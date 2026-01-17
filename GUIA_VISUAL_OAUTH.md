# Guia Visual: Gerar Refresh Token Corretamente

## ⚠️ PROBLEMA ATUAL

O erro "unauthorized_client" significa que o Refresh Token foi gerado com credenciais **DIFERENTES** das que estão no servidor.

## ✅ SOLUÇÃO: Fazer TUDO do Zero

### Passo 1: Configurar Credenciais (CRÍTICO - FAZER PRIMEIRO!)

1. **Acesse:** https://developers.google.com/oauthplayground/

2. **Clique no ícone de engrenagem** ⚙️ (canto superior direito)

3. **Marque a opção:** ✅ **"Use your own OAuth credentials"**

4. **Cole EXATAMENTE estas credenciais:**
   ```
   OAuth Client ID:
   894419798314-kj5msqfhr4bdss15i8ne0ftftt4eokmc.apps.googleusercontent.com
   
   OAuth Client secret:
   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
   ```

5. **Clique em "Close"**

### Passo 2: Limpar o Playground

1. **Clique no "X"** ao lado de "OAuth 2.0 Playground" (no topo)
2. Isso limpa tudo e começa do zero

### Passo 3: Step 1 - Autorizar

1. Expanda **"Step 1 Select & authorize APIs"**
2. No campo de busca, digite: `Google Ads API`
3. Selecione: `https://www.googleapis.com/auth/adwords`
4. Clique em **"Authorize APIs"**
5. Faça login com sua conta do Google Ads
6. Clique em **"Allow"**

### Passo 4: Step 2 - Obter Refresh Token

1. Vá para **"Step 2 Exchange authorization code for tokens"**
2. O authorization code já estará preenchido (gerado no Step 1)
3. Clique em **"Exchange authorization code for tokens"**
4. **Copie o Refresh Token** que aparecerá no campo abaixo

### Passo 5: Enviar o Token

Envie o novo Refresh Token aqui para eu atualizar no servidor.

## 🔍 Como Saber se Está Correto?

**Se você configurou as credenciais próprias ANTES do Step 1:**
- ✅ O Refresh Token funcionará
- ✅ Não terá erro "unauthorized_client"

**Se você NÃO configurou as credenciais próprias:**
- ❌ O Refresh Token será gerado com credenciais padrão
- ❌ Terá erro "unauthorized_client"

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

## ⚠️ IMPORTANTE

**A ordem é CRÍTICA:**
1. ⚙️ Configurar credenciais PRIMEIRO
2. 🧹 Limpar playground
3. 📋 Fazer Step 1
4. ✅ Fazer Step 2
5. 📋 Copiar Refresh Token

Se você fizer Step 1 ANTES de configurar as credenciais, o token não funcionará!


