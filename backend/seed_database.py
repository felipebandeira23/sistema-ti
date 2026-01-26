#!/usr/bin/env python3
"""Script para popular banco de dados com dados de demonstração"""
import asyncio
import asyncpg
import json
from datetime import datetime, timedelta
import random

async def seed_database():
    conn = await asyncpg.connect(
        user='itsm_user',
        password='itsm_password',
        database='itsm',
        host='localhost'
    )
    
    try:
        print("🌱 Iniciando população do banco de dados...")
        
        # Buscar ID do usuário admin
        admin_id = await conn.fetchval("SELECT id FROM users WHERE ldap_username = 'admin'")
        
        # 1. CRIAR ATIVOS
        print("\n📦 Criando ativos de TI...")
        assets_data = [
            ("Notebook Dell Latitude 5420", "HARDWARE", "NB-001", "Sala 101", "DISPONÍVEL"),
            ("Monitor LG 27'", "PERIFÉRICO", "MON-001", "Sala 101", "EM_USO"),
            ("Servidor Dell PowerEdge R740", "SERVIDOR", "SRV-001", "Data Center", "EM_USO"),
            ("Impressora HP LaserJet", "PERIFÉRICO", "IMP-001", "Sala 201", "EM_USO"),
            ("Switch Cisco Catalyst 2960", "REDE", "SW-001", "Data Center", "EM_USO"),
            ("Roteador TP-Link", "REDE", "RT-001", "Data Center", "EM_USO"),
            ("Windows 11 Pro", "SOFTWARE", "WIN-001", "Licenças", "DISPONÍVEL"),
            ("Microsoft Office 365", "SOFTWARE", "OFF-001", "Licenças", "EM_USO"),
        ]
        
        for name, asset_type, serial, location, status in assets_data:
            await conn.execute("""
                INSERT INTO assets (
                    id, name, asset_type, serial_number, status,
                    created_at, updated_at
                )
                VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())
                ON CONFLICT (serial_number) DO NOTHING
            """, name, asset_type, serial, status)
        print(f"  ✓ {len(assets_data)} ativos criados")
        
        # 2. CRIAR ITENS CMDB
        print("\n⚙️  Criando itens CMDB...")
        cmdb_data = [
            ("Servidor Web Principal", "HARDWARE", "ATIVO"),
            ("Banco de Dados PostgreSQL", "BANCO_DADOS", "ATIVO"),
            ("Sistema ERP", "APLICAÇÃO", "ATIVO"),
            ("Rede Corporativa VLAN 10", "REDE", "ATIVO"),
        ]
        
        for name, ci_type, status in cmdb_data:
            await conn.execute("""
                INSERT INTO configuration_items (
                    id, name, ci_type, status, owner_id, criticality, impact_level,
                    created_at, updated_at
                )
                VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW(), NOW())
                ON CONFLICT DO NOTHING
            """, name, ci_type, status, admin_id, 3, 0)
        print(f"  ✓ {len(cmdb_data)} itens CMDB criados")
        
        # 3. CRIAR TICKETS
        print("\n🎫 Criando tickets...")
        tickets_data = [
            ("Computador não liga", "Equipamento da sala 101 não está ligando", "P2_ALTO", "INCIDENTE", "NOVO", "ALTA", "INDIVIDUAL"),
            ("Solicitação de novo notebook", "Preciso de novo notebook para funcionário", "P3_MÉDIO", "REQUISIÇÃO", "NOVO", "MÉDIA", "INDIVIDUAL"),
            ("Internet lenta", "Velocidade da internet muito baixa", "P2_ALTO", "INCIDENTE", "EM_ANDAMENTO", "ALTA", "MÚLTIPLOS"),
            ("Instalação de software", "Instalar Adobe Photoshop", "P4_BAIXO", "REQUISIÇÃO", "NOVO", "BAIXA", "INDIVIDUAL"),
            ("Impressora não imprime", "Impressora da sala 201 com problema", "P3_MÉDIO", "INCIDENTE", "RESOLVIDO", "MÉDIA", "ALGUNS"),
        ]
        
        # Garantir numeração sequencial
        start_number = await conn.fetchval("SELECT COALESCE(MAX(ticket_number), 0) FROM tickets") or 0
        
        for idx, (title, desc, priority, ticket_type, status, urgency, impact) in enumerate(tickets_data):
            await conn.execute("""
                INSERT INTO tickets (
                    id, ticket_number, title, description, priority, type, status,
                    urgency, impact,
                    opened_by_user_id, sla_status,
                    created_at, updated_at
                )
                VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, 'OK', NOW(), NOW())
                ON CONFLICT DO NOTHING
            """, start_number + idx + 1, title, desc, priority, ticket_type, status, urgency, impact, admin_id)
        print(f"  ✓ {len(tickets_data)} tickets criados")
        
        # 4. CRIAR CATEGORIAS E ITENS DO CATÁLOGO
        print("\n📖 Criando categorias e serviços do catálogo...")

        # Criar categorias
        categoria_ids = {}
        categorias = [
            ("Software", "Instalação e licenças de software", "💿", 1),
            ("Acessos", "Contas e permissões de acesso", "🔑", 2),
            ("Equipamentos", "Solicitação de hardware", "💻", 3),
            ("Suporte", "Atendimento e suporte técnico", "🛟", 4),
        ]

        for name, desc, icon, order in categorias:
            result = await conn.fetchrow("""
                INSERT INTO service_catalog_categories (id, name, description, icon, "order", is_active, created_at, updated_at)
                VALUES (gen_random_uuid(), $1, $2, $3, $4, true, NOW(), NOW())
                ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
                RETURNING id
            """, name, desc, icon, order)
            categoria_ids[name] = result['id']

        # Criar itens do catálogo
        services_data = [
            ("Instalação de Software", "Solicitar instalação de novos programas", "Software", "💿", False),
            ("Licença de Software", "Requisitar licença comercial", "Software", "🔐", True),
            ("Criação de Conta", "Criar novo usuário de sistema", "Acessos", "👤", True),
            ("Acesso VPN", "Solicitar acesso à VPN corporativa", "Acessos", "🌐", True),
            ("Novo Notebook", "Requisitar notebook corporativo", "Equipamentos", "💻", True),
            ("Mouse e Teclado", "Solicitar periféricos", "Equipamentos", "⌨️", False),
            ("Suporte Remoto", "Atendimento via TeamViewer/AnyDesk", "Suporte", "🖥️", False),
        ]

        for idx, (name, desc, categoria, icon, requires_approval) in enumerate(services_data):
            cat_id = categoria_ids.get(categoria)
            await conn.execute("""
                INSERT INTO service_catalog_items (
                    id, category_id, name, description, icon, "order",
                    requires_approval, approval_levels,
                    is_active, created_at, updated_at
                )
                VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW())
                ON CONFLICT DO NOTHING
            """, cat_id, name, desc, icon, idx + 1, requires_approval, 1)
        print(f"  ✓ {len(categorias)} categorias e {len(services_data)} serviços criados")
        
        # 5. CRIAR ARTIGOS DA BASE DE CONHECIMENTO
        print("\n📚 Criando categorias e artigos de conhecimento...")
        
        # Criar categoria de conhecimento
        kb_cat_id = await conn.fetchval("""
                INSERT INTO knowledge_categories (id, name, slug, description, "order", created_at, updated_at)
                VALUES (gen_random_uuid(), 'Procedimentos Gerais', 'procedimentos-gerais', 'Documentação de procedimentos comuns', 1, NOW(), NOW())
                ON CONFLICT (slug) DO UPDATE SET slug = EXCLUDED.slug
                RETURNING id
            """)
        
        if not kb_cat_id:
            kb_cat_id = await conn.fetchval("SELECT id FROM knowledge_categories WHERE slug = 'procedimentos-gerais'")
        
        articles_data = [
            ("Como conectar à VPN", "vpn-corporativa", "## Procedimento\n\n1. Baixe o cliente VPN\n2. Configure com as credenciais fornecidas\n3. Conecte à VPN corporativa\n\n**Importante**: Use apenas em redes seguras.", "Guia completo para conexão VPN", ["vpn", "rede", "acesso"]),
            ("Resetar senha de email", "reset-senha-email", "## Como resetar sua senha\n\n1. Acesse o portal de autoatendimento\n2. Clique em 'Esqueci minha senha'\n3. Siga as instruções enviadas por email\n\n**Dica**: Use senhas fortes com letras, números e símbolos.", "Tutorial para reset de senha de email", ["email", "senha", "acesso"]),
            ("Solicitação de equipamentos", "solicitar-equipamento", "## Como solicitar novos equipamentos\n\n1. Acesse o Catálogo de Serviços\n2. Selecione o tipo de equipamento\n3. Preencha a justificativa\n4. Aguarde aprovação\n\nPrazo médio: 5-7 dias úteis.", "Procedimento para requisição de hardware", ["equipamento", "hardware", "solicitacao"]),
            ("Política de Uso da Internet", "politica-internet", "## Diretrizes de uso\n\n- Proibido acesso a sites de conteúdo adulto\n- Proibido downloads ilegais\n- Use apenas para atividades profissionais\n- Monitore seu uso de dados\n\n**Importante**: Violações podem resultar em sanções.", "Regras para uso responsável da internet corporativa", ["politica", "internet", "seguranca"]),
        ]
        
        for title, slug, content, summary, tags in articles_data:
            await conn.execute("""
                INSERT INTO knowledge_articles (
                    id, title, slug, content, summary, category_id, 
                    author_id, tags, is_published, visibility,
                    view_count, helpful_count, not_helpful_count,
                    version, created_at, updated_at
                )
                VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7::json, true, 'PÚBLICO', 0, 0, 0, 1, NOW(), NOW())
                ON CONFLICT (slug) DO NOTHING
            """, title, slug, content, summary, kb_cat_id, admin_id, json.dumps(tags))
        print(f"  ✓ {len(articles_data)} artigos criados")
        
        # 6. CRIAR SLAs
        print("\n⏱️ Criando calendários e SLAs...")
        
        # Criar calendário de horário útil
        calendar_id = await conn.fetchval("""
                INSERT INTO calendars (
                    id, name, timezone, work_hours_start, work_hours_end, work_days,
                    created_at, updated_at
                )
                VALUES (
                    gen_random_uuid(), 'Horário Comercial', 'America/Sao_Paulo', 
                    '08:00:00', '18:00:00', ARRAY['MON', 'TUE', 'WED', 'THU', 'FRI']::text[],
                    NOW(), NOW()
                )
                ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
                RETURNING id
            """)

        if not calendar_id:
            calendar_id = await conn.fetchval("SELECT id FROM calendars WHERE name = 'Horário Comercial'")

        # Criar definições de SLA
        slas_data = [
            ("P1 - Crítico - Incidente", "INCIDENTE", "P1_CRÍTICO", 1, 4),
            ("P2 - Alto - Incidente", "INCIDENTE", "P2_ALTO", 2, 8),
            ("P3 - Médio - Incidente", "INCIDENTE", "P3_MÉDIO", 4, 24),
            ("P4 - Baixo - Incidente", "INCIDENTE", "P4_BAIXO", 8, 48),
            ("P2 - Alto - Requisição", "REQUISIÇÃO", "P2_ALTO", 4, 16),
            ("P3 - Médio - Requisição", "REQUISIÇÃO", "P3_MÉDIO", 8, 32),
        ]

        for name, ticket_type, priority, response_time, resolution_time in slas_data:
                await conn.execute("""
                    INSERT INTO slas (
                        id, name, description, ticket_type, priority_level,
                        response_time, resolution_time, calendar_id, is_active,
                        created_at, updated_at
                    )
                    VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW())
                    ON CONFLICT DO NOTHING
                """, name, f"SLA para {ticket_type} com prioridade {priority}", ticket_type, priority, response_time, resolution_time, calendar_id)
        print(f"  ✓ 1 calendário e {len(slas_data)} SLAs criados")
        
        # 7. CRIAR APROVAÇÕES
        print("\n✅ Criando aprovações...")
        
        # Buscar alguns tickets para criar aprovações
        ticket_ids = await conn.fetch("SELECT id FROM tickets LIMIT 3")
        
        approvals_data = [
            ("PENDENTE", "Aprovação de compra de notebook"),
            ("PENDENTE", "Aprovação de instalação de software"),
            ("APROVADO", "Aprovação de novo monitor"),
        ]
        
        for idx, (status, reason) in enumerate(approvals_data):
            if idx < len(ticket_ids):
                ticket_id = ticket_ids[idx]['id']
                await conn.execute("""
                    INSERT INTO approval_requests (
                        id, ticket_id, level, required_approver_count, status,
                        created_at, updated_at
                    )
                    VALUES (gen_random_uuid(), $1, 1, 1, $2, NOW(), NOW())
                    ON CONFLICT DO NOTHING
                """, ticket_id, status)
        print(f"  ✓ {len(approvals_data)} aprovações criadas")
        
        print("\n✨ Banco de dados populado com sucesso!")
        print("\n📊 Resumo:")
        print(f"  • {len(assets_data)} Ativos")
        print(f"  • {len(cmdb_data)} Itens CMDB")
        print(f"  • {len(tickets_data)} Tickets")
        print(f"  • {len(services_data)} Serviços")
        print(f"  • {len(articles_data)} Artigos")
        print(f"  • {len(slas_data)} SLAs")
        print(f"  • {len(approvals_data)} Aprovações")
        
    except Exception as e:
        print(f"\n❌ Erro ao popular banco: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(seed_database())
