#!/bin/bash
# Testa o endpoint test-write do Sheets
# Uso: ./scripts/test-sheets-write.sh [SPREADSHEET_ID] [API_KEY]
# Ou defina: SYNC_URL, API_KEY, SPREADSHEET_ID no ambiente

SYNC_URL="${SYNC_URL:-https://plataforma.portalcertidao.org/api}"
API_KEY="${API_KEY:-}"
SPREADSHEET_ID="${1:-$SPREADSHEET_ID}"

if [ -z "$API_KEY" ]; then
  echo "Defina API_KEY (ex: export API_KEY=seu_api_key)"
  echo "Ou passe como 2º argumento"
  exit 1
fi

if [ -z "$SPREADSHEET_ID" ]; then
  echo "Defina SPREADSHEET_ID (ID da planilha da URL do Google Sheets)"
  echo "Ou passe como 1º argumento"
  exit 1
fi

echo "Testando POST $SYNC_URL/admin/sheets/test-write"
echo "Spreadsheet ID: $SPREADSHEET_ID"
echo ""

curl -s -X POST "$SYNC_URL/admin/sheets/test-write" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d "{\"spreadsheet_id\": \"$SPREADSHEET_ID\", \"worksheet_name\": \"Conversões\"}" | jq .
