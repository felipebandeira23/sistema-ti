from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.dependencies import get_current_active_user, require_roles
from app.models.user import User
from app.schemas import (
    CIPublic,
    CICreate,
    CIUpdate,
    CIRelationshipPublic,
    CIRelationshipCreate,
)
from app.services import (
    list_cis,
    get_ci,
    create_ci,
    update_ci,
    create_relationship,
)

router = APIRouter(prefix="/cmdb", tags=["cmdb"])


@router.get("/cis", response_model=list[CIPublic])
async def list_all_cis(
    limit: int = 100,
    offset: int = 0,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_roles(["admin", "tecnico"])),
):
    return await list_cis(session, limit=limit, offset=offset)


@router.get("/cis/{ci_id}", response_model=CIPublic)
async def get_ci_route(
    ci_id: UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_roles(["admin", "tecnico"])),
):
    ci = await get_ci(session, ci_id)
    if not ci:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="CI não encontrado")
    return ci


@router.post("/cis", response_model=CIPublic, status_code=status.HTTP_201_CREATED)
async def create_ci_route(
    payload: CICreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_roles(["admin", "tecnico"])),
):
    return await create_ci(session, payload)


@router.patch("/cis/{ci_id}", response_model=CIPublic)
async def update_ci_route(
    ci_id: UUID,
    payload: CIUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_roles(["admin", "tecnico"])),
):
    ci = await get_ci(session, ci_id)
    if not ci:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="CI não encontrado")
    return await update_ci(session, ci, payload)


@router.post("/relationships", response_model=CIRelationshipPublic, status_code=status.HTTP_201_CREATED)
async def create_relationship_route(
    payload: CIRelationshipCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_roles(["admin", "tecnico"])),
):
    return await create_relationship(session, payload)
