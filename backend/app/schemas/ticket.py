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


class TicketUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    priority: str | None = None
    assigned_to_user_id: str | None = None  # UUID as string


class TicketCommentCreate(BaseModel):
    content: str
    is_public: bool = False


class TicketCommentPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    ticket_id: str
    author_id: str
    content: str
    is_public: bool
    created_at: datetime


class TicketHistoryPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    ticket_id: str
    field: str
    old_value: str | None
    new_value: str | None
    changed_by_user_id: str
    created_at: datetime


class TicketTaskCreate(BaseModel):
    title: str
    description: str | None = None
    due_date: datetime | None = None


class TicketTaskPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    ticket_id: str
    title: str
    description: str | None
    status: str
    assigned_to_user_id: str | None
    due_date: datetime | None
    created_at: datetime


class TicketFeedbackCreate(BaseModel):
    rating: int  # 1-5
    comment: str | None = None
    would_recommend: bool | None = None


class TicketFeedbackPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    ticket_id: str
    rating: int
    comment: str | None
    would_recommend: bool | None
    created_at: datetime
