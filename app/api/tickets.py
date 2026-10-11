from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
import aiosqlite
import os
import uuid
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import random

from app.database import get_db
from app.auth import get_current_user, require_agent_or_higher
from app.models import (
    TicketOut,
    TicketCreate,
    TicketPassportUpdate,
    MessageCreate,
    MessageOut,
    RecreateKeyRequest
)
from app.config import CATEGORIES_TAXONOMY, DEVICES_LIST, OPERATORS_LIST, APPS_LIST

router = APIRouter(prefix="/api/tickets", tags=["Tickets"])

def row_to_ticket_dict(r) -> dict:
    return {
        "id": r["id"],
        "ticket_number": r["ticket_number"],
        "channel": r["channel"],
        "channel_user_id": r["channel_user_id"],
        "channel_user_name": r["channel_user_name"],
        "channel_user_handle": r["channel_user_handle"],
        "telegram_topic_id": r["telegram_topic_id"],
        "status": r["status"],
        "severity": r["severity"],
        "category": r["category"],
        "subcategory": r["subcategory"],
        "user_id": r["user_id"],
        "device": r["device"],
        "operator": r["operator"],
        "app": r["app"],
        "problem": r["problem"],
        "cause": r["cause"],
        "result": r["result"],
        "os_version": r["os_version"],
        "app_version": r["app_version"],
        "protocol": r["protocol"],
        "server": r["server"],
        "assigned_to_id": r["assigned_to_id"],
        "assigned_to_name": r["assigned_to_name"] if "assigned_to_name" in r.keys() else None,
        "created_at": str(r["created_at"]),
        "updated_at": str(r["updated_at"]),
        "first_response_at": str(r["first_response_at"]) if r["first_response_at"] else None,
        "resolved_at": str(r["resolved_at"]) if r["resolved_at"] else None,
        "resolution_time_sec": r["resolution_time_sec"],
        "is_reopened": bool(r["is_reopened"]),
        "instruction_helped": bool(r["instruction_helped"]) if r["instruction_helped"] is not None else None,
        "escalated_to_engineer": bool(r["escalated_to_engineer"]),
        "csat_score": r["csat_score"],
        "ai_triaged": bool(r["ai_triaged"]),
        "ai_diagnostic_summary": r["ai_diagnostic_summary"],
        "ai_suggested_reply": r["ai_suggested_reply"],
        "ai_confidence": r["ai_confidence"],
        "unread_count": r["unread_count"] if "unread_count" in r.keys() else 0,
        "last_message": r["last_message"] if "last_message" in r.keys() else None,
        "last_message_at": str(r["last_message_at"]) if "last_message_at" in r.keys() and r["last_message_at"] else None
    }

@router.get("/taxonomy")
async def get_taxonomy(current_user: dict = Depends(get_current_user)):
    """Returns all standard categories, subcategories and taxonomy choices."""
    return {
        "categories": CATEGORIES_TAXONOMY,
        "devices": DEVICES_LIST,
        "operators": OPERATORS_LIST,
        "apps": APPS_LIST,
        "protocols": ["Vless", "ShadowSocks", "Amnezia WG", "Trojan", "WireGuard", "Другой"],
        "servers": ["NL-01", "NL-02", "NL-03", "DE-01", "DE-02", "FI-01", "SE-01", "US-01"]
    }

