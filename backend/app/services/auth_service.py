"""Serviços de autenticação (LDAP + fallback local)."""
from __future__ import annotations

import logging
from datetime import datetime
from typing import Optional

from ldap3 import Connection, Server, ALL
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import verify_password
from app.models.user import User, UserSource, UserStatus, Role

logger = logging.getLogger(__name__)


async def _get_user_by_login(session: AsyncSession, username_or_email: str) -> Optional[User]:
    """Busca usuário por ldap_username ou email."""
    result = await session.execute(
        select(User).where(
            or_(User.ldap_username == username_or_email, User.email == username_or_email)
        )
    )
    return result.scalar_one_or_none()


async def _get_role(session: AsyncSession, name: str) -> Optional[Role]:
    """Busca role pelo nome."""
    result = await session.execute(select(Role).where(Role.name == name))
    return result.scalar_one_or_none()


def _ldap_bind(username: str, password: str) -> tuple[bool, dict[str, str | None]]:
    """Tenta autenticar no LDAP e retorna sucesso + atributos básicos."""
    if not settings.ldap_enabled:
        return False, {}

    user_dn = f"uid={username},{settings.ldap_users_ou},{settings.ldap_base_dn}"
    server = Server(settings.ldap_server, get_info=ALL, use_ssl=settings.ldap_use_ssl)

    try:
        conn = Connection(server, user=user_dn, password=password, auto_bind=True)
    except Exception as exc:  # pylint: disable=broad-except
        logger.info("LDAP bind falhou para %s: %s", username, exc)
        return False, {}

    attributes = {}
    try:
        if conn.search(search_base=user_dn, search_filter="(objectClass=*)", attributes=["cn", "mail", "department", "telephoneNumber"]):
            entry = conn.entries[0]
            attributes = {
                "full_name": str(entry.cn) if "cn" in entry else None,
                "email": str(entry.mail) if "mail" in entry else None,
                "department": str(entry.department) if "department" in entry else None,
                "phone": str(entry.telephoneNumber) if "telephoneNumber" in entry else None,
            }
    finally:
        conn.unbind()

    return True, attributes


async def _upsert_ldap_user(
    session: AsyncSession,
    username: str,
    attrs: dict[str, str | None],
) -> User:
    """Cria ou atualiza usuário a partir do LDAP."""
    user = await _get_user_by_login(session, username)
    if user is None:
        user = User(
            ldap_username=username,
            email=attrs.get("email"),
            full_name=attrs.get("full_name"),
            department=attrs.get("department"),
            phone=attrs.get("phone"),
            source=UserSource.LDAP,
            status=UserStatus.ACTIVE,
            is_active=True,
            sync_status="SYNCED",
        )
        session.add(user)
    else:
        user.email = attrs.get("email") or user.email
        user.full_name = attrs.get("full_name") or user.full_name
        user.department = attrs.get("department") or user.department
        user.phone = attrs.get("phone") or user.phone
        user.sync_status = "SYNCED"
        user.source = UserSource.LDAP
        user.status = UserStatus.ACTIVE
        user.is_active = True

    user.last_login = datetime.utcnow()
    await session.commit()
    await session.refresh(user)
    return user


async def authenticate_user(
    session: AsyncSession,
    username: str,
    password: str,
) -> Optional[User]:
    """Autentica usuário via LDAP; se falhar, tenta fallback local."""
    # 1) LDAP
    ldap_ok, attrs = _ldap_bind(username, password)
    if ldap_ok:
        return await _upsert_ldap_user(session, username, attrs)

    # 2) Fallback local (admin ou usuários locais)
    user = await _get_user_by_login(session, username)
    if user and user.hashed_password and verify_password(password, user.hashed_password):
        user.last_login = datetime.utcnow()
        await session.commit()
        await session.refresh(user)
        return user

    return None


async def ensure_admin_seed(
    session: AsyncSession,
    admin_username: str,
    admin_password_hash: str,
    admin_email: Optional[str] = None,
) -> User:
    """Garante um usuário admin local e role associada."""
    admin_role = await _get_role(session, "admin")
    if admin_role is None:
        admin_role = Role(name="admin", description="Administrador global")
        session.add(admin_role)
        await session.flush()

    user = await _get_user_by_login(session, admin_username)
    if user:
        if admin_role not in user.roles:
            user.roles.append(admin_role)
        await session.commit()
        await session.refresh(user)
        return user

    user = User(
        ldap_username=admin_username,
        email=admin_email,
        full_name="Administrador",
        source=UserSource.LOCAL,
        status=UserStatus.ACTIVE,
        is_active=True,
        hashed_password=admin_password_hash,
        sync_status="LOCAL",
    )
    user.roles.append(admin_role)
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user
