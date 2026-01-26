#!/usr/bin/env python3
import asyncpg
import asyncio

async def check_users():
    conn = await asyncpg.connect(
        user='itsm_user',
        password='itsm_password',
        database='itsm',
        host='localhost'
    )
    
    # Listar tabelas
    tables = await conn.fetch(
        "SELECT tablename FROM pg_tables WHERE schemaname='public'"
    )
    print("Tabelas:")
    for table in tables:
        print(f"  - {table['tablename']}")
    
    # Listar usuários
    users = await conn.fetch(
        "SELECT user_id, username, email FROM users LIMIT 10"
    )
    print("\nUsuários:")
    for user in users:
        print(f"  - {user['username']} ({user['email']})")
    
    await conn.close()

asyncio.run(check_users())
