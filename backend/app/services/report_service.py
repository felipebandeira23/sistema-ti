"""
Sistema de relatórios e exportação
"""
from typing import List, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
import csv
import io

from app.models.ticket import Ticket, TicketStatus
from app.models.asset import Asset
from app.models.approval import ApprovalRequest


class ReportService:
    """Serviço para geração de relatórios"""
    
    @staticmethod
    async def get_ticket_metrics(
        session: AsyncSession,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """Obtém métricas de tickets em um período"""
        
        # Tickets criados no período
        created_result = await session.execute(
            select(func.count(Ticket.id)).where(
                Ticket.created_at >= start_date,
                Ticket.created_at <= end_date
            )
        )
        created_count = created_result.scalar()
        
        # Tickets resolvidos no período
        resolved_result = await session.execute(
            select(func.count(Ticket.id)).where(
                Ticket.resolved_at >= start_date,
                Ticket.resolved_at <= end_date
            )
        )
        resolved_count = resolved_result.scalar()
        
        # Tempo médio de resolução
        time_result = await session.execute(
            select(
                func.avg(
                    func.extract('epoch', Ticket.resolved_at - Ticket.created_at)
                )
            ).where(
                Ticket.resolved_at >= start_date,
                Ticket.resolved_at <= end_date
            )
        )
        avg_resolution_seconds = time_result.scalar() or 0
        avg_resolution_hours = avg_resolution_seconds / 3600
        
        # Tickets por prioridade
        priority_result = await session.execute(
            select(
                Ticket.priority,
                func.count(Ticket.id)
            ).where(
                Ticket.created_at >= start_date,
                Ticket.created_at <= end_date
            ).group_by(Ticket.priority)
        )
        priority_distribution = {
            row[0].value: row[1] for row in priority_result.fetchall()
        }
        
        # Taxa de violação de SLA
        sla_violated_result = await session.execute(
            select(func.count(Ticket.id)).where(
                Ticket.created_at >= start_date,
                Ticket.created_at <= end_date,
                Ticket.sla_status == "VIOLADO"
            )
        )
        sla_violated = sla_violated_result.scalar()
        sla_violation_rate = (sla_violated / created_count * 100) if created_count > 0 else 0
        
        return {
            "period": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat()
            },
            "tickets_created": created_count,
            "tickets_resolved": resolved_count,
            "resolution_rate": (resolved_count / created_count * 100) if created_count > 0 else 0,
            "avg_resolution_hours": round(avg_resolution_hours, 2),
            "priority_distribution": priority_distribution,
            "sla_violation_rate": round(sla_violation_rate, 2),
            "sla_violations": sla_violated
        }
    
    @staticmethod
    async def export_tickets_csv(
        session: AsyncSession,
        filters: Dict[str, Any] = None
    ) -> str:
        """Exporta tickets para CSV"""
        
        query = select(Ticket).where(Ticket.deleted_at.is_(None))
        
        # Aplica filtros se fornecidos
        if filters:
            if filters.get("status"):
                query = query.where(Ticket.status == filters["status"])
            if filters.get("priority"):
                query = query.where(Ticket.priority == filters["priority"])
            if filters.get("start_date"):
                query = query.where(Ticket.created_at >= filters["start_date"])
            if filters.get("end_date"):
                query = query.where(Ticket.created_at <= filters["end_date"])
        
        result = await session.execute(query.order_by(Ticket.created_at.desc()))
        tickets = result.scalars().all()
        
        # Cria CSV em memória
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Cabeçalho
        writer.writerow([
            "Número",
            "Tipo",
            "Status",
            "Título",
            "Prioridade",
            "Criado em",
            "Resolvido em",
            "Status SLA"
        ])
        
        # Dados
        for ticket in tickets:
            writer.writerow([
                ticket.ticket_number,
                ticket.type.value,
                ticket.status.value,
                ticket.title,
                ticket.priority.value,
                ticket.created_at.strftime("%d/%m/%Y %H:%M") if ticket.created_at else "",
                ticket.resolved_at.strftime("%d/%m/%Y %H:%M") if ticket.resolved_at else "",
                ticket.sla_status.value if ticket.sla_status else ""
            ])
        
        return output.getvalue()
    
    @staticmethod
    async def get_asset_inventory_report(
        session: AsyncSession
    ) -> Dict[str, Any]:
        """Relatório de inventário de ativos"""
        
        # Total por tipo
        type_result = await session.execute(
            select(
                Asset.asset_type,
                func.count(Asset.id)
            ).where(
                Asset.deleted_at.is_(None)
            ).group_by(Asset.asset_type)
        )
        by_type = {row[0].value: row[1] for row in type_result.fetchall()}
        
        # Total por status
        status_result = await session.execute(
            select(
                Asset.status,
                func.count(Asset.id)
            ).where(
                Asset.deleted_at.is_(None)
            ).group_by(Asset.status)
        )
        by_status = {row[0].value: row[1] for row in status_result.fetchall()}
        
        # Ativos sem manutenção há mais de 1 ano
        one_year_ago = datetime.utcnow() - timedelta(days=365)
        maintenance_result = await session.execute(
            select(func.count(Asset.id)).where(
                Asset.deleted_at.is_(None),
                Asset.last_maintenance < one_year_ago
            )
        )
        needs_maintenance = maintenance_result.scalar()
        
        return {
            "by_type": by_type,
            "by_status": by_status,
            "needs_maintenance": needs_maintenance,
            "total_assets": sum(by_type.values())
        }


report_service = ReportService()
