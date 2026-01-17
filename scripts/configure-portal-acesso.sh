#!/bin/bash

# Script para configurar Portal Acesso no Nginx
# Execute com: sudo bash scripts/configure-portal-acesso.sh

set -e

echo "🔧 Configurando Portal Acesso no Nginx..."

# Diretórios
NGINX_SITES="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"
PORTAL_ACESSO_DIR="/var/www/portal-acesso/dist"

# Verificar se o diretório existe
if [ ! -d "$PORTAL_ACESSO_DIR" ]; then
    echo "⚠️  Diretório $PORTAL_ACESSO_DIR não encontrado!"
    echo "📦 Criando diretório..."
    sudo mkdir -p "$PORTAL_ACESSO_DIR"
    echo "✅ Diretório criado. Certifique-se de fazer o deploy do build do PORTAL_ACESSO para este diretório."
fi

# Configuração PORTAL_ACESSO
echo "📝 Criando configuração do nginx..."
cat > $NGINX_SITES/portalcacesso.online << 'EOF'
server {
    listen 80;
    server_name www.portalcacesso.online portalcacesso.online portalacesso.online;
    
    root /var/www/portal-acesso/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
}
EOF

# Habilitar site
echo "🔗 Habilitando site..."
ln -sf $NGINX_SITES/portalcacesso.online $NGINX_ENABLED/

# Testar configuração
echo "🧪 Testando configuração do Nginx..."
if nginx -t; then
    echo "✅ Configuração válida!"
    
    # Recarregar Nginx
    echo "🔄 Recarregando Nginx..."
    systemctl reload nginx
    
    echo ""
    echo "✅ Portal Acesso configurado com sucesso!"
    echo ""
    echo "📋 Próximos passos:"
    echo "   1. Certifique-se de que o build do PORTAL_ACESSO está em $PORTAL_ACESSO_DIR"
    echo "   2. Verifique se o domínio portalcacesso.online está apontando para este servidor"
    echo "   3. Teste o acesso: http://portalcacesso.online"
    echo "   4. (Opcional) Configure SSL: sudo certbot --nginx -d www.portalcacesso.online -d portalcacesso.online -d portalacesso.online"
else
    echo "❌ Erro na configuração do Nginx!"
    exit 1
fi

