# Configuração Google Ads - Status e Próximos Passos

## ✅ O que está funcionando

1. **Coleta de Eventos do Funil**: ✅ FUNCIONANDO
   - Sistema coletando eventos normalmente
   - Banco de dados funcionando
   - Analytics calculando métricas

2. **Infraestrutura**: ✅ PRONTA
   - Endpoint `/google-ads/sync` existe
   - Banco de dados preparado para armazenar campanhas
   - Feature flag `ADS_SYNC_ENABLED=true` configurada

3. **Credenciais Configuradas**:
   - ✅ CLIENT_ID: Configurado
   - ✅ CLIENT_SECRET: Configurado
   - ✅ DEVELOPER_TOKEN: Configurado
   - ✅ CUSTOMER_ID: 591-659-0517
   - ⚠️ REFRESH_TOKEN: Erro "invalid_grant"

## ⚠️ Problema Identificado

**Erro:** `invalid_grant`

**Causa:** O Refresh Token pode estar:
- Expirado
- Revogado
- Inválido para o Client ID atual

## 🔧 Solução: Gerar Novo Refresh Token

### Passo 1: Verificar OAuth2 no Google Cloud Console

1. Acesse: https://console.cloud.google.com/
2. Vá em **APIs & Services** > **Credentials**
3. Encontre o OAuth 2.0 Client ID: `894419798314-kj5msqfhr4bdss15i8ne0ftftt4eokmc.apps.googleusercontent.com`
4. Verifique se está configurado corretamente

### Passo 2: Gerar Novo Refresh Token

**Opção A: Via Google OAuth Playground**
1. Acesse: https://developers.google.com/oauthplayground/
2. Configure:
   - **OAuth flow**: Authorization code
   - **OAuth endpoints**: Google Ads API
3. Selecione escopos:
   - `https://www.googleapis.com/auth/adwords`
4. Autorize e obtenha o novo Refresh Token

**Opção B: Via Script de Autenticação**
```bash
# Instalar dependências se necessário
npm install google-auth-library

# Criar script de autenticação
node scripts/generate-refresh-token.js
```

### Passo 3: Atualizar Refresh Token no Servidor

```bash
# No servidor
cd /root/projeto-2026-estrutura
nano .env

# Atualizar linha:
GOOGLE_ADS_REFRESH_TOKEN=<novo_refresh_token>

# Reiniciar servidor
pm2 restart sync-server --update-env
```

## 📊 Sistema Pronto para Receber Dados

### ✅ Coleta Automática de Eventos

O sistema **JÁ ESTÁ COLETANDO** eventos do funil automaticamente:
- `links_view`
- `links_cta_click`
- `portal_view`
- `form_start`
- `form_submit_success`
- `form_submit_error`
- `pix_view`
- `pix_initiated`
- `payment_confirmed`

**Não precisa fazer nada** - a coleta está funcionando!

### ⚠️ Sincronização de Custos Google Ads

Para sincronizar custos das campanhas, você precisa:

1. **Gerar novo Refresh Token** (ver acima)
2. **Sincronizar manualmente** (quando tiver tráfego):
   ```bash
   curl -X POST 'https://portalcertidao.org/api/google-ads/sync' \
     -H 'Content-Type: application/json' \
     -H 'X-API-Key: sua_api_key' \
     -d '{
       "customer_id": "591-659-0517",
       "date_from": "2026-01-12",
       "date_to": "2026-01-12"
     }'
   ```

3. **Ou sincronizar via PLATAFORMA**:
   - Acesse a aba "Coração"
   - Clique em "Sincronizar Google Ads"

## 🎯 Próximos Passos

1. **Agora (antes do tráfego)**:
   - ✅ Sistema já está coletando eventos
   - ⚠️ Gerar novo Refresh Token para Google Ads

2. **Quando tiver tráfego (até 72h)**:
   - ✅ Eventos serão coletados automaticamente
   - ⚠️ Sincronizar custos manualmente ou aguardar sincronização automática

3. **Após sincronizar custos**:
   - ✅ Analytics mostrará ROI, CPA e gargalos completos
   - ✅ Sistema identificará gargalos automaticamente

## 📝 Notas Importantes

- **Coleta de eventos**: Funciona independente do Google Ads
- **Sincronização de custos**: Requer Refresh Token válido
- **Analytics**: Funciona mesmo sem custos (mostra apenas eventos)
- **Gargalos**: Identificados mesmo sem custos do Google Ads

## ✅ Conclusão

**O sistema ESTÁ PRONTO para receber dados!**

- ✅ Coleta automática funcionando
- ✅ Banco de dados pronto
- ✅ Analytics funcionando
- ⚠️ Apenas precisa gerar novo Refresh Token para sincronizar custos do Google Ads

Quando o tráfego começar (até 72h), os eventos serão coletados automaticamente. Os custos podem ser sincronizados depois quando você tiver o novo Refresh Token.


