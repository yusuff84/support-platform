from fastapi import APIRouter, Depends, HTTPException
import aiosqlite
from typing import Dict, Any

from app.database import get_db
from app.auth import get_current_user
from app.models import AiTriageResult, AiSuggestionResult
from app.ai.triage import auto_triage_ticket
from app.ai.copilot import generate_ai_copilot_suggestion
from app.config import settings

router = APIRouter(prefix="/api/ai", tags=["AI Assistance (OpenRouter)"])

@router.get("/models")
async def get_model_pool(current_user: dict = Depends(get_current_user)):
    """Returns the free OpenRouter model pool list and fallback configuration."""
    return {
        "model_pool": settings.FREE_MODEL_POOL,
        "base_url": settings.OPENROUTER_BASE_URL,
        "has_api_key": bool(settings.OPENROUTER_API_KEY)
    }

@router.post("/triage/{ticket_id}", response_model=AiTriageResult)
async def trigger_triage(
    ticket_id: int,
    current_user: dict = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db)
):
    """Executes AI Auto-Triage on the ticket's client messages and saves passport fields."""
    async with db.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,)) as cursor:
        ticket = await cursor.fetchone()
        if not ticket:
            raise HTTPException(status_code=404, detail="Тикет не найден")

    # Fetch client messages
    async with db.execute(
        "SELECT message_text FROM ticket_messages WHERE ticket_id = ? AND sender_type = 'client' ORDER BY id ASC",
        (ticket_id,)
    ) as cursor:
        rows = await cursor.fetchall()
        messages = [r["message_text"] for r in rows if r["message_text"]]

    if not messages:
        messages = [ticket["problem"] or "Не подключается VPN"]

    triage_res = await auto_triage_ticket(messages)

    # Persist extracted fields
    await db.execute(
        """
        UPDATE tickets SET
            category = COALESCE(?, category),
            subcategory = COALESCE(?, subcategory),
            device = COALESCE(?, device),
            operator = COALESCE(?, operator),
            app = COALESCE(?, app),
            problem = COALESCE(?, problem),
            cause = COALESCE(?, cause),
            severity = COALESCE(?, severity),
            ai_triaged = 1,
            ai_diagnostic_summary = ?,
            ai_confidence = ?
        WHERE id = ?
        """,
        (
            triage_res.category,
            triage_res.subcategory,
            triage_res.device,
            triage_res.operator,
            triage_res.app,
            triage_res.problem,
            triage_res.cause,
            triage_res.severity,
            triage_res.diagnostic_summary,
            triage_res.confidence,
            ticket_id
        )
    )
    await db.commit()

    return triage_res

@router.post("/suggest/{ticket_id}", response_model=AiSuggestionResult)
async def trigger_copilot_suggestion(
    ticket_id: int,
    current_user: dict = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db)
):
    """Generates AI Copilot response suggestion for the operator."""
    async with db.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,)) as cursor:
        ticket = await cursor.fetchone()
        if not ticket:
            raise HTTPException(status_code=404, detail="Тикет не найден")

    # Fetch chat messages
    async with db.execute(
        "SELECT sender_type, message_text FROM ticket_messages WHERE ticket_id = ? ORDER BY id ASC",
        (ticket_id,)
    ) as cursor:
        rows = await cursor.fetchall()
        chat_history = [dict(r) for r in rows]

    # Fetch knowledge base articles matching category
    kb_articles = []
    if ticket["category"]:
        async with db.execute(
            "SELECT title, content FROM knowledge_articles WHERE category = ? LIMIT 3",
            (ticket["category"],)
        ) as cursor:
            kb_articles = [dict(r) for r in await cursor.fetchall()]

    suggestion = await generate_ai_copilot_suggestion(
        ticket=dict(ticket),
        chat_history=chat_history,
        knowledge_base=kb_articles
    )

    # Cache suggested reply on ticket
    await db.execute(
        "UPDATE tickets SET ai_suggested_reply = ? WHERE id = ?",
        (suggestion.suggested_reply, ticket_id)
    )
    await db.commit()

    return suggestion
