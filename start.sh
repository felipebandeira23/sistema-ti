#!/bin/bash

# Script de inicialização rápida do projeto COPPEAD ITSM

echo "🚀 Iniciando COPPEAD ITSM..."

# Verificar Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não instalado. Instale em: https://docs.docker.com/install/"
    exit 1
fi

# Configurar .env
if [ ! -f backend/.env ]; then
    echo "📝 Criando arquivo .env..."
    cp backend/.env.example backend/.env
    echo "⚠️  Edite backend/.env com suas credenciais antes de continuar"
fi

# Criar volumes
docker volume create postgres_data 2>/dev/null
docker volume create redis_data 2>/dev/null

# Subi serviços
echo "🐳 Subindo containers..."
docker-compose up -d

# Aguardar DB pronto
echo "⏳ Aguardando banco de dados..."
for i in {1..30}; do
    if docker-compose exec -T db pg_isready -U itsm_user >/dev/null 2>&1; then
        echo "✓ Banco pronto"
        break
    fi
    sleep 1
done

# Iniciar aplicação
echo "✅ COPPEAD ITSM iniciado!"
echo ""
echo "📍 Acessos:"
echo "   - API: http://localhost:8000"
echo "   - Swagger Docs: http://localhost:8000/docs"
echo "   - Health: http://localhost:8000/health"
echo ""
echo "📋 Próximos passos:"
echo "   1. Verifique logs: docker-compose logs -f api"
echo "   2. Acesse http://localhost:8000/docs para testar endpoints"
echo "   3. Configure suas credenciais LDAP em backend/.env"
echo ""
