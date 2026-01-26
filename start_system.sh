#!/bin/bash
# Script de Inicialização do Sistema ITSM COPPEAD
# Uso: ./start_system.sh

set -e

echo "🚀 Iniciando Sistema ITSM COPPEAD..."
echo "===================================="

# Diretórios
BACKEND_DIR="/var/www/sistema_ti/backend"
VENV_PATH="/var/www/sistema_ti/venv"

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Função para verificar se processo está rodando
check_process() {
    if ps aux | grep -v grep | grep -q "$1"; then
        return 0
    else
        return 1
    fi
}

# 1. Verificar containers Docker
echo ""
echo "📦 Verificando containers Docker..."
if docker ps | grep -q "sistema_ti_db_1"; then
    echo -e "${GREEN}✓${NC} PostgreSQL rodando"
else
    echo -e "${YELLOW}⚠${NC} PostgreSQL não encontrado. Iniciando..."
    docker-compose -f /var/www/sistema_ti/docker-compose.yml up -d db
    sleep 5
fi

if docker ps | grep -q "sistema_ti_redis_1"; then
    echo -e "${GREEN}✓${NC} Redis rodando"
else
    echo -e "${YELLOW}⚠${NC} Redis não encontrado. Iniciando..."
    docker-compose -f /var/www/sistema_ti/docker-compose.yml up -d redis
    sleep 3
fi

# 2. Verificar migrations
echo ""
echo "🗃️  Verificando migrations..."
cd "$BACKEND_DIR"
$VENV_PATH/bin/alembic -c alembic.ini current > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Migrations aplicadas"
else
    echo -e "${YELLOW}⚠${NC} Aplicando migrations..."
    $VENV_PATH/bin/alembic -c alembic.ini upgrade head
fi

# 3. Backend (Uvicorn)
echo ""
echo "🌐 Verificando Backend (FastAPI)..."
if check_process "uvicorn.*app.main:app.*8000"; then
    echo -e "${GREEN}✓${NC} Backend já está rodando"
else
    echo -e "${YELLOW}⚠${NC} Iniciando Backend..."
    cd "$BACKEND_DIR"
    $VENV_PATH/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 > /tmp/uvicorn.log 2>&1 &
    sleep 3
    
    if check_process "uvicorn.*app.main:app.*8000"; then
        echo -e "${GREEN}✓${NC} Backend iniciado com sucesso"
    else
        echo -e "${RED}✗${NC} Falha ao iniciar backend. Verifique /tmp/uvicorn.log"
        exit 1
    fi
fi

# 4. Celery Worker
echo ""
echo "⚙️  Verificando Celery Worker..."
if check_process "celery.*worker"; then
    echo -e "${GREEN}✓${NC} Celery Worker já está rodando"
else
    echo -e "${YELLOW}⚠${NC} Iniciando Celery Worker..."
    cd "$BACKEND_DIR"
    $VENV_PATH/bin/celery -A app.tasks.celery_app worker --loglevel=info > /tmp/celery_worker.log 2>&1 &
    sleep 3
    
    if check_process "celery.*worker"; then
        echo -e "${GREEN}✓${NC} Celery Worker iniciado"
    else
        echo -e "${RED}✗${NC} Falha ao iniciar worker. Verifique /tmp/celery_worker.log"
    fi
fi

# 5. Celery Beat
echo ""
echo "⏰ Verificando Celery Beat..."
if check_process "celery.*beat"; then
    echo -e "${GREEN}✓${NC} Celery Beat já está rodando"
else
    echo -e "${YELLOW}⚠${NC} Iniciando Celery Beat..."
    cd "$BACKEND_DIR"
    $VENV_PATH/bin/celery -A app.tasks.celery_app beat --loglevel=info > /tmp/celery_beat.log 2>&1 &
    sleep 2
    
    if check_process "celery.*beat"; then
        echo -e "${GREEN}✓${NC} Celery Beat iniciado"
    else
        echo -e "${RED}✗${NC} Falha ao iniciar beat. Verifique /tmp/celery_beat.log"
    fi
fi

# 6. Teste de conectividade
echo ""
echo "🔍 Testando conectividade..."
sleep 2
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓${NC} Backend respondendo (HTTP $HTTP_CODE)"
else
    echo -e "${RED}✗${NC} Backend não respondeu corretamente (HTTP $HTTP_CODE)"
fi

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓${NC} Health check OK"
else
    echo -e "${YELLOW}⚠${NC} Health check falhou"
fi

# Resumo
echo ""
echo "===================================="
echo -e "${GREEN}✅ Sistema ITSM iniciado com sucesso!${NC}"
echo ""
echo "📋 Informações:"
echo "  • Backend API: http://localhost:8000"
echo "  • Documentação: http://localhost:8000/docs"
echo "  • Health Check: http://localhost:8000/health"
echo ""
echo "🔑 Credenciais padrão:"
echo "  • Username: admin"
echo "  • Password: admin123"
echo ""
echo "📊 Processos ativos:"
ps aux | grep -E "(uvicorn|celery)" | grep -v grep | awk '{print "  •", $11, $12, $13}'
echo ""
echo "📝 Logs disponíveis em:"
echo "  • Backend: /tmp/uvicorn.log"
echo "  • Worker: /tmp/celery_worker.log"
echo "  • Beat: /tmp/celery_beat.log"
echo ""
echo "🛑 Para parar o sistema, use: ./stop_system.sh"
