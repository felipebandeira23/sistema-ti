# COPPEAD ITSM - Sistema de Gerenciamento de TI
## Versão 1.0 - Baseado em Documentação Oficial

Sistema completo de gerenciamento de TI para COPPEAD/UFRJ, implementando ITIL com módulos de:

- **Autenticação**: LDAP/AD + JWT
- **Usuários**: Sincronização automática de LDAP
- **Inventário**: Ativos sincronizados com GLPI
- **CMDB**: Configuration Items com relacionamentos e análise de impacto
- **Tickets**: Incidentes, Requisições, Problemas e Mudanças (4 tipos ITSM)
- **Catálogo**: Serviços self-service com formulários dinâmicos
- **SLA**: Escalonamento automático baseado em tempo útil
- **Base de Conhecimento**: FAQ com sugestões automáticas
- **Dashboards**: KPIs e relatórios executivos
- **Notificações**: Email, webhooks, tempo real (WebSocket)
- **Auditoria**: Log completo de todas as ações
- **Aprovações**: Workflow multi-nível customizável

## Stack Tecnológico

### Backend
- **Framework**: FastAPI 0.115+ (assíncrono, high-performance)
- **ORM**: SQLAlchemy 2.0 + asyncpg
- **Banco**: PostgreSQL 15+
- **Cache/Fila**: Redis 7+
- **Tarefas**: Celery + Celery Beat
- **Autenticação**: PyJWT, LDAP3, passlib+bcrypt
- **Email**: SMTP com Jinja2 templates
- **Validação**: Pydantic 2.0

### Frontend (próxima fase)
- **Framework**: React 18+
- **Tipagem**: TypeScript 5+
- **Estilos**: TailwindCSS 3+
- **HTTP**: Axios + React Query
- **Roteamento**: React Router 6+
- **Estado**: Zustand/Redux
- **Tempo Real**: Socket.io

### Infraestrutura
- **Containerização**: Docker + Docker Compose
- **Reverse Proxy**: Nginx
- **CI/CD**: GitHub Actions (futuro)
- **OS**: Ubuntu 24.04 LTS

## Arquitetura

```
┌─────────────────────────────────────┐
│ APRESENTAÇÃO (React SPA)            │
└─────────────────┬───────────────────┘
                  │
┌─────────────────┼─────────────────┐
│                 │                 │
┌─────────▼──────────┐  ┌───────▼────────┐
│  API (FastAPI)    │  │ WebSocket Real  │
│  Pydantic Models  │  │ Time Notify     │
└────────┬──────────┘  └────────────────┘
         │
┌────────▼──────────────────────────┐
│ DADOS & CACHE                     │
│ PostgreSQL + Redis + Celery       │
└─────────────────────────────────┘
```

## Setup Local

### Pré-requisitos
- Docker 20.10+
- Docker Compose 1.29+
- Git

### Instalação

1. **Clone ou navegue para o diretório**
```bash
cd /var/www/sistema_ti
```

2. **Configure variáveis de ambiente**
```bash
cp backend/.env.example backend/.env
# Edite backend/.env com seus valores (SECRET_KEY, credenciais LDAP, etc)
```

3. **Suba os serviços**
```bash
docker-compose up -d --build
```

4. **Verifique logs**
```bash
docker-compose logs -f api
```

5. **Acesse a aplicação**
- API: http://localhost:8000
- Documentação Swagger: http://localhost:8000/docs
- Health: http://localhost:8000/health

## Endpoints Principais (MVP)

### Autenticação
- `POST /auth/login` - Login LDAP
- `POST /auth/refresh` - Renovar token
- `POST /auth/logout` - Logout
- `GET /auth/me` - Perfil do usuário

### Usuários
- `GET /api/users` - Listar (admin)
- `GET /api/users/me` - Meu perfil
- `PUT /api/users/me` - Atualizar perfil
- `POST /api/admin/users/sync-ldap` - Sincronizar (admin)

### Ativos
- `GET /api/assets` - Listar ativos
- `POST /api/assets` - Criar ativo
- `GET /api/assets/{id}` - Detalhe
- `PATCH /api/assets/{id}/status` - Alterar status

