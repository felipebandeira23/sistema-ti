from __future__ import annotations

from datetime import datetime
from uuid import UUID
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.models.problem import ProblemStatus, ProblemImpact


class ProblemCreate(BaseModel):
    title: str
    description: str
    impact: ProblemImpact = ProblemImpact.MEDIO
    symptoms: Optional[str] = None
    category_id: Optional[UUID] = None


class ProblemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[ProblemStatus] = None
    impact: Optional[ProblemImpact] = None
    symptoms: Optional[str] = None
    root_cause: Optional[str] = None
    workaround: Optional[str] = None
    solution: Optional[str] = None
    assigned_to_user_id: Optional[UUID] = None


class ProblemPublic(BaseModel):
    id: UUID
    title: str
    description: str
    status: str
    impact: str
    symptoms: Optional[str] = None
    root_cause: Optional[str] = None
    workaround: Optional[str] = None
    solution: Optional[str] = None
    opened_by_user_id: UUID
    assigned_to_user_id: Optional[UUID] = None
    category_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ProblemTicketLinkCreate(BaseModel):
    ticket_id: UUID


class ProblemTicketLinkPublic(BaseModel):
    id: UUID
    problem_id: UUID
    ticket_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
