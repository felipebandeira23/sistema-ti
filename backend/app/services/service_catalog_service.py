"""Serviços para catálogo de serviços e requisições."""
from __future__ import annotations

from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.service_catalog import (
    ServiceCatalogCategory,
    ServiceCatalogItem,
    ServiceRequest,
)
from app.models.approval import ApprovalRequest
from app.models.ticket import Ticket, TicketStatus
from app.schemas.service_catalog import (
    ServiceCatalogCategoryCreate,
    ServiceCatalogCategoryUpdate,
    ServiceCatalogItemCreate,
    ServiceCatalogItemUpdate,
    ServiceRequestCreate,
)


# Categorias
async def list_categories(session: AsyncSession) -> list[ServiceCatalogCategory]:
    result = await session.execute(select(ServiceCatalogCategory).order_by(ServiceCatalogCategory.order))
    return list(result.scalars().all())


async def create_category(session: AsyncSession, payload: ServiceCatalogCategoryCreate) -> ServiceCatalogCategory:
    category = ServiceCatalogCategory(**payload.model_dump())
    session.add(category)
    await session.commit()
    await session.refresh(category)
    return category


async def update_category(session: AsyncSession, category: ServiceCatalogCategory, payload: ServiceCatalogCategoryUpdate) -> ServiceCatalogCategory:
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(category, field, value)
    await session.commit()
    await session.refresh(category)
    return category


async def get_category(session: AsyncSession, category_id: UUID) -> Optional[ServiceCatalogCategory]:
    result = await session.execute(select(ServiceCatalogCategory).where(ServiceCatalogCategory.id == category_id))
    return result.scalar_one_or_none()


# Itens
async def list_items(session: AsyncSession, category_id: UUID | None = None) -> list[ServiceCatalogItem]:
    query = select(ServiceCatalogItem)
    if category_id:
        query = query.where(ServiceCatalogItem.category_id == category_id)
    result = await session.execute(query.order_by(ServiceCatalogItem.order))
    return list(result.scalars().all())


async def get_item(session: AsyncSession, item_id: UUID) -> Optional[ServiceCatalogItem]:
    result = await session.execute(select(ServiceCatalogItem).where(ServiceCatalogItem.id == item_id))
    return result.scalar_one_or_none()


async def create_item(session: AsyncSession, payload: ServiceCatalogItemCreate) -> ServiceCatalogItem:
    item = ServiceCatalogItem(**payload.model_dump())
    session.add(item)
    await session.commit()
    await session.refresh(item)
    return item


async def update_item(session: AsyncSession, item: ServiceCatalogItem, payload: ServiceCatalogItemUpdate) -> ServiceCatalogItem:
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    await session.commit()
    await session.refresh(item)
    return item


# Service Request
async def create_service_request(
    session: AsyncSession,
    payload: ServiceRequestCreate,
    ticket_id: UUID,
    requested_by: UUID,
) -> ServiceRequest:
    sr = ServiceRequest(
        ticket_id=ticket_id,
        service_item_id=payload.service_item_id,
        requested_by_user_id=requested_by,
        form_data=payload.form_data,
    )
    session.add(sr)
    await session.flush()

    # Se o item requer aprovação, cria ApprovalRequest e coloca o ticket em AGUARDANDO
    item = await session.get(ServiceCatalogItem, payload.service_item_id)
    if item and item.requires_approval:
        approval = ApprovalRequest(
            ticket_id=ticket_id,
            level=1,
            required_approver_count=max(1, int(item.approval_levels or 1)),
            status="PENDENTE",
        )
        session.add(approval)
        # Atualiza status do ticket
        ticket = await session.get(Ticket, ticket_id)
        if ticket:
            ticket.status = TicketStatus.AGUARDANDO

    await session.commit()
    await session.refresh(sr)
    return sr
