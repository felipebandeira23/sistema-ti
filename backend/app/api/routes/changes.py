from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.dependencies import get_current_active_user, require_roles
from app.models.user import User
from app.schemas.change import ChangePublic, ChangeCreate, ChangeUpdate
from app.services.change_service import list_changes, get_change, create_change, update_change

router = APIRouter(prefix="/changes", tags=["changes"])


@router.get("/", response_model=list[ChangePublic])
async def list_all_changes(
    status_filter: str | None = None,
    q: str | None = None,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_roles(["admin", "tecnico"])),
):
    return await list_changes(session, status=status_filter, q=q)


@router.get("/{change_id}", response_model=ChangePublic)
async def get_change_by_id(
    change_id: UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
):
    change = await get_change(session, change_id)
    if not change:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mudança não encontrada")
    return change


@router.post("/", response_model=ChangePublic, status_code=status.HTTP_201_CREATED)
async def create_new_change(
    payload: ChangeCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
):
    try:
        return await create_change(session, payload, opened_by=current_user.id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.patch("/{change_id}", response_model=ChangePublic)
async def update_change_route(
    change_id: UUID,
    payload: ChangeUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_roles(["admin", "tecnico"])),
):
    change = await get_change(session, change_id)
    if not change:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mudança não encontrada")
    try:
        return await update_change(session, change, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
