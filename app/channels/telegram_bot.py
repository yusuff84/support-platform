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
    choosing_app = State()
    choosing_problem = State()

# In-memory cooldown caches
after_hours_cooldown: Dict[str, datetime] = {}
auto_key_cooldown: Dict[str, datetime] = {}
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

# Keyboards for Multi-step Diagnostic Wizard
def create_diagnostic_kb_device():
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="📱 iPhone / iOS", callback_data="diag_dev:iPhone"),
            InlineKeyboardButton(text="🤖 Android", callback_data="diag_dev:Android")
        ],
        [
            InlineKeyboardButton(text="💻 Windows PC", callback_data="diag_dev:Windows"),
            InlineKeyboardButton(text="🍏 Mac / macOS", callback_data="diag_dev:Mac")
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
            InlineKeyboardButton(text="🏠 Ростелеком", callback_data="diag_op:Ростелеком"),
            InlineKeyboardButton(text="📶 Wi-Fi / Домашний", callback_data="diag_op:Wi-Fi")
        ],
        [
            InlineKeyboardButton(text="🌍 Другой / Зарубежный", callback_data="diag_op:Другой")
        ]
    ])
    return kb

def create_diagnostic_kb_app():
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="⚡ Incy", callback_data="diag_app:Incy"),
            InlineKeyboardButton(text="🚀 Happ", callback_data="diag_app:Happ")
        ],
        [
            InlineKeyboardButton(text="🛡️ Amnezia VPN", callback_data="diag_app:Amnezia"),
            InlineKeyboardButton(text="📡 v2rayNG", callback_data="diag_app:v2rayNG")
        ],
        [
            InlineKeyboardButton(text="🔑 Outline", callback_data="diag_app:Outline"),
            InlineKeyboardButton(text="❓ Другое / Не знаю", callback_data="diag_app:Другое")
        ]
    ])
    return kb

def create_diagnostic_kb_problem():
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="❌ Не подключается / Сбой сети", callback_data="diag_prob:Не подключается")],
        [InlineKeyboardButton(text="🐢 Медленно / Низкая скорость", callback_data="diag_prob:Медленно")],
        [InlineKeyboardButton(text="🚫 Не открывает конкретный сайт", callback_data="diag_prob:Не работает конкретный сайт")],
        [InlineKeyboardButton(text="📖 Не умею установить / настроить", callback_data="diag_prob:Не умеет подключить")],
        [InlineKeyboardButton(text="💥 Ошибка или вылет приложения", callback_data="diag_prob:Проблема с приложением")]
    ])
    return kb

def create_recommendation_action_kb(ticket_id: int):
    return InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="✅ Заработало, спасибо!", callback_data=f"solv_yes:{ticket_id}")
        ],
        [
            InlineKeyboardButton(text="👤 Перевести на человека (Оператора)", callback_data=f"solv_human:{ticket_id}")
        ]
    ])

