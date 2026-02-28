#!/bin/bash
# Verifica e reinicia o sync-server no servidor de produção
# Uso: ./scripts/verificar-sync-server.sh

SERVER_IP="143.198.10.145"
SERVER_USER="${1:-root}"
SERVER_PATH="/root/projeto-2026-estrutura"

echo "🔍 Verificando sync-server em ${SERVER_USER}@${SERVER_IP}..."
echo ""

# Testar API
echo "1. Testando API (GET /api/admin/sheets/diagnostic)..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "X-API-Key: ${VITE_SYNC_SERVER_API_KEY:-6071d071d03a7a595ab3c1cd3477404f68995bfc3c030ff09065a80c2f96d59c}" "https://plataforma.portalcertidao.org/api/admin/sheets/diagnostic" 2>/dev/null || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
  echo "   ✅ API OK (HTTP $HTTP_CODE)"
  exit 0
else
  echo "   ❌ API retornou HTTP $HTTP_CODE (esperado 200)"
fi

echo ""
echo "2. Conectando ao servidor para diagnosticar..."
ssh ${SERVER_USER}@${SERVER_IP} << 'REMOTE'
  echo "   PM2 status:"
  pm2 status 2>/dev/null || echo "   PM2 não encontrado"
  echo ""
  echo "   Sync-server na porta 3001:"
  ss -tlnp 2>/dev/null | grep 3001 || netstat -tlnp 2>/dev/null | grep 3001 || echo "   Porta 3001 não está em uso"
  echo ""
  echo "   Reiniciando sync-server..."
  cd /root/projeto-2026-estrutura 2>/dev/null || cd ~/projeto-2026-estrutura 2>/dev/null || true
  pm2 restart sync-server 2>/dev/null && echo "   ✅ sync-server reiniciado" || echo "   ❌ Falha ao reiniciar"
  sleep 3
  pm2 logs sync-server --lines 5 --nostream 2>/dev/null || true
REMOTE

echo ""
echo "3. Testando API novamente..."
sleep 2
HTTP_CODE2=$(curl -s -o /dev/null -w "%{http_code}" -H "X-API-Key: ${VITE_SYNC_SERVER_API_KEY:-6071d071d03a7a595ab3c1cd3477404f68995bfc3c030ff09065a80c2f96d59c}" "https://plataforma.portalcertidao.org/api/admin/sheets/diagnostic" 2>/dev/null || echo "000")

if [ "$HTTP_CODE2" = "200" ]; then
  echo "   ✅ API OK após reinício (HTTP $HTTP_CODE2)"
else
  echo "   ❌ Ainda retornando HTTP $HTTP_CODE2. Verifique: pm2 logs sync-server"
fi
