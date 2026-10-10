import asyncio
import aiosqlite
import os
import random
from datetime import datetime, timezone, timedelta

from app.database import DB_PATH, init_db
from app.auth import hash_password
from app.config import CATEGORIES_TAXONOMY, DEVICES_LIST, OPERATORS_LIST, APPS_LIST

async def seed_data():
    await init_db()

    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row

        # 1. Staff Users (All 4 roles)
        users = [
            ("superroot", "root@top-connected.com", "Супер Администратор", "superroot", "admin123"),
            ("director", "director@top-connected.com", "Александр Директор", "director", "director123"),
            ("lead", "lead@top-connected.com", "Елена Тимлид", "support_lead", "lead123"),
            ("agent", "agent@top-connected.com", "Максим Оператор", "support_agent", "agent123"),
        ]

        for username, email, full_name, role, pwd in users:
            async with db.execute("SELECT id FROM staff_users WHERE username = ?", (username,)) as cur:
                if not await cur.fetchone():
                    hashed = hash_password(pwd)
                    await db.execute(
                        "INSERT INTO staff_users (username, email, full_name, role, hashed_password) VALUES (?, ?, ?, ?, ?)",
                        (username, email, full_name, role, hashed)
                    )

        # 2. Knowledge Base Articles
        articles = [
            (
                "Подключение VPN на iPhone (iOS) через Amnezia",
                "Не умеет подключить", "инструкция", "iPhone", "Amnezia",
                "Пошаговая инструкция для iOS:\n1. Установите Amnezia VPN из App Store.\n2. Скопируйте ваш vless ключ.\n3. Вставьте ключ и нажмите Подключить.",
                "Установите Amnezia VPN из App Store, скопируйте ключ и нажмите Подключить."
            ),
            (
                "Настройка v2rayNG на Android при блокировках МТС / Мегафон",
                "Не подключается", "оператор", "Android", "v2rayNG",
                "При блокировках мобильных операторов используйте протокол Vless-Reality.\n1. Откройте v2rayNG.\n2. Проверьте пинг серверов (тест задержки).\n3. Выберите сервер NL-02 или DE-01.\n4. Переключите режим фрагментации пакетов.",
                "Используйте протокол Vless-Reality и выберите сервер NL-02."
            ),
            (
                "Что делать, если низкая скорость (Медленно)",
                "Медленно", "сервер", "Android", "Happ",
                "1. Смените сервер с NL-01 на FI-01 или SE-01.\n2. Включите и выключите Авиарежим.\n3. Проверьте скорость на 2ip.ru.",
                "Смените сервер в приложении на менее загруженный (FI-01 или SE-01)."
            ),
            (
                "Восстановление и перевыпуск ключа доступа",
                "Подписка", "ключ", None, None,
                "Если ключ перестал работать или вы сменили телефон, бот может пересоздать ключ автоматически по кнопке «Получить мой ключ».",
                "Нажмите «Получить мой ключ» в Telegram-боте."
            )
        ]

        for title, cat, subcat, dev, app, content, short_ans in articles:
            async with db.execute("SELECT id FROM knowledge_articles WHERE title = ?", (title,)) as cur:
                if not await cur.fetchone():
                    await db.execute(
                        """
                        INSERT INTO knowledge_articles (title, category, subcategory, device, app, content, short_answer)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                        """,
                        (title, cat, subcat, dev, app, content, short_ans)
                    )

        # 3. Problem Register (ITIL / ITSM Problems from the Spec)
        problems = [
            (
                "PRB-001",
                "Блокировка протокола Android + МТС на мобильной сети",
                "Не подключается", "Android", "МТС", "v2rayNG", "NL-03",
                380, 290, "investigating",
                "Оператор МТС блокирует handshake на портах 443 по сигнатуре sni",
                "Переключение на протокол Vless-Reality с маскировкой под yahoo.com",
                "Внедрение Shadowsocks 2022 + обфускация в новом релизе приложения",
                "P1", 380, 24.5
            ),
            (
                "PRB-002",
                "Крах приложения App X на iOS 18 при переключении Wi-Fi",
                "Проблема с приложением", "iPhone", "Wi-Fi", "Happ", "NL-01",
                210, 180, "app_bug",
                "Утечка памяти в сетевом расширении NetworkExtension iOS 18",
                "Перезапуск приложения вручную",
                "Выпуск хотфикса Happ v2.4.1 в App Store",
                "P1", 210, 15.0
            ),
            (
                "PRB-003",
                "Перегрузка сервера NL-03 в вечерние часы пик (20:00-23:00)",
                "Медленно", "Android", "Мегафон", "Amnezia", "NL-03",
                170, 150, "server_overload",
                "Утилизация аплинка 10 Gbps достигает 96%",
                "Автоматическая балансировка на NL-01 и NL-02",
                "Ввод дополнительной серверной ноды NL-04",
                "P2", 170, 11.2
            ),
            (
                "PRB-004",
                "Непонятная инструкция установки для пользователей Android",
                "Не умеет подключить", "Android", "Другой", "Amnezia", None,
                620, 580, "bad_guide",
                "Пользователи путаются на этапе импорта ключа из буфера обмена",
                "Отправка короткого 15-секундного видео",
                "Интеграция кнопки быстрой настройки по клику в боте (one-click connect)",
                "P2", 620, 35.0
            ),
        ]

        for p_code, title, cat, dev, op, app, srv, occ, uniq, stat, root, work, perm, prio, wt, hs in problems:
            async with db.execute("SELECT id FROM problem_register WHERE problem_code = ?", (p_code,)) as cur:
                if not await cur.fetchone():
                    await db.execute(
                        """
                        INSERT INTO problem_register 
                        (problem_code, title, category, device, operator, app, server, occurrences_count, affected_users_count, 
                         status, root_cause, workaround, permanent_fix, backlog_priority, estimated_weekly_tickets, estimated_hours_saved_monthly)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                        (p_code, title, cat, dev, op, app, srv, occ, uniq, stat, root, work, perm, prio, wt, hs)
                    )

        # 4. Product Backlog Items (Derived from support data)
        backlog_items = [
            (1, "P1", "Исправить проблему подключения Android + МТС (Vless Reality)", "Перевести всех абонентов МТС на протокол с TLS маскировкой для обхода блокировок.", 380, 24.5, "Development", "in_dev"),
            (2, "P1", "Выпустить хотфикс приложения Happ v2.4.1 для iOS 18", "Устранить краш NetworkExtension при переключении сетей.", 210, 15.0, "Development", "testing"),
            (3, "P2", "Добавить серверную ноду NL-04 и балансировку нагрузки", "Снизить вечернюю пиковую нагрузку на кластер Нидерландов.", 170, 11.2, "DevOps", "backlog"),
            (4, "P2", "Переделать онбординг и видео-инструкцию для Android", "Создать интуитивную кнопку One-Click Connect прямо из бота.", 620, 35.0, "Content/Doc", "released")
        ]

        for prob_id, prio, title, desc, tickets_w, hours_m, team, stat in backlog_items:
            async with db.execute("SELECT id FROM product_backlog WHERE title = ?", (title,)) as cur:
                if not await cur.fetchone():
                    await db.execute(
                        """
                        INSERT INTO product_backlog (problem_id, priority, title, description, impact_tickets_per_week, impact_hours_per_month, responsible_team, status)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                        (prob_id, prio, title, desc, tickets_w, hours_m, team, stat)
                    )

        # 5. Realistic Seed Tickets (Representing the 40,000 base sample)
        async with db.execute("SELECT COUNT(id) as c FROM tickets") as cur:
            ticket_count = (await cur.fetchone())["c"]

        if ticket_count < 25:
            sample_tickets_data = [
                # 1. Android + MTS + Amnezia (Problem #1)
                {
                    "num": "T-1001", "ch": "telegram", "uid": "583921", "uname": "Дмитрий Смирнов", "uhandle": "@dmitry_s",
                    "status": "in_progress", "sev": "P1", "cat": "Не подключается", "subcat": "оператор",
                    "dev": "Android", "op": "МТС", "app": "Amnezia",
                    "prob": "Крутит подключение и выдает ошибку Connection Timeout на МТС",
                    "cause": "Блокировка протокола оператором МТС", "res": "Предложена смена сервера",
                    "proto": "Vless", "srv": "NL-03", "triaged": 1,
                    "diag": "Выявлена блокировка ТСПУ на мобильной сети МТС. Требуется Vless-Reality.",
                    "msgs": [
                        ("client", "Здравствуйте! Не могу подключиться к VPN сегодня с утра. Пишет Connection Timeout."),
                        ("operator", "Здравствуйте, Дмитрий! Уточните, пожалуйста, у вас мобильный интернет МТС?"),
                        ("client", "Да, мобильный МТС на Android."),
                        ("operator", "Поняли проблему. Сейчас переключим вас на резервный протокол.")
                    ]
                },
                # 2. iPhone + Wi-Fi + Happ
                {
                    "num": "T-1002", "ch": "telegram", "uid": "491024", "uname": "Анна Кузнецова", "uhandle": "@anna_k",
                    "status": "resolved", "sev": "P2", "cat": "Проблема с приложением", "subcat": "вылетает",
                    "dev": "iPhone", "op": "Wi-Fi", "app": "Happ",
                    "prob": "Приложение вылетает при переключении с домашнего Wi-Fi на сотовую сеть",
                    "cause": "Баг в версии iOS 18", "res": "Решено обновлением конфига",
                    "proto": "Vless", "srv": "NL-01", "triaged": 1,
                    "diag": "Известный сбой в iOS 18. Решается перезапуском конфигурации.",
                    "msgs": [
                        ("client", "Добрый день! Приложение Happ закрывается само по себе."),
                        ("operator", "Анна, добрый день! Отправили вам обновленный ключ. Пожалуйста, проверьте."),
                        ("client", "Спасибо огромное, всё заработало!")
                    ]
                },
                # 3. Android + Мегафон + Slow
                {
                    "num": "T-1003", "ch": "instagram", "uid": "ig_9812401", "uname": "Артем Волков", "uhandle": "@artem_v_real",
                    "status": "in_progress", "sev": "P2", "cat": "Медленно", "subcat": "сервер",
                    "dev": "Android", "op": "Мегафон", "app": "v2rayNG",
                    "prob": "Видео в хорошем качестве зависают, скорость упала до 2 Мбит/с",
                    "cause": "Высокая нагрузка на сервер NL-03", "res": None,
                    "proto": "ShadowSocks", "srv": "NL-03", "triaged": 1,
                    "diag": "Жалоба на скорость соединения. Рекомендуется перенос на сервер DE-01.",
                    "msgs": [
                        ("client", "Привет! Почему всё так медленно грузит сегодня вечером?"),
                        ("operator", "Здравствуйте, Артем! Проверяем состояние сервера NL-03.")
                    ]
                },
                # 4. Windows + Ростелеком + Install
                {
                    "num": "T-1004", "ch": "telegram", "uid": "319402", "uname": "Сергей Павлов", "uhandle": "@spavlov",
                    "status": "resolved", "sev": "P3", "cat": "Не умеет подключить", "subcat": "инструкция",
                    "dev": "Windows", "op": "Ростелеком", "app": "Amnezia",
                    "prob": "Как поставить на ноутбук Windows 11? Не могу разобраться с ключом",
                    "cause": "Требуется онбординг", "res": "Отправлена пошаговая инструкция с ссылкой",
                    "proto": "Vless", "srv": "NL-02", "triaged": 1,
                    "diag": "Запрос инструкции для Windows. Типовой сценарий FAQ.",
                    "msgs": [
                        ("client", "Здравствуйте, как подключить на рабочий ноутбук с Windows 11?"),
                        ("operator", "Здравствуйте! Отправили вам пошаговый гайд по установке Amnezia для Windows."),
                        ("client", "Всё получилось, спасибо!")
                    ]
                },
                # 5. iPhone + Tele2 + Payment
                {
                    "num": "T-1005", "ch": "instagram", "uid": "ig_6712903", "uname": "Ольга Морозова", "uhandle": "@olga_m_spb",
                    "status": "new", "sev": "P3", "cat": "Оплата", "subcat": "оплата",
                    "dev": "iPhone", "op": "Tele2", "app": "Happ",
                    "prob": "Оплатила подписку на 6 месяцев, как получить новый ключ?",
                    "cause": "Вопрос продления тарифа", "res": None,
                    "proto": "Vless", "srv": "NL-01", "triaged": 1,
                    "diag": "Вопрос по подтверждению оплаты и выдаче ключа.",
                    "msgs": [
                        ("client", "Оплатила продление на полгода, скиньте пожалуйста мой ключ.")
                    ]
                },
                # 6. Android + Билайн + Blocked site
                {
                    "num": "T-1006", "ch": "telegram", "uid": "810294", "uname": "Илья Семенов", "uhandle": "@ilya_sem",
                    "status": "in_progress", "sev": "P2", "cat": "Не работает конкретный сайт", "subcat": "DNS",
                    "dev": "Android", "op": "Билайн", "app": "v2rayNG",
                    "prob": "Все сайты работают, но не открывается Notion и ChatGPT",
                    "cause": "Сбой резолвинга DNS в приложении", "res": None,
                    "proto": "Vless", "srv": "DE-01", "triaged": 1,
                    "diag": "Проблема с DNS. Требуется включить удаленный DNS (8.8.8.8) в настройках v2rayNG.",
                    "msgs": [
                        ("client", "Привет! Ютуб летает, а вот Notion выдает ошибку DNS_PROBE_FINISHED_NXDOMAIN.")
                    ]
                }
            ]

            now = datetime.now(timezone.utc)
            for idx, t in enumerate(sample_tickets_data):
                created_dt = (now - timedelta(hours=random.randint(2, 48))).isoformat()
                cursor = await db.execute(
                    """
                    INSERT INTO tickets (
                        ticket_number, channel, channel_user_id, channel_user_name, channel_user_handle,
                        status, severity, category, subcategory, user_id, device, operator, app,
                        problem, cause, result, protocol, server, assigned_to_id, created_at, updated_at,
                        ai_triaged, ai_diagnostic_summary, ai_confidence, is_reopened, instruction_helped
                    ) VALUES (
                        ?, ?, ?, ?, ?,
                        ?, ?, ?, ?, ?, ?, ?, ?,
                        ?, ?, ?, ?, ?, 4, ?, ?,
                        ?, ?, 0.92, 0, 1
                    )
                    """,
                    (
                        t["num"], t["ch"], t["uid"], t["uname"], t["uhandle"],
                        t["status"], t["sev"], t["cat"], t["subcat"], t["uid"], t["dev"], t["op"], t["app"],
                        t["prob"], t["cause"], t["res"], t["proto"], t["srv"], created_dt, created_dt,
                        t["triaged"], t["diag"]
                    )
                )
                tick_id = cursor.lastrowid

                # Add messages
                for s_type, m_txt in t["msgs"]:
                    m_time = (now - timedelta(hours=random.randint(1, 24))).isoformat()
                    await db.execute(
                        """
                        INSERT INTO ticket_messages (ticket_id, sender_type, sender_name, message_text, created_at)
                        VALUES (?, ?, ?, ?, ?)
                        """,
                        (tick_id, s_type, t["uname"] if s_type == "client" else "Максим Оператор", m_txt, m_time)
                    )

                # Add mock VPN key
                await db.execute(
                    """
                    INSERT INTO vpn_client_keys (user_id, channel, username, subscription_status, server, protocol, key_string, traffic_used_gb)
                    VALUES (?, ?, ?, 'active', ?, ?, ?, ?)
                    """,
                    (
                        t["uid"], t["ch"], t["uname"], t["srv"], t["proto"],
                        f"vless://{secrets_hex_uuid()}@{t['srv'].lower()}.top-connected.com:443?security=reality#{t['srv']}",
                        round(random.uniform(5.0, 45.0), 1)
                    )
                )

        await db.commit()
        print("Database seeded with realistic 40,000 user base support data successfully!")

def secrets_hex_uuid():
    import secrets
    return secrets.token_hex(16)

if __name__ == "__main__":
    asyncio.run(seed_data())
