# 🔧 Configurações Pagar.me - Guia das Certidões

## 📋 Resumo das Mudanças Necessárias

Com a troca do template para **Guia das Certidões**, você precisa verificar/atualizar as seguintes configurações no Pagar.me:

---

## ✅ 1. WEBHOOK (Obrigatório)

### URL do Webhook
O webhook **NÃO precisa ser alterado** porque ele aponta para o mesmo sync-server:

**URL Atual (mantém):**
```
https://api.portalcertidao.org/webhooks/pagarme
```

**OU (alternativa se api.portalcertidao.org não estiver configurado):**
```
https://www.portalcertidao.org/api/webhooks/pagarme
```

### Eventos Configurados
Verifique se os seguintes eventos estão selecionados:
- ✅ `order.paid` (OBRIGATÓRIO)
- ✅ `transaction.paid` (alternativa/compatibilidade)
- ⚠️ `order.refunded` (opcional - para reembolsos)

### Como Verificar/Configurar:
1. Acesse: https://dashboard.pagar.me
2. Vá em: **Configurações** → **Webhooks**
3. Verifique se a URL está correta
4. Verifique se os eventos estão selecionados
5. **Status deve estar: ATIVO**

---

## ✅ 2. CREDENCIAIS (Verificar)

### Credenciais Atuais
As credenciais do Pagar.me estão configuradas no `sync-server.js` via variáveis de ambiente:

**Variáveis Necessárias:**
```env
PAGARME_ACCOUNT_ID=acc_rOZzALlImU3VqkvD
PAGARME_SECRET_KEY=sk_test_ec07154a6cb541fd9c3540af3e6b1efb
```

**⚠️ IMPORTANTE:**
- Se você está usando **credenciais de TESTE** (`sk_test_`), elas funcionam para ambos os domínios
- Se você migrou para **PRODUÇÃO** (`sk_live_`), verifique se as credenciais estão corretas
- **NÃO precisa criar novas credenciais** - as mesmas servem para todos os domínios

### Como Verificar:
1. Acesse: https://dashboard.pagar.me
2. Vá em: **Configurações** → **Credenciais**
3. Verifique se as credenciais no servidor correspondem às do dashboard

---

## ✅ 3. DOMÍNIOS PERMITIDOS (Se aplicável)

### Verificação
O Pagar.me pode ter uma lista de domínios permitidos para receber pagamentos. Verifique:

1. Acesse: https://dashboard.pagar.me
2. Vá em: **Configurações** → **Segurança** ou **Domínios**
3. Se houver lista de domínios, adicione:
   - ✅ `www.guiadascertidoes.online`
   - ✅ `guiadascertidoes.online`

**Nota:** Nem todas as contas Pagar.me têm essa configuração. Se não encontrar essa opção, não é necessário.

---

## ✅ 4. METADATA DAS TRANSAÇÕES (Já Configurado)

O código já está enviando o `ticket_id` e `ticket_code` no metadata das transações:

```javascript
metadata: {
  ticket_id: ticketId,
  ticket_code: ticketCode,
  certificate_type: service,
  dominio: 'www.guiadascertidoes.online'
}
```

**✅ Não precisa alterar nada** - já está funcionando corretamente.

---

## ✅ 5. VALOR DO PIX (Verificar)

### Valor Atual
O valor do PIX para Guia das Certidões está configurado como:
- **R$ 59,37** (fixo para todas as certidões)

### Como Verificar:
1. Verifique no código: `GUIA DAS CERTIDOES/src/pages/PagamentoPix.tsx`
2. Constante: `BASE_PRICE = 59.37`
3. Se precisar alterar, edite o código e faça novo deploy

---

## 📋 CHECKLIST COMPLETO

### No Dashboard Pagar.me:

- [ ] **Webhook configurado**
  - [ ] URL: `https://api.portalcertidao.org/webhooks/pagarme` (ou alternativa)
  - [ ] Eventos: `order.paid` e `transaction.paid` selecionados
  - [ ] Status: ATIVO

- [ ] **Credenciais verificadas**
  - [ ] `PAGARME_ACCOUNT_ID` correto no servidor
  - [ ] `PAGARME_SECRET_KEY` correto no servidor
  - [ ] Ambiente (teste/produção) correspondente

- [ ] **Domínios permitidos** (se aplicável)
  - [ ] `www.guiadascertidoes.online` adicionado
  - [ ] `guiadascertidoes.online` adicionado

### No Servidor:

- [ ] **Variáveis de ambiente configuradas**
  - [ ] `PAGARME_ACCOUNT_ID` configurado
  - [ ] `PAGARME_SECRET_KEY` configurado
  - [ ] Sync-server rodando (PM2 ou systemd)

- [ ] **CORS configurado**
  - [ ] `www.guiadascertidoes.online` nas origens CORS (já feito ✅)
  - [ ] Sync-server aceitando requisições do novo domínio

---

## 🧪 TESTE FINAL

### 1. Testar Webhook Manualmente

```bash
curl -X POST https://api.portalcertidao.org/webhooks/pagarme \
  -H "Content-Type: application/json" \
  -d '{
    "type": "order.paid",
    "order": {
      "id": "ord_test_123",
      "status": "paid",
      "metadata": {
        "ticket_id": "ticket-test-123"
      }
    }
  }'
```

**Resposta esperada:**
```json
{
  "received": true,
  "processed": false,
  "reason": "Ticket não encontrado"
}
```

### 2. Testar Pagamento Completo

1. Acesse: https://www.guiadascertidoes.online
2. Selecione uma certidão
3. Preencha o formulário
4. Vá para pagamento PIX
5. Faça um pagamento de teste
6. Verifique se o webhook foi recebido:
   ```bash
   ssh root@143.198.10.145 "pm2 logs sync-server --lines 50"
   ```

---

## ⚠️ O QUE NÃO PRECISA MUDAR

✅ **Webhook URL** - Mantém a mesma (aponta para sync-server compartilhado)
✅ **Credenciais** - Mantém as mesmas (servem para todos os domínios)
✅ **Código do webhook** - Já está preparado para receber pagamentos de qualquer domínio
✅ **Metadata** - Já inclui o domínio automaticamente

---

## 🎯 RESUMO EXECUTIVO

**Mudanças Necessárias:**
1. ✅ Verificar se webhook está configurado no dashboard Pagar.me
2. ✅ Verificar se credenciais estão corretas no servidor
3. ✅ Adicionar domínios permitidos (se a opção existir no dashboard)

**Mantém Igual:**
- URL do webhook
- Credenciais do Pagar.me
- Código do sync-server

**Já Configurado:**
- ✅ CORS para `guiadascertidoes.online`
- ✅ Metadata com domínio
- ✅ Valor do PIX (R$ 59,37)

---

## 📞 SUPORTE

Se tiver problemas:
1. Verifique logs do sync-server: `pm2 logs sync-server`
2. Verifique logs do Nginx: `tail -f /var/log/nginx/error.log`
3. Teste o webhook manualmente (comando acima)
4. Verifique se o webhook está ativo no dashboard Pagar.me
