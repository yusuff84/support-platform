import json
import re
import logging
from typing import Dict, Any, List
from app.ai.openrouter import openrouter_client
from app.config import CATEGORIES_TAXONOMY, DEVICES_LIST, OPERATORS_LIST, APPS_LIST
from app.models import AiTriageResult

logger = logging.getLogger(__name__)

SYSTEM_TRIAGE_PROMPT = f"""Ты — аналитик и система классификации обращений техподдержки VPN-сервиса (40 000 абонентов).
Твоя задача — извлечь данные обращения пользователя и заполнить «Паспорт тикета» в формате JSON.

Категории и допустимые подкатегории (выбери ровно одну категорию и соответствующую ей подкатегорию):
1. «Не подключается»: [приложение, ключ, сервер, оператор, устройство]
2. «Медленно»: [оператор, сервер, Wi-Fi, приложение]
3. «Не работает конкретный сайт»: [блокировка, DNS, маршрут, сайт]
4. «Не умеет подключить»: [инструкция, установка, настройка]
5. «Проблема с приложением»: [вылетает, не открывается, ошибка]
6. «Ограничения оператора»: [мобильная сеть, Wi-Fi, регион]
7. «Оплата»: [оплата, продление, возврат]
8. «Подписка»: [ключ, тариф, срок, активация]
9. «Всё исправлено»: [проблема решена]
10. «Не решено»: [техническая проблема требует инженера]

Допустимые устройства: {', '.join(DEVICES_LIST)}
Допустимые операторы: {', '.join(OPERATORS_LIST)}
Допустимые приложения: {', '.join(APPS_LIST)}
Критичность (severity):
- P0: массовая авария сервиса
- P1: полное отсутствие связи у пользователя / невозможность подключения
- P2: стандартная техническая проблема (медленно, периодические обрывы)
- P3: вопрос, как установить / оплата / инструкция

Верни ответ СТРОГО в виде валидного JSON без markdown-блоков:
{{
  "category": "Название категории",
  "subcategory": "Подкатегория",
  "device": "Устройство или null",
  "operator": "Оператор или null",
  "app": "Приложение или null",
  "problem": "Краткая суть проблемы (1 фраза)",
  "cause": "Предполагаемая причина",
  "severity": "P0/P1/P2/P3",
  "diagnostic_summary": "1-2 предложения диагноза для оператора",
  "confidence": 0.95
}}
"""

