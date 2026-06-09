"""Service layer for Change Management (ITIL Change Management process)."""
from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.change import Change, ChangeStatus, ChangeType, ChangeRisk
from app.schemas.change import ChangeCreate, ChangeUpdate


async def list_changes(
    session: AsyncSession,
    status: str | None = None,
    q: str | None = None,
) -> list[Change]:
    query = select(Change).where(Change.deleted_at.is_(None))
    if status:
        query = query.where(Change.status == ChangeStatus(status))
    if q:
        like = f"%{q}%"
        query = query.where(or_(Change.title.ilike(like), Change.description.ilike(like)))
    result = await session.execute(query.order_by(Change.created_at.desc()))
    return list(result.scalars().unique().all())


async def get_change(session: AsyncSession, change_id: UUID) -> Optional[Change]:
    result = await session.execute(
        select(Change).where(Change.id == change_id, Change.deleted_at.is_(None))
    )
    return result.scalar_one_or_none()


async def create_change(
    session: AsyncSession,
    payload: ChangeCreate,
    opened_by: UUID,
) -> Change:
    change = Change(
        title=payload.title,
        description=payload.description,
        justification=payload.justification,
        type=ChangeType(payload.type),
        risk=ChangeRisk(payload.risk),
        impact_description=payload.impact_description,
        rollback_plan=payload.rollback_plan,
        implementation_plan=payload.implementation_plan,
        category_id=payload.category_id,
        scheduled_start=payload.scheduled_start,
        scheduled_end=payload.scheduled_end,
        opened_by_user_id=opened_by,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    session.add(change)
    await session.commit()
    await session.refresh(change)
    return change


async def update_change(
    session: AsyncSession,
    change: Change,
    payload: ChangeUpdate,
) -> Change:
    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(change, field, value)

    # Auto-set timestamps on status transitions
    if "status" in data:
        new_status = data["status"]
        if new_status == ChangeStatus.EXECUCAO and change.actual_start is None:
            change.actual_start = datetime.utcnow()
        if new_status in {ChangeStatus.ENCERRADO, ChangeStatus.CANCELADO} and change.closed_at is None:
            change.closed_at = datetime.utcnow()
            if new_status == ChangeStatus.ENCERRADO and change.actual_end is None:
                change.actual_end = datetime.utcnow()

    change.updated_at = datetime.utcnow()
    await session.commit()
    await session.refresh(change)
    return change
