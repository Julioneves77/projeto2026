# Resumo da Integração Pagar.me

## ✅ Implementações Concluídas

### 1. Serviço de Pagamento (PORTAL/src/lib/pagarmeService.ts)
- ✅ Função `createPixTransaction()` - Cria transação PIX via API do Pagar.me
- ✅ Função `getTransactionStatus()` - Consulta status da transação
- ✅ Função `formatAmountToCents()` - Converte valor para centavos
- ✅ Função `parsePhoneNumber()` - Extrai DDD e número do telefone brasileiro

### 2. Página de Pagamento (PORTAL/src/pages/Payment.tsx)
- ✅ Integração com Pagar.me substituindo mock PIX
- ✅ Geração automática de QR Code PIX ao carregar a página
- ✅ Polling automático para verificar status do pagamento (a cada 5 segundos)
- ✅ Atualização automática do ticket quando pagamento é confirmado
- ✅ Redirecionamento automático para SOLICITE LINK/obrigado após confirmação
- ✅ Mantido botão de teste como fallback

### 3. Webhook do Pagar.me (sync-server.js)
- ✅ Endpoint `POST /webhooks/pagarme` criado
- ✅ Processamento de eventos `transaction.paid`
- ✅ Atualização automática de ticket para EM_OPERACAO
- ✅ Envio automático de confirmações (email/WhatsApp)
- ✅ Tratamento de erros e logs detalhados

### 4. Documentação
- ✅ DEPLOY.md atualizado com instruções do Pagar.me
- ✅ Seção de troubleshooting para webhook e QR Code
- ✅ Instruções de configuração de webhook no dashboard

### 5. Arquivos .env.example
- ✅ Atualizados com variáveis do Pagar.me
- ✅ Domínios reais configurados:
  - SOLICITE LINK: www.solicite.link
  - PORTAL: www.portalcertidao.org
  - PLATAFORMA: plataforma.portalcertidao.org
  - API: api.portalcertidao.org

---

## ⚠️ Configurações Necessárias ANTES de Deploy

### 1. Variáveis de Ambiente

#### Sync-Server (.env)
```env
NODE_ENV=production
PORT=3001
PUBLIC_BASE_URL=https://api.portalcertidao.org
SYNC_SERVER_API_KEY=<gerar-chave-forte>
CORS_ORIGINS=https://www.portalcertidao.org,https://plataforma.portalcertidao.org,https://www.solicite.link
FORCE_RESEND=false

# SendPulse (já configurado)
SENDPULSE_CLIENT_ID=add9a5c88271d94ec87d6016fa01d58e
SENDPULSE_CLIENT_SECRET=33a983c762b866c6c6074abefc8f71c1
SENDPULSE_SENDER_EMAIL=contato@portalcertidao.org
SENDPULSE_SENDER_NAME=Portal Certidão

# Zap API (já configurado)
ZAP_API_URL=https://api.z-api.io/v1
ZAP_API_KEY=3EAB7866FE55B1BEB70D52B01C4B842D
ZAP_CLIENT_TOKEN=F8337947b89a14ae78d92f6365523269bS

# Pagar.me (já configurado)
PAGARME_ACCOUNT_ID=acc_rOZzALlImU3VqkvD
PAGARME_SECRET_KEY=sk_test_ec07154a6cb541fd9c3540af3e6b1efb
```

**⚠️ IMPORTANTE**: Gerar `SYNC_SERVER_API_KEY` forte:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### PORTAL (.env.local)
```env
VITE_SYNC_SERVER_URL=https://api.portalcertidao.org
VITE_SYNC_SERVER_API_KEY=<mesma-chave-do-sync-server>
VITE_RECAPTCHA_SITE_KEY=6Ld13bsrAAAAACyH9-lzVqe6e-NV5eXEkUlU-Q_w
VITE_PAGARME_PUBLIC_KEY=pk_test_lopqddXFGcRjqmKG
VITE_SOLICITE_LINK_URL=https://www.solicite.link
```

#### PLATAFORMA (.env.local)
```env
VITE_SYNC_SERVER_URL=https://api.portalcertidao.org
VITE_SYNC_SERVER_API_KEY=<mesma-chave-do-sync-server>
```

#### SOLICITE LINK (.env.local)
```env
VITE_PORTAL_URL=https://www.portalcertidao.org
VITE_GTM_CONTAINER_ID=GTM-5M37FK67
```

### 2. Configurar Webhook no Pagar.me

1. Acesse: https://dashboard.pagar.me
2. Vá em **Configurações** > **Webhooks**
3. Adicione webhook:
   - **URL**: `https://api.portalcertidao.org/webhooks/pagarme`
   - **Eventos**: `transaction.paid`, `transaction.refunded`
   - **Método**: POST

### 3. Builds de Produção

```bash
# PORTAL
cd PORTAL
npm run build

# PLATAFORMA
cd PLATAFORMA
npm run build

# SOLICITE LINK
cd "SOLICITE LINK"
npm run build
```

---

## 🔄 Fluxo Completo de Pagamento

1. **Cliente preenche formulário** → PORTAL (www.portalcertidao.org)
2. **Cliente seleciona plano** → PORTAL
3. **Cliente é redirecionado para Payment** → PORTAL
4. **Sistema cria ticket** com status GERAL → Sync-Server
5. **Sistema cria transação PIX** via Pagar.me → Pagar.me API
6. **Sistema exibe QR Code PIX** → PORTAL
7. **Cliente paga via PIX** → Banco
8. **Pagar.me recebe confirmação** → Pagar.me
9. **Pagar.me envia webhook** → Sync-Server `/webhooks/pagarme`
10. **Sync-Server atualiza ticket** para EM_OPERACAO → Sync-Server
11. **Sync-Server envia confirmação** (email/WhatsApp) → SendPulse/Zap API
12. **Polling detecta pagamento** (fallback) → PORTAL
13. **Cliente é redirecionado** para SOLICITE LINK/obrigado → SOLICITE LINK

---

## 📝 Observações Importantes

- **Credenciais de Teste**: As credenciais fornecidas são de teste (`pk_test_`, `sk_test_`)
- **Produção**: Após homologação, substituir por `pk_live_` e `sk_live_`
- **Webhook**: URL pública obrigatória (HTTPS)
- **Polling**: Funciona como fallback caso webhook falhe
- **Segurança**: `sk_test_` e `sk_live_` NUNCA devem ser expostas no frontend

---

## ✅ Status Final

**Código**: ✅ 100% Implementado
**Documentação**: ✅ Completa
**Configuração**: ⚠️ Pendente (variáveis de ambiente e builds)
**Webhook**: ⚠️ Pendente (configurar no dashboard do Pagar.me)

**Próximos Passos**:
1. Configurar variáveis de ambiente em todos os projetos
2. Fazer builds de produção
3. Configurar webhook no Pagar.me
4. Fazer deploy seguindo DEPLOY.md
5. Testar fluxo completo


