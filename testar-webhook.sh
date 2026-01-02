#!/bin/bash

# Script para testar webhook do Pagar.me
# Execute: bash testar-webhook.sh

echo "🧪 Testando Webhook Pagar.me..."
echo ""

# Gerar ID único para teste
TEST_ID="test-$(date +%s)"

# Simular payload do Pagar.me (formato real)
PAYLOAD=$(cat <<EOF
{
  "type": "order.paid",
  "order": {
    "id": "ord_${TEST_ID}",
    "status": "paid",
    "amount": 5487,
    "paid_amount": 5487,
    "currency": "BRL",
    "metadata": {
      "ticket_id": "ticket-${TEST_ID}",
      "certificate_type": "Criminal Federal",
      "plan_id": "prioridade"
    },
    "items": [
      {
        "id": "item_1",
        "title": "Certidão",
        "unit_price": 5487,
        "quantity": 1,
        "tangible": false
      }
    ],
    "customer": {
      "name": "Cliente Teste",
      "email": "teste@example.com"
    }
  }
}
EOF
)

echo "📤 Enviando payload de teste..."
echo "Payload:"
echo "$PAYLOAD" | jq . 2>/dev/null || echo "$PAYLOAD"
echo ""

RESPONSE=$(curl -s -X POST https://www.portalcertidao.org/api/webhooks/pagarme \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

echo "📥 Resposta do servidor:"
echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
echo ""

if echo "$RESPONSE" | grep -q "received.*true"; then
    echo "✅ Webhook está funcionando!"
    if echo "$RESPONSE" | grep -q "processed.*true"; then
        echo "✅ Webhook foi processado com sucesso!"
    else
        echo "⚠️  Webhook recebido mas não processado (pode ser ticket de teste)"
    fi
else
    echo "❌ Webhook pode ter problemas"
fi

echo ""
echo "💡 Dica: Execute 'bash monitorar-webhook.sh' para ver logs em tempo real"


