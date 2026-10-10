import logging
from typing import Dict, Any, List, Optional
from app.ai.openrouter import openrouter_client
from app.models import AiSuggestionResult

logger = logging.getLogger(__name__)

COPILOT_SYSTEM_PROMPT = """Ты — интеллектуальный ассистент оператора техподдержки TOPBOX VPN (40 000 абонентов).
Твоя цель: составить вежливый, емкий, профессиональный и технически точный ответ на русском языке.

Правила:
1. Обращайся к пользователю вежливо на «Вы».
2. Не лей воду, давай конкретные пошаговые действия.
3. Учитывай устройство пользователя (iPhone / Android / Windows / Mac), его оператора связи и приложение.
4. Если оператор связи блокирует протокол (например, МТС или Мегафон) — порекомендуй сменить протокол на Vless-Reality или включить резервный сервер.
5. Не используй выдуманные команды. Рекомендуемые приложения: Amnezia VPN, Happ, v2rayNG, Outline.
"""

def generate_local_copilot_fallback(ticket: dict, last_message: str) -> AiSuggestionResult:
    """Fallback generator when OpenRouter API is not configured or all free models fail."""
    dev = ticket.get("device") or "устройстве"
    op = ticket.get("operator") or "вашего оператора"
    cat = ticket.get("category") or ""
    sub = ticket.get("subcategory") or ""

    if cat == "Не умеет подключить":
        text = (
            f"Здравствуйте! Сейчас помогу вам настроить VPN на {dev}.\n\n"
            f"1. Установите рекомендованное приложение (Amnezia VPN или Happ).\n"
            f"2. Скопируйте ваш персональный ключ доступа из бота.\n"
            f"3. Откройте приложение и нажмите «Добавить конфигурацию» (или значок «+»).\n"
            f"4. Нажмите «Подключиться». Соединение установится автоматически."
        )
        action = "send_guide"
    elif cat == "Медленно":
        text = (
            f"Здравствуйте! Давайте оптимизируем скорость подключения.\n\n"
            f"1. Попробуйте переключиться на альтернативный сервер (например, сервер NL-02 или DE-01).\n"
            f"2. Если вы подключены через Wi-Fi или мобильную сеть {op}, кратковременно включите и выключите «Авиарежим» для сброса радиоканала.\n"
            f"3. Проверьте скорость на сайте speedtest.net или 2ip.ru."
        )
        action = "recreate_key"
    elif op in ["МТС", "Мегафон", "Билайн", "Tele2"]:
        text = (
            f"Здравствуйте! Мы зафиксировали временные ограничения стандартных протоколов в сети оператора {op}.\n\n"
            f"Для восстановления доступа мы перевели ваш ключ на устойчивый протокол Vless с маскировкой.\n"
            f"Пожалуйста, обновите ключ в приложении и попробуйте подключиться повторно."
        )
        action = "recreate_key"
    else:
        text = (
            f"Здравствуйте! Проверили статус вашего ключа и состояние серверов.\n\n"
            f"Пожалуйста, выполните следующие шаги:\n"
            f"1. Полностью закройте приложение VPN и откройте его заново.\n"
            f"2. Проверьте, активна ли подписка, и нажмите «Подключиться».\n\n"
            f"Если ошибка сохраняется, напишите нам код ошибки или прикрепите скриншот экрана."
        )
        action = "send_key"

    return AiSuggestionResult(
        suggested_reply=text,
        suggested_action=action,
        model_used="local_heuristic_copilot",
        confidence=0.88
    )

async def generate_ai_copilot_suggestion(
    ticket: dict,
    chat_history: List[dict],
    knowledge_base: Optional[List[dict]] = None
) -> AiSuggestionResult:
    """Generates an intelligent suggested reply using OpenRouter free pool with fallback."""
    last_user_msg = ""
    for m in reversed(chat_history):
        if m.get("sender_type") == "client":
            last_user_msg = m.get("message_text", "")
            break

    context_prompt = f"""
Контекст тикета:
- Номер: {ticket.get('ticket_number')}
- Категория: {ticket.get('category')} / {ticket.get('subcategory')}
- Устройство: {ticket.get('device')}
- Оператор связи: {ticket.get('operator')}
- Приложение: {ticket.get('app')}
- Сервер: {ticket.get('server')}
- Протокол: {ticket.get('protocol')}
- Последняя жалоба клиента: "{last_user_msg}"
"""

    if knowledge_base:
        articles_snippet = "\n".join([f"- {a.get('title')}: {a.get('content')[:120]}..." for a in knowledge_base[:3]])
        context_prompt += f"\nПолезные статьи базы знаний:\n{articles_snippet}\n"

    context_prompt += "\nСформулируй готовый текст ответа клиенту от лица саппорта:"

    messages = [
        {"role": "system", "content": COPILOT_SYSTEM_PROMPT},
        {"role": "user", "content": context_prompt}
    ]

    result = await openrouter_client.chat_completion_with_fallback(
        messages=messages,
        temperature=0.4,
        max_tokens=650
    )

    if result.get("content"):
        content = result["content"].strip()
        # deduce recommended action
        action = "send_reply"
        lower = content.lower()
        if "инструкц" in lower or "шаг" in lower:
            action = "send_guide"
        elif "новый ключ" in lower or "перевыпуск" in lower:
            action = "recreate_key"

        return AiSuggestionResult(
            suggested_reply=content,
            suggested_action=action,
            model_used=result["model"],
            confidence=0.94
        )

    return generate_local_copilot_fallback(ticket, last_user_msg)
