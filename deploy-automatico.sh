#!/bin/bash

# Script de Deploy Automático - Portal Certidão
# Execute este script LOCALMENTE

set -e

SERVER_USER="${1:-root}"
SERVER_IP="143.198.10.145"
SERVER_PATH="/var/www"

echo "🚀 Iniciando deploy automático..."
echo "Servidor: ${SERVER_USER}@${SERVER_IP}"
echo ""

# Verificar builds
echo "📦 Verificando builds..."
[ ! -d "PORTAL/dist" ] && { echo "❌ PORTAL/dist não encontrado!"; exit 1; }
[ ! -d "PLATAFORMA/dist" ] && { echo "❌ PLATAFORMA/dist não encontrado!"; exit 1; }
[ ! -d "SOLICITE LINK/dist" ] && { echo "❌ SOLICITE LINK/dist não encontrado!"; exit 1; }
[ ! -f "sync-server.js" ] && { echo "❌ sync-server.js não encontrado!"; exit 1; }
echo "✅ Builds verificados!"
echo ""

# Criar diretórios no servidor
echo "📁 Criando diretórios no servidor..."
ssh ${SERVER_USER}@${SERVER_IP} "mkdir -p ${SERVER_PATH}/portal/dist ${SERVER_PATH}/plataforma/dist ${SERVER_PATH}/solicite-link/dist ${SERVER_PATH}/portal-certidao/uploads ${SERVER_PATH}/portal-certidao/logs ${SERVER_PATH}/portal-certidao/storage/certidoes && chown -R \$(whoami):\$(whoami) ${SERVER_PATH}/portal ${SERVER_PATH}/plataforma ${SERVER_PATH}/solicite-link ${SERVER_PATH}/portal-certidao" || {
    echo "⚠️  Erro ao criar diretórios. Continuando..."
}
echo ""

# Upload PORTAL
echo "📤 Upload PORTAL..."
rsync -avz --delete PORTAL/dist/ ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/portal/dist/ || {
    echo "❌ Erro no upload do PORTAL"
    exit 1
}
echo "✅ PORTAL enviado!"
echo ""

# Upload PLATAFORMA
echo "📤 Upload PLATAFORMA..."
rsync -avz --delete PLATAFORMA/dist/ ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/plataforma/dist/ || {
    echo "❌ Erro no upload da PLATAFORMA"
    exit 1
}
echo "✅ PLATAFORMA enviada!"
echo ""

# Upload SOLICITE LINK
echo "📤 Upload SOLICITE LINK..."
rsync -avz --delete "SOLICITE LINK/dist/" ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/solicite-link/dist/ || {
    echo "❌ Erro no upload do SOLICITE LINK"
    exit 1
}
echo "✅ SOLICITE LINK enviado!"
echo ""

# Upload sync-server
echo "📤 Upload sync-server..."
rsync -avz sync-server.js ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/portal-certidao/ || exit 1
rsync -avz services/ ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/portal-certidao/services/ || exit 1
rsync -avz utils/ ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/portal-certidao/utils/ || exit 1
rsync -avz package.json ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/portal-certidao/ || exit 1
rsync -avz ecosystem.config.js ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/portal-certidao/ || exit 1
# PM2 roda de /root/projeto-2026-estrutura - sincronizar sync-server completo
echo "📤 Sincronizando sync-server para PM2 (projeto-2026-estrutura)..."
rsync -avz sync-server.js services/ utils/ package.json ecosystem.config.js ${SERVER_USER}@${SERVER_IP}:/root/projeto-2026-estrutura/ 2>/dev/null || true
ssh ${SERVER_USER}@${SERVER_IP} "cd /root/projeto-2026-estrutura && pm2 restart sync-server" 2>/dev/null || true

# Enviar .env se existir
if [ -f ".env" ]; then
    echo "📤 Enviando .env..."
    rsync -avz .env ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/portal-certidao/ || echo "⚠️  Erro ao enviar .env"
fi

echo "✅ sync-server enviado!"
echo ""

echo "=========================================="
echo "✅ UPLOAD CONCLUÍDO!"
echo "=========================================="
echo ""
echo "📋 Próximo passo:"
echo "   ssh ${SERVER_USER}@${SERVER_IP}"
echo "   cd /var/www/portal-certidao"
echo "   sudo bash configurar-servidor.sh"
echo ""




