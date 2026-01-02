#!/bin/bash

# Script para configurar o servidor
# Execute este script NO SERVIDOR (após fazer upload dos arquivos)

set -e

echo "🔧 Configurando servidor..."
echo ""

# Verificar se está rodando como root ou com sudo
if [ "$EUID" -ne 0 ]; then 
    echo "⚠️  Este script precisa de privilégios sudo"
    echo "Execute: sudo bash configurar-servidor.sh"
    exit 1
fi

# Instalar dependências do sistema
echo "📦 Instalando dependências do sistema..."
apt update -qq
apt install -y curl nginx certbot python3-certbot-nginx > /dev/null 2>&1

# Instalar Node.js se não tiver
if ! command -v node &> /dev/null; then
    echo "📦 Instalando Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi

# Instalar PM2 se não tiver
if ! command -v pm2 &> /dev/null; then
    echo "📦 Instalando PM2..."
    npm install -g pm2
fi

echo "✅ Dependências instaladas!"
echo ""

# Configurar Nginx
echo "🔧 Configurando Nginx..."

# PORTAL
cat > /etc/nginx/sites-available/portalcertidao.org << 'EOF'
server {
    listen 80;
    server_name www.portalcertidao.org portalcertidao.org;
    root /var/www/portal/dist;
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

# PLATAFORMA
cat > /etc/nginx/sites-available/plataforma.portalcertidao.org << 'EOF'
server {
    listen 80;
    server_name plataforma.portalcertidao.org;
    root /var/www/plataforma/dist;
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

# SOLICITE LINK
cat > /etc/nginx/sites-available/solicite.link << 'EOF'
server {
    listen 80;
    server_name www.solicite.link solicite.link;
    root /var/www/solicite-link/dist;
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

# API
cat > /etc/nginx/sites-available/api.portalcertidao.org << 'EOF'
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
ln -sf /etc/nginx/sites-available/portalcertidao.org /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/plataforma.portalcertidao.org /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/solicite.link /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/api.portalcertidao.org /etc/nginx/sites-enabled/

# Remover default
rm -f /etc/nginx/sites-enabled/default

# Testar configuração
echo "🧪 Testando configuração do Nginx..."
nginx -t

# Recarregar Nginx
echo "🔄 Recarregando Nginx..."
systemctl reload nginx

echo "✅ Nginx configurado!"
echo ""

# Configurar sync-server
echo "🔧 Configurando sync-server..."
cd /var/www/portal-certidao

# Instalar dependências
if [ -f "package.json" ]; then
    echo "📦 Instalando dependências do Node.js..."
    npm install --production
fi

# Verificar se .env existe
if [ ! -f ".env" ]; then
    echo "⚠️  Arquivo .env não encontrado!"
    echo "Crie o arquivo .env com as configurações necessárias"
    echo "Você pode copiar de .env.example se existir"
fi

# Iniciar com PM2
echo "🚀 Iniciando sync-server com PM2..."
pm2 delete sync-server 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

# Configurar PM2 para iniciar no boot
echo "⚙️  Configurando PM2 para iniciar no boot..."
pm2 startup systemd -u $SUDO_USER --hp /home/$SUDO_USER | grep "sudo" | bash || true

echo "✅ Servidor configurado!"
echo ""
echo "=========================================="
echo "✅ CONFIGURAÇÃO CONCLUÍDA!"
echo "=========================================="
echo ""
echo "📋 Próximos passos:"
echo ""
echo "1. Configure SSL (HTTPS):"
echo "   sudo certbot --nginx -d www.portalcertidao.org -d portalcertidao.org"
echo "   sudo certbot --nginx -d plataforma.portalcertidao.org"
echo "   sudo certbot --nginx -d www.solicite.link -d solicite.link"
echo "   sudo certbot --nginx -d api.portalcertidao.org"
echo ""
echo "2. Verificar status:"
echo "   pm2 status"
echo "   pm2 logs sync-server"
echo "   sudo systemctl status nginx"
echo ""
echo "3. Testar os sites:"
echo "   https://www.portalcertidao.org"
echo "   https://plataforma.portalcertidao.org"
echo "   https://www.solicite.link"
echo ""


