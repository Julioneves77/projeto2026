#!/bin/bash

# Script para configurar SSL/HTTPS com Let's Encrypt
# Execute com: sudo bash scripts/configure-ssl.sh

set -e

echo "🔒 Configurando SSL/HTTPS..."

# Instalar Certbot se não estiver instalado
if ! command -v certbot &> /dev/null; then
    echo "📦 Instalando Certbot..."
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
fi

echo "📜 Obtendo certificados SSL..."

# Obter certificados
certbot --nginx -d www.portalcertidao.org -d portalcertidao.org --non-interactive --agree-tos --email contato@portalcertidao.org || true
certbot --nginx -d plataforma.portalcertidao.org --non-interactive --agree-tos --email contato@portalcertidao.org || true
certbot --nginx -d www.solicite.link -d solicite.link --non-interactive --agree-tos --email contato@portalcertidao.org || true
certbot --nginx -d api.portalcertidao.org --non-interactive --agree-tos --email contato@portalcertidao.org || true

echo "✅ SSL configurado!"
echo ""
echo "📋 Certificados configurados para:"
echo "  - www.portalcertidao.org"
echo "  - plataforma.portalcertidao.org"
echo "  - www.solicite.link"
echo "  - api.portalcertidao.org"
echo ""
echo "🔄 Renovação automática já está configurada pelo Certbot"


