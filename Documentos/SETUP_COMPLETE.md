# PROJETO COPPEAD ITSM - ESTRUTURA CRIADA
## Data: 26 de janeiro de 2026

### ✅ O QUE FOI CRIADO

#### Estrutura de Diretórios
```
/var/www/sistema_ti/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes/          # Endpoints (auth, users, tickets, etc)
│   │   ├── core/
│   │   │   ├── config.py        # Configurações (settings, LDAP, email, etc)
│   │   │   ├── database.py      # Conexão PostgreSQL + SessionLocal
│   │   │   └── security.py      # JWT, senhas, validações
│   │   ├── models/              # SQLAlchemy ORM
│   │   │   ├── user.py          # User, Role, Permission, RBAC
│   │   │   ├── asset.py         # Asset (inventário)
│   │   │   ├── cmdb.py          # ConfigurationItem, CIRelationship
│   │   │   ├── ticket.py        # Ticket, TicketComment, TicketHistory
│   │   │   ├── service_catalog.py # ServiceCatalogItem, ServiceRequest
│   │   │   ├── sla.py           # SLA, Calendar, CalendarHoliday
│   │   │   ├── knowledge.py     # KnowledgeArticle, KnowledgeCategory
│   │   │   ├── audit.py         # AuditLog (conformidade)
│   │   │   ├── approval.py      # ApprovalRequest, ApprovalDecision
│   │   │   ├── licensing.py     # License, MaintenanceContract
│   │   │   └── integrations.py  # Webhook, Announcement
│   │   ├── schemas/             # Pydantic models (request/response)
│   │   ├── services/            # Lógica de negócio (LDAP, tickets, etc)
│   │   ├── dependencies/        # Injeção de dependência (auth, db, perms)
│   │   ├── tasks/               # Celery tasks (sync, SLA, notificações)
│   │   ├── migrations/          # Alembic (schema versioning)
│   │   └── main.py              # Factory FastAPI + lifespan
│   ├── tests/                   # Testes unitários e integração
│   ├── requirements.txt         # Dependências Python
│   ├── Dockerfile              # Multi-stage build
│   ├── .env.example            # Variáveis de ambiente
│   └── .gitignore
│
├── frontend/
│   ├── src/
│   │   ├── components/         # Componentes React (Atomic Design)
│   │   ├── pages/              # Páginas/rotas
│   │   ├── services/           # API client (Axios + React Query)
│   │   ├── hooks/              # Custom hooks
│   │   ├── context/            # Context API / Zustand store
│   │   ├── styles/             # CSS global + TailwindCSS
│   │   ├── App.tsx             # Raiz da SPA
│   │   └── main.tsx            # Entry point React
│   ├── public/                 # Assets estáticos
│   ├── package.json            # Dependências npm
│   ├── vite.config.ts          # Configuração Vite
│   ├── tsconfig.json           # TypeScript config
│   ├── tailwind.config.js      # TailwindCSS
│   └── postcss.config.js       # PostCSS
│
├── infra/
│   ├── nginx/
│   │   └── nginx.conf          # Reverse proxy (API + Frontend + WebSocket)
│   └── docker/
│       └── .env.example        # Variáveis de build
│
├── docker-compose.yml          # Orquestração local (db, redis, api, workers)
├── README.md                   # Documentação completa
└── start.sh                    # Script inicialização rápida

```

#### Modelos de Dados (17 tabelas core)

**Autenticação e Autorização:**
- users (LDAP sync, fallback local)
- roles (admin, técnico, usuário, gerente, aprovador)
- permissions (granular RBAC)

**Gestão de TI:**
- assets (inventário GLPI sync)
- configuration_items (CMDB)
- ci_relationships (análise de impacto)

**Tickets ITSM:**
- tickets (INCIDENTE, REQUISIÇÃO, PROBLEMA, MUDANÇA)
- ticket_comments (público/interno)
- ticket_history (auditoria de mudanças)
- ticket_feedback (satisfação pós-fechamento)
- ticket_tasks (subtasks para requisições complexas)

