#!/bin/bash

# Script para configurar Nginx
# Execute com: sudo bash scripts/configure-nginx.sh

set -e

echo "🔧 Configurando Nginx..."

# Diretórios
NGINX_SITES="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"

# Configuração PORTAL
cat > $NGINX_SITES/portalcertidao.org << 'EOF'
server {
    listen 80;
    server_name www.portalcertidao.org portalcertidao.org;
    
    root /var/www/portal/dist;
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

# Configuração PLATAFORMA
cat > $NGINX_SITES/plataforma.portalcertidao.org << 'EOF'
server {
    listen 80;
    server_name plataforma.portalcertidao.org;
    
    root /var/www/plataforma/dist;
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

# Configuração SOLICITE LINK
cat > $NGINX_SITES/solicite.link << 'EOF'
server {
    listen 80;
    server_name www.solicite.link solicite.link;
    
    root /var/www/solicite-link/dist;
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

# Configuração API
cat > $NGINX_SITES/api.portalcertidao.org << 'EOF'
server {
    listen 80;
    server_name api.portalcertidao.org;

    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Habilitar sites
echo "🔗 Habilitando sites..."
ln -sf $NGINX_SITES/portalcertidao.org $NGINX_ENABLED/
ln -sf $NGINX_SITES/plataforma.portalcertidao.org $NGINX_ENABLED/
ln -sf $NGINX_SITES/solicite.link $NGINX_ENABLED/
ln -sf $NGINX_SITES/api.portalcertidao.org $NGINX_ENABLED/

# Remover site padrão se existir
rm -f $NGINX_ENABLED/default

# Testar configuração
echo "🧪 Testando configuração do Nginx..."
nginx -t

# Recarregar Nginx
echo "🔄 Recarregando Nginx..."
systemctl reload nginx

echo "✅ Nginx configurado com sucesso!"

