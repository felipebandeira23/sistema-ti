from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class CICreate(BaseModel):
    name: str
    description: str | None = None
    ci_type: str
    status: str | None = None
    owner_id: UUID | None = None
    criticality: int = 3
    impact_level: int = 0
    asset_id: UUID | None = None
    attributes: dict | None = None


class CIUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    status: str | None = None
    owner_id: UUID | None = None
    criticality: int | None = None
    impact_level: int | None = None
    asset_id: UUID | None = None
    attributes: dict | None = None


class CIPublic(BaseModel):
    id: UUID
    name: str
    description: str | None = None
    ci_type: str
    status: str
    owner_id: UUID | None = None
    criticality: int
    impact_level: int
    asset_id: UUID | None = None
    attributes: dict | None = None
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class CIRelationshipCreate(BaseModel):
    source_ci_id: UUID
    target_ci_id: UUID
    relationship_type: str
    impact_propagation: bool = False


class CIRelationshipPublic(BaseModel):
    id: UUID
    source_ci_id: UUID
    target_ci_id: UUID
    relationship_type: str
    impact_propagation: bool
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)
