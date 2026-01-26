"""
Wrapper para serviço de aprovações com notificações
"""
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
import logging

from app.models.approval import ApprovalRequest, ApprovalDecision
from app.models.ticket import Ticket, TicketStatus
from app.models.service_catalog import ServiceRequest, ServiceCatalogItem
from app.models.user import User
from app.models.sla import SLAStatus
from app.schemas.approval import ApprovalDecisionCreate
from app.services.email_service import email_service, EmailTemplates
from app.core.config import settings
from datetime import datetime

logger = logging.getLogger(__name__)


async def add_decision_with_notification(
    session: AsyncSession,
    approval: ApprovalRequest,
    approver_id: UUID,
    payload: ApprovalDecisionCreate,
) -> ApprovalDecision:
    """Adiciona decisão de aprovação e envia notificações"""
    
    decision = ApprovalDecision(
        approval_request_id=approval.id,
        approver_id=approver_id,
        decision=payload.decision,
        comment=payload.comment,
        decided_at=datetime.utcnow(),
    )
    session.add(decision)
    
    approval.updated_at = datetime.utcnow()
    
    # Se rejeitado, cancela ticket
    if payload.decision.upper() == "REJEITADO":
        approval.status = "REJEITADO"
        
        ticket = await session.get(Ticket, approval.ticket_id)
        if ticket:
            ticket.status = TicketStatus.CANCELADO
            ticket.sla_status = SLAStatus.PAUSADO
            
            # Notifica rejeição
            try:
                await _send_approval_rejected_notification(
                    session, ticket, approver_id, payload.comment
                )
            except Exception as e:
                logger.error(f"Erro ao enviar notificação de rejeição: {str(e)}")
    
    # Se aprovado, verifica quórum
    else:
        count_row = await session.execute(
            select(func.count()).select_from(ApprovalDecision).where(
                ApprovalDecision.approval_request_id == approval.id,
                ApprovalDecision.decision == "APROVADO",
            )
        )
        approved_count = count_row.scalar()
        
        # Verifica se atingiu quórum
        if approved_count >= approval.required_approver_count:
            approval.status = "APROVADO"
            
            # Busca requisição de serviço para verificar níveis
            service_req_row = await session.execute(
                select(ServiceRequest).where(
                    ServiceRequest.ticket_id == approval.ticket_id
                )
            )
            service_req = service_req_row.scalars().first()
            
            if service_req:
                catalog_item = await session.get(
                    ServiceCatalogItem, service_req.service_item_id
                )
                
                # Se há mais níveis, cria próximo
                if catalog_item and approval.level < catalog_item.approval_levels:
                    next_approval = ApprovalRequest(
                        ticket_id=approval.ticket_id,
                        level=approval.level + 1,
                        status="PENDENTE",
                        required_approver_count=1,  # TODO: configurável
                    )
                    session.add(next_approval)
                    
                    # Notifica próximo nível
                    try:
                        await _send_next_level_notification(
                            session, next_approval, approval.ticket_id
                        )
                    except Exception as e:
                        logger.error(f"Erro ao notificar próximo nível: {str(e)}")
                
                # Senão, aprovação final -> muda ticket
                else:
                    ticket = await session.get(Ticket, approval.ticket_id)
                    if ticket:
                        ticket.status = TicketStatus.EM_ANDAMENTO
                        
                        # Notifica aprovação final
                        try:
                            await _send_final_approval_notification(
                                session, ticket, approver_id
                            )
                        except Exception as e:
                            logger.error(f"Erro ao notificar aprovação final: {str(e)}")
    
    await session.commit()
    await session.refresh(decision)
    return decision


async def create_approval_with_notification(
    session: AsyncSession,
    approval: ApprovalRequest
) -> ApprovalRequest:
    """Cria solicitação de aprovação e notifica aprovadores"""
    session.add(approval)
    await session.flush()
    
    try:
        # Busca ticket relacionado
        ticket = await session.get(Ticket, approval.ticket_id)
        if not ticket:
            return approval
        
        # TODO: Buscar lista de aprovadores configurados
        # Por enquanto, notifica admins
        admins = await session.execute(
            select(User).where(User.is_active == True)
        )
        admin_list = admins.scalars().all()
        
        for admin in admin_list[:3]:  # Limita a 3 aprovadores
            if admin.email:
                html_body = EmailTemplates.approval_request(
                    approval_id=str(approval.id),
                    ticket_number=ticket.ticket_number,
                    title=ticket.title,
                    requester=ticket.opened_by_user.full_name if ticket.opened_by_user else "Desconhecido",
                    level=approval.level,
                    approval_url=f"{settings.frontend_url}/approvals/{approval.id}"
                )
                
                email_service.send_email(
                    to=[admin.email],
                    subject=f"Solicitação de Aprovação - Ticket #{ticket.ticket_number}",
                    body=html_body,
                    html=True
                )
    except Exception as e:
        logger.error(f"Erro ao notificar aprovadores: {str(e)}")
    
    return approval


async def _send_approval_rejected_notification(
    session: AsyncSession,
    ticket: Ticket,
    approver_id: UUID,
    comment: str
):
    """Notifica rejeição de aprovação"""
    # Notifica criador do ticket
    if ticket.opened_by_user_id:
        creator = await session.get(User, ticket.opened_by_user_id)
        approver = await session.get(User, approver_id)
        
        if creator and creator.email:
            html_body = EmailTemplates.approval_decided(
                ticket_number=ticket.ticket_number,
                title=ticket.title,
                decision="REJEITADO",
                decided_by=approver.full_name if approver else "Aprovador",
                comment=comment or "Sem comentários",
                ticket_url=f"{settings.frontend_url}/tickets/{ticket.id}"
            )
            
            email_service.send_email(
                to=[creator.email],
                subject=f"Aprovação REJEITADA - Ticket #{ticket.ticket_number}",
                body=html_body,
                html=True
            )


async def _send_next_level_notification(
    session: AsyncSession,
    next_approval: ApprovalRequest,
    ticket_id: UUID
):
    """Notifica aprovadores do próximo nível"""
    ticket = await session.get(Ticket, ticket_id)
    if not ticket:
        return
    
    # TODO: Implementar busca de aprovadores específicos do nível
    # Por enquanto, notifica admins


async def _send_final_approval_notification(
    session: AsyncSession,
    ticket: Ticket,
    approver_id: UUID
):
    """Notifica aprovação final"""
    if ticket.opened_by_user_id:
        creator = await session.get(User, ticket.opened_by_user_id)
        approver = await session.get(User, approver_id)
        
        if creator and creator.email:
            html_body = EmailTemplates.approval_decided(
                ticket_number=ticket.ticket_number,
                title=ticket.title,
                decision="APROVADO",
                decided_by=approver.full_name if approver else "Aprovador",
                comment="Todas as aprovações necessárias foram concedidas",
                ticket_url=f"{settings.frontend_url}/tickets/{ticket.id}"
            )
            
            email_service.send_email(
                to=[creator.email],
                subject=f"Aprovação CONCEDIDA - Ticket #{ticket.ticket_number}",
                body=html_body,
                html=True
            )
