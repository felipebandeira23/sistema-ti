from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.dependencies import get_current_active_user, require_roles
from app.models.user import User
from app.schemas import AssetPublic, AssetCreate, AssetUpdate
from app.services import list_assets, get_asset, create_asset, update_asset, soft_delete_asset

router = APIRouter(prefix="/assets", tags=["assets"])


@router.get("/", response_model=list[AssetPublic])
async def list_all_assets(
    limit: int = 50,
    offset: int = 0,
    asset_type: str | None = None,
    status: str | None = None,
    q: str | None = None,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_roles(["admin", "tecnico"])),
):
    return await list_assets(session, limit=limit, offset=offset, asset_type=asset_type, status=status, q=q)


@router.get("/{asset_id}", response_model=AssetPublic)
async def get_asset_by_id(
    asset_id: UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_roles(["admin", "tecnico"])),
):
    asset = await get_asset(session, asset_id)
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ativo não encontrado")
    return asset


@router.post("/", response_model=AssetPublic, status_code=status.HTTP_201_CREATED)
async def create_new_asset(
    payload: AssetCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_roles(["admin", "tecnico"])),
):
    try:
        return await create_asset(session, payload, created_by=current_user.id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.patch("/{asset_id}", response_model=AssetPublic)
async def update_existing_asset(
    asset_id: UUID,
    payload: AssetUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_roles(["admin", "tecnico"])),
):
    asset = await get_asset(session, asset_id)
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ativo não encontrado")
    try:
        return await update_asset(session, asset, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.delete("/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_asset(
    asset_id: UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_roles(["admin"])),
):
    asset = await get_asset(session, asset_id)
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ativo não encontrado")
    await soft_delete_asset(session, asset)
    return None
