# Teste do PIX em Produção

## Por que testar em produção?

1. **Credenciais Reais**: O Pagar.me funciona corretamente apenas com credenciais de produção
2. **Webhook Configurado**: O webhook do Pagar.me está configurado para o domínio de produção
3. **CORS Configurado**: As origens permitidas estão configuradas para os domínios de produção
4. **Ambiente Completo**: Todos os serviços (sync-server, plataforma, etc.) estão configurados

## Checklist antes de fazer deploy

### 1. Variáveis de Ambiente em Produção

Certifique-se de que o arquivo `.env` ou variáveis de ambiente do servidor de produção tenham:

```env
VITE_SYNC_SERVER_URL=https://api.portalcertidao.org
VITE_SYNC_SERVER_API_KEY=sua-chave-api-producao
```

### 2. Build de Produção

```bash
cd "verificacao assistida"
npm run build
```

### 3. Verificar Build

- Verifique se o build foi criado em `dist/`
- Verifique se os arquivos estão corretos
- Teste localmente com `npm run preview` antes de fazer deploy

### 4. Deploy

Faça o deploy dos arquivos da pasta `dist/` para o servidor de produção.

### 5. Teste em Produção

1. Acesse o site em produção
2. Preencha o formulário
3. Verifique se o QR Code PIX é gerado
4. Faça um pagamento de teste (se possível)
5. Verifique se o ticket é atualizado para EM_OPERACAO
6. Verifique se email/WhatsApp são enviados

## Teste Local vs Produção

### Local (Desenvolvimento)
- ✅ Bom para desenvolvimento e debug
- ❌ Pode ter problemas de autenticação
- ❌ Pagar.me pode não funcionar corretamente
- ❌ Webhook não funciona localmente

### Produção
- ✅ Ambiente completo e configurado
- ✅ Pagar.me funciona corretamente
- ✅ Webhook funciona
- ✅ Email/WhatsApp funcionam
- ✅ Teste real do fluxo completo

## Recomendação

**Teste em produção** após fazer o deploy. O ambiente local é útil para desenvolvimento, mas para testar o fluxo completo de pagamento, produção é o melhor lugar.

