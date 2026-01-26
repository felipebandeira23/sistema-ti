from typing import Iterable
from fastapi import Depends, HTTPException, status

from app.dependencies.auth import get_current_user
from app.models.user import User


def require_roles(required_roles: Iterable[str]):
    """Factory de dependency para exigir um ou mais roles por nome."""
    required = {r.lower() for r in required_roles}

    async def dependency(current_user: User = Depends(get_current_user)) -> User:
        user_roles = {role.name.lower() for role in current_user.roles}
        if not required.intersection(user_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Acesso negado: role insuficiente",
            )
        return current_user

    return dependency
