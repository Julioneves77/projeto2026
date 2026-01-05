# 🔧 Configurar Webhook Pagar.me - Guia Completo

## ⚠️ PROBLEMA IDENTIFICADO

O DNS de `api.portalcertidao.org` **NÃO está configurado**, mas o webhook funciona via `www.portalcertidao.org/api/webhooks/pagarme`.

---

## ✅ SOLUÇÃO: Configurar Webhook no Dashboard Pagar.me

### Passo 1: Acessar Dashboard Pagar.me

1. Acesse: https://dashboard.pagar.me
2. Faça login com suas credenciais
3. Vá em **Configurações** → **Webhooks**

### Passo 2: Adicionar/Editar Webhook

**URL do Webhook (USE ESTA):**
```
https://www.portalcertidao.org/api/webhooks/pagarme
```

**⚠️ IMPORTANTE:** NÃO use `api.portalcertidao.org` (DNS não configurado)

### Passo 3: Configurar Eventos

Selecione os seguintes eventos:
- ✅ `order.paid` (PAGAMENTO CONFIRMADO)
- ✅ `transaction.paid` (alternativa)
- ✅ `order.refunded` (opcional - para reembolsos)

### Passo 4: Configurações Adicionais

- **Método**: POST
- **Autenticação**: Desabilitada (webhooks públicos)
- **Tentativas**: 3 (padrão)

### Passo 5: Salvar e Testar

1. Clique em **Salvar**
2. Faça um pagamento de teste
3. Verifique os logs do servidor

---

## 🧪 Testar Webhook Manualmente

### Teste 1: Verificar se Endpoint Está Acessível

```bash
curl -X POST https://www.portalcertidao.org/api/webhooks/pagarme \
  -H "Content-Type: application/json" \
  -d '{
    "type": "order.paid",
    "order": {
      "id": "ord_test_123",
      "status": "paid",
      "metadata": {
        "ticket_id": "ticket-123"
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

Isso significa que o endpoint está funcionando! (O ticket não existe, mas o webhook foi recebido)

### Teste 2: Monitorar Logs em Tempo Real

No servidor:
```bash
ssh root@143.198.10.145
pm2 logs sync-server --lines 0
```

Depois faça um pagamento de teste e veja os logs aparecerem.

---

## 📋 Checklist de Verificação

- [ ] Webhook configurado no dashboard Pagar.me
- [ ] URL correta: `https://www.portalcertidao.org/api/webhooks/pagarme`
- [ ] Evento `order.paid` selecionado
- [ ] Webhook ativo/enabled
- [ ] Teste manual funcionando (curl)
- [ ] Logs do servidor sendo monitorados
- [ ] Pagamento de teste realizado
- [ ] Ticket atualizado para EM_OPERACAO após pagamento

---

## 🔍 Verificar se Webhook Está Funcionando

### 1. Ver Logs do Nginx

```bash
ssh root@143.198.10.145
tail -f /var/log/nginx/access.log | grep webhook
```

Você deve ver requisições POST do Pagar.me quando um pagamento for confirmado.

### 2. Ver Logs do Sync-Server

```bash
ssh root@143.198.10.145
pm2 logs sync-server --lines 50 | grep -i "pagarme\|webhook"
```

Você deve ver:
- `📦 [Pagar.me Webhook] Payload completo recebido`
- `📦 [Pagar.me Webhook] Tipo de evento: order.paid`
- `✅ [Pagar.me Webhook] Ticket atualizado para EM_OPERACAO`

### 3. Verificar Ticket na Plataforma

Após pagamento confirmado:
1. Acesse: https://plataforma.portalcertidao.org
2. O ticket deve aparecer com status **EM_OPERACAO**
3. O histórico deve mostrar: "Pagamento confirmado via Pagar.me"

---

## 🚨 Troubleshooting

### Problema: Webhook não está chegando

**Soluções:**
1. Verificar se URL está correta no dashboard
2. Verificar se webhook está ativo/enabled
3. Verificar se evento `order.paid` está selecionado
4. Verificar logs do Nginx para ver se há tentativas de acesso
5. Verificar firewall do servidor

### Problema: Webhook chega mas não processa

**Verificar:**
1. Se `metadata.ticket_id` está sendo enviado na criação da transação
2. Se o ticket existe no sistema
3. Logs do sync-server para ver erro específico

### Problema: DNS não resolve

**Solução temporária:**
- Use `https://www.portalcertidao.org/api/webhooks/pagarme` (funciona)
- Ou configure DNS de `api.portalcertidao.org` apontando para `143.198.10.145`

---

## 📞 Informações Importantes

**URL do Webhook Funcional:**
```
https://www.portalcertidao.org/api/webhooks/pagarme
```

**IP do Servidor:**
```
143.198.10.145
```

**Chave Pagar.me (Produção):**
```
sk_b28c38c2dcb44a91aecc4d1a20b1c00c
```

---

## ✅ Próximos Passos

1. **AGORA**: Configure o webhook no dashboard Pagar.me com a URL correta
2. Faça um pagamento de teste
3. Monitore os logs em tempo real
4. Verifique se o ticket aparece na plataforma

**Se precisar de ajuda, me avise!**



