"""Serviços para SLA e calendários."""
from __future__ import annotations

from uuid import UUID
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta, time

from datetime import datetime
from app.models.sla import SLA, Calendar, CalendarHoliday
from app.models.ticket import Ticket, SLAStatus
from app.schemas.sla import SLACreate, SLAUpdate, CalendarCreate, CalendarUpdate, CalendarHolidayCreate


# Calendars
async def list_calendars(session: AsyncSession) -> list[Calendar]:
    result = await session.execute(select(Calendar))
    return list(result.scalars().all())


async def get_calendar(session: AsyncSession, calendar_id: UUID) -> Optional[Calendar]:
    result = await session.execute(select(Calendar).where(Calendar.id == calendar_id))
    return result.scalar_one_or_none()


async def create_calendar(session: AsyncSession, payload: CalendarCreate) -> Calendar:
    calendar = Calendar(**payload.model_dump())
    session.add(calendar)
    await session.commit()
    await session.refresh(calendar)
    return calendar


async def update_calendar(session: AsyncSession, calendar: Calendar, payload: CalendarUpdate) -> Calendar:
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(calendar, field, value)
    await session.commit()
    await session.refresh(calendar)
    return calendar


async def add_holiday(session: AsyncSession, payload: CalendarHolidayCreate) -> CalendarHoliday:
    holiday = CalendarHoliday(**payload.model_dump())
    session.add(holiday)
    await session.commit()
    await session.refresh(holiday)
    return holiday


# SLA
async def list_slas(session: AsyncSession) -> list[SLA]:
    result = await session.execute(select(SLA))
    return list(result.scalars().all())


async def get_sla(session: AsyncSession, sla_id: UUID) -> Optional[SLA]:
    result = await session.execute(select(SLA).where(SLA.id == sla_id))
    return result.scalar_one_or_none()


async def create_sla(session: AsyncSession, payload: SLACreate) -> SLA:
    sla = SLA(**payload.model_dump())
    session.add(sla)
    await session.commit()
    await session.refresh(sla)
    return sla


async def update_sla(session: AsyncSession, sla: SLA, payload: SLAUpdate) -> SLA:
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(sla, field, value)
    await session.commit()
    await session.refresh(sla)
    return sla


async def recalculate_sla_status(session: AsyncSession) -> int:
    """Atualiza `sla_status` de tickets com base em alvos e tempo atual.
    Retorna a quantidade de tickets atualizados.
    """
    now = datetime.utcnow()
    result = await session.execute(select(Ticket).where(Ticket.sla_target_resolution.is_not(None)))
    tickets: list[Ticket] = list(result.scalars().all())
    updated = 0
    for t in tickets:
        if t.sla_target_resolution and now >= t.sla_target_resolution:
            if t.sla_status != SLAStatus.EXPIRADO:
                t.sla_status = SLAStatus.EXPIRADO
                updated += 1
        elif t.sla_target_resolution and t.created_at:
            total = (t.sla_target_resolution - t.created_at).total_seconds()
            elapsed = (now - t.created_at).total_seconds()
            ratio = elapsed / total if total > 0 else 0
            if ratio >= 0.7 and t.sla_status != SLAStatus.CRÍTICO:
                t.sla_status = SLAStatus.CRÍTICO
                updated += 1
            elif ratio < 0.7 and t.sla_status != SLAStatus.OK:
                t.sla_status = SLAStatus.OK
                updated += 1
    if updated:
        await session.commit()
    return updated


async def add_business_hours(
    session: AsyncSession,
    calendar_id: UUID,
    start: datetime,
    hours: int,
) -> datetime:
    """Soma horas úteis ao `start` usando configuração de `Calendar`.
    Considera dias de trabalho e janela `work_hours_start`/`work_hours_end`.
    Simplificação: usa timezone como informativo; cálculos em UTC.
    """
    cal = await get_calendar(session, calendar_id)
    if not cal:
        return start + timedelta(hours=hours)

    # Mapear dias úteis
    work_days = set(cal.work_days or ["MON", "TUE", "WED", "THU", "FRI"])
    day_map = {0: "MON", 1: "TUE", 2: "WED", 3: "THU", 4: "FRI", 5: "SAT", 6: "SUN"}
    wh_start: time = cal.work_hours_start or time(8, 0)
    wh_end: time = cal.work_hours_end or time(18, 0)
    daily_hours = (datetime.combine(start.date(), wh_end) - datetime.combine(start.date(), wh_start)).total_seconds() / 3600.0
    if daily_hours <= 0:
        return start + timedelta(hours=hours)

    # Feriados
    holidays_rows = await session.execute(select(CalendarHoliday.date).where(CalendarHoliday.calendar_id == calendar_id))
    holidays = {row.date().isoformat() for row in holidays_rows.scalars().all()}

    remaining = float(hours)
    current = start

    def is_workday(d: datetime) -> bool:
        return day_map[d.weekday()] in work_days and d.date().isoformat() not in holidays

    # Ajustar para início dentro da janela
    def clamp_to_window(dt: datetime) -> datetime:
        sdt = datetime.combine(dt.date(), wh_start)
        edt = datetime.combine(dt.date(), wh_end)
        if dt < sdt:
            return sdt
        if dt > edt:
            # ir para próximo dia útil 08:00
            nd = dt + timedelta(days=1)
            while not is_workday(nd):
                nd += timedelta(days=1)
            return datetime.combine(nd.date(), wh_start)
        return dt

    current = clamp_to_window(current)
    while remaining > 0:
        # pular dias não úteis
        while not is_workday(current):
            current = datetime.combine((current + timedelta(days=1)).date(), wh_start)
        day_end = datetime.combine(current.date(), wh_end)
        available = (day_end - current).total_seconds() / 3600.0
        if remaining <= available:
            current = current + timedelta(hours=remaining)
            remaining = 0
            break
        else:
            remaining -= available
            # avançar para próximo dia útil início
            nd = current + timedelta(days=1)
            while not is_workday(nd):
                nd = nd + timedelta(days=1)
            current = datetime.combine(nd.date(), wh_start)
    return current
