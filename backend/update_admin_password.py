#!/usr/bin/env python3
import asyncio
import asyncpg

async def update_admin_password():
    conn = await asyncpg.connect(
        user='itsm_user',
        password='itsm_password',
        database='itsm',
        host='localhost'
    )
    
    try:
        # Hash correto gerado com bcrypt nativo
        hash_correto = "$2b$12$kD3IM8aPiZjM6STQCsmlBe8OKowaylxl3/irSbumHZMe/qqKyJv4q"
        
        await conn.execute("""
            UPDATE users 
            SET hashed_password = $1
            WHERE ldap_username = 'admin'
        """, hash_correto)
        
        print("✓ Senha do admin atualizada com sucesso!")
        print("  Username: admin")
        print("  Password: admin123")
        
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(update_admin_password())
