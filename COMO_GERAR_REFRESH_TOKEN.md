# Como Gerar/Atualizar Refresh Token do Google Ads

## ⚠️ IMPORTANTE: Não Precisa Redefinir Developer Token

O **Developer Token** que você viu na interface (`3SSe_6twJXO_pM3QSoSB4A`) está **CORRETO** e não precisa ser alterado.

O problema é com o **Refresh Token** (OAuth2), que é diferente e não aparece nessa interface.

## 🔑 Diferença Entre os Tokens

1. **Developer Token** (Token de Desenvolvedor):
   - ✅ Já está correto: `3SSe_6twJXO_pM3QSoSB4A`
   - Aparece na interface do Google Ads
   - Não precisa ser alterado

2. **Refresh Token** (OAuth2):
   - ❌ Está inválido (erro: `invalid_grant`)
   - Não aparece na interface do Google Ads
   - Precisa ser gerado via OAuth2

## 📋 Passo a Passo: Gerar Novo Refresh Token

### Opção 1: Via Google OAuth Playground (Mais Fácil)

1. **Acesse:** https://developers.google.com/oauthplayground/

2. **Configure:**
   - No canto superior direito, clique no ícone de engrenagem ⚙️
   - Marque: ✅ "Use your own OAuth credentials"
   - **OAuth Client ID:** `894419798314-kj5msqfhr4bdss15i8ne0ftftt4eokmc.apps.googleusercontent.com`
   - **OAuth Client secret:** `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`

3. **Selecione Escopo:**
   - No campo "Step 1", procure por: `Google Ads API`
   - Selecione: `https://www.googleapis.com/auth/adwords`
   - Clique em "Authorize APIs"

4. **Autorize:**
   - Faça login com a conta do Google Ads
   - Autorize o acesso

5. **Obtenha o Token:**
   - Clique em "Exchange authorization code for tokens"
   - Copie o **Refresh token** (será algo como: `4/0A...`)

6. **Atualize no Servidor:**
   ```bash
   ssh root@143.198.10.145
   cd /root/projeto-2026-estrutura
   nano .env
   # Encontre a linha: GOOGLE_ADS_REFRESH_TOKEN=
   # Substitua pelo novo token
   # Salve (Ctrl+O, Enter, Ctrl+X)
   pm2 restart sync-server --update-env
   ```

### Opção 2: Via Script Node.js (Alternativa)

Se preferir usar um script:

```bash
# Criar arquivo temporário
cat > /tmp/generate-refresh-token.js << 'EOF'
const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
  '894419798314-kj5msqfhr4bdss15i8ne0ftftt4eokmc.apps.googleusercontent.com',
  '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',
  'urn:ietf:wg:oauth:2.0:oob' // Redirect URI
);

const scopes = ['https://www.googleapis.com/auth/adwords'];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
});

console.log('Acesse esta URL e autorize:');
console.log(authUrl);
console.log('\nDepois, cole o código aqui e pressione Enter:');

// Ler código do usuário
process.stdin.once('data', async (code) => {
  const { tokens } = await oauth2Client.getToken(code.toString().trim());
  console.log('\n✅ Refresh Token gerado:');
  console.log(tokens.refresh_token);
});
EOF

node /tmp/generate-refresh-token.js
```

## ✅ Após Gerar o Novo Refresh Token

1. **Atualizar no .env:**
   ```bash
   ssh root@143.198.10.145
   cd /root/projeto-2026-estrutura
   nano .env
   # Atualizar: GOOGLE_ADS_REFRESH_TOKEN=<novo_token_aqui>
   ```

2. **Reiniciar Servidor:**
   ```bash
   pm2 restart sync-server --update-env
   ```

3. **Testar:**
   ```bash
   curl -X POST 'http://localhost:3001/google-ads/sync' \
     -H 'Content-Type: application/json' \
     -d '{
       "customer_id": "591-659-0517",
       "date_from": "2026-01-12",
       "date_to": "2026-01-12"
     }'
   ```

## 🎯 Resumo

- ✅ **Developer Token:** Não precisa alterar (já está correto)
- ⚠️ **Refresh Token:** Precisa gerar novo via OAuth2
- 📝 **Método recomendado:** Google OAuth Playground (Opção 1)

## ⏱️ Tempo Estimado

- Gerar Refresh Token: 5-10 minutos
- Atualizar e testar: 2-3 minutos
- **Total:** ~15 minutos


