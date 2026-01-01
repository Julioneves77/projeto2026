# Configuração de Credenciais - SendPulse e Zap API

## Status: ✅ Configurado

As credenciais foram configuradas com segurança no arquivo `.env` na raiz do projeto.

## Credenciais Configuradas

### SendPulse
- **Client ID**: Configurado ✅
- **Client Secret**: Configurado ✅
- **Endpoint**: `https://api.sendpulse.com`

### Zap API
- **API Key**: Configurado ✅
- **API URL**: `https://api.zap.com.br/v1`

## Segurança

✅ Arquivo `.env` criado e protegido
✅ `.env` adicionado ao `.gitignore`
✅ Credenciais não serão commitadas no Git
✅ Variáveis de ambiente carregadas via `dotenv`

## Como Usar

### 1. Reiniciar o Servidor de Sincronização

Para carregar as novas variáveis de ambiente:

```bash
# Parar o servidor atual (Ctrl+C)
# Reiniciar:
npm run sync-server
```

### 2. Verificar Configuração

O servidor irá carregar automaticamente as variáveis do arquivo `.env` quando iniciar.

### 3. Testar Integração

1. Complete um fluxo de pagamento no PORTAL
2. Verifique os logs no console do servidor
3. Verifique o histórico do ticket na PLATAFORMA

## Logs Esperados

### SendPulse (Email)
```
🔐 [SendPulse] Autenticando...
✅ [SendPulse] Autenticação bem-sucedida
📧 [SendPulse] Enviando email para cliente@email.com (Ticket: TK-001)
✅ [SendPulse] Email enviado com sucesso para cliente@email.com
```

### Zap API (WhatsApp)
```
📱 [Zap API] Enviando WhatsApp para 5511999999999 (Ticket: TK-001)
✅ [Zap API] Mensagem WhatsApp enviada com sucesso para 5511999999999
```

## Troubleshooting

### Erro de Autenticação SendPulse
- Verifique se `SENDPULSE_CLIENT_ID` e `SENDPULSE_CLIENT_SECRET` estão corretos
- Verifique se as credenciais estão ativas na conta SendPulse
- Verifique se a API REST está habilitada na conta SendPulse

### Erro de Autenticação Zap API
- Verifique se `ZAP_API_KEY` está correto
- Verifique se a URL da API está correta (`ZAP_API_URL`)
- O serviço tenta múltiplos métodos de autenticação automaticamente

### Email não enviado
- Verifique se o email remetente (`noreply@portalcertidao.com.br`) está configurado no SendPulse
- Verifique se o domínio está verificado no SendPulse
- Verifique os logs do servidor para detalhes do erro

### WhatsApp não enviado
- Verifique se o número de telefone está no formato correto (com código do país)
- Verifique se a instância WhatsApp está ativa na Zap API
- Verifique os logs do servidor para detalhes do erro

## Importante

⚠️ **NUNCA** commite o arquivo `.env` no Git
⚠️ **NUNCA** compartilhe as credenciais publicamente
⚠️ Mantenha o arquivo `.env` apenas no ambiente local/desenvolvimento
⚠️ Para produção, use variáveis de ambiente do servidor ou gerenciador de segredos

## Suporte

Em caso de problemas:
1. Verifique os logs do servidor de sincronização
2. Verifique os logs do console do navegador (PORTAL)
3. Verifique a documentação oficial:
   - SendPulse: https://sendpulse.com/integrations/api
   - Zap API: Consulte a documentação oficial da sua instância

