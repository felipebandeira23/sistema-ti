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
