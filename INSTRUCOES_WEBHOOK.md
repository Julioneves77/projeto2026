# 🚀 Instruções Rápidas - Configurar Webhook Pagar.me

## ⚡ AÇÃO IMEDIATA NECESSÁRIA

### 1. Configurar Webhook no Dashboard Pagar.me

1. **Acesse:** https://dashboard.pagar.me
2. **Vá em:** Configurações → Webhooks
3. **Adicione webhook:**
   - **URL:** `https://www.portalcertidao.org/api/webhooks/pagarme`
   - **Eventos:** ✅ `order.paid`
   - **Método:** POST
   - **Status:** Ativo
4. **Salve**

---

## 🧪 TESTAR AGORA

### Opção 1: Teste Manual (Rápido)

Execute no terminal:
```bash
bash testar-webhook.sh
```

### Opção 2: Monitorar Logs em Tempo Real

**Terminal 1 - Monitorar:**
```bash
bash monitorar-webhook.sh
```

**Terminal 2 - Fazer Pagamento:**
1. Acesse: https://www.portalcertidao.org
2. Preencha formulário
3. Selecione plano
4. Faça pagamento de teste

**Você verá os logs aparecerem em tempo real!**

---

## 📊 O QUE ESPERAR NOS LOGS

Quando o webhook funcionar, você verá:

```
🟢 POST /webhooks/pagarme - Webhook recebido do Pagar.me
💰 📦 [Pagar.me Webhook] Tipo de evento: order.paid
📦 [Pagar.me Webhook] Dados extraídos: { ticket_id: "...", ... }
✅ [Pagar.me Webhook] Ticket atualizado para EM_OPERACAO: TK-XXX
✅ [Pagar.me Webhook] Webhook processado com sucesso
```

---

## ✅ CHECKLIST

- [ ] Webhook configurado no dashboard Pagar.me
- [ ] URL correta: `https://www.portalcertidao.org/api/webhooks/pagarme`
- [ ] Evento `order.paid` selecionado
- [ ] Webhook ativo/enabled
- [ ] Teste manual executado
- [ ] Logs sendo monitorados
- [ ] Pagamento de teste realizado
- [ ] Ticket aparece na Plataforma com status EM_OPERACAO

---

## 🆘 SE NÃO FUNCIONAR

1. **Verificar URL no dashboard** - Deve ser exatamente: `https://www.portalcertidao.org/api/webhooks/pagarme`
2. **Verificar se webhook está ativo** - Status deve ser "Ativo" ou "Enabled"
3. **Verificar eventos** - Deve ter `order.paid` marcado
4. **Ver logs do Nginx:**
   ```bash
   ssh root@143.198.10.145 "tail -f /var/log/nginx/access.log | grep webhook"
   ```
5. **Ver logs do sync-server:**
   ```bash
   ssh root@143.198.10.145 "pm2 logs sync-server --lines 50"
   ```

---

## 📞 INFORMAÇÕES TÉCNICAS

**URL do Webhook:**
```
https://www.portalcertidao.org/api/webhooks/pagarme
```

**IP do Servidor:**
```
143.198.10.145
```

**Chave Pagar.me:**
```
sk_b28c38c2dcb44a91aecc4d1a20b1c00c (produção)
```

---

**Pronto! Configure o webhook e faça o teste! 🚀**




