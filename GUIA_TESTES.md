# 🧪 Guia de Testes - Sistema ITSM COPPEAD

Este guia contém exemplos práticos para testar todos os módulos do sistema.

---

## 📋 Pré-requisitos

```bash
# 1. Certifique-se de que o sistema está rodando
./start_system.sh

# 2. Obtenha um token de autenticação
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | \
  python3 -c 'import sys,json; print(json.load(sys.stdin)["token"]["access_token"])')

echo "Token: $TOKEN"
```

---

## 🎫 1. Testando Tickets

### Listar todos os tickets
```bash
curl -s "http://localhost:8000/api/tickets/" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

### Criar novo ticket
```bash
curl -s -X POST "http://localhost:8000/api/tickets/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "INCIDENTE",
    "title": "Computador não liga",
    "description": "Computador da sala 305 não está ligando",
    "priority": "P2_ALTO",
    "urgency": "ALTA",
    "impact": "INDIVIDUAL"
  }' | python3 -m json.tool
```

### Buscar ticket por ID
```bash
# Substitua TICKET_ID pelo ID retornado na criação
TICKET_ID="cole-aqui-o-id"
curl -s "http://localhost:8000/api/tickets/$TICKET_ID" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

### Atualizar status do ticket
```bash
curl -s -X PATCH "http://localhost:8000/api/tickets/$TICKET_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "EM_ANDAMENTO"}' | python3 -m json.tool
```

### Adicionar comentário
```bash
curl -s -X POST "http://localhost:8000/api/tickets/$TICKET_ID/comments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Técnico a caminho para verificar o problema",
    "is_internal": false
  }' | python3 -m json.tool
```

---

## 📊 2. Testando SLA

### Listar políticas de SLA
```bash
curl -s "http://localhost:8000/api/sla/" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

### Criar política de SLA
```bash
curl -s -X POST "http://localhost:8000/api/sla/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "SLA Prioritário",
    "description": "Para incidentes críticos",
    "priority": "P1_CRÍTICO",
    "response_time_hours": 1,
    "resolution_time_hours": 4
  }' | python3 -m json.tool
```

### Simular cálculo de horas úteis
```bash
# Testa o cálculo de 8 horas úteis a partir de uma data
curl -s -X POST "http://localhost:8000/api/sla/simulate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "calendar_id": null,
    "start": "2026-01-27T14:00:00",
    "hours": 8
  }' | python3 -m json.tool
```

### Recalcular status de SLA
```bash
curl -s -X POST "http://localhost:8000/api/sla/recalculate" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

---

## 💻 3. Testando Ativos (CMDB)

### Listar ativos
```bash
curl -s "http://localhost:8000/api/assets/?limit=10" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

### Criar novo ativo
```bash
curl -s -X POST "http://localhost:8000/api/assets/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Notebook Dell Latitude 5420",
    "asset_type": "HARDWARE",
    "model": "Latitude 5420",
    "manufacturer": "Dell",
    "serial_number": "SN123456789",
    "asset_tag": "NB-2026-001",
    "status": "EM_USO",
    "location": "Sala 305",
    "purchase_date": "2026-01-15"
  }' | python3 -m json.tool
```

### Buscar ativo específico
```bash
ASSET_ID="cole-aqui-o-id"
curl -s "http://localhost:8000/api/assets/$ASSET_ID" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

### Atualizar status do ativo
```bash
curl -s -X PATCH "http://localhost:8000/api/assets/$ASSET_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "MANUTENÇÃO"}' | python3 -m json.tool
```

---

## 📚 4. Testando Base de Conhecimento

### Listar categorias
```bash
curl -s "http://localhost:8000/api/knowledge/categories" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

### Criar categoria
```bash
curl -s -X POST "http://localhost:8000/api/knowledge/categories" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tutoriais Windows",
    "description": "Guias e tutoriais sobre Windows"
  }' | python3 -m json.tool
```

### Listar artigos
```bash
curl -s "http://localhost:8000/api/knowledge/articles?status=PUBLISHED" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

### Criar artigo
```bash
CATEGORY_ID="cole-aqui-o-id-da-categoria"
curl -s -X POST "http://localhost:8000/api/knowledge/articles" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "category_id": "'$CATEGORY_ID'",
    "title": "Como resetar senha do Windows",
    "content": "# Passo a Passo\n\n1. Acesse o menu Iniciar\n2. Clique em Configurações\n3. Vá em Contas...",
    "tags": ["windows", "senha", "tutorial"],
    "status": "PUBLISHED"
  }' | python3 -m json.tool
```

### Adicionar feedback em artigo
```bash
ARTICLE_ID="cole-aqui-o-id-do-artigo"
curl -s -X POST "http://localhost:8000/api/knowledge/articles/$ARTICLE_ID/feedback" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "is_helpful": true,
    "comment": "Muito útil, resolveu meu problema!"
  }' | python3 -m json.tool
```

---

## 🛍️ 5. Testando Catálogo de Serviços

### Listar categorias do catálogo
```bash
curl -s "http://localhost:8000/api/catalog/categories" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

### Criar categoria de serviço
```bash
curl -s -X POST "http://localhost:8000/api/catalog/categories" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acesso e Permissões",
    "description": "Solicitações relacionadas a acessos"
  }' | python3 -m json.tool
```

### Listar itens do catálogo
```bash
curl -s "http://localhost:8000/api/catalog/items" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

### Criar item de catálogo
```bash
CATALOG_CATEGORY_ID="cole-aqui-o-id"
curl -s -X POST "http://localhost:8000/api/catalog/items" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "category_id": "'$CATALOG_CATEGORY_ID'",
    "name": "Acesso à rede WiFi",
    "description": "Solicitar credenciais para rede WiFi",
    "sla_id": null,
    "requires_approval": true,
    "approval_levels": 1
  }' | python3 -m json.tool
```

