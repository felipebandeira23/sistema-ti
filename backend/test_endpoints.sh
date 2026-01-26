#!/bin/bash
# Script para testar os endpoints principais do sistema ITSM

BASE_URL="http://localhost:8000"
TOKEN=""

echo "=== Teste de Endpoints - Sistema ITSM COPPEAD ==="/

echo -e "\n1. Testando endpoint raiz..."
curl -s "$BASE_URL/" | python3 -m json.tool

echo -e "\n\n2. Testando health check..."
curl -s "$BASE_URL/health" | python3 -m json.tool

echo -e "\n\n3. Testando login (admin)..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}')
echo "$LOGIN_RESPONSE" | python3 -m json.tool
TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('token', {}).get('access_token', '') if 'token' in data else data.get('access_token', ''))")

if [ -z "$TOKEN" ]; then
  echo "Erro: Não foi possível obter token de acesso"
  exit 1
fi
echo "✓ Token obtido com sucesso!"

echo -e "\n\n4. Testando listagem de tickets..."
curl -s "$BASE_URL/api/tickets" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool | head -50

echo -e "\n\n5. Testando listagem de ativos..."
curl -s "$BASE_URL/api/assets?limit=5" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool | head -50

echo -e "\n\n6. Testando listagem de SLAs..."
curl -s "$BASE_URL/api/sla" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool | head -50

echo -e "\n\n7. Testando dashboard..."
curl -s "$BASE_URL/api/dashboard/summary" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

echo -e "\n\n=== Testes finalizados com sucesso! ==="