@router.get("", response_model=List[TicketOut])
async def list_tickets(
    status: Optional[str] = Query(None, description="new, in_progress, escalated, resolved, closed"),
    channel: Optional[str] = Query(None, description="telegram, instagram"),
    category: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = 100,
    offset: int = 0,
    current_user: dict = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db)
):
    query = """
    SELECT t.*, u.full_name as assigned_to_name,
        (SELECT COUNT(m.id) FROM ticket_messages m WHERE m.ticket_id = t.id AND m.sender_type = 'client') as unread_count,
        (SELECT m.message_text FROM ticket_messages m WHERE m.ticket_id = t.id ORDER BY m.id DESC LIMIT 1) as last_message,
        (SELECT m.created_at FROM ticket_messages m WHERE m.ticket_id = t.id ORDER BY m.id DESC LIMIT 1) as last_message_at
    FROM tickets t
    LEFT JOIN staff_users u ON t.assigned_to_id = u.id
    WHERE 1=1
    """
    params = []

    if status:
        query += " AND t.status = ?"
        params.append(status)
    if channel:
        query += " AND t.channel = ?"
        params.append(channel)
    if category:
        query += " AND t.category = ?"
        params.append(category)
    if severity:
        query += " AND t.severity = ?"
        params.append(severity)
    if search:
        search_pattern = f"%{search}%"
        query += " AND (t.ticket_number LIKE ? OR t.channel_user_name LIKE ? OR t.channel_user_handle LIKE ? OR t.channel_user_id LIKE ? OR t.problem LIKE ?)"
        params.extend([search_pattern, search_pattern, search_pattern, search_pattern, search_pattern])

    query += " ORDER BY t.updated_at DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    async with db.execute(query, tuple(params)) as cursor:
        rows = await cursor.fetchall()
        return [TicketOut(**row_to_ticket_dict(r)) for r in rows]

@router.get("/{ticket_id}", response_model=TicketOut)
async def get_ticket(
    ticket_id: int,
    current_user: dict = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db)
):
    query = """
    SELECT t.*, u.full_name as assigned_to_name,
        (SELECT COUNT(m.id) FROM ticket_messages m WHERE m.ticket_id = t.id AND m.sender_type = 'client') as unread_count,
        (SELECT m.message_text FROM ticket_messages m WHERE m.ticket_id = t.id ORDER BY m.id DESC LIMIT 1) as last_message,
        (SELECT m.created_at FROM ticket_messages m WHERE m.ticket_id = t.id ORDER BY m.id DESC LIMIT 1) as last_message_at
    FROM tickets t
    LEFT JOIN staff_users u ON t.assigned_to_id = u.id
    WHERE t.id = ?
    """
    async with db.execute(query, (ticket_id,)) as cursor:
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Тикет не найден")
        return TicketOut(**row_to_ticket_dict(row))

