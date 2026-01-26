from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.dependencies import get_current_active_user, require_roles
from app.models.user import User
from app.schemas import (
    ServiceCatalogCategoryPublic,
    ServiceCatalogCategoryCreate,
    ServiceCatalogCategoryUpdate,
    ServiceCatalogItemPublic,
    ServiceCatalogItemCreate,
    ServiceCatalogItemUpdate,
    ServiceRequestPublic,
    ServiceRequestCreate,
    TicketPublic,
)
from app.schemas.ticket import TicketCreate
from app.services import (
    list_categories,
    create_category,
    update_category,
    get_category,
    list_items,
    get_item,
    create_item,
    update_item,
    create_service_request,
    create_ticket,
)

router = APIRouter(prefix="/catalog", tags=["service-catalog"])


# Categories
@router.get("/categories", response_model=list[ServiceCatalogCategoryPublic])
async def list_all_categories(session: AsyncSession = Depends(get_session)):
    return await list_categories(session)


@router.post("/categories", response_model=ServiceCatalogCategoryPublic, status_code=status.HTTP_201_CREATED)
async def create_category_route(
    payload: ServiceCatalogCategoryCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_roles(["admin", "tecnico"])),
):
    return await create_category(session, payload)


@router.patch("/categories/{category_id}", response_model=ServiceCatalogCategoryPublic)
async def update_category_route(
    category_id: UUID,
    payload: ServiceCatalogCategoryUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_roles(["admin", "tecnico"])),
):
    category = await get_category(session, category_id)
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categoria não encontrada")
    return await update_category(session, category, payload)


# Items
@router.get("/items", response_model=list[ServiceCatalogItemPublic])
async def list_all_items(
    category_id: UUID | None = None,
    session: AsyncSession = Depends(get_session),
):
    return await list_items(session, category_id)


@router.get("/items/{item_id}", response_model=ServiceCatalogItemPublic)
async def get_item_route(item_id: UUID, session: AsyncSession = Depends(get_session)):
    item = await get_item(session, item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item não encontrado")
    return item


@router.post("/items", response_model=ServiceCatalogItemPublic, status_code=status.HTTP_201_CREATED)
async def create_item_route(
    payload: ServiceCatalogItemCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_roles(["admin", "tecnico"])),
):
    return await create_item(session, payload)


@router.patch("/items/{item_id}", response_model=ServiceCatalogItemPublic)
async def update_item_route(
    item_id: UUID,
    payload: ServiceCatalogItemUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_roles(["admin", "tecnico"])),
):
    item = await get_item(session, item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item não encontrado")
    return await update_item(session, item, payload)


# Service Request (gera ticket REQUISIÇÃO)
@router.post("/requests", response_model=ServiceRequestPublic, status_code=status.HTTP_201_CREATED)
async def create_request_route(
    payload: ServiceRequestCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
):
    # Cria ticket do tipo REQUISIÇÃO
    ticket_payload = TicketCreate(
        type="REQUISIÇÃO",
        title="Requisição de Serviço",
        description="Gerado automaticamente a partir do catálogo",
        priority="P3_MÉDIO",
        urgency="MÉDIA",
        impact="INDIVIDUAL",
        asset_id=None,
        ci_id=None,
        category_id=None,
    )
    ticket = await create_ticket(session, ticket_payload, opened_by=current_user.id)
    sr = await create_service_request(session, payload, ticket_id=ticket.id, requested_by=current_user.id)
    return sr
