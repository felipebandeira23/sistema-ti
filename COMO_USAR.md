# 🚀 Sistema de Gerenciamento de TI - COPPEAD/UFRJ

## ✅ Instalação Concluída com Sucesso!

Todas as dependências foram instaladas e configuradas:
- ✅ Python 3.12.3 + ambiente virtual
- ✅ Node.js 20.20.0
- ✅ Docker + Docker Compose
- ✅ PostgreSQL 15 (container)
- ✅ Redis 7 (container)
- ✅ 281 pacotes npm (frontend)
- ✅ 50+ pacotes Python (backend)
- ✅ Banco de dados criado com 30+ tabelas

---

## 🎯 Como Iniciar o Sistema

### 1. Iniciar Banco de Dados e Cache
```bash
cd /var/www/sistema_ti
sudo docker-compose up -d db redis
```

### 2. Iniciar Backend (FastAPI)
```bash
cd /var/www/sistema_ti/backend
/var/www/sistema_ti/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Ou use o atalho:**
```bash
cd /var/www/sistema_ti
./start-backend.sh
```

### 3. Iniciar Frontend (React)
```bash
cd /var/www/sistema_ti/frontend
npm run dev
```

---

## 📡 Acessar o Sistema

### Backend (API)
- **API**: http://localhost:8000
- **Documentação Swagger**: http://localhost:8000/docs
- **Documentação ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

### Frontend
- **Interface Web**: http://localhost:5173

### Banco de Dados
- **Host**: localhost
- **Porta**: 5432
- **Database**: itsm
- **User**: itsm_user
- **Password**: itsm_password

---

## 🔧 Comandos Úteis

### Backend
```bash
# Ativar ambiente virtual
source /var/www/sistema_ti/venv/bin/activate

# Criar nova migration
cd /var/www/sistema_ti/backend
/var/www/sistema_ti/venv/bin/alembic revision --autogenerate -m "descrição"

# Aplicar migrations
/var/www/sistema_ti/venv/bin/alembic upgrade head

# Reverter migration
/var/www/sistema_ti/venv/bin/alembic downgrade -1
```

### Docker
```bash
# Ver logs
sudo docker-compose logs -f

# Ver containers rodando
sudo docker ps

# Parar todos os containers
sudo docker-compose down

# Reiniciar um container
sudo docker-compose restart db
```

### Frontend
```bash
cd /var/www/sistema_ti/frontend

# Instalar nova dependência
npm install nome-do-pacote

# Build para produção
npm run build

# Preview do build
npm run preview
```

---

## 📋 Módulos Implementados

✅ **Autenticação**: LDAP + JWT + fallback local  
✅ **Usuários**: Sincronização automática + RBAC  
✅ **Inventário**: Assets com integração GLPI  
✅ **CMDB**: Configuration Items + relacionamentos  
✅ **Tickets**: Incidente, Requisição, Problema, Mudança  
✅ **Catálogo de Serviços**: Formulários dinâmicos  
✅ **SLA**: Response time + Resolution time  
✅ **Base de Conhecimento**: FAQ + versionamento  
✅ **Aprovações**: Workflow multi-nível  
✅ **Auditoria**: Log completo de ações  
✅ **Webhooks**: Integrações externas  
✅ **Licenças e Contratos**: Gestão completa

---

## 🔐 Credenciais Padrão

**Usuário Admin Local** (fallback):
- Username: `admin`
- Password: `MudeImediatamente@123`

⚠️ **IMPORTANTE**: Altere a senha após o primeiro acesso!

---

## 📚 Documentação

- **Documentação Completa**: [README.md](README.md)
- **Status do Projeto**: [Documentos/STATUS_FINAL.md](Documentos/STATUS_FINAL.md)
- **Guia de Configuração**: [Documentos/SETUP_COMPLETE.md](Documentos/SETUP_COMPLETE.md)
- **Documentação PDF Original**: [Documentos/Sistema Gerenciamento TI COPPEAD.pdf](Documentos/Sistema%20Gerenciamento%20TI%20COPPEAD.pdf)

---

## 🐛 Solução de Problemas

### Backend não inicia
```bash
# Verificar se o banco está rodando
sudo docker ps | grep postgres

# Ver logs do backend
tail -f /var/log/sistema_ti/backend.log
```

### Banco de dados não conecta
```bash
# Verificar se o container está saudável
sudo docker-compose ps

# Reiniciar container do banco
sudo docker-compose restart db
```

### Frontend não carrega
```bash
# Limpar cache do npm
cd /var/www/sistema_ti/frontend
rm -rf node_modules package-lock.json
npm install
```

---

## 📞 Suporte

Para mais informações, consulte a documentação completa no diretório `Documentos/`.

**Sistema desenvolvido com base no documento:**
"Sistema Gerenciamento TI COPPEAD.pdf"

---

**Última atualização**: 26 de Janeiro de 2026
