from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class ServiceCatalogCategoryBase(BaseModel):
    name: str
    description: str | None = None
    icon: str | None = None
    order: int = 0
    is_active: bool = True


class ServiceCatalogCategoryCreate(ServiceCatalogCategoryBase):
    pass


class ServiceCatalogCategoryUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    icon: str | None = None
    order: int | None = None
    is_active: bool | None = None


class ServiceCatalogCategoryPublic(ServiceCatalogCategoryBase):
    id: UUID
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class ServiceCatalogItemBase(BaseModel):
    category_id: UUID
    name: str
    description: str | None = None
    icon: str | None = None
    order: int = 0
    visible_to_groups: list[UUID] | None = None
    form_schema: dict | None = None
    requires_approval: bool = False
    approval_group_id: UUID | None = None
    approval_levels: int = 1
    sla_id: UUID | None = None
    auto_tasks_template: list[dict] | None = None
    is_active: bool = True


class ServiceCatalogItemCreate(ServiceCatalogItemBase):
    pass


class ServiceCatalogItemUpdate(BaseModel):
    category_id: UUID | None = None
    name: str | None = None
    description: str | None = None
    icon: str | None = None
    order: int | None = None
    visible_to_groups: list[UUID] | None = None
    form_schema: dict | None = None
    requires_approval: bool | None = None
    approval_group_id: UUID | None = None
    approval_levels: int | None = None
    sla_id: UUID | None = None
    auto_tasks_template: list[dict] | None = None
    is_active: bool | None = None


class ServiceCatalogItemPublic(ServiceCatalogItemBase):
    id: UUID
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class ServiceRequestCreate(BaseModel):
    service_item_id: UUID
    form_data: dict | None = None


class ServiceRequestPublic(BaseModel):
    id: UUID
    ticket_id: UUID
    service_item_id: UUID
    requested_by_user_id: UUID
    form_data: dict | None = None
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)
