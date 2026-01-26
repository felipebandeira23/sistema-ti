#!/bin/bash
# Script para Parar o Sistema ITSM COPPEAD
# Uso: ./stop_system.sh

echo "🛑 Parando Sistema ITSM COPPEAD..."
echo "===================================="

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Parar Celery Beat
echo ""
echo "⏰ Parando Celery Beat..."
if pkill -f "celery.*beat"; then
    echo -e "${GREEN}✓${NC} Celery Beat parado"
else
    echo -e "${YELLOW}⚠${NC} Celery Beat não estava rodando"
fi

# 2. Parar Celery Worker
echo ""
echo "⚙️  Parando Celery Worker..."
if pkill -f "celery.*worker"; then
    echo -e "${GREEN}✓${NC} Celery Worker parado"
    sleep 2
else
    echo -e "${YELLOW}⚠${NC} Celery Worker não estava rodando"
fi

# 3. Parar Backend (Uvicorn)
echo ""
echo "🌐 Parando Backend..."
if pkill -f "uvicorn.*app.main:app"; then
    echo -e "${GREEN}✓${NC} Backend parado"
else
    echo -e "${YELLOW}⚠${NC} Backend não estava rodando"
fi

# 4. Opcionalmente parar containers Docker (comentado por padrão)
# echo ""
# echo "📦 Parando containers Docker..."
# docker-compose -f /var/www/sistema_ti/docker-compose.yml down

# Resumo
echo ""
echo "===================================="
echo -e "${GREEN}✅ Sistema ITSM parado com sucesso!${NC}"
echo ""
echo "Para reiniciar: ./start_system.sh"
