# Como Adicionar Testador no OAuth App

## 🔴 Problema Identificado

O erro **"Erro 403: access_denied"** indica que:
- O app "SoliciteRapidoAPI 2" está em **modo de TESTE**
- Apenas **testadores aprovados** podem usar o app
- O email `sophiagillies064@gmail.com` precisa ser adicionado como testador

## ✅ Solução: Adicionar Email como Testador

### Passo 1: Acessar OAuth Consent Screen

1. **Acesse:** https://console.cloud.google.com/
2. **Selecione o projeto:** "SoliciteRapido-API 2"
3. **Vá em:** "APIs & Services" > "OAuth consent screen"

### Passo 2: Adicionar Test User

1. **Role até a seção:** "Test users"
2. **Clique em:** "+ ADD USERS" (ou "Adicionar usuários")
3. **Digite o email:** `sophiagillies064@gmail.com`
4. **Clique em:** "ADD" (ou "Adicionar")

### Passo 3: Verificar

- O email deve aparecer na lista de "Test users"
- Status deve ser "Active" ou "Ativo"

### Passo 4: Tentar Novamente no OAuth Playground

1. **Volte ao OAuth Playground:** https://developers.google.com/oauthplayground
2. **Configure credenciais** (se ainda não fez):
   - Clique no ícone ⚙️
   - Marque "Use your own OAuth credentials"
   - Cole Client ID e Client Secret
   - Clique em "Close"
3. **Limpe o playground** (botão X)
4. **Faça Step 1:**
   - Busque "Google Ads API"
   - Selecione `https://www.googleapis.com/auth/adwords`
   - Clique em "Authorize APIs"
   - **Agora deve funcionar sem erro 403!**
5. **Faça Step 2:**
   - Clique em "Exchange authorization code for tokens"
   - Copie o Refresh Token

## ⚠️ Importante

### Modo de Teste vs Produção

- **Modo de TESTE (atual):**
  - ✅ Funciona apenas para testadores adicionados
  - ✅ Não precisa de verificação completa do Google
  - ❌ Limitado a 100 usuários
  - ❌ Mostra aviso de "app não verificado"

- **Modo de PRODUÇÃO:**
  - ✅ Funciona para qualquer usuário
  - ✅ Não mostra aviso
  - ❌ Requer verificação completa do Google
  - ❌ Processo pode levar semanas

### Para Adicionar Mais Testadores

Se precisar adicionar mais emails:
1. Vá em "OAuth consent screen" > "Test users"
2. Clique em "+ ADD USERS"
3. Adicione os emails (um por linha ou separados por vírgula)
4. Clique em "ADD"

### Limite de Testadores

- Máximo de **100 testadores** no modo de teste
- Para mais usuários, precisa fazer verificação completa

## 🎯 Próximos Passos

Depois de adicionar o email como testador:

1. ✅ Volte ao OAuth Playground
2. ✅ Faça Step 1 novamente (deve funcionar agora!)
3. ✅ Faça Step 2 e gere o Refresh Token
4. ✅ Envie o Refresh Token aqui para atualizar no servidor

## 📝 Checklist

- [ ] Acessei "OAuth consent screen"
- [ ] Adicionei o email `sophiagillies064@gmail.com` como testador
- [ ] Email aparece na lista de testadores
- [ ] Voltei ao OAuth Playground
- [ ] Configurei credenciais no ícone ⚙️
- [ ] Limpei o playground (botão X)
- [ ] Fiz Step 1 (sem erro 403)
- [ ] Fiz Step 2 e gerei Refresh Token
- [ ] Enviei o Refresh Token aqui