### Tickets
- `GET /api/tickets` - Listar
- `POST /api/tickets` - Criar incidente
- `GET /api/tickets/{id}` - Detalhe
- `PUT /api/tickets/{id}` - Atualizar
- `PATCH /api/tickets/{id}/status` - Mudar status
- `POST /api/tickets/{id}/comments` - Adicionar comentário
- `POST /api/tickets/{id}/feedback` - Avaliar

### SLA
- `GET /api/tickets/{id}/sla-status` - Status SLA em tempo real

### Base de Conhecimento
- `GET /api/knowledge/articles` - Listar artigos
- `GET /api/knowledge/articles/search` - Buscar
- `POST /api/knowledge/suggest` - Sugestões automáticas

### Relatórios
- `GET /api/dashboards/executive` - Dashboard gerencial
- `GET /api/reports/generate` - Gerar relatório customizado
- `GET /api/reports/{id}/export` - Exportar (CSV/Excel/PDF)

## Banco de Dados

Tabelas principais criadas automaticamente:

- `users` - Usuários do sistema
- `roles` - Papéis (admin, técnico, usuário, gerente, aprovador)
- `permissions` - Permissões granulares (RBAC)
- `assets` - Inventário de ativos (GLPI sync)
- `configuration_items` - CMDB (CIs e relacionamentos)
- `tickets` - Tickets ITSM (4 tipos)
- `ticket_comments` - Comentários públicos/internos
- `ticket_history` - Histórico de mudanças
- `ticket_feedback` - Avaliações de satisfação
- `service_catalog_items` - Catálogo de serviços
- `service_requests` - Requisições de serviço
- `slas` - Definições de SLA
- `knowledge_articles` - Base de conhecimento
- `approval_requests` - Workflow de aprovação
- `audit_logs` - Auditoria completa
- `licenses` - Licenças de software
- `webhook_configs` - Integrações externas

## Integrations

### LDAP/Active Directory
- Sincronização diária às 02:00
- Mapeamento automático de grupos LDAP → roles
- Fallback para admin local

### GLPI (Inventory)
- Sincronização noturna de ativos
- Suporte a FusionInventory
- Campos sincronizados: hardware, software, rede, usuário logado

### Email
- Notificações automáticas
- Templates Jinja2
- Fila Celery para envio assíncrono

### Webhooks
- GitHub: Vincular commits a tickets
- Zabbix: Alertas → Incidentes
- Custom: Qualquer URL (POST)

## Segurança

- ✅ HTTPS obrigatório (produção)
- ✅ CORS configurado restritivamente
- ✅ Rate limiting por IP/usuário
- ✅ Validação CSRF em mutações
- ✅ Senhas com bcrypt (12+ chars, complexidade)
- ✅ JWT com expiração e refresh token
- ✅ Sem credenciais no código (.env)
- ✅ Auditoria completa de ações
- ✅ Backup diário criptografado

## Roadmap

### Fase 1: MVP (Semanas 1-2) ✓ 
- [x] Estrutura base FastAPI
- [x] Autenticação LDAP + JWT
- [x] CRUD de usuários + sincronização
- [x] Inventário básico (assets)
- [x] Tickets ITSM (4 tipos)
- [x] Dashboard simples

### Fase 2: Expansão (Semanas 3-4)
- [ ] Catálogo de serviços + formulários dinâmicos
- [ ] Base de conhecimento com sugestões automáticas
- [ ] SLA com escalonamento
- [ ] CMDB com análise de impacto
- [ ] Aprovações multi-nível
- [ ] Frontend React

### Fase 3: Maturação (Semana 5+)
- [ ] Integrações (Slack, Teams, Discord)
- [ ] Analytics avançado + ML
- [ ] Mobile app
- [ ] Monitoramento (Prometheus/Grafana)
- [ ] Load testing e otimizações

## Contribuindo

1. Crie branch: `git checkout -b feature/descricao`
2. Commit: `git commit -am 'Descrição da mudança'`
3. Push: `git push origin feature/descricao`
4. Abra Pull Request

## Contato

- **Mantenedor**: TI COPPEAD/UFRJ
- **Email**: suporte-ti@coppead.ufrj.br
- **Documentação**: Ver arquivo PDF anexado

## Licença

Propriedade de COPPEAD/UFRJ - 2026

---

**Status**: 🚀 Em desenvolvimento | **Versão**: 1.0 | **Última atualização**: 26 de janeiro de 2026
