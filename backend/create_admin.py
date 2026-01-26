#!/usr/bin/env python3
"""Script para criar usuário admin local"""
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from passlib.hash import bcrypt
from app.models.user import User, Role, UserSource, UserStatus

async def create_admin():
    engine = create_async_engine(settings.database_url, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Criar role admin
        admin_role = Role(name="admin", description="Administrador global")
        session.add(admin_role)
        await session.flush()
        
        # Criar usuário admin - Bcrypt requer senha <= 72 bytes
        password = settings.admin_password[:72]
        hashed = bcrypt.hash(password)
        
        admin_user = User(
            ldap_username=settings.admin_username,
            email=settings.smtp_from_email,
            full_name="Administrador",
            source=UserSource.LOCAL,
            status=UserStatus.ACTIVE,
            is_active=True,
            hashed_password=hashed,
            sync_status="LOCAL",
        )
        admin_user.roles.append(admin_role)
        session.add(admin_user)
        
        await session.commit()
        print(f"✓ Usuário admin criado com sucesso!")
        print(f"  Username: {settings.admin_username}")
        print(f"  Password: {password}")
        print(f"  Email: {settings.smtp_from_email}")
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(create_admin())
