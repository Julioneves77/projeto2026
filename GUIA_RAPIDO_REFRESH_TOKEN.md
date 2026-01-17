# Guia Rápido: Corrigir Google Ads

## ✅ O que NÃO precisa fazer

**NÃO precisa redefinir o Developer Token!**

O Developer Token que você viu (`3SSe_6twJXO_pM3QSoSB4A`) está **CORRETO** e funcionando.

## ⚠️ O que precisa fazer

Gerar um **novo Refresh Token** (OAuth2). Este é diferente do Developer Token e não aparece na interface do Google Ads.

## 🚀 Passo a Passo Rápido (5 minutos)

### 1. Acesse o OAuth Playground
https://developers.google.com/oauthplayground/

### 2. Configure suas credenciais
- Clique no ícone de **engrenagem** ⚙️ (canto superior direito)
- Marque: ✅ **"Use your own OAuth credentials"**
- Cole:
  - **OAuth Client ID:** `894419798314-kj5msqfhr4bdss15i8ne0ftftt4eokmc.apps.googleusercontent.com`
  - **OAuth Client secret:** `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`

### 3. Selecione o escopo
- No campo "Step 1", procure: `Google Ads API`
- Selecione: `https://www.googleapis.com/auth/adwords`
- Clique em **"Authorize APIs"**

### 4. Autorize
- Faça login com sua conta do Google Ads
- Clique em **"Allow"** para autorizar

### 5. Obtenha o Refresh Token
- Clique em **"Exchange authorization code for tokens"**
- Copie o **Refresh token** (será algo como: `4/0A...`)

### 6. Atualize no servidor
```bash
ssh root@143.198.10.145
cd /root/projeto-2026-estrutura
nano .env
# Encontre: GOOGLE_ADS_REFRESH_TOKEN=
# Cole o novo token
# Salve: Ctrl+O, Enter, Ctrl+X
pm2 restart sync-server --update-env
```

### 7. Teste
Após atualizar, o sistema estará funcionando!

## 📝 Resumo

- ✅ **Developer Token:** Já está correto, não mexa
- ⚠️ **Refresh Token:** Precisa gerar novo via OAuth Playground
- ⏱️ **Tempo:** ~5 minutos

## 🎯 Por que isso acontece?

O Refresh Token pode expirar ou ser revogado. Quando isso acontece, você precisa gerar um novo através do processo OAuth2. É normal e seguro fazer isso.


