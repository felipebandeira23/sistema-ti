"""
Wrapper para serviço de tickets com notificações
"""
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from app.services import ticket_service as base_ticket_service
from app.services.email_service import email_service, EmailTemplates
from app.models.ticket import Ticket, TicketStatus
from app.models.user import User
from app.schemas.ticket import TicketCreate, TicketStatusUpdate
from app.core.config import settings

logger = logging.getLogger(__name__)


async def create_ticket_with_notification(
    session: AsyncSession, 
    payload: TicketCreate, 
    opened_by: UUID
) -> Ticket:
    """Cria ticket e envia notificação"""
    ticket = await base_ticket_service.create_ticket(session, payload, opened_by)
    
    try:
        user = await session.get(User, opened_by)
        if user and user.email:
            html_body = EmailTemplates.ticket_created(
                ticket_number=ticket.ticket_number,
                title=ticket.title,
                description=ticket.description or "Sem descrição",
                priority=ticket.priority.value,
                ticket_url=f"{settings.frontend_url}/tickets/{ticket.id}"
            )
            
            email_service.send_email(
                to=[user.email],
                subject=f"Ticket #{ticket.ticket_number} criado - {ticket.title}",
                body=html_body,
                html=True
            )
    except Exception as e:
        logger.error(f"Erro ao enviar notificação: {str(e)}")
    
    return ticket


async def update_ticket_status_with_notification(
    session: AsyncSession,
    ticket: Ticket,
    payload: TicketStatusUpdate,
    updated_by: UUID
) -> Ticket:
    """Atualiza ticket e envia notificação"""
    old_status = ticket.status
    
    ticket = await base_ticket_service.update_ticket_status(session, ticket, payload)
    
    try:
        if old_status != ticket.status:
            recipients = []
            
            # Criador
            if ticket.opened_by_user_id:
                creator = await session.get(User, ticket.opened_by_user_id)
                if creator and creator.email:
                    recipients.append(creator.email)
            
            # Responsável
            if ticket.assigned_to_user_id:
                assignee = await session.get(User, ticket.assigned_to_user_id)
                if assignee and assignee.email and assignee.email not in recipients:
                    recipients.append(assignee.email)
            
            if recipients:
                updater = await session.get(User, updated_by)
                html_body = EmailTemplates.ticket_updated(
                    ticket_number=ticket.ticket_number,
                    title=ticket.title,
                    changes=f"Status: {old_status.value} → {ticket.status.value}",
                    updated_by=updater.full_name if updater else "Sistema",
                    ticket_url=f"{settings.frontend_url}/tickets/{ticket.id}"
                )
                
                email_service.send_email(
                    to=recipients,
                    subject=f"Ticket #{ticket.ticket_number} atualizado",
                    body=html_body,
                    html=True
                )
    except Exception as e:
        logger.error(f"Erro ao enviar notificação: {str(e)}")
    
    return ticket


async def assign_ticket_with_notification(
    session: AsyncSession,
    ticket: Ticket,
    assigned_to: UUID,
    assigned_by: UUID
) -> Ticket:
    """Atribui ticket e envia notificação"""
    ticket.assigned_to_user_id = assigned_to
    
    if ticket.status == TicketStatus.NOVO:
        ticket.status = TicketStatus.EM_ANDAMENTO
    
    await session.commit()
    await session.refresh(ticket)
    
    try:
        assignee = await session.get(User, assigned_to)
        assigner = await session.get(User, assigned_by)
        
        if assignee and assignee.email:
            html_body = EmailTemplates.ticket_assigned(
                ticket_number=ticket.ticket_number,
                title=ticket.title,
                assigned_to=assignee.full_name or assignee.ldap_username,
                assigned_by=assigner.full_name if assigner else "Sistema",
                ticket_url=f"{settings.frontend_url}/tickets/{ticket.id}"
            )
            
            email_service.send_email(
                to=[assignee.email],
                subject=f"Ticket #{ticket.ticket_number} atribuído a você",
                body=html_body,
                html=True
            )
    except Exception as e:
        logger.error(f"Erro ao enviar notificação: {str(e)}")
    
    return ticket
