#!/bin/bash

# Script para monitorar webhooks do Pagar.me em tempo real
# Execute: bash monitorar-webhook.sh

echo "🔍 Monitorando Webhooks Pagar.me..."
echo "📊 Pressione Ctrl+C para parar"
echo ""

SERVER="root@143.198.10.145"

echo "📡 Conectando ao servidor..."
echo ""

# Monitorar logs do sync-server
ssh $SERVER "pm2 logs sync-server --lines 0 --nostream 2>&1" | grep --line-buffered -i "pagarme\|webhook\|order\|transaction\|ticket" | while IFS= read -r line; do
    # Colorir logs importantes
    if echo "$line" | grep -qi "webhook recebido"; then
        echo "🟢 $line"
    elif echo "$line" | grep -qi "ticket atualizado\|processado com sucesso"; then
        echo "✅ $line"
    elif echo "$line" | grep -qi "erro\|error\|falhou"; then
        echo "❌ $line"
    elif echo "$line" | grep -qi "order.paid\|transaction.paid"; then
        echo "💰 $line"
    else
        echo "📦 $line"
    fi
done


