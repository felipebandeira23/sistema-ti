"""
Tasks relacionadas a sincronização LDAP
"""
from celery import shared_task
from sqlalchemy import select
from datetime import datetime
import logging

from app.core.database import AsyncSessionLocal
from app.models.user import User, UserStatus
from app.services.ldap_service import ldap_service

logger = logging.getLogger(__name__)


@shared_task(name="sync_users_from_ldap")
def sync_users_from_ldap():
    """
    Sincroniza usuários do LDAP/Active Directory com o banco de dados local.
    """
    import asyncio
    return asyncio.run(_sync_users_from_ldap_async())


async def _sync_users_from_ldap_async():
    """Implementação assíncrona da sincronização LDAP"""
    async with AsyncSessionLocal() as session:
        try:
            if not ldap_service.enabled:
                logger.warning("Sincronização LDAP desabilitada")
                return {"error": "LDAP disabled"}
            
            # Busca usuários do LDAP
            ldap_users = ldap_service.search_users()
            
            if not ldap_users:
                logger.warning("Nenhum usuário encontrado no LDAP")
                return {"created": 0, "updated": 0, "disabled": 0}
            
            created_count = 0
            updated_count = 0
            disabled_count = 0
            
            # Processa cada usuário do LDAP
            for ldap_user in ldap_users:
                username = ldap_user.get("sAMAccountName") or ldap_user.get("uid")
                email = ldap_user.get("mail")
                full_name = ldap_user.get("displayName") or ldap_user.get("cn")
                
                if not username:
                    continue
                
                # Busca usuário existente
                result = await session.execute(
                    select(User).where(User.ldap_username == username)
                )
                user = result.scalar_one_or_none()
                
                if user:
                    # Atualiza usuário existente
                    user.email = email or user.email
                    user.full_name = full_name or user.full_name
                    user.department = ldap_user.get("department", user.department)
                    user.phone = ldap_user.get("telephoneNumber", user.phone)
                    user.status = UserStatus.ATIVO
                    user.sync_status = "synced"
                    user.sync_error_message = None
                    user.updated_at = datetime.utcnow()
                    updated_count += 1
                else:
                    # Cria novo usuário
                    new_user = User(
                        ldap_username=username,
                        email=email,
                        full_name=full_name,
                        department=ldap_user.get("department"),
                        phone=ldap_user.get("telephoneNumber"),
                        source="ldap",
                        status=UserStatus.ATIVO,
                        is_active=True,
                        sync_status="synced"
                    )
                    session.add(new_user)
                    created_count += 1
            
            # Marca usuários que não estão mais no LDAP
            result = await session.execute(
                select(User).where(
                    User.source == "ldap",
                    User.status == UserStatus.ATIVO
                )
            )
            local_users = result.scalars().all()
            
            ldap_usernames = {u.get("sAMAccountName") or u.get("uid") for u in ldap_users}
            
            for user in local_users:
                if user.ldap_username not in ldap_usernames:
                    user.status = UserStatus.INATIVO
                    user.sync_status = "removed_from_ldap"
                    disabled_count += 1
            
            await session.commit()
            
            logger.info(
                f"Sincronização LDAP completada: {created_count} criados, "
                f"{updated_count} atualizados, {disabled_count} desativados"
            )
            
            return {
                "created": created_count,
                "updated": updated_count,
                "disabled": disabled_count,
                "total_ldap": len(ldap_users)
            }
            
        except Exception as e:
            logger.error(f"Erro ao sincronizar LDAP: {str(e)}")
            await session.rollback()
            return {"error": str(e)}
