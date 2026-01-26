from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, EmailStr, ConfigDict


class RolePublic(BaseModel):
    """Representação pública de um papel (role)."""
    id: UUID
    name: str
    description: str | None = None

    model_config = ConfigDict(from_attributes=True)


class UserPublic(BaseModel):
    """Dados expostos do usuário autenticado ou listado."""
    id: UUID
    ldap_username: str | None = None
    email: EmailStr | None = None
    full_name: str | None = None
    department: str | None = None
    phone: str | None = None
    status: str
    source: str
    roles: list[RolePublic] = []
    last_login: datetime | None = None
    is_active: bool | None = None

    model_config = ConfigDict(from_attributes=True)


class UserCreate(BaseModel):
    """Payload para criação de usuário local."""
    ldap_username: str | None = None
    email: EmailStr | None = None
    full_name: str | None = None
    department: str | None = None
    phone: str | None = None
    password: str | None = None
    roles: list[str] = []
    is_active: bool = True


class UserUpdate(BaseModel):
    """Payload para atualização parcial de usuário."""
    email: EmailStr | None = None
    full_name: str | None = None
    department: str | None = None
    phone: str | None = None
    password: str | None = None
    roles: list[str] | None = None
    is_active: bool | None = None
    status: str | None = None