def generate_smart_recommendation(device: str, operator: str, app: str, problem: str) -> str:
    dev = device or "вашем устройстве"
    op = operator or "вашей сети"
    application = app or "VPN"

    if problem == "Не умеет подключить":
        return (
            f"📖 <b>Пошаговая инструкция по настройке для {dev}:</b>\n\n"
            f"1. Установите приложение <b>{application}</b> из официального магазина (App Store / Google Play).\n"
            f"2. Запросите ваш персональный ключ в меню бота (кнопка «🔑 Получить мой ключ») и скопируйте его.\n"
            f"3. Откройте <b>{application}</b> ➔ нажмите <i>«Добавить конфигурацию»</i> (или значок <i>«+»</i>) ➔ <i>«Импорт из буфера обмена»</i>.\n"
            f"4. Разрешите добавление VPN-профиля в системе и нажмите большую круглую кнопку <b>«Подключить»</b>.\n\n"
            f"<i>Выполните эти шаги. Удалось ли установить подключение?</i>"
        )
    elif problem == "Медленно":
        return (
            f"⚡ <b>Рекомендация по ускорению соединения ({dev} • {op}):</b>\n\n"
            f"1. В приложении <b>{application}</b> откройте список серверов и переключитесь на сервер с минимальной нагрузкой: <b>NL-02</b> или <b>DE-01</b>.\n"
            f"2. Включите на телефоне <b>«Авиарежим»</b> на 10 секунд и выключите обратно. Это сбросит радиосессию вашего оператора связи {op}.\n"
            f"3. Если вы на мобильной сети, проверьте, не включен ли режим экономии трафика в настройках телефона.\n\n"
            f"<i>Попробуйте переключить сервер. Скорость восстановилась?</i>"
        )
    elif problem == "Не работает конкретный сайт":
        return (
            f"🌐 <b>Рекомендация по доступу к сайтам:</b>\n\n"
            f"1. В настройках приложения <b>{application}</b> включите опцию <i>«Удаленный DNS (Remote DNS)»</i> или смените адрес DNS на <code>8.8.8.8</code>.\n"
            f"2. Полностью закройте вкладку в браузере, очистите кэш или откройте ресурс в режиме «Инкогнито».\n"
            f"3. При необходимости смените сервер в приложении на резервную локацию.\n\n"
            f"<i>Попробуйте обновить страницу. Сайт стал открываться?</i>"
        )
    elif problem == "Проблема с приложением":
        return (
            f"🛠 <b>Рекомендация по устранению сбоя {application}:</b>\n\n"
            f"1. Полностью выгрузите <b>{application}</b> из памяти телефона (свайпом вверх) и запустите заново.\n"
            f"2. Проверьте в App Store / Google Play наличие обновлений для <b>{application}</b>.\n"
            f"3. При сохранении сбоев рекомендуется использовать альтернативное приложение (например, <b>Happ</b> для iOS или <b>v2rayNG</b> для Android).\n\n"
            f"<i>Приложение работает стабильно?</i>"
        )
    else: # "Не подключается" / default
        if op in ["МТС", "Мегафон", "Билайн", "Tele2"]:
            return (
                f"🛡️ <b>Диагностика для оператора {op} ({dev}):</b>\n\n"
                f"В сети оператора {op} периодически фильтруются стандартные VPN-порты. Чтобы мгновенно восстановить связь:\n\n"
                f"1. В приложении <b>{application}</b> выберите сервер с протоколом <b>Vless-Reality</b> (ноды <b>NL-02</b> или <b>DE-01</b>) — он полностью маскирует трафик под обычный веб-сайт.\n"
                f"2. Перезагрузите сотовую вышку: включите <b>«Авиарежим»</b> на 10 секунд и выключите.\n"
                f"3. Нажмите кнопку «Подключить» заново.\n\n"
                f"<i>Выполните эти 3 шага. VPN подключился?</i>"
            )
        else:
            return (
                f"🛡️ <b>Диагностика соединения ({dev} • {op}):</b>\n\n"
                f"1. Проверьте активность ключа подписки в меню бота.\n"
                f"2. В приложении <b>{application}</b> переключитесь на сервер <b>NL-02</b> или <b>DE-01</b>.\n"
                f"3. Перезагрузите интернет-соединение (Wi-Fi роутер или мобильную сеть).\n\n"
                f"<i>Удалось установить соединение?</i>"
            )