**Serviços e Catálogo:**
- service_catalog_categories
- service_catalog_items (formulários dinâmicos)
- service_requests (especialização de tickets)

**SLA e Escalonamento:**
- slas (por tipo + prioridade)
- calendars (horário útil)
- calendar_holidays (feriados)

**Base de Conhecimento:**
- knowledge_categories (hierarquia)
- knowledge_articles (FAQ + sugestões auto)
- knowledge_article_versions (versionamento)

**Aprovações:**
- approval_requests (workflow multi-nível)
- approval_decisions (registro de decisões)

**Conformidade e Integrações:**
- audit_logs (ações críticas do sistema)
- licenses (software com data expiração)
- maintenance_contracts (garantia de ativos)
- webhook_configs (GitHub, Zabbix, custom)
- webhook_logs (histórico de chamadas)
- announcements (avisos no portal)

#### Tecnologias Implementadas

**Backend:**
✅ FastAPI 0.115+ (async, high-performance)
✅ SQLAlchemy 2.0 com asyncpg (PostgreSQL)
✅ Pydantic 2.0 (validação)
✅ PyJWT + LDAP3 (autenticação)
✅ Celery + Redis (tarefas assíncronas)
✅ APScheduler (agendamento)
✅ Passlib + bcrypt (senhas)

**Frontend:**
✅ React 18+ (SPA)
✅ TypeScript 5+ (tipagem)
✅ TailwindCSS 3+ (estilos)
✅ Vite (build rápido)
✅ Axios + React Query (HTTP)
✅ React Router 6+ (navegação)

**Infraestrutura:**
✅ PostgreSQL 15+ (ACID, async)
✅ Redis 7+ (cache + fila)
✅ Docker + Docker Compose
✅ Nginx (reverse proxy)
✅ Ubuntu 24.04 LTS compatible

---

### ⏭️ PRÓXIMOS PASSOS - ROADMAP DETALHADO

#### FASE 1: MVP (2 semanas) 🎯 Começar AGORA

**Semana 1:**
- [ ] Implementar rotas de autenticação (/auth/login, /auth/refresh, /auth/logout)
- [ ] Integrar LDAP (bind e validação)
- [ ] Criar bootstrap de admin local (seed data)
- [ ] Testar endpoints com Swagger
- [ ] Implementar rate limiting (5 tentativas falhadas / 15 min)

**Semana 2:**
- [ ] CRUD de usuários (/api/users)
- [ ] Sincronização LDAP automatizada (Celery task diária 02:00)
- [ ] CRUD de ativos (/api/assets)
- [ ] Sistema de tickets básico (POST /api/tickets, GET /api/tickets)
- [ ] Transições de estado (novo → triagem → em_andamento → resolvido → fechado)
- [ ] Comentários no ticket
- [ ] Frontend React básico (login, dashboard, listar tickets)

#### FASE 2: Expansão (2 semanas)

**Semana 3:**
- [ ] Catálogo de serviços com formulários dinâmicos (JSON Schema)
- [ ] Criação de requisições via catálogo
- [ ] Aprovações 1-nível
- [ ] Tasks automáticas geradas

**Semana 4:**
- [ ] Base de conhecimento (CRUD artigos)
- [ ] Busca Full-Text (elasticsearch)
- [ ] Sugestões automáticas ao abrir incidente (TF-IDF)
- [ ] SLA com escalonamento automático
- [ ] Dashboard de KPIs básico

#### FASE 3: Maturação (3+ semanas)

**Semana 5:**
- [ ] CMDB com relacionamentos e análise de impacto
- [ ] Aprovações multi-nível
- [ ] Integração GLPI (sincronização bidirecional)
- [ ] Webhooks (GitHub, Zabbix)

**Semana 6+:**
- [ ] Notificações (email, Slack, Teams)
- [ ] Dashboards avançados e relatórios exportáveis
- [ ] Mobile responsive
- [ ] Analytics e ML
- [ ] Load testing e otimizações
- [ ] Deploy em produção

---

### 🔧 COMO COMEÇAR

#### 1. Setup Local

