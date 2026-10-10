import re
import os
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any

from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, Message

from app.config import settings
from app.database import DB_PATH
import aiosqlite

logger = logging.getLogger(__name__)

# State machine for self-service diagnostic wizard
class DiagnosticWizard(StatesGroup):
    choosing_device = State()
    choosing_operator = State()
    choosing_problem = State()
    choosing_app = State()

# In-memory cooldown caches (in production backed by Redis if available)
after_hours_cooldown: Dict[str, datetime] = {}
auto_key_cooldown: Dict[str, datetime] = {}
silent_threads: set = set()
banned_users: set = set()

def is_within_work_hours_msk() -> bool:
    """Checks whether current time is between 09:00 and 20:00 Moscow Time (UTC+3)."""
    now_utc = datetime.now(timezone.utc)
    now_msk = now_utc + timedelta(hours=3)
    hour = now_msk.hour
    return settings.WORK_HOURS_START_MSK <= hour < settings.WORK_HOURS_END_MSK

AUTO_KEY_REGEX = re.compile(
    r"(где\s*ключ|скинь\s*(ссылку|ключ)|не\s*пришл[ао]\s*подписк[ае]|пропал\s*ключ|мой\s*ключ|дай\s*ключ|получить\s*ключ|как\s*забрать\s*ключ)",
    re.IGNORECASE
)

# Helper DB functions for bot
async def get_or_create_ticket_tg(user: types.User, initial_text: str = "") -> dict:
    tg_id = str(user.id)
    full_name = f"{user.first_name or ''} {user.last_name or ''}".strip() or (user.username or "Абонент")
    handle = f"@{user.username}" if user.username else None

    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM tickets WHERE channel = 'telegram' AND channel_user_id = ? AND status NOT IN ('closed', 'resolved') ORDER BY id DESC LIMIT 1",
            (tg_id,)
        ) as cur:
            existing = await cur.fetchone()

        if existing:
            return dict(existing)

        # Create new ticket
        ticket_number = f"T-{datetime.now().strftime('%m%d')}-{user.id % 10000:04d}"
        now = datetime.now(timezone.utc).isoformat()
        cursor = await db.execute(
            """
            INSERT INTO tickets (ticket_number, channel, channel_user_id, channel_user_name, channel_user_handle, user_id, problem, status, severity, created_at, updated_at)
            VALUES (?, 'telegram', ?, ?, ?, ?, ?, 'new', 'P2', ?, ?)
            """,
            (ticket_number, tg_id, full_name, handle, tg_id, initial_text[:120], now, now)
        )
        ticket_id = cursor.lastrowid
        await db.commit()

        async with db.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,)) as cur:
            return dict(await cur.fetchone())

