# 🎯 Instruções Finais - O que Você Precisa Fazer

## ✅ O que JÁ ESTÁ PRONTO (Eu fiz)

- ✅ Todos os arquivos `.env` e `.env.local` configurados
- ✅ Builds de produção concluídos (PORTAL, PLATAFORMA, SOLICITE LINK)
- ✅ Scripts de deploy criados
- ✅ Documentação completa
- ✅ Integração Pagar.me implementada
- ✅ Webhook endpoint criado

---

## 📋 O que VOCÊ PRECISA FAZER

### 1. Conectar ao Servidor e Executar Comandos

**Arquivo com todos os comandos prontos**: `COMANDOS_PARA_COPIAR_COLAR.md`

Siga na ordem:
1. Conectar ao servidor
2. Preparar ambiente
3. Fazer upload dos arquivos (do seu computador)
4. Configurar Nginx
5. Configurar SSL
6. Iniciar sync-server
7. Configurar webhook no Pagar.me

---

### 2. Upload dos Arquivos

**Execute do SEU COMPUTADOR** (não no servidor):

```bash
cd "/Users/juliocesarnevesdesouza/Desktop/PROJETO 2026 ESTRUTURA"

# Substitua 'usuario' pelo seu usuário SSH
scp -r PORTAL/dist/* usuario@143.198.10.145:/var/www/portal/dist/
scp -r PLATAFORMA/dist/* usuario@143.198.10.145:/var/www/plataforma/dist/
scp -r "SOLICITE LINK/dist/"* usuario@143.198.10.145:/var/www/solicite-link/dist/
scp sync-server.js usuario@143.198.10.145:/var/www/portal-certidao/
scp -r services usuario@143.198.10.145:/var/www/portal-certidao/
scp -r utils usuario@143.198.10.145:/var/www/portal-certidao/
scp package.json usuario@143.198.10.145:/var/www/portal-certidao/
scp .env usuario@143.198.10.145:/var/www/portal-certidao/
scp ecosystem.config.js usuario@143.198.10.145:/var/www/portal-certidao/
```

---

### 3. Configurar Webhook no Pagar.me

**Faça manualmente** (não posso fazer isso):

1. Acesse: https://dashboard.pagar.me
2. Login com suas credenciais
3. Vá em **Configurações** > **Webhooks**
4. Clique em **Adicionar Webhook** ou **Novo Webhook**
5. Configure:
   - **URL**: `https://api.portalcertidao.org/webhooks/pagarme`
   - **Eventos**: `transaction.paid` e `transaction.refunded`
   - **Método**: POST
6. Salve

---

## 📚 Arquivos de Referência

- **`COMANDOS_PARA_COPIAR_COLAR.md`** ⭐ - TODOS os comandos prontos para copiar/colar
- **`DEPLOY_RAPIDO.md`** - Deploy rápido passo a passo
- **`CHECKLIST_DEPLOY_FINAL.md`** - Checklist completo
- **`README_DEPLOY.md`** - Guia principal

---

## 🎯 Resumo

**Eu fiz**: Tudo que é possível fazer localmente ✅

**Você precisa fazer**:
1. Conectar ao servidor
2. Copiar/colar comandos do `COMANDOS_PARA_COPIAR_COLAR.md`
3. Fazer upload dos arquivos
4. Configurar webhook no Pagar.me

---

## 🚀 Comece Agora!

Abra o arquivo **`COMANDOS_PARA_COPIAR_COLAR.md`** e siga os passos na ordem.

Boa sorte! 🎉




