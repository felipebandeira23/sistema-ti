from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
import io

from app.core.database import get_session
from app.dependencies import require_roles
from app.models.user import User
from app.services.report_service import ReportService

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("/tickets")
async def get_ticket_metrics(
    days: int = Query(30, ge=1, le=365),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_roles(["admin", "tecnico"])),
):
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    return await ReportService.get_ticket_metrics(session, start_date, end_date)

@router.get("/tickets/export")
async def export_tickets_csv(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_roles(["admin", "tecnico"])),
):
    csv_content = await ReportService.export_tickets_csv(session)
    return StreamingResponse(
        io.StringIO(csv_content),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=tickets.csv"}
    )

@router.get("/assets")
async def get_asset_report(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_roles(["admin", "tecnico"])),
):
    return await ReportService.get_asset_inventory_report(session)
