from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
import aiosqlite
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.auth import (
    verify_password,
    hash_password,
    create_access_token,
    get_current_user,
    require_superroot,
    require_lead_or_higher
)
from app.models import UserLogin, UserCreate, UserUpdate, UserOut, TokenResponse

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: aiosqlite.Connection = Depends(get_db)):
    username = form_data.username
    password = form_data.password

    async with db.execute(
        "SELECT id, username, email, full_name, role, is_active, hashed_password, created_at, last_login FROM staff_users WHERE username = ?",
        (username,)
    ) as cursor:
        user = await cursor.fetchone()

    if not user or not verify_password(password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверное имя пользователя или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user["is_active"]:
        raise HTTPException(status_code=403, detail="Пользователь заблокирован")

    now = datetime.now().isoformat()
    await db.execute("UPDATE staff_users SET last_login = ? WHERE id = ?", (now, user["id"]))
    await db.commit()

    token = create_access_token(data={"sub": user["username"], "role": user["role"], "id": user["id"]})
    user_out = UserOut(
        id=user["id"],
        username=user["username"],
        email=user["email"],
        full_name=user["full_name"],
        role=user["role"],
        is_active=bool(user["is_active"]),
        created_at=str(user["created_at"]) if user["created_at"] else None,
        last_login=now
    )
    return TokenResponse(access_token=token, user=user_out)

@router.get("/me", response_model=UserOut)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserOut(
        id=current_user["id"],
        username=current_user["username"],
        email=current_user["email"],
        full_name=current_user["full_name"],
        role=current_user["role"],
        is_active=bool(current_user["is_active"]),
        created_at=current_user.get("created_at"),
        last_login=current_user.get("last_login")
    )

@router.get("/users", response_model=List[UserOut])
async def list_users(
    current_user: dict = Depends(require_lead_or_higher),
    db: aiosqlite.Connection = Depends(get_db)
):
    async with db.execute("SELECT id, username, email, full_name, role, is_active, created_at, last_login FROM staff_users ORDER BY id ASC") as cursor:
        rows = await cursor.fetchall()
        return [
            UserOut(
                id=r["id"],
                username=r["username"],
                email=r["email"],
                full_name=r["full_name"],
                role=r["role"],
                is_active=bool(r["is_active"]),
                created_at=str(r["created_at"]) if r["created_at"] else None,
                last_login=str(r["last_login"]) if r["last_login"] else None
            )
            for r in rows
        ]

@router.post("/users", response_model=UserOut)
async def create_user(
    user_in: UserCreate,
    current_user: dict = Depends(require_superroot),
    db: aiosqlite.Connection = Depends(get_db)
):
    async with db.execute("SELECT id FROM staff_users WHERE username = ?", (user_in.username,)) as cursor:
        if await cursor.fetchone():
            raise HTTPException(status_code=400, detail="Пользователь с таким логином уже существует")

    hashed = hash_password(user_in.password)
    now = datetime.now().isoformat()
    cursor = await db.execute(
        """
        INSERT INTO staff_users (username, email, hashed_password, full_name, role, is_active, created_at)
        VALUES (?, ?, ?, ?, ?, 1, ?)
        """,
        (user_in.username, user_in.email, hashed, user_in.full_name, user_in.role, now)
    )
    user_id = cursor.lastrowid
    await db.commit()

    return UserOut(
        id=user_id,
        username=user_in.username,
        email=user_in.email,
        full_name=user_in.full_name,
        role=user_in.role,
        is_active=True,
        created_at=now
    )

@router.put("/users/{user_id}", response_model=UserOut)
async def update_user(
    user_id: int,
    user_in: UserUpdate,
    current_user: dict = Depends(require_superroot),
    db: aiosqlite.Connection = Depends(get_db)
):
    async with db.execute("SELECT id, username, email, full_name, role, is_active, created_at, last_login FROM staff_users WHERE id = ?", (user_id,)) as cursor:
        existing = await cursor.fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Пользователь не найден")

    fields = []
    params = []
    if user_in.email is not None:
        fields.append("email = ?")
        params.append(user_in.email)
    if user_in.full_name is not None:
        fields.append("full_name = ?")
        params.append(user_in.full_name)
    if user_in.role is not None:
        fields.append("role = ?")
        params.append(user_in.role)
    if user_in.is_active is not None:
        fields.append("is_active = ?")
        params.append(1 if user_in.is_active else 0)
    if user_in.password:
        fields.append("hashed_password = ?")
        params.append(hash_password(user_in.password))

    if fields:
        params.append(user_id)
        await db.execute(f"UPDATE staff_users SET {', '.join(fields)} WHERE id = ?", tuple(params))
        await db.commit()

    async with db.execute("SELECT id, username, email, full_name, role, is_active, created_at, last_login FROM staff_users WHERE id = ?", (user_id,)) as cursor:
        updated = await cursor.fetchone()
        return UserOut(
            id=updated["id"],
            username=updated["username"],
            email=updated["email"],
            full_name=updated["full_name"],
            role=updated["role"],
            is_active=bool(updated["is_active"]),
            created_at=str(updated["created_at"]) if updated["created_at"] else None,
            last_login=str(updated["last_login"]) if updated["last_login"] else None
        )
