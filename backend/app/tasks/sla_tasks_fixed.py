"""
Tasks relacionadas a SLA
"""
from celery import shared_task
from sqlalchemy import select
from datetime import datetime, timedelta
import logging

from app.core.database import AsyncSessionLocal
from app.models.ticket import Ticket
from app.models.sla import SLA
from app.models.user import User
from app.services.email_service import email_service, EmailTemplates
from app.core.config import settings

logger = logging.getLogger(__name__)


@shared_task(name="check_sla_status")
def check_sla_status():
    """
    Verifica e atualiza status de SLA de todos os tickets abertos.
    Envia notificações quando necessário.
    """
    import asyncio
    return asyncio.run(_check_sla_status_async())


async def _check_sla_status_async():
    """Implementação assíncrona da verificação de SLA"""
    async with AsyncSessionLocal() as session:
        try:
            # Busca tickets não resolvidos
            result = await session.execute(
                select(Ticket).where(
                    Ticket.status.in_(["NOVO", "EM_ANDAMENTO", "AGUARDANDO"])
                )
            )
            tickets = result.scalars().all()
            
            updated_count = 0
            warned_count = 0
            violated_count = 0
            
            for ticket in tickets:
                if not ticket.sla_id:
                    continue
                
                # Busca SLA policy
                sla = await session.get(SLA, ticket.sla_id)
                if not sla:
                    continue
                
                now = datetime.utcnow()
                old_status = ticket.sla_status
                
                # Calcula deadline
                if ticket.sla_deadline:
                    deadline = ticket.sla_deadline
                    time_remaining = (deadline - now).total_seconds() / 3600  # em horas
                    
                    # Atualiza status baseado no tempo restante
                    if time_remaining < 0:
                        ticket.sla_status = "VIOLADO"
                        if old_status != "VIOLADO":
                            violated_count += 1
                            # Envia notificação de violação
                            await _send_sla_violation_notification(session, ticket)
                    elif time_remaining < (sla.resolution_time_hours * 0.2):  # 20% do tempo
                        ticket.sla_status = "ALERTA"
                        if old_status == "OK":
                            warned_count += 1
                            # Envia alerta
                            await _send_sla_warning_notification(session, ticket, deadline, time_remaining)
                    else:
                        ticket.sla_status = "OK"
                    
                    if old_status != ticket.sla_status:
                        updated_count += 1
            
            await session.commit()
            
            logger.info(
                f"SLA check completado: {updated_count} atualizados, "
                f"{warned_count} alertas, {violated_count} violações"
            )
            
            return {
                "updated": updated_count,
                "warned": warned_count,
                "violated": violated_count,
                "total_checked": len(tickets)
            }
            
        except Exception as e:
            logger.error(f"Erro ao verificar SLA: {str(e)}")
            await session.rollback()
            return {"error": str(e)}


async def _send_sla_warning_notification(session, ticket, deadline, time_remaining):
    """Envia notificação de alerta de SLA"""
    try:
        # Busca email do responsável
        if ticket.assigned_to_user_id:
            user = await session.get(User, ticket.assigned_to_user_id)
            if user and user.email:
                html_body = EmailTemplates.sla_warning(
                    ticket_number=ticket.ticket_number,
                    title=ticket.title,
                    sla_deadline=deadline.strftime('%d/%m/%Y %H:%M'),
                    time_remaining=f"{time_remaining:.1f} horas",
                    ticket_url=f"{settings.frontend_url}/tickets/{ticket.id}"
                )
                
                email_service.send_email(
                    to=[user.email],
                    subject=f"⚠️ Alerta de SLA - Ticket #{ticket.ticket_number}",
                    body=html_body,
                    html=True
                )
    except Exception as e:
        logger.error(f"Erro ao enviar notificação de alerta SLA: {str(e)}")


async def _send_sla_violation_notification(session, ticket):
    """Envia notificação de violação de SLA"""
    try:
        # Busca emails de notificação
        recipients = []
        
        if ticket.assigned_to_user_id:
            user = await session.get(User, ticket.assigned_to_user_id)
            if user and user.email:
                recipients.append(user.email)
        
        # Adiciona supervisor/gerente (se configurado)
        # TODO: implementar hierarquia de notificação
        
        if recipients:
            html_body = EmailTemplates.sla_violated(
                ticket_number=ticket.ticket_number,
                title=ticket.title,
                ticket_url=f"{settings.frontend_url}/tickets/{ticket.id}"
            )
            
            email_service.send_email(
                to=recipients,
                subject=f"🚨 SLA VIOLADO - Ticket #{ticket.ticket_number}",
                body=html_body,
                html=True
            )
    except Exception as e:
        logger.error(f"Erro ao enviar notificação de violação SLA: {str(e)}")
