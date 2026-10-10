import aiosqlite
from typing import Dict, Any
from datetime import datetime, timezone, timedelta
from app.analytics.engine import calculate_vpn_health_overview, get_top_problems_stats
from app.analytics.drilldown import detect_drilldown_anomalies

async def generate_daily_executive_report(db: aiosqlite.Connection) -> Dict[str, Any]:
    """Generates the 5-minute daily report for the executive."""
    overview = await calculate_vpn_health_overview(db, days=1)
    top_problems = await get_top_problems_stats(db, days=1)
    anomalies = await detect_drilldown_anomalies(db, days=1)

    today_str = datetime.now().strftime("%d.%m.%Y")
    top_anomaly = anomalies[0] if anomalies else None

    # Text format as requested in TZ:
    # TOPBOX SUPPORT — 07.10
    # Обращений: 247
    # Решено: 231
    # Эскалаций: 16
    # Среднее время: 6:12
    # CSAT: 94%
    # 🔴 Новая проблема: Android + оператор X ...
    text_report = f"""TOPBOX SUPPORT — {today_str}

Обращений: {overview['total_tickets_period']}
Решено: {overview['resolved_tickets']} ({overview['resolved_pct']}%)
Эскалаций инженеру: {overview['escalated_tickets']} ({overview['escalated_pct']}%)
Среднее время решения: {overview['median_resolution_time_min']} мин
CSAT: {overview['csat_pct']}%
Автоматизация / Deflection: {overview['automation_rate_pct']}%
"""

    if top_anomaly and top_anomaly['alert_level'] in ['CRITICAL', 'WARNING']:
        text_report += f"""
🔴 Новая проблема: {top_anomaly['combination']}
{top_anomaly['occurrences']} обращений ({top_anomaly['percentage_of_category']}% от категории «{top_anomaly['category']}»)
⚠️ Статус: {f"Привязана к {top_anomaly['linked_problem_code']}" if top_anomaly['linked_problem_code'] else "Требует занесения в Problem Register"}
"""

    return {
        "title": f"TOPBOX SUPPORT — {today_str}",
        "date": today_str,
        "text": text_report,
        "metrics": overview,
        "top_anomaly": top_anomaly
    }

async def generate_weekly_support_report(db: aiosqlite.Connection) -> Dict[str, Any]:
    """Generates the full Weekly Report according to Specification Level 4 & 5."""
    overview = await calculate_vpn_health_overview(db, days=7)
    top_problems = await get_top_problems_stats(db, days=7)
    anomalies = await detect_drilldown_anomalies(db, days=7)

    # Fetch product backlog and problems resolved
    async with db.execute(
        "SELECT COUNT(id) as cnt, SUM(estimated_weekly_tickets) as saved_tickets FROM problem_register WHERE status = 'resolved'"
    ) as cur:
        res_row = await cur.fetchone()
        resolved_problems_cnt = res_row["cnt"] or 0
        prevented_tickets_month = (res_row["saved_tickets"] or 0) * 4

    week_range_str = f"{(datetime.now() - timedelta(days=7)).strftime('%d.%m')} - {datetime.now().strftime('%d.%m.%Y')}"

    # Build markdown summary text matching TZ:
    top_problems_text = ""
    for p in top_problems[:7]:
        top_problems_text += f"{p['rank']}. {p['name']} — {p['count']} ({p['share_pct']}%)\n"

    anomalies_text = ""
    for a in anomalies[:4]:
        anomalies_text += f"→ {a['combination']} ({a['category']}): {a['occurrences']} обращений [{a['alert_level']}]\n"

    text_report = f"""# VPN — Support Weekly ({week_range_str})

База: {overview['total_users']:,} пользователей
Обратилось: {overview['total_tickets_period']}
Доля пользователей с проблемой: {overview['user_problem_rate_pct']}%
Проблемы решены: {overview['resolved_tickets']} / {overview['resolved_pct']}%
Не решены (эскалированы): {overview['escalated_tickets']} / {overview['escalated_pct']}%
First Contact Resolution (FCR): {overview['first_contact_resolution_pct']}%
Автоматизация (AI + инструкции): {overview['automation_rate_pct']}%
CSAT удовлетворенность: {overview['csat_pct']}%

---

### ТОП проблем:
{top_problems_text}

---

### Drill-Down аномалий (ITIL Root Cause):
{anomalies_text}

---

### Влияние на продукт (Product Impact):
* Системных проблем исправлено: {resolved_problems_cnt}
* Предотвращено обращений в месяц: ~{prevented_tickets_month} тикетов
"""

    return {
        "title": f"VPN — Support Weekly ({week_range_str})",
        "week_range": week_range_str,
        "text": text_report,
        "overview": overview,
        "top_problems": top_problems,
        "anomalies": anomalies,
        "resolved_problems_count": resolved_problems_cnt,
        "prevented_monthly_tickets": prevented_tickets_month
    }