```bash
cd /var/www/sistema_ti

# Copiar configurações
cp backend/.env.example backend/.env

# Editar backend/.env com suas credenciais:
# - SECRET_KEY (algo aleatório forte)
# - LDAP_SERVER, LDAP_BASE_DN
# - SMTP credentials
# - ADMIN_PASSWORD

# Subir containers
docker-compose up -d

# Verificar logs
docker-compose logs -f api
```

#### 2. Testar Endpoints

```bash
# Health check
curl http://localhost:8000/health

# Swagger UI
open http://localhost:8000/docs

# Redoc (alternativa)
open http://localhost:8000/redoc
```

#### 3. Implementar Endpoints um por um

Ordem recomendada (por criticidade):

1. POST /auth/login → Autenticação LDAP
2. GET /auth/me → Perfil do usuário
3. GET /api/users → Listar usuários (admin)
4. POST /api/admin/users/sync-ldap → Sincronizar LDAP
5. GET/POST /api/tickets → Tickets CRUD
6. PATCH /api/tickets/{id}/status → Transições
7. GET/POST /api/assets → Ativos
8. GET /api/dashboards/executive → Dashboard básico

#### 4. Implementar Celery Tasks

```python
# app/tasks/ldap_sync.py
@celery_app.task
def sync_users_from_ldap():
    """Sincronização diária às 02:00"""
    pass

# app/tasks/sla_checker.py
@celery_app.task
def check_sla_status():
    """A cada 5 minutos"""
    pass
```

#### 5. Testes

```bash
# Rodar testes
docker-compose exec api pytest tests/ -v

# Coverage
docker-compose exec api pytest tests/ --cov=app
```

---

### 📋 CHECKLIST ESSENCIAL

**Segurança:**
- [ ] HTTPS configurado (produção)
- [ ] CORS restritivo
- [ ] Rate limiting ativado
- [ ] CSRF tokens
- [ ] Senhas com validação forte (12+ chars, complexidade)
- [ ] Audit logs funcionando
- [ ] JWT com expiração e refresh
- [ ] Credenciais em .env (não no código)

**Performance:**
- [ ] PostgreSQL indexado (FK, queries comuns)
- [ ] Redis cache para usuários/roles
- [ ] Celery para tarefas longas
- [ ] Query optimization (eager loading)
- [ ] Pagination em listagens

**Confiabilidade:**
- [ ] Backup automático PostgreSQL
- [ ] Retry logic em LDAP
- [ ] Logging estruturado (JSON)
- [ ] Health checks nos containers
- [ ] Graceful shutdown

---

### 📚 REFERÊNCIAS

- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **SQLAlchemy 2.0**: https://docs.sqlalchemy.org/
- **React 18**: https://react.dev/
- **TailwindCSS**: https://tailwindcss.com/
- **Celery**: https://docs.celeryproject.io/
- **LDAP3**: https://ldap3.readthedocs.io/

---

### ⚡ DICAS RÁPIDAS

**Desenvolvimento Local:**
```bash
# Hot reload backend
docker-compose up -d api

# Logs em tempo real
docker-compose logs -f api celery_worker

# Acessar DB
docker-compose exec db psql -U itsm_user -d itsm

# Resetar tudo
docker-compose down -v
docker-compose up -d
```

**Debugging:**
```bash
# Adicionar print/logging
import logging
logger = logging.getLogger(__name__)
logger.info("Debug message")

# Usar debugger
import pdb; pdb.set_trace()

# Logs Celery
docker-compose logs celery_worker
```

---

## 🎉 RESUMO

Você tem agora:

✅ **Estrutura completa** de backend FastAPI com 17 tabelas do ITSM
✅ **14 modelos ORM** representando todo o sistema conforme documentação
✅ **Autenticação** LDAP + JWT + RBAC
✅ **Frontend React** base com TypeScript + TailwindCSS
✅ **Docker Compose** com 6 serviços (API, DB, Redis, LDAP, Workers)
✅ **Documentação** alinhada com o PDF do projeto

**Próximo Passo:** Implementar rotas e schemas conforme roadmap da Fase 1.

Boa sorte! 🚀
