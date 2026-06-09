"""Service layer for Problem Management (ITIL Problem Management process)."""
from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.problem import Problem, ProblemStatus, ProblemImpact, ProblemTicketLink
from app.schemas.problem import ProblemCreate, ProblemUpdate


async def list_problems(
    session: AsyncSession,
    status: str | None = None,
    q: str | None = None,
) -> list[Problem]:
    query = select(Problem).where(Problem.deleted_at.is_(None))
    if status:
        query = query.where(Problem.status == ProblemStatus(status))
    if q:
        like = f"%{q}%"
        query = query.where(or_(Problem.title.ilike(like), Problem.description.ilike(like)))
    result = await session.execute(query.order_by(Problem.created_at.desc()))
    return list(result.scalars().unique().all())


async def get_problem(session: AsyncSession, problem_id: UUID) -> Optional[Problem]:
    result = await session.execute(
        select(Problem).where(Problem.id == problem_id, Problem.deleted_at.is_(None))
    )
    return result.scalar_one_or_none()


async def create_problem(
    session: AsyncSession,
    payload: ProblemCreate,
    opened_by: UUID,
) -> Problem:
    problem = Problem(
        title=payload.title,
        description=payload.description,
        impact=ProblemImpact(payload.impact),
        symptoms=payload.symptoms,
        category_id=payload.category_id,
        opened_by_user_id=opened_by,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    session.add(problem)
    await session.commit()
    await session.refresh(problem)
    return problem


async def update_problem(
    session: AsyncSession,
    problem: Problem,
    payload: ProblemUpdate,
) -> Problem:
    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(problem, field, value)

    # Auto-set timestamps on status transitions
    if "status" in data:
        if data["status"] == ProblemStatus.RESOLVIDO and problem.resolved_at is None:
            problem.resolved_at = datetime.utcnow()
        if data["status"] == ProblemStatus.FECHADO and problem.closed_at is None:
            problem.closed_at = datetime.utcnow()

    problem.updated_at = datetime.utcnow()
    await session.commit()
    await session.refresh(problem)
    return problem


async def link_ticket(
    session: AsyncSession,
    problem_id: UUID,
    ticket_id: UUID,
) -> ProblemTicketLink:
    link = ProblemTicketLink(
        problem_id=problem_id,
        ticket_id=ticket_id,
        created_at=datetime.utcnow(),
    )
    session.add(link)
    await session.commit()
    await session.refresh(link)
    return link
