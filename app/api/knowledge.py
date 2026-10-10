from fastapi import APIRouter, Depends, HTTPException, Query
import aiosqlite
from typing import List, Optional

from app.database import get_db
from app.auth import get_current_user, require_lead_or_higher
from app.models import KnowledgeArticleItem

router = APIRouter(prefix="/api/knowledge", tags=["Knowledge Base"])

@router.get("", response_model=List[KnowledgeArticleItem])
async def list_knowledge_articles(
    category: Optional[str] = Query(None),
    device: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db)
):
    query = "SELECT * FROM knowledge_articles WHERE is_active = 1"
    params = []
    if category:
        query += " AND category = ?"
        params.append(category)
    if device:
        query += " AND device = ?"
        params.append(device)
    if search:
        query += " AND (title LIKE ? OR content LIKE ?)"
        params.extend([f"%{search}%", f"%{search}%"])

    query += " ORDER BY views_count DESC"

    async with db.execute(query, tuple(params)) as cursor:
        rows = await cursor.fetchall()
        return [
            KnowledgeArticleItem(
                id=r["id"],
                title=r["title"],
                category=r["category"],
                subcategory=r["subcategory"],
                device=r["device"],
                app=r["app"],
                content=r["content"],
                short_answer=r["short_answer"],
                images_json=r["images_json"],
                is_active=bool(r["is_active"]),
                views_count=r["views_count"],
                useful_count=r["useful_count"]
            )
            for r in rows
        ]

@router.post("", response_model=KnowledgeArticleItem)
async def create_article(
    item: KnowledgeArticleItem,
    current_user: dict = Depends(require_lead_or_higher),
    db: aiosqlite.Connection = Depends(get_db)
):
    cursor = await db.execute(
        """
        INSERT INTO knowledge_articles (title, category, subcategory, device, app, content, short_answer, images_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (item.title, item.category, item.subcategory, item.device, item.app, item.content, item.short_answer, item.images_json)
    )
    item.id = cursor.lastrowid
    await db.commit()
    return item

@router.put("/{article_id}", response_model=KnowledgeArticleItem)
async def update_article(
    article_id: int,
    item: KnowledgeArticleItem,
    current_user: dict = Depends(require_lead_or_higher),
    db: aiosqlite.Connection = Depends(get_db)
):
    await db.execute(
        """
        UPDATE knowledge_articles SET
            title = ?, category = ?, subcategory = ?, device = ?, app = ?,
            content = ?, short_answer = ?, images_json = ?, is_active = ?
        WHERE id = ?
        """,
        (
            item.title, item.category, item.subcategory, item.device, item.app,
            item.content, item.short_answer, item.images_json, 1 if item.is_active else 0, article_id
        )
    )
    await db.commit()
    item.id = article_id
    return item
