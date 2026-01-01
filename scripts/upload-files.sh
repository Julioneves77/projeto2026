#!/bin/bash

# Script para fazer upload dos arquivos para o servidor
# Execute LOCALMENTE (não no servidor)
# Configure as variáveis abaixo antes de executar

set -e

# ============================================
# CONFIGURAÇÃO - AJUSTE AQUI
# ============================================
SERVER_USER="seu_usuario"  # Altere para seu usuário SSH
SERVER_IP="143.198.10.145"
SERVER_PATH="/var/www"

# ============================================

echo "📤 Fazendo upload dos arquivos para o servidor..."

# Verificar se arquivos existem
if [ ! -d "PORTAL/dist" ]; then
    echo "❌ PORTAL/dist não encontrado. Execute: cd PORTAL && npm run build"
    exit 1
fi

if [ ! -d "PLATAFORMA/dist" ]; then
    echo "❌ PLATAFORMA/dist não encontrado. Execute: cd PLATAFORMA && npm run build"
    exit 1
fi

if [ ! -d "SOLICITE LINK/dist" ]; then
    echo "❌ SOLICITE LINK/dist não encontrado. Execute: cd 'SOLICITE LINK' && npm run build"
    exit 1
fi

if [ ! -f "sync-server.js" ]; then
    echo "❌ sync-server.js não encontrado"
    exit 1
fi

# Upload dos builds
echo "📤 Upload PORTAL/dist..."
rsync -avz --delete PORTAL/dist/ ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/portal/dist/

echo "📤 Upload PLATAFORMA/dist..."
rsync -avz --delete PLATAFORMA/dist/ ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/plataforma/dist/

echo "📤 Upload SOLICITE LINK/dist..."
rsync -avz --delete "SOLICITE LINK/dist/" ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/solicite-link/dist/

# Upload do sync-server
echo "📤 Upload sync-server..."
rsync -avz sync-server.js ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/portal-certidao/
rsync -avz services/ ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/portal-certidao/services/
rsync -avz utils/ ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/portal-certidao/utils/
rsync -avz package.json ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/portal-certidao/
rsync -avz .env ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/portal-certidao/

echo "✅ Upload concluído!"
echo ""
echo "📋 Próximos passos no servidor:"
echo "1. ssh ${SERVER_USER}@${SERVER_IP}"
echo "2. cd ${SERVER_PATH}/portal-certidao"
echo "3. sudo bash scripts/configure-nginx.sh"
echo "4. sudo bash scripts/configure-ssl.sh"
echo "5. bash scripts/start-services.sh"

