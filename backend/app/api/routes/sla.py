from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.dependencies import require_roles
from app.models.user import User
from app.schemas import (
    SLAPublic,
    SLACreate,
    SLAUpdate,
    CalendarPublic,
    CalendarCreate,
    CalendarUpdate,
    CalendarHolidayPublic,
    CalendarHolidayCreate,
    BusinessHoursSimulate,
    BusinessHoursSimulateResult,
)
from app.services import (
    list_calendars,
    get_calendar,
    create_calendar,
    update_calendar,
    add_holiday,
    list_slas,
    get_sla,
    create_sla,
    update_sla,
    recalculate_sla_status,
    add_business_hours,
)

router = APIRouter(prefix="/sla", tags=["sla"])


@router.get("/calendars", response_model=list[CalendarPublic])
async def list_all_calendars(session: AsyncSession = Depends(get_session)):
    return await list_calendars(session)


@router.post("/calendars", response_model=CalendarPublic, status_code=status.HTTP_201_CREATED)
async def create_calendar_route(
    payload: CalendarCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_roles(["admin", "tecnico"])),
):
    return await create_calendar(session, payload)


@router.patch("/calendars/{calendar_id}", response_model=CalendarPublic)
async def update_calendar_route(
    calendar_id: UUID,
    payload: CalendarUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_roles(["admin", "tecnico"])),
):
    calendar = await get_calendar(session, calendar_id)
    if not calendar:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Calendário não encontrado")
    return await update_calendar(session, calendar, payload)


@router.post("/calendars/{calendar_id}/holidays", response_model=CalendarHolidayPublic, status_code=status.HTTP_201_CREATED)
async def add_holiday_route(
    calendar_id: UUID,
    payload: CalendarHolidayCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_roles(["admin", "tecnico"])),
):
    if payload.calendar_id != calendar_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="calendar_id divergente")
    return await add_holiday(session, payload)


@router.get("/", response_model=list[SLAPublic])
async def list_all_slas(session: AsyncSession = Depends(get_session)):
    return await list_slas(session)


@router.post("/", response_model=SLAPublic, status_code=status.HTTP_201_CREATED)
async def create_sla_route(
    payload: SLACreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_roles(["admin", "tecnico"])),
):
    return await create_sla(session, payload)


@router.patch("/{sla_id}", response_model=SLAPublic)
async def update_sla_route(
    sla_id: UUID,
    payload: SLAUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_roles(["admin", "tecnico"])),
):
    sla = await get_sla(session, sla_id)
    if not sla:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SLA não encontrado")
    return await update_sla(session, sla, payload)


@router.post("/recalculate", status_code=status.HTTP_200_OK)
async def recalculate_route(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_roles(["admin", "tecnico"])),
):
    updated = await recalculate_sla_status(session)
    return {"updated": updated}


@router.post("/simulate", response_model=BusinessHoursSimulateResult)
async def simulate_business_hours_route(
    payload: BusinessHoursSimulate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_roles(["admin", "tecnico"])),
):
    target = await add_business_hours(session, payload.calendar_id, payload.start, payload.hours)
    return {"target": target}
