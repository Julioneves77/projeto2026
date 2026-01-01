# Configuração das APIs - Guia Completo

## ✅ Correções Aplicadas

### 1. SendPulse
- ✅ **Biblioteca oficial instalada e integrada** (`sendpulse-api`)
- ✅ **Estrutura do payload corrigida** conforme documentação oficial
- ✅ **Gerenciamento automático de tokens**
- ✅ **Tratamento de erros melhorado**

### 2. Zap API (WhatsApp)
- ✅ **Suporte a múltiplos formatos de API** (Z-API, Evolution API, etc.)
- ✅ **Mensagens de erro mais claras**
- ✅ **Timeout configurado** para evitar travamentos
- ✅ **Validação de URL obrigatória**

## Configuração do .env

### SendPulse

```env
# Credenciais SendPulse (obrigatório)
SENDPULSE_CLIENT_ID=add9a5c88271d94ec87d6016fa01d58e
SENDPULSE_CLIENT_SECRET=33a983c762b866c6c6074abefc8f71c1

# Email remetente (obrigatório - deve estar verificado no SendPulse)
SENDPULSE_SENDER_EMAIL=seu-email-verificado@dominio.com.br
SENDPULSE_SENDER_NAME=Portal Certidão
```

**Como verificar email no SendPulse:**
1. Acesse https://login.sendpulse.com
2. Vá em **Configurações** > **Senders** ou **Emails**
3. Adicione/verifique o email remetente
4. Use esse email em `SENDPULSE_SENDER_EMAIL`

### Zap API (WhatsApp)

```env
# URL da API (obrigatório - escolha uma das opções abaixo)
# Opção 1: Z-API
ZAP_API_URL=https://api.z-api.io/v1
ZAP_API_KEY=sua-instance-token-aqui

# Opção 2: Evolution API
# ZAP_API_URL=https://api.evolution-api.com/v1
# ZAP_API_KEY=sua-api-key-aqui
# ZAP_INSTANCE_ID=nome-da-instancia

# Opção 3: URL personalizada
# ZAP_API_URL=https://sua-url-personalizada.com/v1
# ZAP_API_KEY=sua-api-key-aqui
```

**Como descobrir a URL correta:**

1. **Z-API (Brasil):**
   - URL: `https://api.z-api.io/v1`
   - Obtenha o token no painel Z-API
   - Formato: `instance:token` ou apenas `token`

2. **Evolution API:**
   - URL: `https://api.evolution-api.com/v1`
   - Configure `ZAP_INSTANCE_ID` com o nome da instância
   - Use a API Key do painel

3. **Outra API:**
   - Consulte a documentação do seu provedor
   - Configure a URL e formato de autenticação adequados

## Estrutura Final do .env

```env
# SendPulse API Credentials
SENDPULSE_CLIENT_ID=add9a5c88271d94ec87d6016fa01d58e
SENDPULSE_CLIENT_SECRET=33a983c762b866c6c6074abefc8f71c1
SENDPULSE_SENDER_EMAIL=seu-email-verificado@dominio.com.br
SENDPULSE_SENDER_NAME=Portal Certidão

# Zap API Credentials (WhatsApp)
ZAP_API_URL=https://api.z-api.io/v1
ZAP_API_KEY=sua-api-key-aqui
# ZAP_INSTANCE_ID=nome-instancia  # Apenas se usar Evolution API

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
- ✅ SendPulse: Biblioteca inicializada com sucesso
- ✅ Zap API: URL configurada corretamente
- ✅ Envios funcionando sem erros

## Troubleshooting

### SendPulse ainda retorna erro

**Erro: "Sender is not valid"**
- ✅ Configure `SENDPULSE_SENDER_EMAIL` com um email verificado
- ✅ Verifique o email no painel SendPulse

**Erro: "Argument email missing"**
- ✅ Corrigido - usando biblioteca oficial agora

### Zap API ainda não funciona

**Erro: "ENOTFOUND"**
- ✅ Configure `ZAP_API_URL` com a URL correta
- ✅ Verifique se a URL está acessível

**Erro: "401 Unauthorized"**
- ✅ Verifique se `ZAP_API_KEY` está correto
- ✅ Verifique se a instância está ativa

**Erro: "404 Not Found"**
- ✅ Verifique se o endpoint está correto
- ✅ Para Evolution API, configure `ZAP_INSTANCE_ID`

## Suporte

Se os problemas persistirem:
1. Verifique os logs detalhados no servidor
2. Consulte a documentação oficial:
   - SendPulse: https://sendpulse.com/api
   - Z-API: https://developer.z-api.io
   - Evolution API: https://doc.evolution-api.com

