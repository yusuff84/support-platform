import httpx
import logging
from typing import Dict, Any, Optional
from datetime import datetime, timezone
import aiosqlite

from app.config import settings
from app.database import DB_PATH

logger = logging.getLogger(__name__)

class InstagramAdapter:
    def __init__(self):
        self.access_token = settings.INSTAGRAM_ACCESS_TOKEN
        self.page_id = settings.INSTAGRAM_PAGE_ID
        self.graph_url = "https://graph.facebook.com/v19.0/me/messages"

    async def send_message(self, recipient_id: str, text: str) -> bool:
        """Sends direct message to Instagram user via Graph API or simulation."""
        if not self.access_token:
            logger.info(f"[SIMULATED IG DISPATCH] To IG user {recipient_id}: {text[:100]}...")
            return True

        payload = {
            "recipient": {"id": recipient_id},
            "message": {"text": text}
        }
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(self.graph_url, json=payload, headers=headers)
                if res.status_code == 200:
                    logger.info(f"Successfully sent IG message to {recipient_id}")
                    return True
                else:
                    logger.error(f"Failed sending IG message: {res.status_code} - {res.text}")
                    return False
        except Exception as e:
            logger.error(f"Exception sending IG message: {e}")
            return False

instagram_adapter = InstagramAdapter()

async def process_incoming_instagram_event(event_data: Dict[str, Any]):
    """Processes incoming Meta/Instagram webhook event."""
    entries = event_data.get("entry", [])
    for entry in entries:
        messaging = entry.get("messaging", [])
        for m in messaging:
            sender_id = m.get("sender", {}).get("id")
            recipient_id = m.get("recipient", {}).get("id")
            message = m.get("message", {})
            text = message.get("text", "")
            mid = message.get("mid")

            if not sender_id or not text:
                continue

            # Don't loop echo messages sent by the page itself
            if sender_id == settings.INSTAGRAM_PAGE_ID:
                continue

            await handle_incoming_ig_message(sender_id, text, mid)

async def handle_incoming_ig_message(sender_id: str, text: str, mid: Optional[str] = None):
    """Finds or creates ticket for Instagram user, saves message, triggers AI triage."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row

        # Check existing active ticket
        async with db.execute(
            "SELECT * FROM tickets WHERE channel = 'instagram' AND channel_user_id = ? AND status NOT IN ('closed', 'resolved') ORDER BY id DESC LIMIT 1",
            (sender_id,)
        ) as cur:
            ticket = await cur.fetchone()

        now = datetime.now(timezone.utc).isoformat()
        if not ticket:
            ticket_number = f"IG-{datetime.now().strftime('%m%d')}-{int(sender_id[-4:]) if sender_id.isdigit() else 1001:04d}"
            cursor = await db.execute(
                """
                INSERT INTO tickets (ticket_number, channel, channel_user_id, channel_user_name, channel_user_handle, user_id, problem, status, severity, created_at, updated_at)
                VALUES (?, 'instagram', ?, ?, ?, ?, ?, 'new', 'P2', ?, ?)
                """,
                (ticket_number, sender_id, f"Instagram User {sender_id[-5:]}", f"@ig_user_{sender_id[-5:]}", sender_id, text[:120], now, now)
            )
            ticket_id = cursor.lastrowid
            await db.commit()
            async with db.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,)) as cur:
                ticket = await cur.fetchone()
        else:
            ticket_id = ticket["id"]

        # Insert message
        await db.execute(
            """
            INSERT INTO ticket_messages (ticket_id, sender_type, sender_name, sender_id, message_text, instagram_message_id, created_at)
            VALUES (?, 'client', ?, ?, ?, ?, ?)
            """,
            (ticket_id, f"IG User {sender_id[-5:]}", sender_id, text, mid, now)
        )
        await db.execute("UPDATE tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = ?", (ticket_id,))
        await db.commit()

        # AI triage if not yet done
        if not ticket["ai_triaged"]:
            from app.ai.triage import auto_triage_ticket
            triage_res = await auto_triage_ticket([text])
            await db.execute(
                """
                UPDATE tickets SET
                    category = COALESCE(category, ?),
                    subcategory = COALESCE(subcategory, ?),
                    device = COALESCE(device, ?),
                    operator = COALESCE(operator, ?),
                    app = COALESCE(app, ?),
                    cause = COALESCE(cause, ?),
                    severity = COALESCE(severity, ?),
                    ai_triaged = 1,
                    ai_diagnostic_summary = ?,
                    ai_confidence = ?
                WHERE id = ?
                """,
                (
                    triage_res.category, triage_res.subcategory,
                    triage_res.device, triage_res.operator, triage_res.app,
                    triage_res.cause, triage_res.severity,
                    triage_res.diagnostic_summary, triage_res.confidence,
                    ticket_id
                )
            )
            await db.commit()
