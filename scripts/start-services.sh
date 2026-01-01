#!/bin/bash

# Script para iniciar serviços
# Execute com: bash scripts/start-services.sh

set -e

PROJECT_DIR="/var/www/portal-certidao"

echo "🚀 Iniciando serviços..."

cd $PROJECT_DIR

# Verificar se .env existe
if [ ! -f "$PROJECT_DIR/.env" ]; then
    echo "❌ Arquivo .env não encontrado em $PROJECT_DIR"
    echo "   Certifique-se de fazer upload do arquivo .env"
    exit 1
fi

# Instalar dependências do sync-server se necessário
if [ ! -d "$PROJECT_DIR/node_modules" ]; then
    echo "📦 Instalando dependências do sync-server..."
    npm install
fi

# Parar sync-server se já estiver rodando
pm2 stop sync-server 2>/dev/null || true
pm2 delete sync-server 2>/dev/null || true

# Iniciar sync-server
echo "🚀 Iniciando sync-server..."
pm2 start sync-server.js --name sync-server
pm2 save

# Configurar PM2 para iniciar no boot
pm2 startup | tail -1 | bash || true

echo "✅ Serviços iniciados!"
echo ""
echo "📊 Status dos serviços:"
pm2 list
echo ""
echo "📝 Ver logs: pm2 logs sync-server"
echo "📊 Monitorar: pm2 monit"

