# Configuração da Zap API (WhatsApp)

## Variáveis de Ambiente Necessárias

Para que o sistema de monitoramento marque a Zap API como **ONLINE**, você precisa adicionar as seguintes variáveis no arquivo `.env` do servidor:

```bash
# Zap API - WhatsApp
ZAP_API_URL=https://api.z-api.io/v1
# OU para Evolution API:
# ZAP_API_URL=https://api.evolution-api.com/v1
# OU sua URL personalizada

ZAP_API_KEY=sua_chave_api_aqui
ZAP_CLIENT_TOKEN=seu_token_cliente_aqui
```

## Onde Configurar

1. **Acesse o servidor:**
   ```bash
   ssh root@143.198.10.145
   ```

2. **Edite o arquivo .env:**
   ```bash
   nano /root/projeto-2026-estrutura/.env
   ```

3. **Adicione as variáveis acima** (substitua pelos valores reais da sua conta Zap API)

4. **Reinicie o sync-server:**
   ```bash
   pm2 restart sync-server --update-env
   ```

## Exemplos de URLs por Provedor

- **Z-API:** `https://api.z-api.io/v1`
- **Evolution API:** `https://api.evolution-api.com/v1`
- **URL Personalizada:** Sua URL personalizada se tiver uma instância própria

## Verificação

Após configurar, você pode verificar se está funcionando:

```bash
curl -s "https://plataforma.portalcertidao.org/api/system/whatsapp/health" \
  -H "X-API-Key: 6071d071d03a7a595ab3c1cd3477404f68995bfc3c030ff09065a80c2f96d59c"
```

Deve retornar:
```json
{
  "status": "ok",
  "service": "Zap API",
  "configured": true,
  "timestamp": "..."
}
```

## Nota

O `ZAP_CLIENT_TOKEN` é opcional, mas recomendado para segurança adicional. Se não configurar, o sistema ainda funcionará, mas o health check pode marcar como "warning" se apenas `ZAP_API_URL` e `ZAP_API_KEY` estiverem configurados.