# Bot Setup
def setup_bot_dispatcher() -> Dispatcher:
    dp = Dispatcher()

    @dp.message(Command("start"))
    async def cmd_start(message: Message, state: FSMContext):
        await state.clear()
        kb = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="🛠 Начать быструю диагностику", callback_data="start_diag")],
            [InlineKeyboardButton(text="🔑 Получить мой ключ", callback_data="get_my_key")],
            [InlineKeyboardButton(text="📖 Инструкция по установке", callback_data="get_guide")],
            [InlineKeyboardButton(text="👤 Связаться с оператором", callback_data="talk_human")]
        ])
        await message.answer(
            f"Здравствуйте, {message.from_user.first_name or 'друг'}!\n\n"
            "Вас приветствует служба заботы и поддержки <b>TOPBOX VPN</b>.\n"
            "Чтобы мы помогли вам за 1 минуту, выберите нужный пункт или запустите кнопочную диагностику:",
            parse_mode="HTML",
            reply_markup=kb
        )

    # 1. Start Wizard: Device Step
    @dp.callback_query(F.data == "start_diag")
    async def diag_start(callback: types.CallbackQuery, state: FSMContext):
        await state.set_state(DiagnosticWizard.choosing_device)
        await callback.message.edit_text(
            "🛠 <b>Шаг 1 из 4:</b> На каком устройстве вы используете VPN?",
            parse_mode="HTML",
            reply_markup=create_diagnostic_kb_device()
        )
        await callback.answer()

    # 2. Got Device -> Operator Step
    @dp.callback_query(DiagnosticWizard.choosing_device, F.data.startswith("diag_dev:"))
    async def diag_got_device(callback: types.CallbackQuery, state: FSMContext):
        dev = callback.data.split(":")[1]
        await state.update_data(device=dev)
        await state.set_state(DiagnosticWizard.choosing_operator)
        await callback.message.edit_text(
            f"Устройство: <b>{dev}</b>\n\n"
            "🛠 <b>Шаг 2 из 4:</b> Какой у вас интернет-провайдер или оператор связи?",
            parse_mode="HTML",
            reply_markup=create_diagnostic_kb_operator()
        )
        await callback.answer()

    # 3. Got Operator -> App Step
    @dp.callback_query(DiagnosticWizard.choosing_operator, F.data.startswith("diag_op:"))
    async def diag_got_operator(callback: types.CallbackQuery, state: FSMContext):
        op = callback.data.split(":")[1]
        await state.update_data(operator=op)
        await state.set_state(DiagnosticWizard.choosing_app)
        data = await state.get_data()
        await callback.message.edit_text(
            f"Устройство: <b>{data.get('device')}</b>\n"
            f"Оператор: <b>{op}</b>\n\n"
            "🛠 <b>Шаг 3 из 4:</b> Какое приложение вы используете для подключения?",
            parse_mode="HTML",
            reply_markup=create_diagnostic_kb_app()
        )
        await callback.answer()

    # 4. Got App -> Problem Step
    @dp.callback_query(DiagnosticWizard.choosing_app, F.data.startswith("diag_app:"))
    async def diag_got_app(callback: types.CallbackQuery, state: FSMContext):
        app = callback.data.split(":")[1]
        await state.update_data(app=app)
        await state.set_state(DiagnosticWizard.choosing_problem)
        data = await state.get_data()
        await callback.message.edit_text(
            f"Устройство: <b>{data.get('device')}</b>\n"
            f"Оператор: <b>{data.get('operator')}</b>\n"
            f"Приложение: <b>{app}</b>\n\n"
            "🛠 <b>Шаг 4 из 4:</b> Что именно происходит?",
            parse_mode="HTML",
            reply_markup=create_diagnostic_kb_problem()
        )
        await callback.answer()

    # 5. Finished Wizard -> Auto-Populate Passport -> Give Recommendations -> Buttons: Solved / Human
    @dp.callback_query(DiagnosticWizard.choosing_problem, F.data.startswith("diag_prob:"))
    async def diag_finished(callback: types.CallbackQuery, state: FSMContext):
        prob = callback.data.split(":")[1]
        data = await state.get_data()
        await state.clear()

        device = data.get("device", "iPhone")
        operator = data.get("operator", "МТС")
        app = data.get("app", "Incy")

        # 1. Create or get ticket
        ticket = await get_or_create_ticket_tg(callback.from_user, initial_text=f"Кнопочная диагностика: {prob}")
        ticket_id = ticket["id"]

        # 2. Automatically update all 7 fields of the ticket passport in database!
        async with aiosqlite.connect(DB_PATH) as db:
            await db.execute(
                """
                UPDATE tickets SET
                    category = ?,
                    subcategory = 'кнопочный_опрос',
                    device = ?,
                    operator = ?,
                    app = ?,
                    problem = ?,
                    cause = ?,
                    ai_triaged = 1,
                    status = 'in_progress',
                    ai_diagnostic_summary = ?
                WHERE id = ?
                """,
                (
                    prob, device, operator, app, prob,
                    f"Ограничения {operator} или сбой конфигурации",
                    f"Кнопочный опрос бота: {device} • {operator} • {app} • {prob}",
                    ticket_id
                )
            )
            await db.commit()

        # 3. Log diagnostic summary in chat history
        summary_log = f"🤖 <b>Паспорт обращения автозаполнен ботом:</b>\n• Устройство: {device}\n• Оператор: {operator}\n• Приложение: {app}\n• Симптом: {prob}"
        await save_ticket_message(ticket_id, "ai", summary_log, "Бот (Автоопрос)")

        # 4. Generate targeted smart recommendation
        recommendation_body = generate_smart_recommendation(device, operator, app, prob)
        full_message = (
            f"📋 <b>Данные зафиксированы:</b>\n"
            f"• Платформа: <b>{device}</b>\n"
            f"• Провайдер: <b>{operator}</b>\n"
            f"• Приложение: <b>{app}</b>\n"
            f"• Симптом: <b>{prob}</b>\n\n"
            f"{recommendation_body}"
        )

        await save_ticket_message(ticket_id, "ai", full_message, "Бот (Рекомендация)")
        await callback.message.edit_text(
            full_message,
            parse_mode="HTML",
            reply_markup=create_recommendation_action_kb(ticket_id)
        )
        await callback.answer()

    # 6. User confirms: Recommendation worked! (Решено)
    @dp.callback_query(F.data.startswith("solv_yes:"))
    async def cb_solved_yes(callback: types.CallbackQuery):
        ticket_id = int(callback.data.split(":")[1])
        async with aiosqlite.connect(DB_PATH) as db:
            await db.execute(
                """
                UPDATE tickets SET
                    status = 'resolved',
                    category = 'Всё исправлено',
                    result = 'Решено автоматической рекомендацией бота',
                    instruction_helped = 1,
                    resolved_at = CURRENT_TIMESTAMP
                WHERE id = ?
                """,
                (ticket_id,)
            )
            await db.commit()

        resolved_text = "🎉 <b>Отлично! Рады, что всё заработало.</b>\n\nВаше обращение закрыто со статусом «Решено». Если возникнут любые вопросы — мы всегда на связи!"
        await save_ticket_message(ticket_id, "ai", "✅ Клиент подтвердил решение через рекомендацию бота.", "Бот")
        await callback.message.edit_text(resolved_text, parse_mode="HTML")
        await callback.answer()

    # 7. User clicks: Transfer to Human Operator (Человек)
    @dp.callback_query(F.data.startswith("solv_human:"))
    async def cb_transfer_human(callback: types.CallbackQuery):
        ticket_id = int(callback.data.split(":")[1])

        async with aiosqlite.connect(DB_PATH) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,)) as cur:
                ticket = dict(await cur.fetchone())

            await db.execute(
                """
                UPDATE tickets SET
                    status = 'in_progress',
                    instruction_helped = 0
                WHERE id = ?
                """,
                (ticket_id,)
            )
            await db.commit()

        human_notice = (
            "👤 <b>Вы переведены на дежурного специалиста поддержки!</b>\n\n"
            f"Номер обращения: <b>#{ticket['ticket_number']}</b>\n"
            f"• Устройство: <b>{ticket.get('device') or 'Зафиксировано'}</b>\n"
            f"• Провайдер: <b>{ticket.get('operator') or 'Зафиксировано'}</b>\n"
            f"• Приложение: <b>{ticket.get('app') or 'Зафиксировано'}</b>\n\n"
            "📋 Все параметры уже переданы в систему оператору.\n"
            "Специалист уже видит ваше обращение и подключится в течение 2–5 минут.\n"
            "Вы можете прямо сейчас написать подробности или отправить скриншот ошибки!"
        )

        await save_ticket_message(ticket_id, "system", f"👤 Клиент переведён на человека. Параметры: {ticket.get('device')} • {ticket.get('operator')} • {ticket.get('app')}.", "Система")
        await callback.message.edit_text(human_notice, parse_mode="HTML")
        await callback.answer()

    # Fast Action: talk_human directly
    @dp.callback_query(F.data == "talk_human")
    async def cb_talk_human(callback: types.CallbackQuery, state: FSMContext):
        ticket = await get_or_create_ticket_tg(callback.from_user, initial_text="Запрос оператора")
        # Check if environment is already known
        if not ticket.get("device") or not ticket.get("operator"):
            # Prompt the 4 quick buttons first so the human has data!
            await state.set_state(DiagnosticWizard.choosing_device)
            prompt_text = (
                "👋 Чтобы специалист поддержки сразу знал, как вам помочь без лишних переспросов, "
                "уточните, пожалуйста, ваше устройство и оператора (это займет 10 секунд):\n\n"
                "🛠 <b>Шаг 1 из 4:</b> На каком устройстве вы используете VPN?"
            )
            await callback.message.edit_text(prompt_text, parse_mode="HTML", reply_markup=create_diagnostic_kb_device())
        else:
            human_text = (
                f"👤 <b>Ваше обращение передано дежурному оператору!</b>\n\n"
                f"Номер заявки: <b>#{ticket['ticket_number']}</b>\n"
                f"Параметры: <b>{ticket.get('device')}</b> • <b>{ticket.get('operator')}</b> • <b>{ticket.get('app')}</b>\n\n"
                "Специалист уже на связи и ответит вам прямо в этот чат!"
            )
            await callback.message.edit_text(human_text, parse_mode="HTML")
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
                    f"🔑 <b>Ваша действующая VPN-подписка:</b>\n\n"
                    f"Ссылка / ключ:\n`{k['key_string']}`\n\n"
                    f"• Сервер: {k['server']}\n"
                    f"• Протокол: {k['protocol']}\n"
                    f"• Статус: {k['subscription_status']}\n\n"
                    f"Скопируйте ключ и вставьте в приложение Incy / Happ / Amnezia."
                )
            else:
                text = "Для вашего Telegram ID не найдено активных ключей. Вы можете приобрести подписку или написать оператору."
        await callback.message.answer(text, parse_mode="HTML")
        await callback.answer()

    @dp.callback_query(F.data == "get_guide")
    async def cb_get_guide(callback: types.CallbackQuery):
        guide = (
            "📖 <b>Как подключить TOPBOX VPN:</b>\n\n"
            "1. Установите приложение <b>Incy</b> или <b>Happ</b> (из App Store / Google Play).\n"
            "2. Скопируйте ваш ключ (кнопка «🔑 Получить мой ключ»).\n"
            "3. Откройте приложение ➔ выберите «Добавить ключ из буфера обмена».\n"
            "4. Нажмите «Подключить»!\n\n"
            "Если что-то не получается — нажмите «🛠 Быстрая диагностика»!"
        )
        await callback.message.answer(guide, parse_mode="HTML")
        await callback.answer()

    # Handling incoming client messages
    @dp.message()
    async def handle_client_message(message: Message, state: FSMContext):
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
                            f"🤖 <b>Автоответ по запросу ключа:</b>\n\n"
                            f"Ваш активный ключ:\n`{k['key_string']}`\n\n"
                            f"Сервер: {k['server']} | Протокол: {k['protocol']}\n"
                            f"Срок: до {k['expires_at'] or 'активен'}"
                        )
                        await message.answer(auto_key_reply, parse_mode="HTML")
                        await save_ticket_message(ticket["id"], "ai", auto_key_reply, "AI Auto-Key")

        # 4. If environment is NOT YET collected, offer the friendly buttons wizard!
        current_state = await state.get_state()
        if not ticket.get("device") and not current_state:
            await state.set_state(DiagnosticWizard.choosing_device)
            welcome_survey = (
                "👋 Чтобы быстро определить причину неполадки и сразу дать точную рекомендацию, "
                "ответьте на 3 быстрых вопроса кнопками внизу:\n\n"
                "🛠 <b>Шаг 1 из 4:</b> На каком устройстве вы используете VPN?"
            )
            await message.answer(welcome_survey, parse_mode="HTML", reply_markup=create_diagnostic_kb_device())

    return dp
