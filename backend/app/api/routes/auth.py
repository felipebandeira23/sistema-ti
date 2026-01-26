from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_session
from app.core.cache import get_redis_dependency
from app.core.security import create_access_token, create_refresh_token
from app.dependencies import get_current_active_user
from app.models.user import User
from app.schemas import LoginRequest, LoginResponse, Token, UserPublic
from app.services import authenticate_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse, status_code=status.HTTP_200_OK)
async def login(
    payload: LoginRequest,
    session: AsyncSession = Depends(get_session),
    redis: Redis = Depends(get_redis_dependency),
):
    """Autentica via LDAP (ou fallback local) e retorna tokens JWT."""
    key = f"rl:login:{payload.username.lower()}"
    attempts = await redis.incr(key)
    if attempts == 1:
        await redis.expire(key, 900)  # 15 minutos
    if attempts > 5:
        ttl = await redis.ttl(key)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Muitas tentativas. Aguarde {ttl if ttl > 0 else 0} segundos",
        )

    user = await authenticate_user(session, payload.username, payload.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuário ou senha inválidos")

    # Reset contador após sucesso
    await redis.delete(key)

    access_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        subject=str(user.id),
        expires_delta=access_expires,
        extra={"username": user.ldap_username, "roles": [role.name for role in user.roles]},
    )
    refresh_token = create_refresh_token(subject=str(user.id))

    return LoginResponse(
        token=Token(access_token=access_token, refresh_token=refresh_token),
        user_id=user.id,
        username=user.ldap_username,
        email=user.email,
        full_name=user.full_name,
        roles=[role.name for role in user.roles],
        last_login=user.last_login,
    )


@router.get("/me", response_model=UserPublic)
async def me(current_user: User = Depends(get_current_active_user)):
    """Retorna dados do usuário autenticado."""
    return current_user
