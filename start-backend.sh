#!/bin/bash

# Script de inicialização do Backend - COPPEAD ITSM
# Ativa o ambiente virtual e inicia o servidor FastAPI

cd "$(dirname "$0")/backend"

echo "🚀 Iniciando COPPEAD ITSM Backend..."
echo ""

# Ativar ambiente virtual
source ../venv/bin/activate

# Verificar se o banco está rodando
if ! sudo docker ps | grep -q sistema_ti_db; then
    echo "⚠️  Banco de dados não está rodando. Iniciando..."
    cd ..
    sudo docker-compose up -d db redis
    cd backend
    echo "⏳ Aguardando banco de dados inicializar..."
    sleep 5
fi

echo "✅ Banco de dados conectado"
echo ""
echo "📡 Servidor rodando em:"
echo "   - API: http://localhost:8000"
echo "   - Documentação: http://localhost:8000/docs"
echo "   - Health Check: http://localhost:8000/health"
echo ""
echo "Pressione CTRL+C para parar o servidor"
echo ""

# Iniciar servidor
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
