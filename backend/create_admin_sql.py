#!/usr/bin/env python3
"""Script para criar usuário admin via SQL direto"""
import asyncio
import asyncpg
from passlib.hash import bcrypt

async def create_admin():
    # Conectar ao banco
    conn = await asyncpg.connect(
        user='itsm_user',
        password='itsm_password',
        database='itsm',
        host='localhost'
    )
    
    try:
        # Criar role admin
        role_id = await conn.fetchval("""
            INSERT INTO roles (id, name, description, created_at, updated_at)
            VALUES (gen_random_uuid(), $1, $2, NOW(), NOW())
            ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
            RETURNING id
        """,
            "admin",
            "Administrador global"
        )
        
        if not role_id:
            role_id = await conn.fetchval("SELECT id FROM roles WHERE name = 'admin'")
        
        # Hash da senha
        password = "admin123"
        hashed = "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/FRiUCo2OxJ6w0bE/e"  # admin123
        
        # Criar usuário admin
        user_id = await conn.fetchval("""
            INSERT INTO users (
                id, ldap_username, email, full_name, source, status,
                is_active, hashed_password, sync_status, created_at, updated_at
            ) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
            ON CONFLICT (ldap_username) DO UPDATE
            SET hashed_password = EXCLUDED.hashed_password,
                is_active = true,
                updated_at = NOW()
            RETURNING id
        """, 
            "admin",
            "suporte-ti@coppead.ufrj.br",
            "Administrador",
            "LOCAL",
            "ACTIVE",
            True,
            hashed,
            "LOCAL"
        )
        
        # Associar role ao usuário
        await conn.execute("""
            INSERT INTO user_roles (user_id, role_id)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING
        """, user_id, role_id)
        
        print("✓ Usuário admin criado com sucesso!")
        print(f"  Username: admin")
        print(f"  Password: {password}")
        print(f"  Email: suporte-ti@coppead.ufrj.br")
        
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(create_admin())
