#!/bin/bash
# Deploy PLATAFORMA + GUIA_CENTRAL (mensagens Plexi + campo Data Nascimento)
# Uso: ./deploy-plataforma-guia.sh [usuario_ssh]

set -e
SERVER_IP="143.198.10.145"
SERVER_USER="${1:-root}"

echo "🚀 Deploy PLATAFORMA + GUIA_CENTRAL"
echo "===================================="

# 1. Build PLATAFORMA
echo ""
echo "📦 Build PLATAFORMA..."
cd PLATAFORMA
npm run build
cd ..
[ -f "PLATAFORMA/dist/index.html" ] || { echo "❌ Build PLATAFORMA falhou"; exit 1; }
echo "✅ PLATAFORMA build OK"

# 2. Build GUIA_CENTRAL
echo ""
echo "📦 Build GUIA_CENTRAL..."
cd GUIA_CENTRAL
npm run build
cd ..
[ -f "GUIA_CENTRAL/dist/index.html" ] || { echo "❌ Build GUIA_CENTRAL falhou"; exit 1; }
echo "✅ GUIA_CENTRAL build OK"

# 3. Upload PLATAFORMA
echo ""
echo "📤 Upload PLATAFORMA → /var/www/plataforma/dist/"
rsync -avz --delete PLATAFORMA/dist/ ${SERVER_USER}@${SERVER_IP}:/var/www/plataforma/dist/
echo "✅ PLATAFORMA em produção (plataforma.portalcertidao.org)"

# 4. Upload GUIA_CENTRAL
echo ""
echo "📤 Upload GUIA_CENTRAL → /var/www/guia-central/dist/"
rsync -avz --delete GUIA_CENTRAL/dist/ ${SERVER_USER}@${SERVER_IP}:/var/www/guia-central/dist/
echo "✅ GUIA_CENTRAL em produção (guia-central.online)"

# 5. Garantir proxy /api no Nginx da plataforma (para sync-server)
echo ""
echo "⚙️  Verificando Nginx (proxy /api para sync-server)..."
if [ -f "atualizar-nginx-plataforma-api.sh" ]; then
  bash atualizar-nginx-plataforma-api.sh ${SERVER_USER}
  echo "✅ Nginx da plataforma verificado"
else
  echo "⚠️  Script atualizar-nginx-plataforma-api.sh não encontrado - verifique manualmente"
fi

# 6. Atualizar sync-server (GCLID/Sheets + utils)
echo ""
echo "📤 Atualizando sync-server..."
SERVER_PATH="/root/projeto-2026-estrutura"
rsync -avz sync-server.js ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/ 2>/dev/null || true
rsync -avz services/ ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/services/ 2>/dev/null || true
rsync -avz utils/ ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/utils/ 2>/dev/null || true
rsync -avz package.json ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/ 2>/dev/null || true
ssh ${SERVER_USER}@${SERVER_IP} "cd ${SERVER_PATH} && npm install --production 2>/dev/null && pm2 restart sync-server 2>/dev/null" && \
  echo "✅ Sync-server atualizado e reiniciado" || echo "⚠️  Sync-server não atualizado (verifique caminho)"

echo ""
echo "===================================="
echo "✅ Deploy concluído!"
echo "   - PLATAFORMA: https://plataforma.portalcertidao.org"
echo "   - GUIA_CENTRAL: https://www.guia-central.online"
echo "===================================="
