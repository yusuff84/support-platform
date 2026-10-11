import asyncio
import aiosqlite
import logging

from app.database import DB_PATH, init_db
from app.auth import hash_password

logger = logging.getLogger(__name__)

async def seed_data():
    """Initializes staff users if missing. Does NOT inject fake tickets."""
    await init_db()

    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row

        # 1. Staff Users (4 primary roles)
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

        await db.commit()
        logger.info("Staff users verified/seeded successfully.")

if __name__ == "__main__":
    asyncio.run(seed_data())

