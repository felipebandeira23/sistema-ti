# Sistema T.I. - COPPEAD ITSM

[![Status](https://img.shields.io/badge/Status-Em%20Desenvolvimento-yellow)](https://github.com)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.11+-blue)](https://www.python.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-blue)](https://nodejs.org/)

Sistema completo de Gerenciamento de TI (ITSM) para COPPEAD/UFRJ, implementando as melhores práticas de ITIL com suporte a múltiplos tipos de tickets, inventário sincronizado com GLPI, CMDB com análise de impacto, SLA automático e muito mais.

## 🚀 Características Principais

- ✅ **Autenticação LDAP/AD** - Integração com Active Directory da instituição
- ✅ **4 Tipos de Tickets ITSM** - Incidentes, Requisições, Problemas e Mudanças
- ✅ **SLA Automático** - Escalonamento inteligente baseado em tempo útil
- ✅ **CMDB** - Configuration Items com análise de impacto
- ✅ **Inventário Sincronizado** - Ativos sincronizados com GLPI
- ✅ **Base de Conhecimento** - FAQ com sugestões automáticas
- ✅ **Aprovações** - Workflow multi-nível customizável
- ✅ **Dashboard Executivo** - KPIs e relatórios em tempo real
- ✅ **Notificações** - Email, WebSocket em tempo real
- ✅ **Auditoria Completa** - Log de todas as ações

## 📊 Stack Tecnológico

### Backend
- **FastAPI** 0.115+ - Framework assíncrono de alta performance
- **SQLAlchemy** 2.0 - ORM com suporte async
- **PostgreSQL** 15+ - Banco de dados robusto
- **Redis** 7+ - Cache e fila de processamento
- **Celery** - Tarefas assíncronas
- **LDAP3** - Autenticação integrada

### Frontend
- **React** 18+ - Interface reativa
- **TypeScript** 5+ - Tipagem estática
- **Vite** - Build tool rápido
- **TailwindCSS** 3+ - Utilitários CSS
- **React Router** 6+ - Roteamento SPA
- **Zustand** - Gerenciamento de estado
- **React Query** - Data fetching e caching

### Infraestrutura
- **Docker** & **Docker Compose** - Containerização completa
- **Nginx** - Reverse proxy
- **Ubuntu** 24.04 LTS - SO base

## 📦 Instalação

### Pré-requisitos
- Docker 20.10+
- Docker Compose 1.29+
- Git

### Quick Start

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/Sistema-TI.git
cd Sistema-TI

# 2. Configure as variáveis de ambiente
cp backend/.env.example backend/.env
# Edite backend/.env com seus valores

# 3. Suba os containers
docker-compose up -d

# 4. Verifique os logs
docker-compose logs -f api

# 5. Acesse a aplicação
# Frontend: http://localhost:3000
# API: http://localhost:8000
# Swagger: http://localhost:8000/docs
```

### Desenvolvimento Local

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # ou `venv\Scripts\activate` no Windows
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload

# Frontend (em outro terminal)
cd frontend
npm install
npm run dev
```

## 📁 Estrutura do Projeto

```
Sistema-TI/
├── backend/                    # API FastAPI
│   ├── app/
│   │   ├── core/              # Configurações e segurança
│   │   ├── models/            # ORM SQLAlchemy
│   │   ├── api/               # Rotas e endpoints
│   │   ├── schemas/           # Schemas Pydantic
│   │   ├── services/          # Lógica de negócio
│   │   └── tasks/             # Tarefas Celery
│   ├── alembic/               # Migrations
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                   # React + TypeScript
│   ├── src/
│   │   ├── pages/             # Páginas
│   │   ├── components/        # Componentes React
│   │   ├── hooks/             # Custom hooks
│   │   ├── services/          # Serviços API
│   │   ├── stores/            # Estado global
│   │   ├── types/             # Types TypeScript
│   │   └── utils/             # Utilitários
│   ├── package.json
│   └── vite.config.ts
├── infra/                      # Configurações de infraestrutura
│   ├── nginx/                 # Configuração Nginx
│   └── docker/
├── Documentos/                 # Documentação do projeto
├── docker-compose.yml
└── README.md
```

## 🔐 Segurança

- ✅ HTTPS obrigatório em produção
- ✅ Autenticação LDAP com fallback local
- ✅ JWT com refresh tokens
- ✅ Senhas com bcrypt (12+ caracteres)
- ✅ RBAC granular (papéis e permissões)
- ✅ Rate limiting
- ✅ CSRF protection
- ✅ Auditoria completa

## 📊 Endpoints Principais

### Autenticação
```
POST   /api/auth/login           - Login LDAP
POST   /api/auth/refresh         - Renovar token
POST   /api/auth/logout          - Logout
GET    /api/auth/me              - Perfil do usuário
```

### Tickets
```
GET    /api/tickets              - Listar tickets
POST   /api/tickets              - Criar ticket
GET    /api/tickets/{id}         - Detalhes
PUT    /api/tickets/{id}         - Atualizar
PATCH  /api/tickets/{id}/status  - Mudar status
POST   /api/tickets/{id}/comments - Comentário
```

### Ativos
```
GET    /api/assets               - Listar ativos
POST   /api/assets               - Criar ativo
GET    /api/assets/{id}          - Detalhes
PATCH  /api/assets/{id}/status   - Alterar status
```

### CMDB
```
GET    /api/cmdb/items           - Listar CIs
POST   /api/cmdb/items           - Criar CI
GET    /api/cmdb/items/{id}/relationships - Relacionamentos
GET    /api/cmdb/items/{id}/impact-analysis - Análise de impacto
```

Veja a [documentação completa do projeto](Documentos/README.md).

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🗺️ Roadmap

- [ ] Fase 1: MVP (Autenticação, Tickets, Ativos)
- [ ] Fase 2: Expansão (Catálogo, Aprovações, Base de Conhecimento)
- [ ] Fase 3: Maturação (CMDB, GLPI Sync, Webhooks)
- [ ] Fase 4: Otimização (Performance, Mobile, Load Testing)

## 📚 Documentação Adicional

- [Status de Implementação](Documentos/STATUS_FINAL.md)
- [Guia de Setup](Documentos/SETUP_COMPLETE.md)
- [Especificação Original](Documentos/Sistema%20Gerenciamento%20TI%20COPPEAD.pdf)

---

**Desenvolvido com ❤️ para COPPEAD/UFRJ**
