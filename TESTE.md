# COPPEAD ITSM - Guia de Teste

## Credenciais de Teste

```
Usuário: admin
Senha: admin123
```

## URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## Módulos Disponíveis

### 1. Dashboard
- URL: http://localhost:3000
- Descrição: Página inicial com status do sistema e informações do usuário
- Funcionalidades:
  - Exibir informações do usuário logado
  - Status dos serviços (Backend, BD, Redis, LDAP)
  - Acesso rápido aos módulos

### 2. Tickets (Gerenciamento de Incidentes)
- URL: http://localhost:3000/tickets
- Descrição: Gerenciamento de incidentes, requisições de serviço e problemas
- Funcionalidades:
  - Listar todos os tickets
  - Criar novo ticket
  - Filtrar por prioridade e status
  - Atualizar status do ticket
- Campos do formulário:
  - Título
  - Descrição
  - Prioridade (Baixa, Média, Alta, Crítica)
  - Categoria

### 3. Inventário de Ativos
- URL: http://localhost:3000/assets
- Descrição: Controle de inventário de TI
- Funcionalidades:
  - Listar todos os ativos
  - Criar novo ativo
  - Visualizar detalhes do ativo
- Tipos de ativos:
  - Computadores
  - Impressoras
  - Servidores
  - Roteadores
  - Outros

### 4. CMDB (Configuration Management Database)
- URL: http://localhost:3000/cmdb
- Descrição: Base de dados de itens de configuração
- Funcionalidades:
  - Listar todos os CIs (Configuration Items)
  - Criar novo CI
  - Definir relacionamentos entre CIs
  - Rastrear dependências
- Tipos de CIs:
  - Hardware
  - Software
  - Network
  - Service

### 5. Catálogo de Serviços
- URL: http://localhost:3000/catalog
- Descrição: Catálogo de serviços disponíveis para requisição
- Funcionalidades:
  - Listar serviços disponíveis
  - Criar novo serviço
  - Solicitar serviço
  - Gerenciar categorias
- Campos do serviço:
  - Nome
  - Descrição
  - Categoria
  - Preço

### 6. Base de Conhecimento
- URL: http://localhost:3000/knowledge
- Descrição: Base de conhecimento e documentação
- Funcionalidades:
  - Listar artigos
  - Criar novo artigo
  - Pesquisar artigos
  - Categorizar conhecimento
- Campos do artigo:
  - Título
  - Conteúdo
  - Categoria
  - Tags

### 7. Fluxo de Aprovações
- URL: http://localhost:3000/approvals
- Descrição: Gerenciamento de aprovações de requisições
- Funcionalidades:
  - Listar aprovações pendentes
  - Aprovar requisições
  - Rejeitar requisições
  - Filtrar por status
- Status:
  - Pendente
  - Aprovada
  - Rejeitada

### 8. SLA - Service Level Agreement
- URL: http://localhost:3000/sla
- Descrição: Gerenciamento de SLAs e métricas de desempenho
- Funcionalidades:
  - Listar SLAs configurados
  - Criar novo SLA
  - Visualizar métricas de uptime
  - Monitorar tempo de resposta e resolução
- Métricas:
  - Tempo de Resposta (horas)
  - Tempo de Resolução (horas)
  - Disponibilidade (%)
  - Uptime do mês

## Fluxos de Negócio

### Fluxo de Incidente
1. Usuário cria ticket em "Tickets"
2. Ticket entra em análise
3. Se necessária aprovação, vai para "Aprovações"
4. Após aprovação, técnico trabalha no incidente
5. Ticket é resolvido e fechado

### Fluxo de Requisição de Serviço
1. Usuário visualiza "Catálogo de Serviços"
2. Seleciona serviço desejado
3. Preenche formulário de requisição
4. Requisição vai para "Aprovações"
5. Após aprovação, serviço é provisionado

### Fluxo de CMDB
1. Técnico registra novo CI em "CMDB"
2. Define tipo e localização do CI
3. Estabelece relacionamentos com outros CIs
4. SLA é aplicado ao CI
5. Monitorar em dashboard de SLA

## Testando a API Diretamente

### Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

### Listar Tickets
```bash
curl -H "Authorization: Bearer <TOKEN>" \
  http://localhost:8000/api/tickets/
```

### Criar Ticket
```bash
curl -X POST http://localhost:8000/api/tickets/ \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Problema de conectividade",
    "description": "Internet lenta na rede",
    "priority": "high",
    "category": "network"
  }'
```

### Listar CIs
```bash
curl -H "Authorization: Bearer <TOKEN>" \
  http://localhost:8000/api/cmdb/cis
```

## Solução de Problemas

### Porta 3000 já em uso
```bash
# Encontrar processo usando porta 3000
lsof -i :3000

# Matar processo
kill -9 <PID>
```

### Backend não responde
```bash
# Verificar se backend está rodando
curl http://localhost:8000/health

# Reiniciar backend
cd /var/www/sistema_ti/backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Erro de autenticação
- Verificar se token foi salvo no localStorage
- Fazer logout e login novamente
- Limpar cache do navegador

## Dados de Teste para Popular

Você pode usar o script de seed para popular dados de teste:
```bash
cd /var/www/sistema_ti/backend
python scripts/seed_data.py
```

## Documentação Adicional

- Swagger API Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- Projeto no GitHub: [Se houver repositório]
- Documentação do projeto: `/var/www/sistema_ti/Documentos/`
