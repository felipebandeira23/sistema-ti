from __future__ import annotations

from datetime import datetime
from uuid import UUID
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.models.change import ChangeType, ChangeStatus, ChangeRisk


class ChangeCreate(BaseModel):
    title: str
    description: str
    justification: str
    type: ChangeType = ChangeType.NORMAL
    risk: ChangeRisk = ChangeRisk.MEDIO
    impact_description: Optional[str] = None
    rollback_plan: Optional[str] = None
    implementation_plan: Optional[str] = None
    category_id: Optional[UUID] = None
    scheduled_start: Optional[datetime] = None
    scheduled_end: Optional[datetime] = None


class ChangeUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    justification: Optional[str] = None
    type: Optional[ChangeType] = None
    status: Optional[ChangeStatus] = None
    risk: Optional[ChangeRisk] = None
    impact_description: Optional[str] = None
    rollback_plan: Optional[str] = None
    implementation_plan: Optional[str] = None
    assigned_to_user_id: Optional[UUID] = None
    scheduled_start: Optional[datetime] = None
    scheduled_end: Optional[datetime] = None


class ChangePublic(BaseModel):
    id: UUID
    title: str
    description: str
    type: str
    status: str
    risk: str
    justification: str
    impact_description: Optional[str] = None
    rollback_plan: Optional[str] = None
    implementation_plan: Optional[str] = None
    opened_by_user_id: UUID
    assigned_to_user_id: Optional[UUID] = None
    category_id: Optional[UUID] = None
    scheduled_start: Optional[datetime] = None
    scheduled_end: Optional[datetime] = None
    actual_start: Optional[datetime] = None
    actual_end: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    closed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
