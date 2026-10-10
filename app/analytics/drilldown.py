import aiosqlite
from typing import List, Dict, Any
from datetime import datetime, timezone, timedelta

async def detect_drilldown_anomalies(db: aiosqlite.Connection, days: int = 14) -> List[Dict[str, Any]]:
    """
    Detects Level 5 multi-dimensional anomalies:
    Groups by (category, device, operator, app) to find patterns like:
    'Android + МТС + Amnezia = 380 обращений' (ITIL Problem candidate)
    """
    since_date = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()

    # Total per category
    async with db.execute(
        "SELECT category, COUNT(id) as cat_total FROM tickets WHERE created_at >= ? AND category IS NOT NULL GROUP BY category",
        (since_date,)
    ) as cur:
        cat_totals = {r["category"]: r["cat_total"] for r in await cur.fetchall()}

    query = """
    SELECT 
        category,
        COALESCE(device, 'Не указано') as dev,
        COALESCE(operator, 'Не указано') as op,
        COALESCE(app, 'Не указано') as application,
        COUNT(id) as occ_count,
        COUNT(DISTINCT channel_user_id) as uniq_users
    FROM tickets
    WHERE created_at >= ? AND category IS NOT NULL
    GROUP BY category, dev, op, application
    HAVING occ_count >= 10
    ORDER BY occ_count DESC
    LIMIT 20
    """

    async with db.execute(query, (since_date,)) as cur:
        rows = await cur.fetchall()

    # Fetch existing problem register codes to link
    async with db.execute("SELECT problem_code, device, operator, app FROM problem_register") as cur:
        prob_rows = await cur.fetchall()
        problems_map = {}
        for p in prob_rows:
            key = f"{p['device']}|{p['operator']}|{p['app']}".lower()
            problems_map[key] = p["problem_code"]

    anomalies = []
    for r in rows:
        cat = r["category"]
        dev = r["dev"]
        op = r["op"]
        app = r["application"]
        occ = r["occ_count"]
        uniq = r["uniq_users"]

        cat_tot = cat_totals.get(cat, occ) or 1
        pct = round((occ / cat_tot) * 100, 1)

        # Check if mapped to a problem
        match_key = f"{dev}|{op}|{app}".lower()
        linked_code = problems_map.get(match_key)

        # Determine alert level
        if pct >= 35.0 or occ >= 200:
            alert_level = "CRITICAL"
        elif pct >= 20.0 or occ >= 80:
            alert_level = "WARNING"
        else:
            alert_level = "INFO"

        anomalies.append({
            "combination": f"{dev} + {op} + {app}",
            "category": cat,
            "device": dev,
            "operator": op,
            "app": app,
            "occurrences": occ,
            "unique_users": uniq,
            "percentage_of_category": pct,
            "linked_problem_code": linked_code,
            "alert_level": alert_level
        })

    return anomalies