@router.put("/{ticket_id}/passport", response_model=TicketOut)
async def update_ticket_passport(
    ticket_id: int,
    passport_data: TicketPassportUpdate,
    current_user: dict = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db)
):
    """Updates Level 1 (Category/Subcategory) and Level 2 (7 Passport fields) + status."""
    async with db.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,)) as cursor:
        ticket = await cursor.fetchone()
        if not ticket:
            raise HTTPException(status_code=404, detail="Тикет не найден")

    fields = ["updated_at = CURRENT_TIMESTAMP"]
    params = []

    # Level 1
    if passport_data.category is not None:
        fields.append("category = ?")
        params.append(passport_data.category)
    if passport_data.subcategory is not None:
        fields.append("subcategory = ?")
        params.append(passport_data.subcategory)

    # Level 2 (7 fields)
    if passport_data.user_id is not None:
        fields.append("user_id = ?")
        params.append(passport_data.user_id)
    if passport_data.device is not None:
        fields.append("device = ?")
        params.append(passport_data.device)
    if passport_data.operator is not None:
        fields.append("operator = ?")
        params.append(passport_data.operator)
    if passport_data.app is not None:
        fields.append("app = ?")
        params.append(passport_data.app)
    if passport_data.problem is not None:
        fields.append("problem = ?")
        params.append(passport_data.problem)
    if passport_data.cause is not None:
        fields.append("cause = ?")
        params.append(passport_data.cause)
    if passport_data.result is not None:
        fields.append("result = ?")
        params.append(passport_data.result)

    # Extra
    if passport_data.os_version is not None:
        fields.append("os_version = ?")
        params.append(passport_data.os_version)
    if passport_data.app_version is not None:
        fields.append("app_version = ?")
        params.append(passport_data.app_version)
    if passport_data.protocol is not None:
        fields.append("protocol = ?")
        params.append(passport_data.protocol)
    if passport_data.server is not None:
        fields.append("server = ?")
        params.append(passport_data.server)

    # Status & Operational
    if passport_data.severity is not None:
        fields.append("severity = ?")
        params.append(passport_data.severity)
    if passport_data.status is not None:
        fields.append("status = ?")
        params.append(passport_data.status)
        if passport_data.status in ["resolved", "closed"] and not ticket["resolved_at"]:
            now_iso = datetime.now(timezone.utc).isoformat()
            fields.append("resolved_at = ?")
            params.append(now_iso)
            # Calculate resolution time
            created_dt = datetime.fromisoformat(str(ticket["created_at"]).replace(" ", "T"))
            res_sec = int((datetime.now(timezone.utc) - created_dt.replace(tzinfo=timezone.utc)).total_seconds())
            fields.append("resolution_time_sec = ?")
            params.append(res_sec)

    if passport_data.instruction_helped is not None:
        fields.append("instruction_helped = ?")
        params.append(1 if passport_data.instruction_helped else 0)
    if passport_data.escalated_to_engineer is not None:
        fields.append("escalated_to_engineer = ?")
        params.append(1 if passport_data.escalated_to_engineer else 0)
        if passport_data.escalated_to_engineer:
            fields.append("status = 'escalated'")
    if passport_data.csat_score is not None:
        fields.append("csat_score = ?")
        params.append(passport_data.csat_score)

    # Assign to current operator if unassigned
    if not ticket["assigned_to_id"]:
        fields.append("assigned_to_id = ?")
        params.append(current_user["id"])

    params.append(ticket_id)
    await db.execute(f"UPDATE tickets SET {', '.join(fields)} WHERE id = ?", tuple(params))
    await db.commit()

    return await get_ticket(ticket_id, current_user, db)

def _format_media_url(url: Optional[str], mtype: Optional[str]) -> Optional[str]:
    if not url:
        return None
    if url.startswith("http://") or url.startswith("https://") or url.startswith("/uploads/") or url.startswith("/api/media"):
        return url
    clean_type = (mtype or "").lower().replace("contenttype.", "").strip()
    return f"/api/media?file_id={url}&kind={clean_type}"


def _normalize_media_type(mtype: Optional[str]) -> Optional[str]:
    if not mtype:
        return None
    mt = mtype.lower().replace("contenttype.", "").strip()
    if mt in ("photo", "voice", "audio", "video", "document"):
        return mt
    return mt


@router.get("/{ticket_id}/messages", response_model=List[MessageOut])
async def get_ticket_messages(
    ticket_id: int,
    current_user: dict = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db)
):
    async with db.execute(
        "SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY id ASC",
        (ticket_id,)
    ) as cursor:
        rows = await cursor.fetchall()
        return [
            MessageOut(
                id=r["id"],
                ticket_id=r["ticket_id"],
                sender_type=r["sender_type"],
                sender_name=r["sender_name"],
                sender_id=str(r["sender_id"]) if r["sender_id"] else None,
                message_text=r["message_text"],
                media_type=_normalize_media_type(r["media_type"]),
                media_url=_format_media_url(r["media_url"], r["media_type"]),
                created_at=str(r["created_at"])
            )
            for r in rows
        ]

