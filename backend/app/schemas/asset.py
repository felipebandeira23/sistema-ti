from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class AssetBase(BaseModel):
    asset_type: str
    name: str
    description: str | None = None
    serial_number: str | None = None
    manufacturer: str | None = None
    model: str | None = None
    acquisition_date: datetime | None = None
    warranty_until: datetime | None = None
    cost: float | None = None
    location_id: UUID | None = None
    assigned_to_user_id: UUID | None = None
    status: str | None = None
    ip_address: str | None = None
    mac_address: str | None = None
    hostname: str | None = None
    host_id: UUID | None = None
    glpi_id: str | None = None


class AssetCreate(AssetBase):
    pass


class AssetUpdate(BaseModel):
    description: str | None = None
    manufacturer: str | None = None
    model: str | None = None
    warranty_until: datetime | None = None
    cost: float | None = None
    assigned_to_user_id: UUID | None = None
    status: str | None = None
    ip_address: str | None = None
    mac_address: str | None = None
    hostname: str | None = None


class AssetPublic(BaseModel):
    id: UUID
    asset_type: str
    name: str
    description: str | None = None
    serial_number: str | None = None
    manufacturer: str | None = None
    model: str | None = None
    acquisition_date: datetime | None = None
    warranty_until: datetime | None = None
    cost: float | None = None
    location_id: UUID | None = None
    assigned_to_user_id: UUID | None = None
    status: str
    ip_address: str | None = None
    mac_address: str | None = None
    hostname: str | None = None
    host_id: UUID | None = None
    glpi_id: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)
