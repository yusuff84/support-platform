from fastapi import APIRouter, Depends, HTTPException
import aiosqlite
from pydantic import BaseModel
from typing import Dict, Any, List, Optional

from app.database import get_db
from app.auth import get_current_user, require_superroot
from app.config import settings
from app.vpn.adapter import check_vpn_db_health

router = APIRouter(prefix="/api/settings", tags=["Superroot Settings"])

class SystemSettingsUpdate(BaseModel):
    openrouter_api_key: Optional[str] = None
    free_model_pool: Optional[List[str]] = None
    telegram_bot_token: Optional[str] = None
    telegram_operator_group_id: Optional[int] = None
    instagram_verify_token: Optional[str] = None
    instagram_access_token: Optional[str] = None
    vpn_database_url: Optional[str] = None
    total_user_base: Optional[int] = None

@router.get("")
async def get_system_settings(
    current_user: dict = Depends(require_superroot),
    db: aiosqlite.Connection = Depends(get_db)
):
    """Returns all current integration and system settings."""
    vpn_health = await check_vpn_db_health()

    return {
        "project_name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "total_user_base": settings.TOTAL_USER_BASE,
        "work_hours": f"{settings.WORK_HOURS_START_MSK:02d}:00 - {settings.WORK_HOURS_END_MSK:02d}:00 MSK",
        "openrouter": {
            "has_api_key": bool(settings.OPENROUTER_API_KEY),
            "masked_key": f"{settings.OPENROUTER_API_KEY[:6]}...{settings.OPENROUTER_API_KEY[-4:]}" if settings.OPENROUTER_API_KEY else "",
            "model_pool": settings.FREE_MODEL_POOL
        },
        "telegram": {
            "is_configured": bool(settings.TELEGRAM_BOT_TOKEN),
            "masked_token": f"{settings.TELEGRAM_BOT_TOKEN[:6]}...{settings.TELEGRAM_BOT_TOKEN[-4:]}" if settings.TELEGRAM_BOT_TOKEN else "",
            "operator_group_id": settings.TELEGRAM_OPERATOR_GROUP_ID
        },
        "instagram": {
            "is_configured": bool(settings.INSTAGRAM_ACCESS_TOKEN),
            "verify_token": settings.INSTAGRAM_VERIFY_TOKEN
        },
        "vpn_database": vpn_health
    }

@router.post("")
async def update_system_settings(
    update_data: SystemSettingsUpdate,
    current_user: dict = Depends(require_superroot),
    db: aiosqlite.Connection = Depends(get_db)
):
    """Updates runtime credentials and persistent settings."""
    if update_data.openrouter_api_key is not None:
        settings.OPENROUTER_API_KEY = update_data.openrouter_api_key
        from app.ai.openrouter import openrouter_client
        openrouter_client.api_key = update_data.openrouter_api_key
        await db.execute("INSERT OR REPLACE INTO system_settings (key, value) VALUES ('OPENROUTER_API_KEY', ?)", (update_data.openrouter_api_key,))

    if update_data.free_model_pool is not None:
        settings.FREE_MODEL_POOL = update_data.free_model_pool
        from app.ai.openrouter import openrouter_client
        openrouter_client.model_pool = update_data.free_model_pool
        import json
        await db.execute("INSERT OR REPLACE INTO system_settings (key, value) VALUES ('FREE_MODEL_POOL', ?)", (json.dumps(update_data.free_model_pool),))

    if update_data.telegram_bot_token is not None:
        settings.TELEGRAM_BOT_TOKEN = update_data.telegram_bot_token
        await db.execute("INSERT OR REPLACE INTO system_settings (key, value) VALUES ('TELEGRAM_BOT_TOKEN', ?)", (update_data.telegram_bot_token,))

    if update_data.telegram_operator_group_id is not None:
        settings.TELEGRAM_OPERATOR_GROUP_ID = update_data.telegram_operator_group_id
        await db.execute("INSERT OR REPLACE INTO system_settings (key, value) VALUES ('TELEGRAM_OPERATOR_GROUP_ID', ?)", (str(update_data.telegram_operator_group_id),))

    if update_data.instagram_access_token is not None:
        settings.INSTAGRAM_ACCESS_TOKEN = update_data.instagram_access_token
        from app.channels.instagram import instagram_adapter
        instagram_adapter.access_token = update_data.instagram_access_token
        await db.execute("INSERT OR REPLACE INTO system_settings (key, value) VALUES ('INSTAGRAM_ACCESS_TOKEN', ?)", (update_data.instagram_access_token,))

    if update_data.vpn_database_url is not None:
        settings.VPN_DATABASE_URL = update_data.vpn_database_url
        await db.execute("INSERT OR REPLACE INTO system_settings (key, value) VALUES ('VPN_DATABASE_URL', ?)", (update_data.vpn_database_url,))

    if update_data.total_user_base is not None:
        settings.TOTAL_USER_BASE = update_data.total_user_base
        await db.execute("INSERT OR REPLACE INTO system_settings (key, value) VALUES ('TOTAL_USER_BASE', ?)", (str(update_data.total_user_base),))

    await db.commit()
    return {"status": "success", "message": "Настройки успешно сохранены"}
