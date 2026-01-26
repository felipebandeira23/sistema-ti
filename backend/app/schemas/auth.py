from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, EmailStr, ConfigDict


class LoginRequest(BaseModel):
    """Payload de login via LDAP ou fallback local."""
    username: str
    password: str


class Token(BaseModel):
    """Tokens de acesso e refresh."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    """Payload decodificado do JWT."""
    sub: str
    type: str
    exp: int
    iat: int


class LoginResponse(BaseModel):
    """Resposta completa de login com dados do usuário."""
    token: Token
    user_id: UUID
    username: str | None = None
    email: EmailStr | None = None
    full_name: str | None = None
    roles: list[str] = []
    last_login: datetime | None = None


class RefreshRequest(BaseModel):
    """Requisição para refresh do token."""
    refresh_token: str
