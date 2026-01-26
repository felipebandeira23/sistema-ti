from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class ApprovalRequestCreate(BaseModel):
    ticket_id: UUID
    level: int = 1
    required_approver_count: int = 1
    expires_at: datetime | None = None


class ApprovalRequestPublic(BaseModel):
    id: UUID
    ticket_id: UUID
    level: int
    required_approver_count: int
    status: str
    expires_at: datetime | None = None
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class ApprovalDecisionCreate(BaseModel):
    decision: str  # APROVADO, REJEITADO
    comment: str | None = None


class ApprovalDecisionPublic(BaseModel):
    id: UUID
    approval_request_id: UUID
    approver_id: UUID
    decision: str
    comment: str | None = None
    decided_at: datetime

    model_config = ConfigDict(from_attributes=True)
