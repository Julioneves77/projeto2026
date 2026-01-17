# Como Identificar o Projeto Correto do Google Cloud

## 🔍 Credenciais que Precisamos Encontrar

**Client ID:** `894419798314-kj5msqfhr4bdss15i8ne0ftftt4eokmc.apps.googleusercontent.com`

**Client Secret:** `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`

## 📋 Passo a Passo para Encontrar o Projeto

### Método 1: Buscar pelo Client ID

1. **Acesse:** https://console.cloud.google.com/

2. **Vá em:** "APIs & Services" > "Credentials"

3. **Procure na lista** de "OAuth 2.0 Client IDs"

4. **Encontre o Client ID:** `894419798314-kj5msqfhr4bdss15i8ne0ftftt4eokmc`

5. **O projeto onde esse Client ID está é o CORRETO!**

### Método 2: Verificar em Cada Projeto

Se você tem vários projetos, verifique em cada um:

1. **Selecione um projeto** no dropdown (topo da página)

2. **Vá em:** "APIs & Services" > "Credentials"

3. **Procure por:**
   - Client ID que termina com: `kj5msqfhr4bdss15i8ne0ftftt4eokmc.apps.googleusercontent.com`
   - Client Secret que começa com: `GOCSPX-NZkx...`

4. **Se encontrar:** ✅ Esse é o projeto correto!

5. **Se não encontrar:** Tente o próximo projeto

### Método 3: Verificar pelo Nome do Cliente

Na imagem que você mostrou, vejo:
- **Nome:** "SoliciteRapidoAPI2-OAuthWeb"
- **Client ID:** `894419798314-kj5msqfhr4bdss15i8ne0ftftt4eokmc`

**Se esse Client ID corresponde ao que está no servidor, então:**
- ✅ Projeto: **"SoliciteRapido-API 2"** (ou similar)
- ✅ Esse é o projeto correto!

## ✅ Verificação Final

Para confirmar que é o projeto correto:

1. **Clique no Client ID** na lista
2. **Verifique:**
   - ✅ Client ID termina com: `kj5msqfhr4bdss15i8ne0ftftt4eokmc.apps.googleusercontent.com`
   - ✅ Client Secret começa com: `GOCSPX-NZkx...`
3. **Se ambos corresponderem:** ✅ Projeto correto!

## 🎯 Próximo Passo

Depois de identificar o projeto correto:

1. **Certifique-se** de estar nesse projeto no Google Cloud Console
2. **No OAuth Playground:**
   - Configure as credenciais desse projeto
   - Gere o Refresh Token
3. **Envie o Refresh Token** para atualizar no servidor

## ⚠️ Importante

O Refresh Token **DEVE** ser gerado com:
- ✅ O mesmo Client ID do servidor
- ✅ O mesmo Client Secret do servidor
- ✅ Do mesmo projeto do Google Cloud

Se você gerar o token em um projeto diferente, não funcionará!


