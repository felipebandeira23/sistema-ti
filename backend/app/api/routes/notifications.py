from datetime import datetime, timedelta
from uuid import UUID, uuid4
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.dependencies import get_current_active_user
from app.models.user import User
from app.models.approval import ApprovalRequest
from app.models.ticket import Ticket, SLAStatus, TicketStatus

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.get("/")
async def list_notifications(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
):
    notifications = []
    seven_days_ago = datetime.utcnow() - timedelta(days=7)

    # 1. Pending approvals (PENDENTE status)
    approvals_result = await session.execute(
        select(ApprovalRequest).where(ApprovalRequest.status == "PENDENTE")
    )
    for ap in approvals_result.scalars().all():
        notifications.append({
            "id": str(ap.id),
            "type": "approval",
            "title": "Aprovação pendente",
            "message": f"Ticket #{str(ap.ticket_id)[:8]} aguarda sua decisão",
            "created_at": ap.created_at.isoformat() if ap.created_at else None,
            "read": False,
        })

    # 2. Tickets assigned to user with SLA at risk
    sla_result = await session.execute(
        select(Ticket).where(
            Ticket.assigned_to_user_id == current_user.id,
            Ticket.sla_status.in_([SLAStatus.CRÍTICO, SLAStatus.EXPIRADO]),
            Ticket.status.notin_([TicketStatus.RESOLVIDO, TicketStatus.FECHADO, TicketStatus.CANCELADO]),
            Ticket.deleted_at.is_(None),
        )
    )
    for t in sla_result.scalars().all():
        notifications.append({
            "id": f"sla-{t.id}",
            "type": "sla_warning",
            "title": "SLA em risco" if t.sla_status == SLAStatus.CRÍTICO else "SLA expirado",
            "message": f"Ticket #{t.ticket_number}: {t.title[:60]}",
            "created_at": t.updated_at.isoformat() if t.updated_at else None,
            "read": False,
        })

    # 3. Tickets assigned to user (recent, last 7 days)
    assigned_result = await session.execute(
        select(Ticket).where(
            Ticket.assigned_to_user_id == current_user.id,
            Ticket.created_at >= seven_days_ago,
            Ticket.deleted_at.is_(None),
        ).order_by(Ticket.created_at.desc()).limit(5)
    )
    for t in assigned_result.scalars().all():
        notifications.append({
            "id": f"assigned-{t.id}",
            "type": "ticket_assigned",
            "title": "Ticket atribuído a você",
            "message": f"#{t.ticket_number}: {t.title[:60]}",
            "created_at": t.created_at.isoformat() if t.created_at else None,
            "read": False,
        })

    # Sort by date descending
    notifications.sort(key=lambda x: x["created_at"] or "", reverse=True)
    return notifications[:20]

@router.post("/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: User = Depends(get_current_active_user),
):
    # Stateless: just return success (client-side tracks read state)
    return {"status": "ok", "notification_id": notification_id}
