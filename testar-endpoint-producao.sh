#!/bin/bash
# Script para testar o endpoint até funcionar

API_KEY="6071d071d03a7a595ab3c1cd3477404f68995bfc3c030ff09065a80c2f96d59c"
TEST_URL="https://plataforma.portalcertidao.org/api/funnel-validation?date_from=2025-12-13&date_to=2026-01-12"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "🧪 Testando endpoint em produção..."
echo ""

MAX_ATTEMPTS=10
ATTEMPT=1

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
    echo -e "${YELLOW}Tentativa $ATTEMPT/$MAX_ATTEMPTS...${NC}"
    
    response=$(curl -s -w "\n%{http_code}" -H "X-API-Key: ${API_KEY}" "${TEST_URL}" 2>/dev/null)
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✅✅✅ ENDPOINT FUNCIONANDO! ✅✅✅${NC}"
        echo ""
        echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
        echo ""
        echo -e "${GREEN}✅ Teste concluído com sucesso!${NC}"
        exit 0
    else
        echo -e "${RED}❌ Status: $http_code${NC}"
        if [ $ATTEMPT -lt $MAX_ATTEMPTS ]; then
            echo "⏳ Aguardando 5 segundos antes da próxima tentativa..."
            sleep 5
        fi
    fi
    
    ATTEMPT=$((ATTEMPT + 1))
done

echo ""
echo -e "${RED}❌ Endpoint ainda não está funcionando após $MAX_ATTEMPTS tentativas${NC}"
echo ""
echo "💡 Verifique se o servidor foi reiniciado:"
echo "   ssh root@143.198.10.145"
echo "   cd /var/www/portal-certidao"
echo "   pm2 restart sync-server"
echo ""
exit 1

