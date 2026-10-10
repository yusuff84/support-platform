import logging
from aiogram import Bot
from app.config import settings
from app.channels.instagram import instagram_adapter

logger = logging.getLogger(__name__)

async def dispatch_outgoing_message(ticket: dict, text: str) -> bool:
    """Routes an operator's outgoing message to either Telegram or Instagram."""
    t_dict = dict(ticket) if hasattr(ticket, "keys") else ticket
    channel = t_dict.get("channel", "telegram").lower()
    channel_user_id = t_dict.get("channel_user_id")

    if not channel_user_id:
        logger.warning(f"Ticket {t_dict.get('id')} has no channel_user_id")
        return False

    if channel == "telegram":
        if not settings.TELEGRAM_BOT_TOKEN:
            logger.info(f"[SIMULATED TG DISPATCH] To TG {channel_user_id}: {text[:100]}...")
            return True
        try:
            bot = Bot(token=settings.TELEGRAM_BOT_TOKEN)
            await bot.send_message(chat_id=int(channel_user_id), text=text)
            await bot.session.close()
            return True
        except Exception as e:
            logger.error(f"Error sending message via Telegram Bot: {e}")
            return False

    elif channel == "instagram":
        return await instagram_adapter.send_message(recipient_id=channel_user_id, text=text)

    else:
        logger.warning(f"Unknown channel: {channel}")
        return False