### Criar requisição de serviço
```bash
SERVICE_ITEM_ID="cole-aqui-o-id-do-item"
curl -s -X POST "http://localhost:8000/api/catalog/requests" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "service_item_id": "'$SERVICE_ITEM_ID'",
    "description": "Necessito acesso WiFi para trabalho remoto",
    "fields_data": {"motivo": "Home office", "departamento": "TI"}
  }' | python3 -m json.tool
```

---

## ✅ 6. Testando Aprovações

### Listar aprovações pendentes
```bash
curl -s "http://localhost:8000/api/approvals/?status=PENDENTE" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

### Aprovar/Rejeitar uma aprovação
```bash
APPROVAL_ID="cole-aqui-o-id-da-aprovacao"
curl -s -X POST "http://localhost:8000/api/approvals/$APPROVAL_ID/decide" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "decision": "APROVADO",
    "comment": "Aprovado conforme política"
  }' | python3 -m json.tool
```

---

## 📊 7. Testando Dashboard

### Obter resumo geral
```bash
curl -s "http://localhost:8000/api/dashboard/summary/" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

### Resultados esperados:
```json
{
  "totals": {
    "tickets": 40,
    "assets": 8,
    "approvals": 3
  },
  "tickets_by_status": {
    "NOVO": 24,
    "EM_ANDAMENTO": 8,
    "RESOLVIDO": 8
  },
  "tickets_by_priority": {
    "P2_ALTO": 16,
    "P3_MÉDIO": 16,
    "P4_BAIXO": 8
  },
  "sla_distribution": {
    "OK": 40
  },
  "assets_by_type": {
    "HARDWARE": 1,
    "SOFTWARE": 2,
    "SERVIDOR": 1,
    "REDE": 2,
    "PERIFÉRICO": 2
  }
}
```

---

## 👥 8. Testando Usuários

### Listar usuários
```bash
curl -s "http://localhost:8000/api/users/?limit=10" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

### Buscar perfil atual
```bash
curl -s "http://localhost:8000/api/users/me" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

### Criar novo usuário
```bash
curl -s -X POST "http://localhost:8000/api/users/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "ldap_username": "joao.silva",
    "email": "joao.silva@coppead.ufrj.br",
    "full_name": "João Silva",
    "department": "TI",
    "is_active": true
  }' | python3 -m json.tool
```

---

## 🔧 9. Testando Health Checks

### Health do sistema
```bash
curl -s "http://localhost:8000/health" | python3 -m json.tool
```

### Informações do sistema
```bash
curl -s "http://localhost:8000/" | python3 -m json.tool
```

### Documentação OpenAPI
```bash
# Acesse no navegador
http://localhost:8000/docs
```

---

## 🧪 10. Testes de Carga

### Teste simples de múltiplas requisições
```bash
# Teste de 100 requisições ao endpoint de tickets
for i in {1..100}; do
  curl -s "http://localhost:8000/api/tickets/?limit=5" \
    -H "Authorization: Bearer $TOKEN" > /dev/null &
done
wait
echo "Teste de carga concluído!"
```

### Monitorar performance
```bash
# Em outro terminal, monitore o tempo de resposta
while true; do
  time curl -s "http://localhost:8000/health" > /dev/null
  sleep 1
done
```

---

## 🐛 11. Testes de Erros

### Teste sem autenticação (deve retornar 401)
```bash
curl -s "http://localhost:8000/api/tickets/" | python3 -m json.tool
```

### Teste com token inválido (deve retornar 401)
```bash
curl -s "http://localhost:8000/api/tickets/" \
  -H "Authorization: Bearer token-invalido" | python3 -m json.tool
```

### Teste criando ticket com dados inválidos (deve retornar 422)
```bash
curl -s -X POST "http://localhost:8000/api/tickets/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": ""}' | python3 -m json.tool
```

---

## 📝 12. Exportar Resultados

### Salvar tickets em arquivo
```bash
curl -s "http://localhost:8000/api/tickets/" \
  -H "Authorization: Bearer $TOKEN" > tickets.json
cat tickets.json | python3 -m json.tool
```

### Salvar dashboard
```bash
curl -s "http://localhost:8000/api/dashboard/summary/" \
  -H "Authorization: Bearer $TOKEN" > dashboard.json
cat dashboard.json | python3 -m json.tool
```

---

## ✅ Checklist de Testes

- [ ] Login funciona e retorna token JWT
- [ ] CRUD de tickets funcional
- [ ] SLA calcula horas úteis corretamente
- [ ] Ativos são criados e atualizados
- [ ] Base de conhecimento aceita artigos
- [ ] Catálogo de serviços cria requisições
- [ ] Aprovações multi-nível funcionam
- [ ] Dashboard retorna estatísticas corretas
- [ ] Health check retorna OK
- [ ] Erros retornam códigos HTTP apropriados
- [ ] Celery Worker está processando tarefas
- [ ] Celery Beat está agendando tarefas

---

## 🎯 Teste Completo Automatizado

```bash
# Execute o script de teste completo
/var/www/sistema_ti/backend/test_endpoints.sh
```

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs: `/tmp/uvicorn.log`, `/tmp/celery_worker.log`
2. Reinicie o sistema: `./stop_system.sh && ./start_system.sh`
3. Verifique containers Docker: `docker ps`
4. Valide banco de dados: `docker exec -it sistema_ti_db_1 psql -U itsm_user -d itsm`