@router.post("/{ticket_id}/messages", response_model=MessageOut)
async def send_ticket_message(
    ticket_id: int,
    msg_in: MessageCreate,
    current_user: dict = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db)
):
    """Sends a message from operator or AI to the client via TG or IG."""
    async with db.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,)) as cursor:
        ticket = await cursor.fetchone()
        if not ticket:
            raise HTTPException(status_code=404, detail="Тикет не найден")

    now_iso = datetime.now(timezone.utc).isoformat()
    cursor = await db.execute(
        """
        INSERT INTO ticket_messages (ticket_id, sender_type, sender_name, sender_id, message_text, media_type, media_url, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            ticket_id,
            msg_in.sender_type,
            current_user["full_name"],
            str(current_user["id"]),
            msg_in.message_text,
            msg_in.media_type,
            msg_in.media_url,
            now_iso
        )
    )
    msg_id = cursor.lastrowid

    # Update ticket first_response_at if this is the first operator response
    updates = ["updated_at = CURRENT_TIMESTAMP"]
    params = []
    if not ticket["first_response_at"] and msg_in.sender_type in ["operator", "ai"]:
        updates.append("first_response_at = ?")
        params.append(now_iso)

    if ticket["status"] == "new":
        updates.append("status = 'in_progress'")

    if not ticket["assigned_to_id"]:
        updates.append("assigned_to_id = ?")
        params.append(current_user["id"])

    params.append(ticket_id)
    await db.execute(f"UPDATE tickets SET {', '.join(updates)} WHERE id = ?", tuple(params))
    await db.commit()

    # Route message out to Telegram or Instagram if active
    from app.channels.dispatcher import dispatch_outgoing_message
    await dispatch_outgoing_message(ticket, msg_in.message_text)

    return MessageOut(
        id=msg_id,
        ticket_id=ticket_id,
        sender_type=msg_in.sender_type,
        sender_name=current_user["full_name"],
        sender_id=str(current_user["id"]),
        message_text=msg_in.message_text,
        media_type=msg_in.media_type,
        media_url=msg_in.media_url,
        created_at=now_iso
    )

@router.post("/{ticket_id}/send-key")
async def send_user_key(
    ticket_id: int,
    current_user: dict = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db)
):
    """Fetches user VPN key and sends it directly to the customer chat (TELEGRAM ONLY)."""
    from app.vpn.adapter import get_vpn_client_keys
    async with db.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,)) as cursor:
        ticket = await cursor.fetchone()
        if not ticket:
            raise HTTPException(status_code=404, detail="Тикет не найден")

    # Enforce Telegram channel restriction for VPN key operations
    if ticket["channel"] != "telegram":
        raise HTTPException(
            status_code=400,
            detail="Выдача ключей доступна только для Telegram-бота (@topvpnhelp_bot). Для Instagram доступна только отправка ссылки на бота."
        )

    keys = await get_vpn_client_keys(ticket["channel_user_id"], db)
    if not keys:
        key_text = "🔑 Для вашего аккаунта не найден активный ключ в базе данных. Вы можете оформить подписку в основном боте по кнопке «Купить VPN»."
    else:
        k = keys[0]
        tariff_name = k.get("tariff_name") or "VPN-подписка"
        exp_date = k.get("expires_at") or "бессрочно"
        link = k.get("key_string") or ""
        key_text = (
            "🔑 <b>Ваша активная VPN-подписка</b>\n\n"
            f"Тариф: <b>{tariff_name}</b>\n"
            f"Действует до: <b>{exp_date}</b>\n\n"
            f"Ссылка подписки:\n{link}\n\n"
            "Откройте ссылку, выберите своё устройство (Incy / Happ) и следуйте инструкции.\n"
            "Если появятся вопросы — напишите нам в чат!"
        )

    msg = MessageCreate(ticket_id=ticket_id, message_text=key_text, sender_type="operator")
    return await send_ticket_message(ticket_id, msg, current_user, db)

@router.post("/{ticket_id}/recreate-key")
async def recreate_user_key(
    ticket_id: int,
    req: RecreateKeyRequest,
    current_user: dict = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db)
):
    """Re-creates / resets connection key for the user (TELEGRAM ONLY)."""
    from app.vpn.adapter import recreate_vpn_client_key
    async with db.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,)) as cursor:
        ticket = await cursor.fetchone()
        if not ticket:
            raise HTTPException(status_code=404, detail="Тикет не найден")

    # Enforce Telegram channel restriction for key replacement/reset
    if ticket["channel"] != "telegram":
        raise HTTPException(
            status_code=400,
            detail="Замена и пересоздание ключей производятся исключительно через Telegram-бота (@topvpnhelp_bot)."
        )

    new_key = await recreate_vpn_client_key(
        user_id=ticket["channel_user_id"],
        protocol=req.protocol or "Vless",
        server=req.server or "remna2",
        db=db
    )

    link = new_key.get("key_string", "")
    exp = new_key.get("expires_at", "бессрочно")
    result_text = (
        "⚡ <b>Ваш ключ был успешно перевыпущен</b>:\n\n"
        f"Ссылка подписки:\n{link}\n\n"
        f"Действует до: {exp}\n\n"
        "Старый ключ деактивирован. Пожалуйста, откройте ссылку и обновите подключение в приложении (Incy / Happ)."
    )

    # Update passport result
    await db.execute(
        "UPDATE tickets SET result = 'решено перевыпуском ключа / сменой сервера', server = ?, protocol = ? WHERE id = ?",
        (new_key.get('server', 'remna2'), new_key.get('protocol', 'Vless'), ticket_id)
    )
    await db.commit()

    msg = MessageCreate(ticket_id=ticket_id, message_text=result_text, sender_type="operator")
    return await send_ticket_message(ticket_id, msg, current_user, db)

@router.post("/{ticket_id}/send-tg-link")
async def send_tg_bot_link_endpoint(
    ticket_id: int,
    current_user: dict = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db)
):
    """Sends official Telegram bot link to Instagram customer for key issuance."""
    async with db.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,)) as cursor:
        ticket = await cursor.fetchone()
        if not ticket:
            raise HTTPException(status_code=404, detail="Тикет не найден")

    text = (
        "🔑 Для автоматической выдачи, проверки подписки и замены вашего VPN-ключа перейдите в нашего официального Telegram-бота:\n\n"
        "👉 https://t.me/topvpnhelp_bot (команда /start)\n\n"
        "Бот моментально проверит ваш статус и выдаст активный ключ доступа."
    )
    msg = MessageCreate(ticket_id=ticket_id, message_text=text, sender_type="operator")
    return await send_ticket_message(ticket_id, msg, current_user, db)

@router.post("/{ticket_id}/send-guide")
async def send_guide(
    ticket_id: int,
    platform: Optional[str] = "iPhone",
    current_user: dict = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db)
):
    """Sends 4-step VPN connection instruction to the customer."""
    guides = {
        "iPhone": (
            "📱 Инструкция по подключению на iPhone / iOS:\n\n"
            "1. Установите приложение Amnezia VPN или Happ из App Store.\n"
            "2. Скопируйте ваш ключ доступа (начинается с vless:// или vpn://).\n"
            "3. Откройте приложение, нажмите «Добавить конфигурацию» ➔ «Из буфера обмена».\n"
            "4. Нажмите большую кнопку «Подключить» и разрешите добавление VPN-конфигурации.\n\n"
            "Если кнопка горит зелёным — вы защищены! Проверить: 2ip.ru"
        ),
        "Android": (
            "🤖 Инструкция по подключению на Android:\n\n"
            "1. Установите v2rayNG или Amnezia VPN из Google Play.\n"
            "2. Скопируйте ваш ключ доступа.\n"
            "3. В приложении нажмите «+» (вверху справа) ➔ «Импорт из буфера обмена».\n"
            "4. Нажмите на круглую кнопку подключения внизу экрана.\n\n"
            "При первом запуске подтвердите системный запрос на VPN-соединение."
        ),
        "Windows": (
            "💻 Инструкция по подключению на Windows:\n\n"
            "1. Скачайте Amnezia VPN или v2rayN для Windows.\n"
            "2. Запустите приложение от имени администратора.\n"
            "3. Вставьте ваш ключ доступа и нажмите «Подключиться»."
        )
    }
    text = guides.get(platform, guides["iPhone"])
    msg = MessageCreate(ticket_id=ticket_id, message_text=text, sender_type="operator")
    return await send_ticket_message(ticket_id, msg, current_user, db)

@router.get("/{ticket_id}/vpn-keys")
async def get_ticket_vpn_keys(
    ticket_id: int,
    current_user: dict = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db)
):
    """Fetches user VPN keys and subscription status for the ticket."""
    from app.vpn.adapter import get_vpn_client_keys
    async with db.execute("SELECT channel_user_id, user_id FROM tickets WHERE id = ?", (ticket_id,)) as cursor:
        ticket = await cursor.fetchone()
        if not ticket:
            raise HTTPException(status_code=404, detail="Тикет не найден")

    lookup_id = ticket["user_id"] or ticket["channel_user_id"]
    keys = await get_vpn_client_keys(lookup_id, db)
    return {"user_id": lookup_id, "keys": keys}

@router.post("/{ticket_id}/resolve")
async def resolve_ticket(
    ticket_id: int,
    current_user: dict = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db)
):
    """Marks ticket as resolved (Проблема решена) and sends confirmation to client."""
    async with db.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,)) as cursor:
        ticket = await cursor.fetchone()
        if not ticket:
            raise HTTPException(status_code=404, detail="Тикет не найден")

    now_iso = datetime.now(timezone.utc).isoformat()
    created_dt = datetime.fromisoformat(str(ticket["created_at"]).replace(" ", "T"))
    res_sec = int((datetime.now(timezone.utc) - created_dt.replace(tzinfo=timezone.utc)).total_seconds())

    await db.execute(
        """
        UPDATE tickets SET
            status = 'resolved',
            category = 'Всё исправлено',
            subcategory = COALESCE(subcategory, 'проблема решена'),
            result = 'Проблема успешно решена',
            instruction_helped = 1,
            resolved_at = ?,
            resolution_time_sec = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        """,
        (now_iso, res_sec, ticket_id)
    )
    await db.commit()

    # Send confirmation message to customer chat
    res_text = (
        "✅ Рады сообщить, что ваша проблема успешно решена!\n\n"
        "Спасибо, что пользуетесь TOPBOX VPN. Если возникнут любые вопросы или понадобится помощь — мы всегда на связи!"
    )
    msg = MessageCreate(ticket_id=ticket_id, message_text=res_text, sender_type="operator")
    await send_ticket_message(ticket_id, msg, current_user, db)

    return await get_ticket(ticket_id, current_user, db)

@router.post("/{ticket_id}/escalate")
async def escalate_ticket(
    ticket_id: int,
    current_user: dict = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db)
):
    """Marks ticket as not resolved / escalated to engineer L2."""
    async with db.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,)) as cursor:
        ticket = await cursor.fetchone()
        if not ticket:
            raise HTTPException(status_code=404, detail="Тикет не найден")

    await db.execute(
        """
        UPDATE tickets SET
            status = 'escalated',
            category = 'Не решено',
            subcategory = 'техническая проблема требует инженера',
            escalated_to_engineer = 1,
            result = 'Техническая проблема требует вмешательства инженера L2',
            instruction_helped = 0,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        """,
        (ticket_id,)
    )
    await db.commit()

    # Send escalation notification to customer chat
    esc_text = (
        "⚠️ Ваше обращение передано дежурному техническому инженеру для детального анализа инфраструктуры.\n\n"
        "Специалист уже занимается проверкой узлов и серверов. Мы уведомим вас сразу, как только решение будет готово."
    )
    msg = MessageCreate(ticket_id=ticket_id, message_text=esc_text, sender_type="operator")
    await send_ticket_message(ticket_id, msg, current_user, db)

    return await get_ticket(ticket_id, current_user, db)

@router.post("/{ticket_id}/send-ai-setup")
async def send_ai_setup_guide(
    ticket_id: int,
    current_user: dict = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db)
):
    """AI determines the problem and tailored setup steps, and sends step-by-step setup guide to client."""
    from app.ai.triage import auto_triage_ticket
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
        msgs = [r["message_text"] for r in rows if r["message_text"]]

    if not msgs:
        msgs = [ticket["problem"] or "Помощь в настройке VPN"]

    triage_res = await auto_triage_ticket(msgs)
    if ticket["channel"] == "instagram":
        guide_text = (
            f"🛠 Помощник по настройке TOPBOX VPN ({triage_res.device or 'ваше устройство'}):\n\n"
            "1. Перейдите в нашего официального Telegram-бота для получения и привязки вашего ключа: https://t.me/topvpnhelp_bot (нажмите /start).\n"
            f"2. {triage_res.setup_guide or 'Скопируйте ключ и вставьте в приложение Amnezia VPN или Happ.'}\n\n"
            f"Диагноз системы: {triage_res.diagnostic_summary}\n"
            "Если после выполнения этих шагов останутся вопросы — напишите сюда, оператор на связи!"
        )
    else:
        guide_text = (
            f"🛠 Помощник по настройке TOPBOX VPN ({triage_res.device or 'ваше устройство'}):\n\n"
            f"{triage_res.setup_guide or '1. Скопируйте ключ.\n2. Вставьте в приложение Amnezia / Happ.\n3. Нажмите Подключить.'}\n\n"
            f"Диагноз системы: {triage_res.diagnostic_summary}\n"
            f"Если после выполнения этих шагов соединение не установилось — напишите нам, и оператор сразу подключится!"
        )

    msg = MessageCreate(ticket_id=ticket_id, message_text=guide_text, sender_type="ai")
    return await send_ticket_message(ticket_id, msg, current_user, db)

@router.post("/{ticket_id}/upload", response_model=MessageOut)
async def upload_attachment(
    ticket_id: int,
    file: UploadFile = File(...),
    media_type: str = Form("document"), # 'photo', 'video', 'voice', 'audio', 'document'
    caption: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db)
):
    """Uploads photo, video, document or voice message and records message."""
    async with db.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,)) as cursor:
        ticket = await cursor.fetchone()
        if not ticket:
            raise HTTPException(status_code=404, detail="Тикет не найден")

    uploads_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "uploads")
    os.makedirs(uploads_dir, exist_ok=True)

    ext = os.path.splitext(file.filename or "")[1] or ""
    if not ext:
        if media_type == "voice":
            ext = ".webm"
        elif media_type == "photo":
            ext = ".jpg"
        elif media_type == "video":
            ext = ".mp4"

    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(uploads_dir, filename)

    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)

    media_url = f"/uploads/{filename}"
    now_iso = datetime.now(timezone.utc).isoformat()
    msg_text = caption or (f"🎤 Голосовое сообщение" if media_type == "voice" else f"📎 {file.filename or media_type.capitalize()}")

    cursor = await db.execute(
        """
        INSERT INTO ticket_messages (ticket_id, sender_type, sender_name, sender_id, message_text, media_type, media_url, created_at)
        VALUES (?, 'operator', ?, ?, ?, ?, ?, ?)
        """,
        (ticket_id, current_user["full_name"], str(current_user["id"]), msg_text, media_type, media_url, now_iso)
    )
    msg_id = cursor.lastrowid
    await db.execute("UPDATE tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = ?", (ticket_id,))
    await db.commit()

    return MessageOut(
        id=msg_id,
        ticket_id=ticket_id,
        sender_type="operator",
        sender_name=current_user["full_name"],
        sender_id=str(current_user["id"]),
        message_text=msg_text,
        media_type=media_type,
        media_url=media_url,
        created_at=now_iso
    )



