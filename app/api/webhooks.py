from fastapi import APIRouter, Request, Response, HTTPException, Query, status
from pydantic import BaseModel
from typing import Optional, Dict, Any
import logging

from app.config import settings
from app.channels.instagram import process_incoming_instagram_event, handle_incoming_ig_message
from app.channels.telegram_bot import get_or_create_ticket_tg, save_ticket_message

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/webhooks", tags=["Channel Webhooks (TG & IG)"])

class SimulateMessageRequest(BaseModel):
    channel: str # 'telegram' | 'instagram'
    user_id: str
    user_name: Optional[str] = "Клиент"
    message_text: str

@router.get("/instagram")
async def verify_instagram_webhook(
    mode: Optional[str] = Query(None, alias="hub.mode"),
    verify_token: Optional[str] = Query(None, alias="hub.verify_token"),
    challenge: Optional[str] = Query(None, alias="hub.challenge")
):
    """Meta Webhook verification handshake."""
    if mode == "subscribe" and verify_token == settings.INSTAGRAM_VERIFY_TOKEN:
        logger.info("Instagram webhook verified successfully.")
        return Response(content=challenge, media_type="text/plain")
    raise HTTPException(status_code=403, detail="Verification token mismatch")

@router.post("/instagram")
async def receive_instagram_webhook(request: Request):
    """Handles incoming direct messages from Instagram."""
    payload = await request.json()
    logger.info(f"Received Instagram webhook event: {payload}")
    await process_incoming_instagram_event(payload)
    return {"status": "ok"}

@router.post("/simulate")
async def simulate_incoming_message(req: SimulateMessageRequest):
    """
    Simulation endpoint to test incoming customer inquiries from
    Telegram or Instagram without requiring external webhooks during development.
    """
    if req.channel == "instagram":
        await handle_incoming_ig_message(req.user_id, req.message_text)
        return {"status": "success", "channel": "instagram", "user_id": req.user_id}
    else:
        # Simulate Telegram user
        class DummyTGUser:
            def __init__(self, uid, name):
                self.id = int(uid) if uid.isdigit() else 777123
                self.first_name = name
                self.last_name = ""
                self.username = f"user_{uid}"

        dummy_user = DummyTGUser(req.user_id, req.user_name)
        ticket = await get_or_create_ticket_tg(dummy_user, initial_text=req.message_text)
        await save_ticket_message(ticket["id"], "client", req.message_text, req.user_name)

        # Trigger AI triage
        from app.ai.triage import auto_triage_ticket
        import aiosqlite
        from app.database import DB_PATH

        triage_res = await auto_triage_ticket([req.message_text])
        async with aiosqlite.connect(DB_PATH) as db:
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
                    ticket["id"]
                )
            )
            await db.commit()

        return {"status": "success", "channel": "telegram", "ticket_id": ticket["id"]}
