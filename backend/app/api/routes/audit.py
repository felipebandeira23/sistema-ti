from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.dependencies import require_roles
from app.models.user import User
from app.models.audit import AuditLog

router = APIRouter(prefix="/audit", tags=["audit"])

@router.get("/")
async def list_audit_logs(
    action: str | None = Query(None),
    resource_type: str | None = Query(None),
    days: int = Query(30, ge=1, le=365),
    limit: int = Query(100, le=500),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_roles(["admin"])),
):
    cutoff = datetime.utcnow() - timedelta(days=days)
    query = select(AuditLog).where(AuditLog.timestamp >= cutoff)
    if action:
        query = query.where(AuditLog.action == action)
    if resource_type:
        query = query.where(AuditLog.resource_type == resource_type)
    result = await session.execute(query.order_by(AuditLog.timestamp.desc()).limit(limit))
    logs = result.scalars().all()
    return [
        {
            "id": str(log.id),
            "action": log.action,
            "resource_type": log.resource_type,
            "resource_id": str(log.resource_id) if log.resource_id else None,
            "user_id": str(log.user_id) if log.user_id else None,
            "before": log.before,
            "after": log.after,
            "ip_address": log.ip_address,
            "severity": log.severity,
            "timestamp": log.timestamp.isoformat(),
        }
        for log in logs
    ]