async def save_ticket_message(ticket_id: int, sender_type: str, text: str, sender_name: str, tg_msg_id: Optional[int] = None):
    async with aiosqlite.connect(DB_PATH) as db:
        now = datetime.now(timezone.utc).isoformat()
        await db.execute(
            """
            INSERT INTO ticket_messages (ticket_id, sender_type, sender_name, sender_id, message_text, telegram_message_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (ticket_id, sender_type, sender_name, "", text, tg_msg_id, now)
        )
        await db.execute(
            "UPDATE tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            (ticket_id,)
        )
        await db.commit()

def create_diagnostic_kb_device():
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="📱 iPhone / iPad", callback_data="diag_dev:iPhone"),
            InlineKeyboardButton(text="🤖 Android", callback_data="diag_dev:Android")
        ],
        [
            InlineKeyboardButton(text="💻 Windows PC", callback_data="diag_dev:Windows"),
            InlineKeyboardButton(text="🍎 Mac / macOS", callback_data="diag_dev:Mac")
        ],
        [
            InlineKeyboardButton(text="🌐 Роутер / Другое", callback_data="diag_dev:Другое")
        ]
    ])
    return kb

def create_diagnostic_kb_operator():
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="🔴 МТС", callback_data="diag_op:МТС"),
            InlineKeyboardButton(text="🟢 Мегафон", callback_data="diag_op:Мегафон")
        ],
        [
            InlineKeyboardButton(text="🟡 Билайн", callback_data="diag_op:Билайн"),
            InlineKeyboardButton(text="⚫ Tele2 / Т2", callback_data="diag_op:Tele2")
        ],
        [
            InlineKeyboardButton(text="📶 Wi-Fi / Домашний", callback_data="diag_op:Wi-Fi"),
            InlineKeyboardButton(text="🌍 Другой", callback_data="diag_op:Другой")
        ]
    ])
    return kb

def create_diagnostic_kb_problem():
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="❌ Не подключается", callback_data="diag_prob:Не подключается")],
        [InlineKeyboardButton(text="🐢 Медленно / Низкая скорость", callback_data="diag_prob:Медленно")],
        [InlineKeyboardButton(text="🚫 Не открывает конкретный сайт", callback_data="diag_prob:Не работает конкретный сайт")],
        [InlineKeyboardButton(text="❓ Не умею установить / настроить", callback_data="diag_prob:Не умеет подключить")],
        [InlineKeyboardButton(text="💥 Ошибка в приложении", callback_data="diag_prob:Проблема с приложением")]
    ])
    return kb

def create_diagnostic_kb_app():
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="Amnezia VPN", callback_data="diag_app:Amnezia"),
            InlineKeyboardButton(text="Happ", callback_data="diag_app:Happ")
        ],
        [
            InlineKeyboardButton(text="v2rayNG", callback_data="diag_app:v2rayNG"),
            InlineKeyboardButton(text="Outline", callback_data="diag_app:Outline")
        ],
        [
            InlineKeyboardButton(text="Другое приложение", callback_data="diag_app:Другое")
        ]
    ])
    return kb

# Bot Setup
def setup_bot_dispatcher() -> Dispatcher:
    dp = Dispatcher()

    @dp.message(Command("start"))
    async def cmd_start(message: Message, state: FSMContext):
        await state.clear()
        kb = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="❌ Не работает VPN (Диагностика)", callback_data="start_diag")],
            [InlineKeyboardButton(text="🔑 Получить мой ключ", callback_data="get_my_key")],
            [InlineKeyboardButton(text="📖 Инструкция по установке", callback_data="get_guide")],
            [InlineKeyboardButton(text="👤 Написать оператору", callback_data="talk_human")]
        ])
        await message.answer(
            f"Здравствуйте, {message.from_user.first_name or 'друг'}!\n\n"
            "Это служба заботы и поддержки TOPBOX VPN.\n"
            "Выберите нужный пункт или просто напишите ваш вопрос прямо в этот чат — специалисты и система поддержки уже на связи!",
            reply_markup=kb
        )

    # Diagnostic wizard flow
    @dp.callback_query(F.data == "start_diag")
    async def diag_start(callback: types.CallbackQuery, state: FSMContext):
        await state.set_state(DiagnosticWizard.choosing_device)
        await callback.message.edit_text(
            "🛠 Шаг 1 из 4: На каком устройстве вы используете VPN?",
            reply_markup=create_diagnostic_kb_device()
        )
        await callback.answer()

    @dp.callback_query(DiagnosticWizard.choosing_device, F.data.startswith("diag_dev:"))
    async def diag_got_device(callback: types.CallbackQuery, state: FSMContext):
        dev = callback.data.split(":")[1]
        await state.update_data(device=dev)
        await state.set_state(DiagnosticWizard.choosing_operator)
        await callback.message.edit_text(
            f"Устройство: {dev}\n\n🛠 Шаг 2 из 4: Какой у вас оператор связи / интернет?",
            reply_markup=create_diagnostic_kb_operator()
        )
        await callback.answer()

    @dp.callback_query(DiagnosticWizard.choosing_operator, F.data.startswith("diag_op:"))
    async def diag_got_operator(callback: types.CallbackQuery, state: FSMContext):
        op = callback.data.split(":")[1]
        await state.update_data(operator=op)
        await state.set_state(DiagnosticWizard.choosing_problem)
        data = await state.get_data()
        await callback.message.edit_text(
            f"Устройство: {data.get('device')}\nОператор: {op}\n\n🛠 Шаг 3 из 4: Что именно происходит?",
            reply_markup=create_diagnostic_kb_problem()
        )
        await callback.answer()

    @dp.callback_query(DiagnosticWizard.choosing_problem, F.data.startswith("diag_prob:"))
    async def diag_got_problem(callback: types.CallbackQuery, state: FSMContext):
        prob = callback.data.split(":")[1]
        await state.update_data(problem=prob)
        await state.set_state(DiagnosticWizard.choosing_app)
        data = await state.get_data()
        await callback.message.edit_text(
            f"Устройство: {data.get('device')}\nОператор: {data.get('operator')}\nСимптом: {prob}\n\n🛠 Шаг 4 из 4: Какое приложение используете?",
            reply_markup=create_diagnostic_kb_app()
        )
        await callback.answer()

    @dp.callback_query(DiagnosticWizard.choosing_app, F.data.startswith("diag_app:"))
    async def diag_finished(callback: types.CallbackQuery, state: FSMContext):
        app = callback.data.split(":")[1]
        data = await state.get_data()
        await state.clear()

        device = data.get("device", "iPhone")
        operator = data.get("operator", "Другой")
        problem = data.get("problem", "Не подключается")

        # Create or update ticket in DB with fully filled Passport!
        ticket = await get_or_create_ticket_tg(callback.from_user, initial_text=f"Диагностика: {problem}")
        async with aiosqlite.connect(DB_PATH) as db:
            await db.execute(
                """
                UPDATE tickets SET
                    category = ?,
                    subcategory = 'диагностика',
                    device = ?,
                    operator = ?,
                    app = ?,
                    problem = ?,
                    cause = 'Первичная диагностика бота',
                    ai_triaged = 1,
                    status = 'in_progress'
                WHERE id = ?
                """,
                (problem, device, operator, app, problem, ticket["id"])
            )
            await db.commit()

        # Recommendation logic
        rec_text = (
            f"📋 Результат диагностики:\n\n"
            f"• Платформа: {device}\n"
            f"• Оператор: {operator}\n"
            f"• Приложение: {app}\n"
            f"• Проблема: {problem}\n\n"
        )
        if operator in ["МТС", "Мегафон"] and problem == "Не подключается":
            rec_text += (
                "💡 Рекомендация:\n"
                "Оператор может временно блокировать устаревшие протоколы. "
                "Рекомендуем обновить ключ на протокол Vless или переключить сервер в настройках приложения.\n\n"
                "Паспорт тикета уже передан оператору. Если связь не восстановилась, напишите сообщение сюда, и оператор подключится!"
            )
        else:
            rec_text += (
                "💡 Рекомендация:\n"
                "1. Проверьте активность подписки.\n"
                "2. Перезагрузите соединение в приложении.\n\n"
                "Специалист поддержки уже видит ваши параметры и готов помочь!"
            )

        await callback.message.edit_text(rec_text)
        await callback.answer()

    # Fast callback buttons
    @dp.callback_query(F.data == "get_my_key")
    async def cb_get_my_key(callback: types.CallbackQuery):
        from app.vpn.adapter import get_vpn_client_keys
        async with aiosqlite.connect(DB_PATH) as db:
            db.row_factory = aiosqlite.Row
            keys = await get_vpn_client_keys(str(callback.from_user.id), db)
            if keys:
                k = keys[0]
                text = (
                    f"🔑 Ваш действующий ключ VPN:\n\n"
                    f"`{k['key_string']}`\n\n"
                    f"• Сервер: {k['server']}\n"
                    f"• Протокол: {k['protocol']}\n"
                    f"• Статус: {k['subscription_status']}\n\n"
                    f"Вставьте этот ключ в приложение Amnezia VPN / Happ / Outline."
                )
            else:
                text = "Для вашего Telegram ID не найдено активных ключей. Напишите нам сообщение, и оператор проверит ваши подписки."
        await callback.message.answer(text)
        await callback.answer()

    @dp.callback_query(F.data == "get_guide")
    async def cb_get_guide(callback: types.CallbackQuery):
        guide = (
            "📖 Как подключить TOPBOX VPN:\n\n"
            "1. Установите приложение Amnezia VPN или Happ (из App Store / Google Play).\n"
            "2. Скопируйте ваш ключ (кнопка «🔑 Получить мой ключ»).\n"
            "3. Откройте приложение ➔ выберите «Добавить ключ из буфера обмена».\n"
            "4. Нажмите «Подключить»!\n\n"
            "Если что-то не получается — напишите в чат, оператор на связи."
        )
        await callback.message.answer(guide)
        await callback.answer()

    # Handling incoming client messages
    @dp.message()
    async def handle_client_message(message: Message):
        user_id_str = str(message.from_user.id)
        if user_id_str in banned_users:
            return

        text = message.text or message.caption or "[Медиафайл]"

        # 1. Get or create ticket
        ticket = await get_or_create_ticket_tg(message.from_user, initial_text=text)
        await save_ticket_message(ticket["id"], "client", text, message.from_user.full_name or "Клиент", message.message_id)

        # 2. After-hours notice check (09:00 - 20:00 MSK)
        if not is_within_work_hours_msk():
            now = datetime.now(timezone.utc)
            last_after_hours = after_hours_cooldown.get(user_id_str)
            if not last_after_hours or (now - last_after_hours) > timedelta(hours=8):
                after_hours_cooldown[user_id_str] = now
                await message.answer(
                    "Здравствуйте! Сейчас нерабочее время техподдержки.\n"
                    "Мы работаем строго с 09:00 до 20:00 по московскому времени.\n\n"
                    "Ваше сообщение уже зарегистрировано в системе и передано специалистам. Мы обязательно ответим вам в начале рабочего дня!"
                )

        # 3. Auto-key check by regex
        if AUTO_KEY_REGEX.search(text):
            now = datetime.now(timezone.utc)
            last_key_sent = auto_key_cooldown.get(user_id_str)
            if not last_key_sent or (now - last_key_sent) > timedelta(hours=1):
                auto_key_cooldown[user_id_str] = now
                from app.vpn.adapter import get_vpn_client_keys
                async with aiosqlite.connect(DB_PATH) as db:
                    db.row_factory = aiosqlite.Row
                    keys = await get_vpn_client_keys(user_id_str, db)
                    if keys:
                        k = keys[0]
                        auto_key_reply = (
                            f"🤖 Автоответ по запросу ключа:\n\n"
                            f"Ваш активный ключ:\n`{k['key_string']}`\n\n"
                            f"Сервер: {k['server']} | Протокол: {k['protocol']}\n"
                            f"Срок: до {k['expires_at'] or 'активен'}"
                        )
                        await message.answer(auto_key_reply)
                        await save_ticket_message(ticket["id"], "ai", auto_key_reply, "AI Auto-Key")

        # 4. Background AI Auto-Triage on first incoming message
        if not ticket["ai_triaged"]:
            from app.ai.triage import auto_triage_ticket
            triage_res = await auto_triage_ticket([text])
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

    return dp
