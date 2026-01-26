from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class TicketCreate(BaseModel):
    type: str
    title: str
    description: str
    priority: str
    urgency: str
    impact: str
    asset_id: UUID | None = None
    ci_id: UUID | None = None
    category_id: UUID | None = None


class TicketPublic(BaseModel):
    id: UUID
    ticket_number: int | None = None
    type: str
    status: str
    title: str
    description: str
    priority: str
    urgency: str
    impact: str
    opened_by_user_id: UUID
    assigned_to_user_id: UUID | None = None
    asset_id: UUID | None = None
    ci_id: UUID | None = None
    category_id: UUID | None = None
    sla_status: str | None = None
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class TicketStatusUpdate(BaseModel):
    status: str
    solution: str | None = None
