"""Serviço de métricas e dashboard do sistema TI."""
from __future__ import annotations

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ticket import Ticket, TicketStatus, TicketPriority, SLAStatus
from app.models.asset import Asset, AssetType
from app.models.approval import ApprovalRequest


async def dashboard_summary(session: AsyncSession) -> dict:
    # Tickets por status
    tickets_by_status = dict(
        (row[0], row[1])
        for row in (
            await session.execute(select(Ticket.status, func.count(Ticket.id)).group_by(Ticket.status))
        ).all()
    )
    # Tickets por prioridade
    tickets_by_priority = dict(
        (row[0], row[1])
        for row in (
            await session.execute(select(Ticket.priority, func.count(Ticket.id)).group_by(Ticket.priority))
        ).all()
    )
    # SLA status
    sla_dist = dict(
        (row[0], row[1])
        for row in (
            await session.execute(select(Ticket.sla_status, func.count(Ticket.id)).group_by(Ticket.sla_status))
        ).all()
    )
    # Ativos por tipo
    assets_by_type = dict(
        (row[0], row[1])
        for row in (
            await session.execute(select(Asset.asset_type, func.count(Asset.id)).group_by(Asset.asset_type))
        ).all()
    )
    # Aprovações por status
    approvals_by_status = dict(
        (row[0], row[1])
        for row in (
            await session.execute(select(ApprovalRequest.status, func.count(ApprovalRequest.id)).group_by(ApprovalRequest.status))
        ).all()
    )

    total_tickets = (await session.execute(select(func.count(Ticket.id)))).scalar() or 0
    total_assets = (await session.execute(select(func.count(Asset.id)))).scalar() or 0
    total_approvals = (await session.execute(select(func.count(ApprovalRequest.id)))).scalar() or 0

    return {
        "totals": {
            "tickets": total_tickets,
            "assets": total_assets,
            "approvals": total_approvals,
        },
        "tickets_by_status": tickets_by_status,
        "tickets_by_priority": tickets_by_priority,
        "sla_distribution": sla_dist,
        "assets_by_type": assets_by_type,
        "approvals_by_status": approvals_by_status,
    }
