#!/bin/bash

# Script para configurar mapeamentos e sincronizar campanhas
# Usa a API do sync-server

SYNC_SERVER_URL="${SYNC_SERVER_URL:-https://api.portalcertidao.org}"
API_KEY="${SYNC_SERVER_API_KEY}"

if [ -z "$API_KEY" ]; then
  echo "⚠️  SYNC_SERVER_API_KEY não configurada"
  echo "   Configure no .env ou exporte: export SYNC_SERVER_API_KEY=sua_key"
fi

# Calcular período (últimos 30 dias)
DATE_TO=$(date +%Y-%m-%d)
DATE_FROM=$(date -v-30d +%Y-%m-%d 2>/dev/null || date -d "30 days ago" +%Y-%m-%d)

echo "🚀 Configuração e Sincronização de Google Ads"
echo ""
echo "📅 Período: $DATE_FROM até $DATE_TO"
echo ""

# 1. Configurar mapeamento solicite.link
echo "🔧 Configurando mapeamento solicite.link..."
curl -s -X POST "$SYNC_SERVER_URL/google-ads/map-domain" \
  -H "Content-Type: application/json" \
  ${API_KEY:+-H "X-API-Key: $API_KEY"} \
  -d "{
    \"domain\": \"solicite.link\",
    \"customer_id\": \"591-659-0517\",
    \"account_name\": \"Conta Solicite Link\"
  }" | jq '.' || echo "Erro ao configurar solicite.link"
echo ""

# 2. Perguntar customer_id da segunda conta
echo "📝 Qual é o Customer ID da conta do portalacesso.online?"
echo "   (Deixe em branco se ainda não souber)"
read -r PORTAL_ACESSO_CUSTOMER_ID

if [ -n "$PORTAL_ACESSO_CUSTOMER_ID" ]; then
  echo "🔧 Configurando mapeamento portalacesso.online..."
  curl -s -X POST "$SYNC_SERVER_URL/google-ads/map-domain" \
    -H "Content-Type: application/json" \
    ${API_KEY:+-H "X-API-Key: $API_KEY"} \
    -d "{
      \"domain\": \"portalcacesso.online\",
      \"customer_id\": \"$PORTAL_ACESSO_CUSTOMER_ID\",
      \"account_name\": \"Conta Portal Acesso\"
    }" | jq '.' || echo "Erro ao configurar portalacesso.online"
  echo ""
fi

# 3. Sincronizar via MCC (se MCC_ID fornecido)
if [ -n "$GOOGLE_ADS_MCC_ID" ] || [ -n "$1" ]; then
  MCC_ID="${1:-$GOOGLE_ADS_MCC_ID}"
  echo "🔄 Sincronizando todas as contas via MCC: $MCC_ID"
  curl -s -X POST "$SYNC_SERVER_URL/google-ads/sync" \
    -H "Content-Type: application/json" \
    ${API_KEY:+-H "X-API-Key: $API_KEY"} \
    -d "{
      \"mcc_id\": \"$MCC_ID\",
      \"date_from\": \"$DATE_FROM\",
      \"date_to\": \"$DATE_TO\"
    }" | jq '.' || echo "Erro ao sincronizar"
else
  echo "⚠️  MCC_ID não fornecido"
  echo "   Use: $0 [MCC_ID]"
  echo "   Ou configure GOOGLE_ADS_MCC_ID no .env"
fi

echo ""
echo "✅ Concluído!"
echo ""
echo "💡 Verifique a validação:"
echo "   curl \"$SYNC_SERVER_URL/funnel-validation?date_from=$DATE_FROM&date_to=$DATE_TO\" ${API_KEY:+-H \"X-API-Key: $API_KEY\"} | jq '.'"

