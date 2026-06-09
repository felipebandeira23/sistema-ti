"""Serviços para abertura e gestão básica de tickets."""
from __future__ import annotations

from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy import or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ticket import (
    Ticket,
    TicketStatus,
    TicketType,
    TicketPriority,
    TicketUrgency,
    TicketImpact,
)
from app.models.sla import SLA
from app.services.sla_service import add_business_hours
from app.schemas.ticket import TicketCreate, TicketStatusUpdate


async def list_tickets(
    session: AsyncSession,
    limit: int = 50,
    offset: int = 0,
    status: str | None = None,
    priority: str | None = None,
    type_filter: str | None = None,
    q: str | None = None,
) -> list[Ticket]:
    query = select(Ticket).where(Ticket.deleted_at.is_(None))
    if status:
        query = query.where(Ticket.status == TicketStatus(status))
    if priority:
        query = query.where(Ticket.priority == TicketPriority(priority))
    if type_filter:
        query = query.where(Ticket.type == TicketType(type_filter))
    if q:
        like = f"%{q}%"
        query = query.where(or_(Ticket.title.ilike(like), Ticket.description.ilike(like)))
    result = await session.execute(query.order_by(Ticket.created_at.desc()).offset(offset).limit(limit))
    return list(result.scalars().unique().all())


async def get_ticket(session: AsyncSession, ticket_id: UUID) -> Optional[Ticket]:
    result = await session.execute(select(Ticket).where(Ticket.id == ticket_id, Ticket.deleted_at.is_(None)))
    return result.scalar_one_or_none()


async def create_ticket(session: AsyncSession, payload: TicketCreate, opened_by: UUID) -> Ticket:
    ticket = Ticket(
        type=TicketType(payload.type),
        status=TicketStatus.NOVO,
        title=payload.title,
        description=payload.description,
        priority=TicketPriority(payload.priority),
        urgency=TicketUrgency(payload.urgency),
        impact=TicketImpact(payload.impact),
        opened_by_user_id=opened_by,
        asset_id=payload.asset_id,
        ci_id=payload.ci_id,
        category_id=payload.category_id,
        created_at=datetime.utcnow(),
    )

    # Aplicar SLA simples baseado em tipo e prioridade
    sla = await session.execute(
        select(SLA).where(SLA.ticket_type == payload.type, SLA.priority_level == payload.priority)
    )
    sla_obj = sla.scalars().first()
    if sla_obj:
        ticket.sla_id = sla_obj.id
        # Cálculo avançado: soma horas úteis respeitando calendário se definido
        try:
            if sla_obj.calendar_id:
                ticket.sla_target_response = await add_business_hours(
                    session,
                    sla_obj.calendar_id,
                    ticket.created_at,
                    int(sla_obj.response_time),
                )
                ticket.sla_target_resolution = await add_business_hours(
                    session,
                    sla_obj.calendar_id,
                    ticket.created_at,
                    int(sla_obj.resolution_time),
                )
            else:
                ticket.sla_target_response = ticket.created_at + timedelta(hours=int(sla_obj.response_time))
                ticket.sla_target_resolution = ticket.created_at + timedelta(hours=int(sla_obj.resolution_time))
        except Exception:
            # Em caso de erro no calendário, fazer fallback para soma simples
            ticket.sla_target_response = ticket.created_at + timedelta(hours=int(sla_obj.response_time))
            ticket.sla_target_resolution = ticket.created_at + timedelta(hours=int(sla_obj.resolution_time))

    session.add(ticket)
    await session.commit()
    await session.refresh(ticket)
    return ticket


async def update_ticket_status(
    session: AsyncSession,
    ticket: Ticket,
    payload: TicketStatusUpdate,
) -> Ticket:
    ticket.status = TicketStatus(payload.status)
    if payload.solution:
        ticket.solution = payload.solution
        if ticket.status in {TicketStatus.RESOLVIDO, TicketStatus.FECHADO}:
            ticket.resolved_at = datetime.utcnow()
    ticket.updated_at = datetime.utcnow()
    await session.commit()
    await session.refresh(ticket)
    return ticket


