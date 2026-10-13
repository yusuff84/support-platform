import logging
import os
from typing import Optional
from aiogram import Bot
from aiogram.types import FSInputFile
from app.config import settings
from app.channels.instagram import instagram_adapter

logger = logging.getLogger(__name__)

async def dispatch_outgoing_message(
    ticket: dict,
    text: str,
    media_path: Optional[str] = None,
    media_type: Optional[str] = None
) -> bool:
    """Routes an operator's outgoing message and optional media attachment to either Telegram or Instagram."""
    t_dict = dict(ticket) if hasattr(ticket, "keys") else ticket
    channel = t_dict.get("channel", "telegram").lower()
    channel_user_id = t_dict.get("channel_user_id")

    if not channel_user_id:
        logger.warning(f"Ticket {t_dict.get('id')} has no channel_user_id")
        return False

    if channel == "telegram":
        if not settings.TELEGRAM_BOT_TOKEN:
            logger.info(f"[SIMULATED TG DISPATCH] To TG {channel_user_id}: {text[:100]}... media={media_path}")
            return True
        try:
            bot = Bot(token=settings.TELEGRAM_BOT_TOKEN)
            chat_id = int(channel_user_id)

            if media_path and os.path.exists(media_path):
                fs_file = FSInputFile(media_path)
                mtype = (media_type or "").lower()
                caption = text if text and not text.startswith("📎") and not text.startswith("🎤") else None

                if mtype == "photo" or media_path.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
                    await bot.send_photo(chat_id=chat_id, photo=fs_file, caption=caption)
                elif mtype == "voice" or media_path.lower().endswith((".ogg", ".opus", ".webm")):
                    await bot.send_voice(chat_id=chat_id, voice=fs_file, caption=caption)
                elif mtype == "video" or media_path.lower().endswith((".mp4", ".mov", ".avi")):
                    await bot.send_video(chat_id=chat_id, video=fs_file, caption=caption)
                elif mtype == "audio" or media_path.lower().endswith((".mp3", ".wav", ".m4a")):
                    await bot.send_audio(chat_id=chat_id, audio=fs_file, caption=caption)
                else:
                    await bot.send_document(chat_id=chat_id, document=fs_file, caption=caption)
            else:
                if text:
                    await bot.send_message(chat_id=chat_id, text=text)

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
