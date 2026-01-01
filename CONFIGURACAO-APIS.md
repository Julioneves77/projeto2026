# Configuração das APIs - SendPulse e Zap API

## Problemas Corrigidos

### 1. SendPulse - "Argument email missing"
**Problema:** A estrutura do payload estava incorreta (tinha um wrapper "email" desnecessário).

**Solução:** Corrigido - os campos agora estão diretamente no root do payload.

### 2. Zap API - "ENOTFOUND api.zap.com.br"
**Problema:** O domínio `api.zap.com.br` não existe.

**Solução:** A URL agora é configurável e obrigatória. Você precisa configurar a URL correta da sua instância WhatsApp.

## Configuração Necessária

### 1. SendPulse

No arquivo `.env`, configure:

```env
SENDPULSE_CLIENT_ID=add9a5c88271d94ec87d6016fa01d58e
SENDPULSE_CLIENT_SECRET=33a983c762b866c6c6074abefc8f71c1

# IMPORTANTE: Configure com um email VERIFICADO na sua conta SendPulse
SENDPULSE_SENDER_EMAIL=seu-email-verificado@dominio.com.br
SENDPULSE_SENDER_NAME=Portal Certidão
```

**Como verificar/adicionar email remetente no SendPulse:**
1. Acesse sua conta SendPulse
2. Vá em **Configurações** > **Emails** ou **Senders**
3. Verifique ou adicione um email remetente
4. Use esse email no `SENDPULSE_SENDER_EMAIL`

### 2. Zap API (WhatsApp)

No arquivo `.env`, configure:

```env
# IMPORTANTE: Configure com a URL correta da sua instância WhatsApp
# Exemplos de URLs comuns:
# - Z-API: https://api.z-api.io/v1
# - Evolution API: https://api.evolution-api.com/v1
# - URL personalizada da sua instância
ZAP_API_URL=https://api.z-api.io/v1
ZAP_API_KEY=3EAB7866FE55B1BEB70D52B01C4B842D
```

**Como descobrir a URL correta:**
1. Consulte a documentação do seu provedor de WhatsApp API
2. Verifique no painel de controle da sua instância
3. Exemplos comuns:
   - **Z-API**: `https://api.z-api.io/v1`
   - **Evolution API**: `https://api.evolution-api.com/v1`
   - **Z-API (Brasil)**: `https://api.z-api.io/v1`
   - Sua URL personalizada se tiver uma instância própria

## Estrutura Final do .env

```env
# SendPulse API Credentials
SENDPULSE_CLIENT_ID=add9a5c88271d94ec87d6016fa01d58e
SENDPULSE_CLIENT_SECRET=33a983c762b866c6c6074abefc8f71c1
SENDPULSE_SENDER_EMAIL=seu-email-verificado@dominio.com.br
SENDPULSE_SENDER_NAME=Portal Certidão

# Zap API Credentials
ZAP_API_URL=https://api.z-api.io/v1
ZAP_API_KEY=3EAB7866FE55B1BEB70D52B01C4B842D

# Sync Server Configuration
PORT=3001
```

## Após Configurar

1. **Salve o arquivo `.env`**
2. **Reinicie o servidor de sincronização:**
   ```bash
   # Parar o servidor atual (Ctrl+C)
   npm run sync-server
   ```
3. **Teste novamente** completando um pagamento no PORTAL

## Verificação

Após reiniciar, os logs devem mostrar:
- ✅ SendPulse: Autenticação bem-sucedida
- ✅ Zap API: URL configurada corretamente
- ✅ Envios funcionando sem erros

## Troubleshooting

### SendPulse ainda retorna erro
- Verifique se o email em `SENDPULSE_SENDER_EMAIL` está verificado no SendPulse
- Verifique se as credenciais estão corretas
- Verifique os logs do servidor para detalhes do erro

### Zap API ainda não funciona
- Verifique se a URL está correta (teste no navegador ou com curl)
- Verifique se a API Key está correta
- Verifique se a instância WhatsApp está ativa
- Consulte a documentação do seu provedor para a estrutura correta da API

## Suporte

Se os problemas persistirem:
1. Verifique os logs detalhados no servidor
2. Consulte a documentação oficial:
   - SendPulse: https://sendpulse.com/integrations/api
   - Zap API: Consulte a documentação do seu provedor específico

