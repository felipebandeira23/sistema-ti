# 🚀 COMO FAZER PUSH PARA GITHUB - GUIA RÁPIDO

## Passo 1: Criar Repositório no GitHub

1. Abra https://github.com/new
2. Preencha assim:
   - **Nome**: `sistema-ti`
   - **Descrição**: Sistema de Gerenciamento de TI (ITSM) para COPPEAD
   - **Privacidade**: Escolha (Público ou Privado)
3. Clique em **"Create repository"**
4. Copie a URL que aparece (será algo como: `https://github.com/felipebandeira23/sistema-ti.git`)

## Passo 2: Fazer o Push (Escolha Uma Opção)

### ✨ OPÇÃO RÁPIDA (Recomendada)

```bash
cd /var/www/sistema_ti
bash deploy-github.sh
```

O script fará tudo automaticamente. É só responder as perguntas!

### 🔧 OPÇÃO MANUAL

Se preferir fazer manualmente, execute estes comandos:

```bash
cd /var/www/sistema_ti

# Substitua a URL pela que você copiou no GitHub
git remote add origin https://github.com/felipebandeira23/sistema-ti.git

# Renomear branch para main (padrão novo do GitHub)
git branch -M main

# Fazer o push
git push -u origin main
```

## Passo 3: Pronto! 🎉

Seu projeto agora está no GitHub! Você pode:

```bash
# Ver o histórico
git log --oneline

# Atualizar com a versão mais recente do GitHub
git pull origin main

# Fazer mudanças e enviar novamente
git add .
git commit -m "Descrição das mudanças"
git push origin main
```

## 📱 Usar em Casa

Depois que o repositório estiver no GitHub:

```bash
# Clonar o projeto
git clone https://github.com/felipebandeira23/sistema-ti.git
cd sistema-ti

# Instalar dependências
pip install -r backend/requirements.txt
npm install --prefix frontend

# Subir o Docker
docker-compose up -d

# Acessar
# Frontend: http://localhost:3000
# API: http://localhost:8000
# Docs: http://localhost:8000/docs
```

## ❓ Dúvidas Frequentes

### Erro: "Repository already exists"
Significa que você já criou o repositório. Continuar normalmente.

### Erro: "fatal: remote already exists"
Execute primeiro: `git remote remove origin`
Depois configure novamente.

### Preciso de ajuda?
- Veja GUIA_GITHUB.md para instruções completas
- Veja RESUMO_FINAL.md para checklist
- Leia README.md para entender o projeto

---

**Tudo pronto! É só executar o script e seu projeto estará no GitHub! 🚀**
