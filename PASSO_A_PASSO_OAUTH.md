# Passo a Passo: Gerar Refresh Token no OAuth Playground

## ⚠️ Você está no Step 2, mas precisa fazer o Step 1 primeiro!

O erro "invalid_grant" acontece porque o authorization code não foi gerado corretamente.

## 🔧 Solução: Fazer do início

### 1. Configure suas credenciais PRIMEIRO

**ANTES de fazer qualquer coisa:**

1. Clique no **ícone de engrenagem** ⚙️ (canto superior direito)
2. Marque: ✅ **"Use your own OAuth credentials"**
3. Cole suas credenciais:
   - **OAuth Client ID:** `894419798314-kj5msqfhr4bdss15i8ne0ftftt4eokmc.apps.googleusercontent.com`
   - **OAuth Client secret:** `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`
4. Clique em **"Close"**

### 2. Step 1: Select & authorize APIs

1. Expanda o **"Step 1 Select & authorize APIs"** (clique na seta)
2. No campo de busca, digite: `Google Ads API`
3. Selecione: `https://www.googleapis.com/auth/adwords`
4. Clique em **"Authorize APIs"**
5. Faça login com sua conta do Google Ads
6. Clique em **"Allow"** para autorizar

### 3. Step 2: Exchange authorization code for tokens

1. Agora sim, vá para o **"Step 2"**
2. O authorization code já estará preenchido automaticamente
3. Clique em **"Exchange authorization code for tokens"**
4. **Refresh token** aparecerá no campo abaixo
5. **Copie esse Refresh Token** (será algo como: `4/0A...`)

### 4. Atualizar no servidor

```bash
ssh root@143.198.10.145
cd /root/projeto-2026-estrutura
nano .env
# Encontre: GOOGLE_ADS_REFRESH_TOKEN=
# Cole o novo token (substitua o antigo)
# Salve: Ctrl+O, Enter, Ctrl+X
pm2 restart sync-server --update-env
```

## ✅ Checklist

- [ ] Configurei minhas credenciais OAuth (ícone ⚙️)
- [ ] Fiz o Step 1 e autorizei o Google Ads API
- [ ] Fiz o Step 2 e obtive o Refresh Token
- [ ] Atualizei no .env do servidor
- [ ] Reiniciei o servidor

## 🎯 Importante

**NÃO use o authorization code que já estava lá!**

Ele foi gerado com as credenciais padrão do Playground e não funciona com suas credenciais.

Você precisa:
1. ✅ Configurar SUAS credenciais primeiro
2. ✅ Fazer o Step 1 novamente
3. ✅ Depois fazer o Step 2


