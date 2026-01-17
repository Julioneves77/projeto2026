# ⚠️ DEPLOY URGENTE: Código de utm_campaign Não Está em Produção

## 🔴 Problema Identificado

No Preview Mode, a variável `DLV - utm_campaign` está retornando `undefined`, mesmo com `utm_campaign=teste_conta_1` na URL.

**Isso significa que o código que implementamos ainda não está em produção!**

---

## ✅ Solução: Fazer Deploy Agora

### Passo 1: Fazer Build do SOLICITE LINK

```bash
cd "SOLICITE LINK"
npm run build
```

### Passo 2: Fazer Upload para Produção

```bash
# Voltar para raiz do projeto
cd ..

# Fazer upload do build
rsync -avz --delete -e "ssh -o StrictHostKeyChecking=no" "SOLICITE LINK/dist/" root@143.198.10.145:/var/www/solicite-link/dist/
```

### Passo 3: Verificar no Servidor

```bash
ssh root@143.198.10.145 "ls -la /var/www/solicite-link/dist/assets/ | head -5"
```

---

## 🧪 Após o Deploy, Testar Novamente

1. **Limpar cache do navegador** (Ctrl+Shift+Delete)
2. **Abrir Preview Mode novamente**
3. **Acessar:** `https://solicite.link?utm_campaign=teste_conta_1`
4. **Verificar:**
   - `DLV - utm_campaign` deve mostrar: `teste_conta_1` ✅
   - `google_ads_account` deve mostrar: `591-659-0517` ✅

---

## 📋 O Que Foi Implementado (mas não está em produção ainda)

- ✅ Função `getUtmCampaign()` para capturar utm_campaign
- ✅ `pushDL()` inclui utm_campaign automaticamente
- ✅ `addFunnelIdToUrl()` preserva utm_campaign na URL
- ✅ EventProxy e Obrigado incluem utm_campaign nos eventos

**Mas isso só funciona se o código estiver em produção!**

---

## 🚀 Comando Rápido para Deploy

Execute este comando na raiz do projeto:

```bash
cd "SOLICITE LINK" && npm run build && cd .. && rsync -avz --delete -e "ssh -o StrictHostKeyChecking=no" "SOLICITE LINK/dist/" root@143.198.10.145:/var/www/solicite-link/dist/
```

---

**⚠️ IMPORTANTE: Após o deploy, aguarde alguns minutos e teste novamente no Preview Mode!**

