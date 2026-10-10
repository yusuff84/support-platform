import os
import aiosqlite
import logging
from typing import AsyncGenerator
from app.config import settings

logger = logging.getLogger(__name__)

DB_PATH = settings.DATABASE_PATH

async def get_db() -> AsyncGenerator[aiosqlite.Connection, None]:
    os.makedirs(os.path.dirname(DB_PATH) or ".", exist_ok=True)
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        await db.execute("PRAGMA foreign_keys = ON;")
        await db.execute("PRAGMA journal_mode = WAL;")
        yield db

async def init_db():
    os.makedirs(os.path.dirname(DB_PATH) or ".", exist_ok=True)
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        await db.execute("PRAGMA foreign_keys = ON;")
        await db.execute("PRAGMA journal_mode = WAL;")

        # Users (Admin / Staff members)
        await db.execute("""
        CREATE TABLE IF NOT EXISTS staff_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE,
            hashed_password TEXT NOT NULL,
            full_name TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'support_agent', -- support_agent, support_lead, director, superroot
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP
        );
        """)

        # Tickets (Universal multi-channel tickets)
        await db.execute("""
        CREATE TABLE IF NOT EXISTS tickets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ticket_number TEXT UNIQUE NOT NULL,
            channel TEXT NOT NULL, -- 'telegram' or 'instagram'
            channel_user_id TEXT NOT NULL, -- tg_id or ig_id
            channel_user_name TEXT,
            channel_user_handle TEXT,
            telegram_topic_id INTEGER, -- forum thread ID in operator supergroup
            
            status TEXT NOT NULL DEFAULT 'new', -- 'new', 'in_progress', 'escalated', 'resolved', 'closed'
            severity TEXT NOT NULL DEFAULT 'P2', -- P0, P1, P2, P3
            
            -- Level 1: Category & Subcategory
            category TEXT,
            subcategory TEXT,
            
            -- Level 2: 7 Passport Fields
            user_id TEXT,             -- field 1: client id in VPN
            device TEXT,              -- field 2: iPhone, Android, etc.
            operator TEXT,            -- field 3: МТС, Мегафон, etc.
            app TEXT,                 -- field 4: Amnezia, Outline, etc.
            problem TEXT,             -- field 5: symptom/problem
            cause TEXT,               -- field 6: root cause
            result TEXT,              -- field 7: resolution outcome
            
            -- Extra Passport / Telemetry
            os_version TEXT,
            app_version TEXT,
            protocol TEXT,
            server TEXT,
            
            -- Operational KPIs
            assigned_to_id INTEGER REFERENCES staff_users(id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            first_response_at TIMESTAMP,
            resolved_at TIMESTAMP,
            resolution_time_sec INTEGER,
            
            is_reopened INTEGER DEFAULT 0,
            instruction_helped INTEGER, -- 1=yes, 0=no, NULL=unknown
            escalated_to_engineer INTEGER DEFAULT 0,
            csat_score INTEGER, -- 1 to 5
            
            -- AI Assist flags
            ai_triaged INTEGER DEFAULT 0,
            ai_diagnostic_summary TEXT,
            ai_suggested_reply TEXT,
            ai_confidence REAL DEFAULT 0.0
        );
        """)

        # Messages (Chat history for each ticket)
        await db.execute("""
        CREATE TABLE IF NOT EXISTS ticket_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
            sender_type TEXT NOT NULL, -- 'client', 'operator', 'system', 'ai'
            sender_name TEXT,
            sender_id TEXT,
            message_text TEXT,
            media_type TEXT, -- 'photo', 'document', 'audio', 'voice', 'video'
            media_url TEXT,
            telegram_message_id INTEGER,
            instagram_message_id TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        # Problem Register (Level 5: ITIL / ITSM Problem Management)
        await db.execute("""
        CREATE TABLE IF NOT EXISTS problem_register (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            problem_code TEXT UNIQUE NOT NULL, -- e.g. "PRB-001" or "Problem #27"
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            device TEXT,
            operator TEXT,
            app TEXT,
            server TEXT,
            occurrences_count INTEGER DEFAULT 0,
            affected_users_count INTEGER DEFAULT 0,
            status TEXT NOT NULL DEFAULT 'investigating', -- 'unknown', 'investigating', 'app_bug', 'server_overload', 'bad_guide', 'resolved'
            root_cause TEXT,
            workaround TEXT,
            permanent_fix TEXT,
            backlog_priority TEXT DEFAULT 'P2', -- P0, P1, P2, P3
            estimated_weekly_tickets INTEGER DEFAULT 0,
            estimated_hours_saved_monthly REAL DEFAULT 0.0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        # Product Backlog Items (Linked to problems from support data)
        await db.execute("""
        CREATE TABLE IF NOT EXISTS product_backlog (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            problem_id INTEGER REFERENCES problem_register(id),
            priority TEXT NOT NULL DEFAULT 'P1', -- P0, P1, P2, P3
            title TEXT NOT NULL,
            description TEXT,
            impact_tickets_per_week INTEGER DEFAULT 0,
            impact_hours_per_month REAL DEFAULT 0.0,
            responsible_team TEXT DEFAULT 'Development', -- 'Development', 'DevOps', 'Content/Doc', 'Operations'
            status TEXT NOT NULL DEFAULT 'backlog', -- 'backlog', 'in_dev', 'testing', 'released'
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        # Knowledge Base Articles (Guides, solutions, templates)
        await db.execute("""
        CREATE TABLE IF NOT EXISTS knowledge_articles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            subcategory TEXT,
            device TEXT,
            app TEXT,
            content TEXT NOT NULL,
            short_answer TEXT,
            images_json TEXT, -- array of guide image URLs
            is_active INTEGER DEFAULT 1,
            views_count INTEGER DEFAULT 0,
            useful_count INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        # VPN Client Mock / Local Store (For testing & fallback when external DB isn't plugged in)
        await db.execute("""
        CREATE TABLE IF NOT EXISTS vpn_client_keys (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            channel TEXT DEFAULT 'telegram',
            username TEXT,
            subscription_status TEXT DEFAULT 'active', -- 'active', 'expired', 'frozen'
            expires_at TIMESTAMP,
            server TEXT DEFAULT 'NL-03',
            protocol TEXT DEFAULT 'Vless',
            key_string TEXT NOT NULL,
            traffic_used_gb REAL DEFAULT 12.4,
            traffic_limit_gb REAL DEFAULT 100.0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        # System Settings & Key-Value Config (For dynamic OpenRouter keys, models, bot config)
        await db.execute("""
        CREATE TABLE IF NOT EXISTS system_settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            description TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        # Audit Logs
        await db.execute("""
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            action TEXT NOT NULL,
            entity_type TEXT,
            entity_id TEXT,
            details TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        # Indices for rapid querying
        await db.execute("CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_tickets_channel ON tickets(channel, channel_user_id);")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_tickets_category ON tickets(category, subcategory);")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_tickets_device_op ON tickets(device, operator, app);")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_messages_ticket ON ticket_messages(ticket_id);")

        await db.commit()
        logger.info("Database initialized successfully.")
