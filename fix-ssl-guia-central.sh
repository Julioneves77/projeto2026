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
echo "🔐 Obtendo/renovando certificado SSL (certonly --webroot, sem alterar config Nginx)..."
echo "   (DNS deve apontar www.guia-central.online e guia-central.online para este servidor)"
echo ""

# certonly --webroot: obtém cert sem modificar Nginx (evita sobrescrever listen 143.198.10.145:443)
sudo certbot certonly --webroot -w /var/www/guia-central/dist \
    -d www.guia-central.online -d guia-central.online \
    --non-interactive --agree-tos --email contato@guia-central.online --expand 2>/dev/null || true

echo ""
echo "🔄 Aplicando config Nginx com SSL..."
CERT_DIR="/etc/letsencrypt/live/guia-central.online"
[ ! -d "$CERT_DIR" ] && CERT_DIR="/etc/letsencrypt/live/www.guia-central.online"
if [ -d "$CERT_DIR" ]; then
    sudo tee /etc/nginx/sites-available/guia-central.online > /dev/null << NGXEOF
server {
    listen 80;
    server_name www.guia-central.online guia-central.online;
    return 301 https://\$host\$request_uri;
}

server {
    listen 143.198.10.145:443 ssl http2;
    listen [::]:443 ssl http2;
    server_name www.guia-central.online guia-central.online;
    
    root /var/www/guia-central/dist;
    index index.html;
    
    ssl_certificate ${CERT_DIR}/fullchain.pem;
    ssl_certificate_key ${CERT_DIR}/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    
    location / { try_files \$uri \$uri/ /index.html; }

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
NGXEOF
    sudo ln -sf /etc/nginx/sites-available/guia-central.online /etc/nginx/sites-enabled/
fi

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
