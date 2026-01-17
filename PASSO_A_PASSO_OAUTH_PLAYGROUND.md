# Passo a Passo: OAuth Playground

## ✅ Projeto Confirmado!

- **Projeto:** SoliciteRapido-API 2
- **Client ID:** `894419798314-kj5msqfhr4bdss15i8ne0ftftt4eokmc.apps.googleusercontent.com`
- **Client Secret:** `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` ✅

## 🎯 Passo a Passo Completo

### 1. Acessar o OAuth Playground

**URL:** https://developers.google.com/oauthplayground

### 2. Configurar Credenciais (CRÍTICO - FAZER PRIMEIRO!)

1. **Clique no ícone de engrenagem** ⚙️ (canto superior direito)
2. **Marque a opção:** ✅ **"Use your own OAuth credentials"**
3. **Cole EXATAMENTE:**
   - **OAuth Client ID:**
     ```
     894419798314-kj5msqfhr4bdss15i8ne0ftftt4eokmc.apps.googleusercontent.com
     ```
   - **OAuth Client secret:**
     ```
     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
     ```
4. **Clique em "Close"**

### 3. Limpar o Playground

- **Clique no "X"** ao lado de "OAuth 2.0 Playground" (no topo)
- Isso limpa tudo e começa do zero

### 4. Step 1 - Autorizar APIs

1. Expanda **"Step 1 Select & authorize APIs"**
2. No campo de busca, digite: `Google Ads API`
3. Selecione: `https://www.googleapis.com/auth/adwords`
4. Clique em **"Authorize APIs"**
5. Faça login com sua conta do Google Ads
6. Clique em **"Allow"** para autorizar

### 5. Step 2 - Obter Refresh Token

1. Vá para **"Step 2 Exchange authorization code for tokens"**
2. O authorization code já estará preenchido (gerado no Step 1)
3. Clique em **"Exchange authorization code for tokens"**
4. **Copie o Refresh Token** que aparecerá no campo abaixo

### 6. Enviar o Token

Envie o Refresh Token completo aqui para eu atualizar no servidor!

## ⚠️ IMPORTANTE

**A ordem é CRÍTICA:**
1. ⚙️ Configurar credenciais PRIMEIRO
2. 🧹 Limpar playground
3. 📋 Fazer Step 1
4. ✅ Fazer Step 2
5. 📋 Copiar Refresh Token

**Se você fizer Step 1 ANTES de configurar as credenciais, o token não funcionará!**

## 🔍 Como Saber se Está Correto?

- ✅ Se você configurou as credenciais ANTES do Step 1
- ✅ O Refresh Token funcionará
- ✅ Não terá erro "unauthorized_client"

## 📝 Checklist

Antes de gerar o Refresh Token, confirme:

- [ ] Cliquei no ícone de engrenagem ⚙️
- [ ] Marquei "Use your own OAuth credentials"
- [ ] Colei o Client ID correto
- [ ] Colei o Client Secret correto
- [ ] Cliquei em "Close"
- [ ] Limpei o playground (botão X)
- [ ] Fiz Step 1 com essas credenciais
- [ ] Fiz Step 2 e obtive o Refresh Token