async def list_comments(session: AsyncSession, ticket_id: UUID) -> list:
    from app.models.ticket import TicketComment
    result = await session.execute(
        select(TicketComment)
        .where(TicketComment.ticket_id == ticket_id, TicketComment.deleted_at.is_(None))
        .order_by(TicketComment.created_at.asc())
    )
    return list(result.scalars().all())


async def add_comment(session: AsyncSession, ticket_id: UUID, author_id: UUID, content: str, is_public: bool) -> object:
    from app.models.ticket import TicketComment
    comment = TicketComment(ticket_id=ticket_id, author_id=author_id, content=content, is_public=is_public)
    session.add(comment)
    await session.commit()
    await session.refresh(comment)
    return comment


async def get_history(session: AsyncSession, ticket_id: UUID) -> list:
    from app.models.ticket import TicketHistory
    result = await session.execute(
        select(TicketHistory)
        .where(TicketHistory.ticket_id == ticket_id)
        .order_by(TicketHistory.created_at.desc())
    )
    return list(result.scalars().all())


async def list_tasks(session: AsyncSession, ticket_id: UUID) -> list:
    from app.models.ticket import TicketTask
    result = await session.execute(
        select(TicketTask).where(TicketTask.ticket_id == ticket_id).order_by(TicketTask.created_at.asc())
    )
    return list(result.scalars().all())


async def add_task(session: AsyncSession, ticket_id: UUID, title: str, description: str | None, due_date) -> object:
    from app.models.ticket import TicketTask
    task = TicketTask(ticket_id=ticket_id, title=title, description=description, due_date=due_date)
    session.add(task)
    await session.commit()
    await session.refresh(task)
    return task


async def update_task_status(session: AsyncSession, task_id: UUID, new_status: str) -> object | None:
    from app.models.ticket import TicketTask
    result = await session.execute(select(TicketTask).where(TicketTask.id == task_id))
    task = result.scalar_one_or_none()
    if task:
        task.status = new_status
        task.updated_at = datetime.utcnow()
        await session.commit()
        await session.refresh(task)
    return task


async def add_feedback(session: AsyncSession, ticket_id: UUID, rating: int, comment: str | None, would_recommend: bool | None) -> object:
    from app.models.ticket import TicketFeedback
    fb = TicketFeedback(ticket_id=ticket_id, rating=rating, comment=comment, would_recommend=would_recommend)
    session.add(fb)
    await session.commit()
    await session.refresh(fb)
    return fb


async def update_ticket(session: AsyncSession, ticket, payload, changed_by: UUID) -> object:
    from app.models.ticket import TicketHistory, TicketPriority
    changes = []
    if payload.title is not None and payload.title != ticket.title:
        changes.append(("title", ticket.title, payload.title))
        ticket.title = payload.title
    if payload.description is not None and payload.description != ticket.description:
        changes.append(("description", ticket.description[:100] if ticket.description else None, payload.description[:100]))
        ticket.description = payload.description
    if payload.priority is not None:
        try:
            new_priority = TicketPriority(payload.priority)
            if new_priority != ticket.priority:
                changes.append(("priority", str(ticket.priority), str(new_priority)))
                ticket.priority = new_priority
        except ValueError:
            pass
    if payload.assigned_to_user_id is not None:
        import uuid as _uuid
        new_assigned = _uuid.UUID(payload.assigned_to_user_id) if payload.assigned_to_user_id else None
        if new_assigned != ticket.assigned_to_user_id:
            changes.append(("assigned_to_user_id", str(ticket.assigned_to_user_id) if ticket.assigned_to_user_id else None, str(new_assigned) if new_assigned else None))
            ticket.assigned_to_user_id = new_assigned
    ticket.updated_at = datetime.utcnow()
    for field, old_val, new_val in changes:
        hist = TicketHistory(ticket_id=ticket.id, field=field, old_value=str(old_val) if old_val is not None else None, new_value=str(new_val) if new_val is not None else None, changed_by_user_id=changed_by)
        session.add(hist)
    await session.commit()
    await session.refresh(ticket)
    return ticket
