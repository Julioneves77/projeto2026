#!/bin/bash
# Aplica proxy /api na plataforma mantendo SSL
# Execute: bash atualizar-nginx-plataforma-api.sh [usuario_ssh]

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_USER="${1:-root}"
SERVER_IP="143.198.10.145"

echo "🔧 Atualizando Nginx da plataforma (proxy /api + SSL)..."
scp -q "$SCRIPT_DIR/nginx-plataforma.conf" ${SERVER_USER}@${SERVER_IP}:/tmp/plataforma-nginx.conf
ssh ${SERVER_USER}@${SERVER_IP} 'sudo cp /tmp/plataforma-nginx.conf /etc/nginx/sites-available/plataforma.portalcertidao.org && sudo nginx -t && sudo systemctl reload nginx && echo "✅ Nginx atualizado e recarregado!"'
