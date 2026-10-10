import pytest
import asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.config import settings

@pytest.mark.asyncio
async def test_health():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/health")
        assert res.status_code == 200
        data = res.json()
        assert data["app"] == settings.PROJECT_NAME
        assert data["user_base"] == 40000

@pytest.mark.asyncio
async def test_auth_login():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Test agent login
        res = await ac.post("/api/auth/login", data={"username": "agent", "password": "agent123"})
        assert res.status_code == 200
        data = res.json()
        assert "access_token" in data
        assert data["user"]["role"] == "support_agent"

        # Test director login
        res_dir = await ac.post("/api/auth/login", data={"username": "director", "password": "director123"})
        assert res_dir.status_code == 200
        data_dir = res_dir.json()
        assert data_dir["user"]["role"] == "director"

@pytest.mark.asyncio
async def test_tickets_flow():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Login as agent
        login_res = await ac.post("/api/auth/login", data={"username": "agent", "password": "agent123"})
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # List tickets
        res = await ac.get("/api/tickets", headers=headers)
        assert res.status_code == 200
        tickets = res.json()
        assert len(tickets) > 0
        ticket_id = tickets[0]["id"]

        # Get taxonomy
        tax_res = await ac.get("/api/tickets/taxonomy", headers=headers)
        assert tax_res.status_code == 200
        taxonomy = tax_res.json()
        assert "Не подключается" in taxonomy["categories"]

        # Update ticket passport (7 fields)
        passport_payload = {
            "category": "Не подключается",
            "subcategory": "оператор",
            "device": "Android",
            "operator": "МТС",
            "app": "Amnezia",
            "problem": "Не подключается к серверу NL-03",
            "cause": "Блокировка сигнатуры протокола",
            "result": "решено сменой протокола на Vless",
            "severity": "P1",
            "status": "in_progress"
        }
        update_res = await ac.put(f"/api/tickets/{ticket_id}/passport", json=passport_payload, headers=headers)
        assert update_res.status_code == 200
        updated = update_res.json()
        assert updated["device"] == "Android"
        assert updated["operator"] == "МТС"
        assert updated["category"] == "Не подключается"

@pytest.mark.asyncio
async def test_analytics_and_vpn_health():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        login_res = await ac.post("/api/auth/login", data={"username": "director", "password": "director123"})
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # VPN Health Overview (40k base metrics)
        health_res = await ac.get("/api/analytics/health-overview", headers=headers)
        assert health_res.status_code == 200
        h_data = health_res.json()
        assert h_data["total_users"] == 40000
        assert "working_normally_pct" in h_data
        assert "user_problem_rate_pct" in h_data

        # Top problems
        top_res = await ac.get("/api/analytics/top-problems", headers=headers)
        assert top_res.status_code == 200
        top_data = top_res.json()
        assert len(top_data) > 0

        # Drilldown anomalies
        drill_res = await ac.get("/api/analytics/drilldown-anomalies", headers=headers)
        assert drill_res.status_code == 200

        # Reports
        rep_res = await ac.get("/api/analytics/reports/daily", headers=headers)
        assert rep_res.status_code == 200
        assert "TOPBOX SUPPORT" in rep_res.json()["title"]

        weekly_res = await ac.get("/api/analytics/reports/weekly", headers=headers)
        assert weekly_res.status_code == 200
        assert "VPN — Support Weekly" in weekly_res.json()["title"]

@pytest.mark.asyncio
async def test_ai_triage_and_copilot():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        login_res = await ac.post("/api/auth/login", data={"username": "agent", "password": "agent123"})
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Trigger AI triage on ticket 1
        triage_res = await ac.post("/api/ai/triage/1", headers=headers)
        assert triage_res.status_code == 200
        t_data = triage_res.json()
        assert t_data["category"] is not None
        assert t_data["severity"] in ["P0", "P1", "P2", "P3"]

        # Trigger AI copilot suggestion
        copilot_res = await ac.post("/api/ai/suggest/1", headers=headers)
        assert copilot_res.status_code == 200
        c_data = copilot_res.json()
        assert len(c_data["suggested_reply"]) > 10

@pytest.mark.asyncio
async def test_simulate_channel_webhook():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Simulate Telegram customer
        tg_res = await ac.post("/api/webhooks/simulate", json={
            "channel": "telegram",
            "user_id": "991823",
            "user_name": "Павел Тестовый",
            "message_text": "У меня на iPhone перестал работать интернет через Amnezia VPN на МТС"
        })
        assert tg_res.status_code == 200
        assert tg_res.json()["status"] == "success"

        # Simulate Instagram customer
        ig_res = await ac.post("/api/webhooks/simulate", json={
            "channel": "instagram",
            "user_id": "ig_334455",
            "user_name": "Екатерина Инста",
            "message_text": "Здравствуйте! Не могу оплатить подписку, выдает ошибку шлюза"
        })
        assert ig_res.status_code == 200
        assert ig_res.json()["status"] == "success"

@pytest.mark.asyncio
async def test_problem_register_and_backlog():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        login_res = await ac.post("/api/auth/login", data={"username": "lead", "password": "lead123"})
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # List problems
        probs_res = await ac.get("/api/problems", headers=headers)
        assert probs_res.status_code == 200
        probs = probs_res.json()
        assert len(probs) >= 4

        # List backlog
        backlog_res = await ac.get("/api/problems/backlog", headers=headers)
        assert backlog_res.status_code == 200
        backlog = backlog_res.json()
        assert len(backlog) >= 4

@pytest.mark.asyncio
async def test_knowledge_base():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        login_res = await ac.post("/api/auth/login", data={"username": "agent", "password": "agent123"})
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        res = await ac.get("/api/knowledge", headers=headers)
        assert res.status_code == 200
        articles = res.json()
        assert len(articles) >= 3

@pytest.mark.asyncio
async def test_vpn_keys_and_recreate():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        login_res = await ac.post("/api/auth/login", data={"username": "agent", "password": "agent123"})
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Get keys for ticket 1
        keys_res = await ac.get("/api/tickets/1/vpn-keys", headers=headers)
        assert keys_res.status_code == 200
        data = keys_res.json()
        assert "keys" in data

        # Recreate key for ticket 1
        recreate_res = await ac.post("/api/tickets/1/recreate-key", json={"protocol": "Vless", "server": "NL-02"}, headers=headers)
        assert recreate_res.status_code == 200
        msg = recreate_res.json()
        assert "пересоздан" in msg["message_text"]

@pytest.mark.asyncio
async def test_resolve_and_escalate_buttons():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        login_res = await ac.post("/api/auth/login", data={"username": "agent", "password": "agent123"})
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Resolve ticket
        resolve_res = await ac.post("/api/tickets/1/resolve", headers=headers)
        assert resolve_res.status_code == 200
        data_res = resolve_res.json()
        assert data_res["status"] == "resolved"
        assert data_res["category"] == "Всё исправлено"

        # 2. Escalate ticket
        esc_res = await ac.post("/api/tickets/1/escalate", headers=headers)
        assert esc_res.status_code == 200
        data_esc = esc_res.json()
        assert data_esc["status"] == "escalated"
        assert data_esc["category"] == "Не решено"
        assert data_esc["escalated_to_engineer"] is True

        # 3. AI Setup helper
        setup_res = await ac.post("/api/tickets/1/send-ai-setup", headers=headers)
        assert setup_res.status_code == 200
        data_setup = setup_res.json()
        assert "Помощник по настройке" in data_setup["message_text"]


