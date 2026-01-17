#!/bin/bash

# Script para configurar HTTPS no Portal Acesso AGORA
# Execute: bash configurar-https-agora.sh [usuario_ssh]

set -e

SERVER_USER="${1:-root}"
SERVER_IP="143.198.10.145"

echo "🔒 Configurando HTTPS para Portal Acesso..."
echo "Servidor: ${SERVER_USER}@${SERVER_IP}"
echo ""

# Executar configuração SSL via SSH
ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
    echo "📦 Verificando Certbot..."
    if ! command -v certbot &> /dev/null; then
        echo "Instalando Certbot..."
        sudo apt-get update -qq
        sudo apt-get install -y certbot python3-certbot-nginx
    fi
    
    echo "🔍 Verificando configuração do nginx..."
    if [ ! -f "/etc/nginx/sites-available/portalcacesso.online" ]; then
        echo "❌ Site não configurado no nginx!"
        echo "Configurando nginx primeiro..."
        sudo tee /etc/nginx/sites-available/portalcacesso.online > /dev/null << 'EOF'
server {
    listen 80;
    server_name www.portalcacesso.online portalcacesso.online portalacesso.online;
    
    root /var/www/portal-acesso/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
}
EOF
        sudo ln -sf /etc/nginx/sites-available/portalcacesso.online /etc/nginx/sites-enabled/
        sudo nginx -t && sudo systemctl reload nginx
    fi
    
    echo "🔐 Configurando certificado SSL..."
    sudo certbot --nginx \
        -d www.portalcacesso.online \
        -d portalcacesso.online \
        -d portalacesso.online \
        --non-interactive \
        --agree-tos \
        --email contato@portalcertidao.org \
        --redirect || {
        echo "⚠️  Erro ao configurar SSL"
        echo "Verifique:"
        echo "  1. DNS está apontando para este servidor?"
        echo "  2. Porta 80 está acessível?"
        exit 1
    }
    
    echo ""
    echo "✅ SSL configurado com sucesso!"
    echo ""
    echo "🌐 Teste o acesso:"
    echo "  - https://portalcacesso.online"
    echo "  - https://www.portalcacesso.online"
ENDSSH

echo ""
echo "✅ Configuração concluída!"

