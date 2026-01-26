"""Serviços para gestão de usuários locais/LDAP."""
from __future__ import annotations

from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_password_hash, validate_password_strength
from app.models.user import Role, User, UserStatus, UserSource
from app.schemas.user import UserCreate, UserUpdate


async def _get_roles_by_names(session: AsyncSession, role_names: list[str]) -> list[Role]:
    if not role_names:
        return []
    result = await session.execute(select(Role).where(Role.name.in_(role_names)))
    return list(result.scalars().all())


async def list_users(session: AsyncSession, limit: int = 50, offset: int = 0) -> list[User]:
    result = await session.execute(select(User).offset(offset).limit(limit))
    return list(result.scalars().unique().all())


async def get_user(session: AsyncSession, user_id: UUID) -> Optional[User]:
    result = await session.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def create_user(session: AsyncSession, payload: UserCreate) -> User:
    if payload.password:
        ok, msg = validate_password_strength(payload.password)
        if not ok:
            raise ValueError(msg)
        hashed = get_password_hash(payload.password)
    else:
        hashed = None

    roles = await _get_roles_by_names(session, payload.roles)

    user = User(
        ldap_username=payload.ldap_username,
        email=payload.email,
        full_name=payload.full_name,
        department=payload.department,
        phone=payload.phone,
        hashed_password=hashed,
        is_active=payload.is_active,
        status=UserStatus.ACTIVE if payload.is_active else UserStatus.DISABLED,
        source=UserSource.LOCAL if payload.password else UserSource.LDAP,
        sync_status="LOCAL" if payload.password else "SYNCED",
    )
    user.roles = roles

    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


async def update_user(session: AsyncSession, user: User, payload: UserUpdate) -> User:
    if payload.email is not None:
        user.email = payload.email
    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.department is not None:
        user.department = payload.department
    if payload.phone is not None:
        user.phone = payload.phone
    if payload.is_active is not None:
        user.is_active = payload.is_active
        user.status = UserStatus.ACTIVE if payload.is_active else UserStatus.DISABLED
    if payload.status is not None:
        try:
            user.status = UserStatus(payload.status)
        except ValueError:
            pass
    if payload.password:
        ok, msg = validate_password_strength(payload.password)
        if not ok:
            raise ValueError(msg)
        user.hashed_password = get_password_hash(payload.password)
        user.source = UserSource.LOCAL
        user.sync_status = "LOCAL"
    if payload.roles is not None:
        roles = await _get_roles_by_names(session, payload.roles)
        user.roles = roles

    await session.commit()
    await session.refresh(user)
    return user
