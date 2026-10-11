import os
from pydantic import BaseModel
from typing import List, Dict

class Settings(BaseModel):
    # App
    PROJECT_NAME: str = "TOPBOX SUPPORT OS"
    VERSION: str = "1.0.0"
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8080"))
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-topbox-key-change-in-production-2025")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Database
    DATABASE_PATH: str = os.getenv("DATABASE_PATH", "data/support_os.sqlite3")
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite+aiosqlite:///{DATABASE_PATH}")
    VPN_DATABASE_URL: str = os.getenv("VPN_DATABASE_URL", "")  # Postgres connection string to main VPN DB

    # Redis (Optional)
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    # Telegram
    TELEGRAM_BOT_TOKEN: str = os.getenv("TELEGRAM_BOT_TOKEN", "")
    TELEGRAM_OPERATOR_GROUP_ID: int = int(os.getenv("TELEGRAM_OPERATOR_GROUP_ID", "0"))
    TELEGRAM_WEBHOOK_URL: str = os.getenv("TELEGRAM_WEBHOOK_URL", "")

    # Instagram
    INSTAGRAM_VERIFY_TOKEN: str = os.getenv("INSTAGRAM_VERIFY_TOKEN", "topbox_ig_verify_token")
    INSTAGRAM_ACCESS_TOKEN: str = os.getenv("INSTAGRAM_ACCESS_TOKEN", "")
    INSTAGRAM_PAGE_ID: str = os.getenv("INSTAGRAM_PAGE_ID", "")

    # OpenRouter AI & Free Model Pool
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    
    # Pool of high-performing free models with fallback sequence
    FREE_MODEL_POOL: List[str] = [
        "google/gemini-2.0-flash-exp:free",
        "meta-llama/llama-3.3-70b-instruct:free",
        "mistralai/mistral-small-24b-instruct-2501:free",
        "deepseek/deepseek-r1:free",
        "deepseek/deepseek-chat:free",
        "qwen/qwen-2.5-72b-instruct:free",
        "google/gemini-2.0-pro-exp-02-05:free"
    ]

    # Support schedule & business hours (MSK)
    WORK_HOURS_START_MSK: int = 9   # 09:00
    WORK_HOURS_END_MSK: int = 20    # 20:00

    # User base sizing
    TOTAL_USER_BASE: int = int(os.getenv("TOTAL_USER_BASE", "40000"))

settings = Settings()

# Level 1: Category & Subcategory definitions from Specification
CATEGORIES_TAXONOMY: Dict[str, List[str]] = {
    "Не подключается": ["приложение", "ключ", "сервер", "оператор", "устройство"],
    "Медленно": ["оператор", "сервер", "Wi-Fi", "приложение"],
    "Не работает конкретный сайт": ["блокировка", "DNS", "маршрут", "сайт"],
    "Не умеет подключить": ["инструкция", "установка", "настройка"],
    "Проблема с приложением": ["вылетает", "не открывается", "ошибка"],
    "Ограничения оператора": ["мобильная сеть", "Wi-Fi", "регион"],
    "Оплата": ["оплата", "продление", "возврат"],
    "Подписка": ["ключ", "тариф", "срок", "активация"],
    "Всё исправлено": ["проблема решена"],
    "Не решено": ["техническая проблема требует инженера"],
}

# Standard Supported Options for Ticket Passport Fields
DEVICES_LIST: List[str] = ["iPhone", "Android", "Windows", "Mac", "Linux", "Роутер", "Другое"]
OPERATORS_LIST: List[str] = ["МТС", "Мегафон", "Билайн", "Tele2", "Ростелеком", "Wi-Fi", "Другой"]
APPS_LIST: List[str] = ["Incy", "Happ", "v2rayNG", "V2RayTun", "Outline", "Shadowrocket", "Streisand", "Karing", "Другое"]
PROTOCOLS_LIST: List[str] = ["Vless-Reality", "Vless", "ShadowSocks", "Trojan", "WireGuard", "OpenVPN", "Другой"]
SEVERITY_LEVELS: List[str] = ["P0", "P1", "P2", "P3"]
TICKET_STATUSES: List[str] = ["new", "in_progress", "escalated", "resolved", "closed"]
USER_ROLES: List[str] = ["support_agent", "support_lead", "director", "superroot"]
CHANNELS_LIST: List[str] = ["telegram", "instagram"]
