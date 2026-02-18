#!/bin/bash

# Script para configurar/corrigir SSL em todos os domínios
# Use quando HTTPS parar de funcionar após deploys

set -e

SERVER_USER="${1:-root}"
SERVER_IP="143.198.10.145"
EMAIL="contato@portalcertidao.org"

echo "🔒 Configurando SSL em todos os domínios"
echo "Servidor: ${SERVER_USER}@${SERVER_IP}"
echo ""

ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
set -e

echo "📦 Verificando Certbot..."
command -v certbot >/dev/null || { sudo apt-get update -qq; sudo apt-get install -y certbot python3-certbot-nginx; }

echo ""
echo "🔐 Configurando certificados SSL..."

# guia-central.online (certonly --webroot: NÃO altera Nginx - deploy-guia-central aplica a config)
echo "  → guia-central.online"
sudo certbot certonly --webroot -w /var/www/guia-central/dist \
    -d www.guia-central.online -d guia-central.online \
    --non-interactive --agree-tos --email contato@guia-central.online --expand 2>/dev/null || echo "    (já existe ou falhou)"

# centraldascertidoes.com / guiadascertidoes.online (mesmo servidor)
echo "  → centraldascertidoes.com"
sudo certbot --nginx -d www.centraldascertidoes.com -d centraldascertidoes.com \
    --non-interactive --agree-tos --email contato@portalcertidao.org --redirect --expand 2>/dev/null || echo "    (já existe ou falhou)"

echo "  → guiadascertidoes.online"
sudo certbot --nginx -d www.guiadascertidoes.online -d guiadascertidoes.online \
    --non-interactive --agree-tos --email contato@portalcertidao.org --redirect --expand 2>/dev/null || echo "    (já existe ou falhou)"

echo ""
echo "🔄 Renovando certificados existentes..."
sudo certbot renew --quiet --no-self-upgrade 2>/dev/null || true

echo ""
echo "📋 Certificados instalados:"
sudo certbot certificates 2>/dev/null | grep -E "Certificate Name|Domains:" || true

echo ""
echo "✅ SSL verificado!"
ENDSSH

echo ""
echo "✅ Concluído. Execute o deploy do Guia Central para aplicar a config Nginx com SSL:"
echo "   ./deploy-guia-central.sh ${SERVER_USER}"
echo ""
