"""Serviços para aprovações de requisições."""
from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.approval import ApprovalRequest, ApprovalDecision
from app.models.service_catalog import ServiceRequest, ServiceCatalogItem
from app.models.ticket import Ticket, TicketStatus, SLAStatus
from app.schemas.approval import ApprovalRequestCreate, ApprovalDecisionCreate


async def list_approvals(session: AsyncSession, ticket_id: UUID | None = None) -> list[ApprovalRequest]:
    query = select(ApprovalRequest)
    if ticket_id:
        query = query.where(ApprovalRequest.ticket_id == ticket_id)
    result = await session.execute(query)
    return list(result.scalars().all())


async def get_approval(session: AsyncSession, approval_id: UUID) -> Optional[ApprovalRequest]:
    result = await session.execute(select(ApprovalRequest).where(ApprovalRequest.id == approval_id))
    return result.scalar_one_or_none()


async def create_approval(session: AsyncSession, payload: ApprovalRequestCreate) -> ApprovalRequest:
    approval = ApprovalRequest(**payload.model_dump())
    session.add(approval)
    await session.commit()
    await session.refresh(approval)
    return approval


async def add_decision(
    session: AsyncSession,
    approval: ApprovalRequest,
    approver_id: UUID,
    payload: ApprovalDecisionCreate,
) -> ApprovalDecision:
    decision = ApprovalDecision(
        approval_request_id=approval.id,
        approver_id=approver_id,
        decision=payload.decision,
        comment=payload.comment,
        decided_at=datetime.utcnow(),
    )
    session.add(decision)

    # Quórum e multi-nível
    approval.updated_at = datetime.utcnow()

    # Se qualquer decisão rejeitar, a aprovação é rejeitada
    if payload.decision.upper() == "REJEITADO":
        approval.status = "REJEITADO"
        # Atualiza ticket para CANCELADO
        ticket = await session.get(Ticket, approval.ticket_id)
        if ticket:
            ticket.status = TicketStatus.CANCELADO
            ticket.sla_status = SLAStatus.PAUSADO
    else:
        # Contabiliza aprovados
        count_row = await session.execute(
            select(func.count()).select_from(ApprovalDecision).where(
                ApprovalDecision.approval_request_id == approval.id,
                ApprovalDecision.decision == "APROVADO",
            )
        )
        approved_count = int(count_row.scalar() or 0)
        if approved_count >= int(approval.required_approver_count or 1):
            approval.status = "APROVADO"
            # Verifica níveis adicionais
            sr = await session.execute(select(ServiceRequest).where(ServiceRequest.ticket_id == approval.ticket_id))
            sr_obj = sr.scalars().first()
            levels = 1
            if sr_obj:
                item = await session.get(ServiceCatalogItem, sr_obj.service_item_id)
                levels = int(item.approval_levels or 1) if item else 1
            if approval.level < levels:
                # Cria próxima requisição de aprovação
                next_approval = ApprovalRequest(
                    ticket_id=approval.ticket_id,
                    level=approval.level + 1,
                    required_approver_count=approval.required_approver_count,
                    status="PENDENTE",
                )
                session.add(next_approval)
                # Ticket permanece AGUARDANDO
                ticket = await session.get(Ticket, approval.ticket_id)
                if ticket:
                    ticket.status = TicketStatus.AGUARDANDO
                    ticket.sla_status = SLAStatus.PAUSADO
            else:
                # Aprovação final concluída: prosseguir ticket
                ticket = await session.get(Ticket, approval.ticket_id)
                if ticket:
                    ticket.status = TicketStatus.EM_ANDAMENTO
                    ticket.sla_status = SLAStatus.OK

    await session.commit()
    await session.refresh(decision)
    return decision