def heuristic_fallback_triage(text: str) -> AiTriageResult:
    """Intelligent rule-based parser used when LLM is unavailable or offline."""
    lower = text.lower()

    # Device detection
    device = None
    if any(k in lower for k in ["айфон", "iphone", "ios", "айпад", "ipad", "apple"]):
        device = "iPhone"
    elif any(k in lower for k in ["андроид", "android", "самсунг", "samsung", "сяоми", "xiaomi", "redmi", "pixel"]):
        device = "Android"
    elif any(k in lower for k in ["винда", "windows", "виндовс", "пк", "ноутбук", "комп"]):
        device = "Windows"
    elif any(k in lower for k in ["мак", "mac", "macbook", "macos", "макбук"]):
        device = "Mac"
    elif "роутер" in lower or "router" in lower:
        device = "Роутер"

    # Operator detection
    operator = None
    if "мтс" in lower or "mts" in lower:
        operator = "МТС"
    elif "мегафон" in lower or "megafon" in lower:
        operator = "Мегафон"
    elif "билайн" in lower or "beeline" in lower:
        operator = "Билайн"
    elif "теле2" in lower or "tele2" in lower or "t2" in lower:
        operator = "Tele2"
    elif "ростелеком" in lower or "rt" in lower:
        operator = "Ростелеком"
    elif "вайфай" in lower or "wi-fi" in lower or "wifi" in lower:
        operator = "Wi-Fi"

    # App detection
    app = None
    if "amnezia" in lower or "амнезия" in lower:
        app = "Amnezia"
    elif "outline" in lower or "аутлайн" in lower:
        app = "Outline"
    elif "v2rayng" in lower or "v2ray" in lower:
        app = "v2rayNG"
    elif "happ" in lower:
        app = "Happ"
    elif "shadowrocket" in lower:
        app = "Shadowrocket"
    elif "karing" in lower:
        app = "Karing"

    # Category, Subcategory, Severity
    category = "Не подключается"
    subcategory = "оператор"
    severity = "P1"
    cause = "Ограничения или блокировка протокола"
    diag = "Пользователь сообщает о проблемах с подключением. Требуется проверка ключа и настроек."

    if any(k in lower for k in ["как подключить", "инструкци", "установ", "как настроить", "скачать", "не умею", "помогите настроить"]):
        category = "Не умеет подключить"
        subcategory = "инструкция"
        severity = "P3"
        cause = "Требуется гайд по установке"
        diag = "Клиенту нужна пошаговая инструкция для подключения."
    elif any(k in lower for k in ["медленн", "скорост", "тормозит", "лагает", "низкая"]):
        category = "Медленно"
        subcategory = "сервер" if not operator else "оператор"
        severity = "P2"
        cause = "Снижение скорости или загруженность сервера"
        diag = "Жалоба на низкую скорость соединения. Рекомендуется смена сервера."
    elif any(k in lower for k in ["сайт", "инста", "ютуб", "youtube", "дискорд", "discord", "не открывает"]):
        category = "Не работает конкретный сайт"
        subcategory = "блокировка"
        severity = "P2"
        cause = "Блокировка конкретного домена / DNS"
        diag = "Не открывается определенный ресурс при активном VPN. Проверить DNS и маршрутизацию."
    elif any(k in lower for k in ["вылетает", "ошибка в приложении", "крашится", "не открывается приложение"]):
        category = "Проблема с приложением"
        subcategory = "вылетает"
        severity = "P2"
        cause = "Сбой клиентского ПО"
        diag = "Сбой в мобильном приложении клиента."
    elif any(k in lower for k in ["оплат", "деньги", "чек", "списал", "карт", "возврат"]):
        category = "Оплата"
        subcategory = "оплата"
        severity = "P3"
        cause = "Вопрос по платежу или балансу"
        diag = "Финансовый запрос по оплате или продлению."
    elif any(k in lower for k in ["где ключ", "скинь ключ", "пропал ключ", "подписк", "тариф", "срок"]):
        category = "Подписка"
        subcategory = "ключ"
        severity = "P3"
        cause = "Запрос активного ключа абонента"
        diag = "Запрос данных подписки и ключа подключения."

    return AiTriageResult(
        category=category,
        subcategory=subcategory,
        device=device,
        operator=operator,
        app=app,
        problem=text[:120],
        cause=cause,
        severity=severity,
        diagnostic_summary=diag,
        confidence=0.82
    )

async def auto_triage_ticket(messages: List[str]) -> AiTriageResult:
    """Runs OpenRouter free pool triage with heuristic fallback."""
    combined_text = "\n".join(messages).strip()
    if not combined_text:
        return heuristic_fallback_triage("Не подключается")

    llm_messages = [
        {"role": "system", "content": SYSTEM_TRIAGE_PROMPT},
        {"role": "user", "content": f"Обращение клиента:\n\"\"\"{combined_text}\"\"\""}
    ]

    result = await openrouter_client.chat_completion_with_fallback(
        messages=llm_messages,
        temperature=0.1,
        max_tokens=600
    )

    if result.get("content"):
        try:
            cleaned = result["content"].strip()
            # remove ```json ... ``` wrapper if model generated it
            cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.MULTILINE)
            cleaned = re.sub(r"\s*```$", "", cleaned, flags=re.MULTILINE)
            data = json.loads(cleaned)

            return AiTriageResult(
                category=data.get("category"),
                subcategory=data.get("subcategory"),
                device=data.get("device"),
                operator=data.get("operator"),
                app=data.get("app"),
                problem=data.get("problem") or combined_text[:100],
                cause=data.get("cause"),
                severity=data.get("severity") or "P2",
                diagnostic_summary=data.get("diagnostic_summary") or "Диагностика проведена ИИ.",
                confidence=float(data.get("confidence", 0.90))
            )
        except Exception as e:
            logger.warning(f"Error parsing LLM triage response: {e}. Raw content: {result['content'][:200]}")

    # Fallback to heuristics
    return heuristic_fallback_triage(combined_text)
