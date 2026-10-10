from fastapi import APIRouter, Depends, Query
import aiosqlite
from typing import Dict, Any, List

from app.database import get_db
from app.auth import get_current_user, require_lead_or_higher
from app.analytics.engine import calculate_vpn_health_overview, get_top_problems_stats
from app.analytics.drilldown import detect_drilldown_anomalies
from app.analytics.reports import generate_daily_executive_report, generate_weekly_support_report

router = APIRouter(prefix="/api/analytics", tags=["Analytics & Health"])

@router.get("/health-overview")
async def get_health_overview(
    days: int = Query(7, description="Number of days to analyze"),
    current_user: dict = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db)
):
    """Returns Level 3 Global VPN Health Overview (40k base proportions + Support Score)."""
    return await calculate_vpn_health_overview(db, days=days)

@router.get("/top-problems")
async def get_top_problems(
    days: int = Query(7, description="Number of days to analyze"),
    current_user: dict = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db)
):
    """Returns Level 4 Top problems ranking with % of total and trend."""
    return await get_top_problems_stats(db, days=days)

@router.get("/drilldown-anomalies")
async def get_drilldown_anomalies(
    days: int = Query(14, description="Number of days to analyze"),
    current_user: dict = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db)
):
    """Returns Level 5 multi-dimensional anomalies (Device + Operator + App + Server)."""
    return await detect_drilldown_anomalies(db, days=days)

@router.get("/reports/daily")
async def get_daily_report(
    current_user: dict = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db)
):
    """Generates 5-minute daily executive report."""
    return await generate_daily_executive_report(db)

@router.get("/reports/weekly")
async def get_weekly_report(
    current_user: dict = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db)
):
    """Generates weekly comprehensive Support & Product impact report."""
    return await generate_weekly_support_report(db)
