#!/bin/bash
# Script para fazer deploy da funcionalidade de validação em produção

set -e

echo "🚀 Deploy da Validação de Funil em Produção"
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configurações
SERVER_USER="${SERVER_USER:-root}"
SERVER_HOST="${SERVER_HOST:-143.198.10.145}"
SERVER_PATH="${SERVER_PATH:-/var/www/portal-certidao}"
PLATAFORMA_DIST="${PLATAFORMA_DIST:-/var/www/plataforma/dist}"

echo "📋 Configurações:"
echo "   Servidor: ${SERVER_USER}@${SERVER_HOST}"
echo "   Caminho: ${SERVER_PATH}"
echo ""

# 1. Build do frontend PLATAFORMA
echo -e "${YELLOW}📦 Fazendo build do frontend PLATAFORMA...${NC}"
cd PLATAFORMA
npm run build
cd ..
echo -e "${GREEN}✅ Build concluído!${NC}"
echo ""

# 2. Verificar se o código do sync-server tem o endpoint
echo -e "${YELLOW}🔍 Verificando se o endpoint /funnel-validation existe no código...${NC}"
if grep -q "/funnel-validation" sync-server.js; then
    echo -e "${GREEN}✅ Endpoint encontrado no código!${NC}"
else
    echo -e "${RED}❌ Endpoint NÃO encontrado no código!${NC}"
    exit 1
fi
echo ""

# 3. Upload do sync-server.js atualizado
echo -e "${YELLOW}📤 Fazendo upload do sync-server.js...${NC}"
scp sync-server.js ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/sync-server.js
echo -e "${GREEN}✅ Upload concluído!${NC}"
echo ""

# 4. Upload do frontend PLATAFORMA
echo -e "${YELLOW}📤 Fazendo upload do frontend PLATAFORMA...${NC}"
ssh ${SERVER_USER}@${SERVER_HOST} "mkdir -p ${PLATAFORMA_DIST}"
scp -r PLATAFORMA/dist/* ${SERVER_USER}@${SERVER_HOST}:${PLATAFORMA_DIST}/
echo -e "${GREEN}✅ Upload concluído!${NC}"
echo ""

# 5. Reiniciar o servidor no servidor remoto
echo -e "${YELLOW}🔄 Reiniciando o sync-server no servidor...${NC}"
ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_HOST} "cd ${SERVER_PATH} && (pm2 restart sync-server 2>/dev/null || pm2 start sync-server.js --name sync-server 2>/dev/null || echo '⚠️ PM2 não encontrado. Reinicie manualmente.') && pm2 save 2>/dev/null || true"
echo -e "${GREEN}✅ Comando de reinicialização enviado!${NC}"
echo ""

# 6. Verificar se o endpoint está funcionando
echo -e "${YELLOW}🧪 Testando o endpoint em produção...${NC}"
sleep 3
API_KEY="6071d071d03a7a595ab3c1cd3477404f68995bfc3c030ff09065a80c2f96d59c"
TEST_URL="https://plataforma.portalcertidao.org/api/funnel-validation?date_from=2025-12-13&date_to=2026-01-12"

response=$(curl -s -w "\n%{http_code}" -H "X-API-Key: ${API_KEY}" "${TEST_URL}")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✅ Endpoint funcionando! Status: ${http_code}${NC}"
    echo "$body" | head -20
else
    echo -e "${RED}❌ Endpoint retornou status: ${http_code}${NC}"
    echo "$body" | head -10
fi

echo ""
echo -e "${GREEN}✅ Deploy concluído!${NC}"
echo ""
echo "💡 Próximos passos:"
echo "   1. Recarregue a página da Aba Coração em produção"
echo "   2. A seção 'Validação por Domínio' deve aparecer"
echo ""

