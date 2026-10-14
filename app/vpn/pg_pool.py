import asyncpg
import logging
from typing import Optional

from app.config import settings

logger = logging.getLogger(__name__)

_pg_pool: Optional[asyncpg.Pool] = None


async def init_pg_pool() -> Optional[asyncpg.Pool]:
    """Initializes a read-only asyncpg connection pool to databasetop."""
    global _pg_pool
    db_url = settings.VPN_DATABASE_URL
    if not db_url:
        logger.warning("[PG Pool] VPN_DATABASE_URL is not set. Direct PostgreSQL reading disabled.")
        return None

    try:
        # Create connection pool with read-only transaction mode
        _pg_pool = await asyncpg.create_pool(
            dsn=db_url,
            min_size=2,
            max_size=10,
            command_timeout=8.0,
            max_inactive_connection_lifetime=300.0,
            server_settings={"default_transaction_read_only": "on"}
        )
        # Test connection
        async with _pg_pool.acquire() as conn:
            user_count = await conn.fetchval("SELECT count(*) FROM users;")
            logger.info(f"[PG Pool] ✅ Connected to PostgreSQL databasetop! Read-only pool initialized ({user_count} users).")
        return _pg_pool
    except Exception as e:
        logger.error(f"[PG Pool] ❌ Failed to initialize asyncpg pool: {e}", exc_info=True)
        _pg_pool = None
        return None


async def close_pg_pool() -> None:
    """Closes the asyncpg connection pool gracefully."""
    global _pg_pool
    if _pg_pool:
        try:
            await _pg_pool.close()
            logger.info("[PG Pool] PostgreSQL connection pool closed.")
        except Exception as e:
            logger.warning(f"[PG Pool] Error closing pool: {e}")
        _pg_pool = None


async def get_pg_pool() -> Optional[asyncpg.Pool]:
    """Returns the live asyncpg connection pool, initializing it if needed."""
    global _pg_pool
    if _pg_pool is None:
        await init_pg_pool()
    return _pg_pool
