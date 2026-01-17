#!/bin/bash

echo "🧪 TESTE COMPLETO DO SISTEMA DE MONITORAMENTO"
echo "=============================================="
echo ""

API_KEY="6071d071d03a7a595ab3c1cd3477404f68995bfc3c030ff09065a80c2f96d59c"
BASE_URL="https://plataforma.portalcertidao.org/api"

echo "1️⃣ Testando Endpoints de Health Check"
echo "--------------------------------------"

echo -n "📧 SendPulse (Email): "
RESPONSE=$(curl -s "${BASE_URL}/system/email/health" -H "X-API-Key: ${API_KEY}")
STATUS=$(echo $RESPONSE | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
if [ "$STATUS" = "ok" ]; then
    echo "✅ ONLINE - $RESPONSE"
else
    echo "⚠️  $STATUS - $RESPONSE"
fi

echo -n "💬 Zap API (WhatsApp): "
RESPONSE=$(curl -s "${BASE_URL}/system/whatsapp/health" -H "X-API-Key: ${API_KEY}")
STATUS=$(echo $RESPONSE | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
if [ "$STATUS" = "ok" ]; then
    echo "✅ ONLINE - $RESPONSE"
elif [ "$STATUS" = "not_configured" ]; then
    echo "⚠️  INSTÁVEL (Não configurado) - $RESPONSE"
else
    echo "❌ $STATUS - $RESPONSE"
fi

echo ""
echo "2️⃣ Testando Domínios"
echo "---------------------"

DOMAINS=(
    "https://www.portalcertidao.org"
    "https://www.solicite.link"
    "https://www.verificacaoassistida.online"
    "https://www.portalcacesso.online"
    "https://portalcacesso.online"
)

for domain in "${DOMAINS[@]}"; do
    echo -n "🌐 $(basename $domain): "
    HTTP_CODE=$(curl -s -I "$domain" --max-time 5 -w "%{http_code}" -o /dev/null 2>&1)
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
        echo "✅ ONLINE (HTTP $HTTP_CODE)"
    elif [ "$HTTP_CODE" = "000" ]; then
        echo "❌ OFFLINE (Timeout/Erro de conexão)"
    else
        echo "⚠️  HTTP $HTTP_CODE"
    fi
done

echo ""
echo "3️⃣ Testando Sync-Server"
echo "------------------------"
echo -n "🔧 Health Check: "
RESPONSE=$(curl -s "${BASE_URL}/health")
if echo "$RESPONSE" | grep -q '"status":"ok"'; then
    echo "✅ ONLINE"
else
    echo "❌ ERRO - $RESPONSE"
fi

echo ""
echo "✅ TESTES CONCLUÍDOS"
echo "===================="

