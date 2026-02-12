#!/bin/bash

# Script de Deploy - Guia Central
# Uso: ./deploy-guia-central.sh [usuario_ssh]

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

SERVER_IP="143.198.10.145"
SERVER_USER="${1:-root}"
DOMAIN="www.guia-central.online"
APP_DIR="/var/www/guia-central"
SOURCE_DIR="GUIA_CENTRAL/dist"

echo -e "${GREEN}🚀 Iniciando deploy do Guia Central${NC}"
echo "Servidor: ${SERVER_USER}@${SERVER_IP}"
echo "Domínio: ${DOMAIN}"
echo ""

if [ ! -d "$SOURCE_DIR" ]; then
    echo -e "${YELLOW}⚠️  Build não encontrado. Compilando...${NC}"
    cd "GUIA_CENTRAL"
    npm run build
    cd ..
    
    if [ ! -d "$SOURCE_DIR" ]; then
        echo -e "${RED}❌ Erro: Build falhou!${NC}"
        exit 1
    fi
fi

echo -e "${YELLOW}📦 Verificando build...${NC}"
if [ ! -f "$SOURCE_DIR/index.html" ]; then
    echo -e "${RED}❌ Erro: index.html não encontrado em $SOURCE_DIR${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Build encontrado${NC}"
echo ""

echo -e "${YELLOW}🔌 Conectando ao servidor...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} << EOF
    echo "📁 Criando diretório $APP_DIR..."
    sudo mkdir -p $APP_DIR/dist
    sudo chown -R \$(whoami):www-data $APP_DIR
    sudo chmod -R 755 $APP_DIR
    echo "✅ Diretório criado"
EOF

echo -e "${YELLOW}📤 Fazendo upload dos arquivos...${NC}"
rsync -avz --delete --progress \
    "$SOURCE_DIR/" \
    ${SERVER_USER}@${SERVER_IP}:${APP_DIR}/dist/

echo -e "${GREEN}✅ Upload concluído${NC}"
echo ""

echo -e "${YELLOW}⚙️  Configurando Nginx e SSL...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} << 'NGINX_EOF'
    set -e
    CERT_DIR="/etc/letsencrypt/live/www.guia-central.online"
    [ ! -d "$CERT_DIR" ] && CERT_DIR="/etc/letsencrypt/live/guia-central.online"
    
    # Instalar certbot se não existir
    command -v certbot >/dev/null 2>&1 || { sudo apt-get update -qq; sudo apt-get install -y certbot python3-certbot-nginx; }
    
    # Se certificado não existe: config HTTP temporária + obter cert + reconfig
    if [ ! -d "$CERT_DIR" ]; then
        echo "🌐 Configurando HTTP temporário para validação..."
        sudo tee /etc/nginx/sites-available/guia-central.online > /dev/null << 'TEMPHTTP'
server {
    listen 80;
    server_name www.guia-central.online guia-central.online;
    root /var/www/guia-central/dist;
    index index.html;
    location / { try_files $uri $uri/ /index.html; }
}
TEMPHTTP
        sudo ln -sf /etc/nginx/sites-available/guia-central.online /etc/nginx/sites-enabled/
        sudo nginx -t 2>/dev/null && sudo systemctl reload nginx 2>/dev/null || true
        echo "🔐 Obtendo certificado SSL (DNS deve apontar para este servidor)..."
        if sudo certbot --nginx -d www.guia-central.online -d guia-central.online \
            --non-interactive --agree-tos --email contato@guia-central.online --redirect 2>/dev/null; then
            echo "✅ Certificado obtido com sucesso!"
        else
            echo "⚠️  Certbot falhou. Verifique: DNS (A record) apontando para este servidor."
            echo "   Execute manualmente: sudo certbot --nginx -d www.guia-central.online -d guia-central.online"
        fi
        CERT_DIR="/etc/letsencrypt/live/www.guia-central.online"
        [ ! -d "$CERT_DIR" ] && CERT_DIR="/etc/letsencrypt/live/guia-central.online"
    fi
    
    if [ -d "$CERT_DIR" ]; then
        echo "🔒 Aplicando configuração HTTPS..."
        sudo tee /etc/nginx/sites-available/guia-central.online > /dev/null << SSLEOF
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
    
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
SSLEOF
        echo "✅ Configuração com SSL aplicada"
    else
        echo "⚠️  Certificado não encontrado. Aplicando config HTTP (execute certbot manualmente para SSL)"
        sudo tee /etc/nginx/sites-available/guia-central.online > /dev/null << 'HTTPEOF'
server {
    listen 80;
    server_name www.guia-central.online guia-central.online;
    
    root /var/www/guia-central/dist;
    index index.html;
    
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
HTTPEOF
    fi

    sudo ln -sf /etc/nginx/sites-available/guia-central.online /etc/nginx/sites-enabled/
    echo "🧪 Testando configuração do Nginx..."
    sudo nginx -t
    echo "🔄 Recarregando Nginx..."
    sudo systemctl reload nginx
    echo "✅ Nginx configurado"
NGINX_EOF

echo -e "${YELLOW}🔐 Configurando permissões...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} << EOF
    sudo chown -R www-data:www-data $APP_DIR
    sudo chmod -R 755 $APP_DIR
    echo "✅ Permissões configuradas"
EOF

echo ""
echo -e "${GREEN}✅ Deploy concluído com sucesso!${NC}"
echo ""
echo "Acesse: https://${DOMAIN}"
echo ""
