from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.dependencies import get_current_active_user, require_roles
from app.models.user import User
from app.schemas import UserPublic
from app.schemas.user import UserCreate, UserUpdate
from app.services import list_users, get_user, create_user, update_user

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/", response_model=list[UserPublic])
async def list_all_users(
    limit: int = 50,
    offset: int = 0,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_roles(["admin"])),
):
    """Lista usuários com paginação simples."""
    return await list_users(session, limit=limit, offset=offset)


@router.get("/{user_id}", response_model=UserPublic)
async def get_user_by_id(
    user_id: UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_roles(["admin"])),
):
    user = await get_user(session, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado")
    return user


@router.post("/", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
async def create_new_user(
    payload: UserCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_roles(["admin"])),
):
    try:
        return await create_user(session, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.patch("/{user_id}", response_model=UserPublic)
async def update_existing_user(
    user_id: UUID,
    payload: UserUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_roles(["admin"])),
):
    user = await get_user(session, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado")
    try:
        return await update_user(session, user, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
