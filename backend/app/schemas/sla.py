from datetime import datetime, time
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class CalendarBase(BaseModel):
    name: str
    timezone: str = "America/Sao_Paulo"
    work_hours_start: time = time(8, 0)
    work_hours_end: time = time(18, 0)
    work_days: list[str] = ["MON", "TUE", "WED", "THU", "FRI"]


class CalendarCreate(CalendarBase):
    pass


class CalendarUpdate(BaseModel):
    timezone: str | None = None
    work_hours_start: time | None = None
    work_hours_end: time | None = None
    work_days: list[str] | None = None


class CalendarPublic(CalendarBase):
    id: UUID
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class CalendarHolidayCreate(BaseModel):
    calendar_id: UUID
    date: datetime
    name: str


class CalendarHolidayPublic(BaseModel):
    id: UUID
    calendar_id: UUID
    date: datetime
    name: str
    created_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class SLACreate(BaseModel):
    name: str
    description: str | None = None
    ticket_type: str
    priority_level: str
    response_time: int
    resolution_time: int
    calendar_id: UUID | None = None
    escalation_actions: dict | None = None
    is_active: bool = True


class SLAUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    ticket_type: str | None = None
    priority_level: str | None = None
    response_time: int | None = None
    resolution_time: int | None = None
    calendar_id: UUID | None = None
    escalation_actions: dict | None = None
    is_active: bool | None = None


class SLAPublic(BaseModel):
    id: UUID
    name: str
    description: str | None = None
    ticket_type: str
    priority_level: str
    response_time: int
    resolution_time: int
    calendar_id: UUID | None = None
    escalation_actions: dict | None = None
    is_active: bool
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class BusinessHoursSimulate(BaseModel):
    calendar_id: UUID
    start: datetime
    hours: int


class BusinessHoursSimulateResult(BaseModel):
    target: datetime
