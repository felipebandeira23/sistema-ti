#!/bin/bash
# Script rápido para fazer push para o GitHub
# Use como: bash deploy-github.sh

echo "🚀 Script de Deploy para GitHub"
echo "================================"
echo ""

# Verificar se git está inicializado
if [ ! -d .git ]; then
    echo "❌ Erro: Não é um repositório git"
    exit 1
fi

echo "✅ Repositório git configurado"
echo ""

# Solicitar informações
read -p "📝 Entre com seu usuário GitHub (ex: felipebandeira23): " github_user
read -p "📝 Entre com o nome do repositório (ex: sistema-ti): " repo_name

echo ""
echo "🔗 URL do repositório: https://github.com/$github_user/$repo_name.git"
echo ""

# Confirmar
read -p "Deseja continuar? (s/n): " confirm
if [ "$confirm" != "s" ]; then
    echo "❌ Operação cancelada"
    exit 1
fi

echo ""
echo "⏳ Configurando remoto..."

# Adicionar remote
git remote remove origin 2>/dev/null || true
git remote add origin "https://github.com/$github_user/$repo_name.git"

echo "✅ Remote configurado!"
echo ""

# Renomear branch para main
echo "⏳ Renomeando branch para 'main'..."
git branch -M main

echo "✅ Branch renomeado!"
echo ""

# Fazer push
echo "⏳ Fazendo push para GitHub..."
echo "   (Você pode ser solicitado a entrar com suas credenciais)"
echo ""

git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ ✅ ✅ SUCESSO! Projeto enviado para GitHub! ✅ ✅ ✅"
    echo ""
    echo "📍 URL do repositório:"
    echo "   https://github.com/$github_user/$repo_name"
    echo ""
    echo "🎯 Próximos passos:"
    echo "   1. Configure protections na branch 'main' (Settings → Branches)"
    echo "   2. Habilite Issues e Discussions (Settings → General)"
    echo "   3. Adicione colaboradores se necessário (Settings → Collaborators)"
    echo "   4. Configure secrets para CI/CD (Settings → Secrets)"
    echo ""
else
    echo ""
    echo "❌ Erro ao fazer push!"
    echo "   Verifique suas credenciais e tente novamente"
    echo ""
    echo "💡 Dicas:"
    echo "   - Se usar HTTPS, gere um Personal Access Token em:"
    echo "     https://github.com/settings/tokens"
    echo "   - Se usar SSH, certifique-se de ter configurado sua chave"
    exit 1
fi
