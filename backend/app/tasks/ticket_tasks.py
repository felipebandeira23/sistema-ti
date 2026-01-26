"""
Tasks relacionadas a tickets
"""
from celery import shared_task
from sqlalchemy import select
from datetime import datetime, timedelta
import logging

from app.core.database import AsyncSessionLocal
from app.models.ticket import Ticket, TicketStatus

logger = logging.getLogger(__name__)


@shared_task(name="auto_close_inactive_tickets")
def auto_close_inactive_tickets(days_inactive: int = 30):
    """
    Fecha automaticamente tickets resolvidos há mais de X dias sem atividade.
    
    Args:
        days_inactive: Número de dias de inatividade para fechar
    """
    import asyncio
    return asyncio.run(_auto_close_inactive_tickets_async(days_inactive))


async def _auto_close_inactive_tickets_async(days_inactive: int):
    """Implementação assíncrona do fechamento automático"""
    async with AsyncSessionLocal() as session:
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days_inactive)
            
            # Busca tickets resolvidos há mais de X dias
            result = await session.execute(
                select(Ticket).where(
                    Ticket.status == TicketStatus.RESOLVIDO,
                    Ticket.updated_at < cutoff_date
                )
            )
            tickets = result.scalars().all()
            
            closed_count = 0
            for ticket in tickets:
                ticket.status = TicketStatus.FECHADO
                ticket.closed_at = datetime.utcnow()
                closed_count += 1
                
                logger.info(f"Ticket #{ticket.ticket_number} fechado automaticamente por inatividade")
            
            await session.commit()
            
            logger.info(f"Auto-fechamento completado: {closed_count} tickets fechados")
            
            return {
                "closed_count": closed_count,
                "days_inactive": days_inactive
            }
            
        except Exception as e:
            logger.error(f"Erro ao fechar tickets inativos: {str(e)}")
            await session.rollback()
            return {"error": str(e)}
