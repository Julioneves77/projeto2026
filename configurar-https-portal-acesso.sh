#!/bin/bash

# Script para configurar HTTPS no Portal Acesso
# Execute no servidor: sudo bash configurar-https-portal-acesso.sh
# OU execute localmente para fazer via SSH: ./configurar-https-portal-acesso.sh [usuario_ssh]

set -e

SERVER_USER="${1:-root}"
SERVER_IP="143.198.10.145"

if [ "$1" != "" ] && [ "$1" != "root" ]; then
    # Executar via SSH
    echo "🔒 Configurando HTTPS via SSH..."
    ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
    if [ -f "scripts/configure-ssl-portal-acesso.sh" ]; then
        sudo bash scripts/configure-ssl-portal-acesso.sh
    else
        echo "📦 Instalando Certbot se necessário..."
        sudo apt-get update
        sudo apt-get install -y certbot python3-certbot-nginx
        
        echo "🔐 Configurando certificado SSL..."
        sudo certbot --nginx \
            -d www.portalcacesso.online \
            -d portalcacesso.online \
            -d portalacesso.online \
            --non-interactive \
            --agree-tos \
            --email contato@portalcertidao.org \
            --redirect
        
        echo "✅ SSL configurado!"
    fi
ENDSSH
else
    # Executar localmente no servidor
    echo "🔒 Configurando HTTPS para Portal Acesso..."
    
    # Instalar Certbot se não estiver instalado
    if ! command -v certbot &> /dev/null; then
        echo "📦 Instalando Certbot..."
        apt-get update
        apt-get install -y certbot python3-certbot-nginx
    fi
    
    # Verificar se o site está configurado
    if [ ! -f "/etc/nginx/sites-available/portalcacesso.online" ]; then
        echo "❌ Erro: Site portalacesso.online não está configurado no nginx!"
        echo "Execute primeiro: sudo bash scripts/configure-portal-acesso.sh"
        exit 1
    fi
    
    # Obter certificado SSL
    echo "🔐 Configurando certificado SSL..."
    certbot --nginx \
        -d www.portalcacesso.online \
        -d portalcacesso.online \
        -d portalacesso.online \
        --non-interactive \
        --agree-tos \
        --email contato@portalcertidao.org \
        --redirect
    
    echo ""
    echo "✅ SSL configurado com sucesso!"
    echo ""
    echo "🌐 Teste o acesso:"
    echo "  - https://portalcacesso.online"
    echo "  - https://www.portalcacesso.online"
fi

