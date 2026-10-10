from fastapi import APIRouter, Depends, HTTPException, status
import aiosqlite
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.auth import get_current_user, require_lead_or_higher
from app.models import ProblemRegisterItem, ProductBacklogItem

router = APIRouter(prefix="/api/problems", tags=["Problem Register & Backlog"])

@router.get("", response_model=List[ProblemRegisterItem])
async def list_problems(
    current_user: dict = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db)
):
    query = """
    SELECT * FROM problem_register ORDER BY occurrences_count DESC
    """
    async with db.execute(query) as cursor:
        rows = await cursor.fetchall()
        return [
            ProblemRegisterItem(
                id=r["id"],
                problem_code=r["problem_code"],
                title=r["title"],
                category=r["category"],
                device=r["device"],
                operator=r["operator"],
                app=r["app"],
                server=r["server"],
                occurrences_count=r["occurrences_count"],
                affected_users_count=r["affected_users_count"],
                status=r["status"],
                root_cause=r["root_cause"],
                workaround=r["workaround"],
                permanent_fix=r["permanent_fix"],
                backlog_priority=r["backlog_priority"],
                estimated_weekly_tickets=r["estimated_weekly_tickets"],
                estimated_hours_saved_monthly=r["estimated_hours_saved_monthly"],
                created_at=str(r["created_at"]) if r["created_at"] else None
            )
            for r in rows
        ]

@router.post("", response_model=ProblemRegisterItem)
async def create_problem(
    item: ProblemRegisterItem,
    current_user: dict = Depends(require_lead_or_higher),
    db: aiosqlite.Connection = Depends(get_db)
):
    now = datetime.now().isoformat()
    cursor = await db.execute(
        """
        INSERT INTO problem_register 
        (problem_code, title, category, device, operator, app, server, occurrences_count, affected_users_count, 
         status, root_cause, workaround, permanent_fix, backlog_priority, estimated_weekly_tickets, estimated_hours_saved_monthly, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            item.problem_code, item.title, item.category, item.device, item.operator, item.app, item.server,
            item.occurrences_count, item.affected_users_count, item.status, item.root_cause, item.workaround,
            item.permanent_fix, item.backlog_priority, item.estimated_weekly_tickets, item.estimated_hours_saved_monthly, now
        )
    )
    prob_id = cursor.lastrowid
    await db.commit()

    item.id = prob_id
    item.created_at = now
    return item

@router.put("/{problem_id}", response_model=ProblemRegisterItem)
async def update_problem(
    problem_id: int,
    item: ProblemRegisterItem,
    current_user: dict = Depends(require_lead_or_higher),
    db: aiosqlite.Connection = Depends(get_db)
):
    await db.execute(
        """
        UPDATE problem_register SET
            title = ?, category = ?, device = ?, operator = ?, app = ?, server = ?,
            occurrences_count = ?, affected_users_count = ?, status = ?, root_cause = ?,
            workaround = ?, permanent_fix = ?, backlog_priority = ?, estimated_weekly_tickets = ?,
            estimated_hours_saved_monthly = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        """,
        (
            item.title, item.category, item.device, item.operator, item.app, item.server,
            item.occurrences_count, item.affected_users_count, item.status, item.root_cause,
            item.workaround, item.permanent_fix, item.backlog_priority, item.estimated_weekly_tickets,
            item.estimated_hours_saved_monthly, problem_id
        )
    )
    await db.commit()
    item.id = problem_id
    return item

# --- Backlog items ---
@router.get("/backlog", response_model=List[ProductBacklogItem])
async def list_backlog(
    current_user: dict = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db)
):
    query = """
    SELECT b.*, p.problem_code 
    FROM product_backlog b
    LEFT JOIN problem_register p ON b.problem_id = p.id
    ORDER BY 
        CASE b.priority 
            WHEN 'P0' THEN 1 
            WHEN 'P1' THEN 2 
            WHEN 'P2' THEN 3 
            ELSE 4 
        END ASC,
        b.impact_tickets_per_week DESC
    """
    async with db.execute(query) as cursor:
        rows = await cursor.fetchall()
        return [
            ProductBacklogItem(
                id=r["id"],
                problem_id=r["problem_id"],
                problem_code=r["problem_code"],
                priority=r["priority"],
                title=r["title"],
                description=r["description"],
                impact_tickets_per_week=r["impact_tickets_per_week"],
                impact_hours_per_month=r["impact_hours_per_month"],
                responsible_team=r["responsible_team"],
                status=r["status"]
            )
            for r in rows
        ]

@router.post("/backlog", response_model=ProductBacklogItem)
async def create_backlog_item(
    item: ProductBacklogItem,
    current_user: dict = Depends(require_lead_or_higher),
    db: aiosqlite.Connection = Depends(get_db)
):
    cursor = await db.execute(
        """
        INSERT INTO product_backlog 
        (problem_id, priority, title, description, impact_tickets_per_week, impact_hours_per_month, responsible_team, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            item.problem_id, item.priority, item.title, item.description,
            item.impact_tickets_per_week, item.impact_hours_per_month, item.responsible_team, item.status
        )
    )
    item.id = cursor.lastrowid
    await db.commit()
    return item

@router.put("/backlog/{backlog_id}", response_model=ProductBacklogItem)
async def update_backlog_item(
    backlog_id: int,
    item: ProductBacklogItem,
    current_user: dict = Depends(require_lead_or_higher),
    db: aiosqlite.Connection = Depends(get_db)
):
    await db.execute(
        """
        UPDATE product_backlog SET
            priority = ?, title = ?, description = ?, impact_tickets_per_week = ?,
            impact_hours_per_month = ?, responsible_team = ?, status = ?
        WHERE id = ?
        """,
        (
            item.priority, item.title, item.description, item.impact_tickets_per_week,
            item.impact_hours_per_month, item.responsible_team, item.status, backlog_id
        )
    )
    await db.commit()
    item.id = backlog_id
    return item
