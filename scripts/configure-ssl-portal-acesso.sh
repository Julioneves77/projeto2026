#!/bin/bash

# Script para configurar SSL/HTTPS apenas para Portal Acesso
# Execute com: sudo bash scripts/configure-ssl-portal-acesso.sh

set -e

echo "🔒 Configurando SSL/HTTPS para Portal Acesso..."

# Instalar Certbot se não estiver instalado
if ! command -v certbot &> /dev/null; then
    echo "📦 Instalando Certbot..."
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
fi

echo "📜 Obtendo certificado SSL para portalacesso.online..."

# Verificar se o site está configurado no nginx
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
    --redirect || {
    echo "⚠️  Erro ao obter certificado SSL"
    echo "Verifique:"
    echo "  1. O domínio está apontando para este servidor?"
    echo "  2. A porta 80 está acessível?"
    echo "  3. O nginx está rodando?"
    exit 1
}

echo ""
echo "✅ SSL configurado com sucesso!"
echo ""
echo "📋 Certificado configurado para:"
echo "  - www.portalcacesso.online"
echo "  - portalcacesso.online"
echo "  - portalacesso.online"
echo ""
echo "🌐 Teste o acesso:"
echo "  - https://portalcacesso.online"
echo "  - https://www.portalcacesso.online"
echo ""
echo "🔄 Renovação automática já está configurada pelo Certbot"

