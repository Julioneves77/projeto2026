#!/bin/bash
# Script para ativar HTTPS no Guia Central
# Use quando: site está em HTTP e precisa de SSL
# Pré-requisito: DNS (A record) de www.guia-central.online e guia-central.online apontando para 143.198.10.145

set -e

SERVER_USER="${1:-root}"
SERVER_IP="143.198.10.145"

echo "🔒 Ativando HTTPS para guia-central.online"
echo "Servidor: ${SERVER_USER}@${SERVER_IP}"
echo ""

ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
set -e

echo "📦 Verificando Certbot..."
command -v certbot >/dev/null 2>&1 || {
    sudo apt-get update -qq
    sudo apt-get install -y certbot python3-certbot-nginx
}

echo ""
echo "🔐 Obtendo/renovando certificado SSL..."
echo "   (DNS deve apontar www.guia-central.online e guia-central.online para este servidor)"
echo ""

sudo certbot --nginx -d www.guia-central.online -d guia-central.online \
    --non-interactive --agree-tos --email contato@guia-central.online --redirect --expand

echo ""
echo "🔄 Recarregando Nginx..."
sudo nginx -t && sudo systemctl reload nginx

echo ""
echo "📋 Certificados:"
sudo certbot certificates 2>/dev/null | grep -A1 "guia-central" || true

echo ""
echo "✅ HTTPS ativado! Acesse: https://www.guia-central.online"
ENDSSH

echo ""
echo "💡 Se o site ainda não estiver em HTTPS, execute o deploy completo:"
echo "   ./deploy-guia-central.sh ${SERVER_USER}"
echo ""
