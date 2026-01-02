# 🚀 Guia de Deploy - Portal Certidão

## ✅ Status: PRONTO PARA DEPLOY

Tudo está configurado e buildado. Siga os passos abaixo para fazer o deploy no servidor.

---

## 📋 Resumo do que foi Preparado

### ✅ Configurações
- ✅ `.env` (Sync-Server) - Todas as variáveis configuradas
- ✅ `PORTAL/.env.local` - Configurado com Pagar.me e domínios
- ✅ `PLATAFORMA/.env.local` - Configurado
- ✅ `SOLICITE LINK/.env.local` - Configurado

### ✅ Builds de Produção
- ✅ `PORTAL/dist/` - Buildado e pronto
- ✅ `PLATAFORMA/dist/` - Buildado e pronto
- ✅ `SOLICITE LINK/dist/` - Buildado e pronto

### ✅ Scripts de Deploy
- ✅ `scripts/deploy.sh` - Preparação do servidor
- ✅ `scripts/configure-nginx.sh` - Configuração do Nginx
- ✅ `scripts/configure-ssl.sh` - Configuração SSL/HTTPS
- ✅ `scripts/start-services.sh` - Iniciar serviços
- ✅ `scripts/upload-files.sh` - Upload dos arquivos (executar localmente)

### ✅ Documentação
- ✅ `DEPLOY.md` - Guia completo
- ✅ `DEPLOY_RAPIDO.md` - Deploy rápido passo a passo
- ✅ `GUIA_PROXIMOS_PASSOS.md` - Guia detalhado
- ✅ `CHECKLIST_DEPLOY_FINAL.md` - Checklist completo
- ✅ `INTEGRACAO_PAGARME_RESUMO.md` - Resumo da integração

---

## 🚀 Deploy Rápido (3 Passos)

### 1. No Servidor: Preparar Ambiente
```bash
ssh usuario@143.198.10.145
cd /var/www
git clone <seu-repositorio> portal-certidao
cd portal-certidao
bash scripts/deploy.sh
```

### 2. Do Seu Computador: Upload dos Arquivos
```bash
# Edite scripts/upload-files.sh e configure SERVER_USER
bash scripts/upload-files.sh
```

### 3. No Servidor: Configurar e Iniciar
```bash
sudo bash scripts/configure-nginx.sh
sudo bash scripts/configure-ssl.sh
bash scripts/start-services.sh
```

### 4. Configurar Webhook Pagar.me
1. Acesse: https://dashboard.pagar.me
2. Configurações > Webhooks
3. URL: `https://api.portalcertidao.org/webhooks/pagarme`
4. Eventos: `transaction.paid`, `transaction.refunded`

---

## 📝 Informações Importantes

### API Key
```
6071d071d03a7a595ab3c1cd3477404f68995bfc3c030ff09065a80c2f96d59c
```

### Domínios
- **SOLICITE LINK**: www.solicite.link
- **PORTAL**: www.portalcertidao.org
- **PLATAFORMA**: plataforma.portalcertidao.org
- **API**: api.portalcertidao.org

### IP do Servidor
```
143.198.10.145
```

---

## 📚 Documentação Completa

Para instruções detalhadas, consulte:
- **`DEPLOY_RAPIDO.md`** - Deploy rápido passo a passo
- **`DEPLOY.md`** - Guia completo com todas as opções
- **`CHECKLIST_DEPLOY_FINAL.md`** - Checklist completo para seguir

---

## ✅ Próximo Passo

**Conecte-se ao servidor e execute o `scripts/deploy.sh`**

Boa sorte com o deploy! 🚀


