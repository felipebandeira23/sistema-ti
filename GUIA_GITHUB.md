# 📘 Guia de Push para GitHub

## ✅ Status Atual

O repositório local foi inicializado com sucesso e contém o commit inicial com **151 arquivos**.

```
Commit: 4d62c23
Autor: Felipe Bandeira (felipebandeira23@github.com)
Branch: master
```

## 🚀 Próximos Passos para Fazer o Push

### 1️⃣ Criar Repositório no GitHub

1. Acesse: https://github.com/new
2. Preencha os dados:
   - **Nome do repositório**: `Sistema-TI` ou `sistema-ti`
   - **Descrição**: "Sistema completo de Gerenciamento de TI (ITSM) para COPPEAD/UFRJ"
   - **Privacidade**: Escolha entre **Público** ou **Privado**
   - **Adicionar .gitignore**: Não (já temos um)
   - **Adicionar README**: Não (já temos um)
   - **Licença**: MIT (recomendado)

3. Clique em **"Create repository"**

### 2️⃣ Adicionar Remote e Fazer Push

Após criar o repositório, o GitHub fornecerá um link. Use os comandos abaixo:

```bash
# Adicionar o remote (substitua felipebandeira23 e sistema-ti pelos seus)
git remote add origin https://github.com/felipebandeira23/sistema-ti.git

# Renomear branch para 'main' (opcional, mas recomendado)
git branch -M main

# Fazer o push inicial
git push -u origin main
```

### 3️⃣ Verificar se Deu Certo

```bash
# Verificar os remotes configurados
git remote -v

# Deve mostrar algo como:
# origin  https://github.com/felipebandeira23/sistema-ti.git (fetch)
# origin  https://github.com/felipebandeira23/sistema-ti.git (push)
```

## 📦 Conteúdo que Será Enviado

```
Sistema-TI/
├── backend/                    (✅ 100% pronto)
│   ├── app/
│   │   ├── models/            - 17+ entidades ORM
│   │   ├── api/routes/        - 10 módulos ITSM
│   │   ├── services/          - Lógica de negócio
│   │   ├── tasks/             - Celery + Beat
│   │   └── core/              - Config, DB, Security
│   ├── alembic/               - Migrations
│   └── requirements.txt
├── frontend/                   (✅ 100% pronto)
│   ├── src/
│   │   ├── pages/             - 7 páginas principais
│   │   ├── components/        - Componentes reutilizáveis
│   │   ├── services/          - Cliente API
│   │   ├── stores/            - Estado global (Zustand)
│   │   ├── hooks/             - React Query + Hooks
│   │   └── types/             - TypeScript interfaces
│   └── package.json
├── infra/                      - Nginx + Docker
├── Documentos/                 - Especificação do projeto
├── docker-compose.yml          - Orquestração de serviços
└── README.md                   - Documentação completa
```

## 🔐 Autenticação GitHub (via SSH ou Token)

Se ainda não tem SSH configurado, use **Personal Access Token**:

1. Acesse: https://github.com/settings/tokens
2. Clique em **"Generate new token"** → **"Generate new token (classic)"**
3. Preencha:
   - **Note**: "Git Push from Server"
   - **Expiration**: 90 dias (ou conforme sua preferência)
   - **Scopes**: Marque ✅ `repo` (acesso completo a repositórios)
4. Copie o token gerado
5. Use como senha quando o git pedir

## 💡 Dicas

- **Renomear o branch**: É recomendado usar `main` em vez de `master`
- **Adicionar colaboradores**: Vá para Settings → Collaborators
- **Habilitar Issues**: Para rastrear bugs e features
- **Habilitar Discussions**: Para discussões sobre o projeto
- **Proteger a branch main**: Settings → Branches → Add rule

## 📱 Clonar em Casa

Depois que fazer o push, você poderá clonar em casa com:

```bash
git clone https://github.com/felipebandeira23/sistema-ti.git
cd sistema-ti
npm install --prefix frontend
pip install -r backend/requirements.txt
docker-compose up -d
```

## 🎯 Comandos Essenciais Daqui em Diante

```bash
# Atualizar local com remoto
git pull origin main

# Adicionar mudanças
git add .

# Fazer commit
git commit -m "Descrição das mudanças"

# Enviar para GitHub
git push origin main

# Ver histórico
git log --oneline

# Ver status
git status
```

## ❓ Problemas Comuns

### "fatal: 'origin' does not appear to be a 'git' repository"
**Solução**: Certifique-se de estar na pasta raiz do projeto (`/var/www/sistema_ti`)

### "Could not resolve host: github.com"
**Solução**: Verifique sua conexão com a internet

### "Permission denied (publickey)"
**Solução**: Configure SSH key ou use token de acesso

### "error: src refspec master does not match any remote tracking branch"
**Solução**: Use `git push -u origin main` em vez de `master`

---

**Próximo Passo**: Criar o repositório no GitHub e executar os comandos do item 2️⃣!

Para dúvidas, consulte: https://docs.github.com/pt/get-started
