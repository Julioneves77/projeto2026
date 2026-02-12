#!/bin/bash

# Script de Deploy - Guia das Certidões
# Uso: ./deploy-guia-certidoes.sh [usuario_ssh]

set -e

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configurações
SERVER_IP="143.198.10.145"
SERVER_USER="${1:-root}"
DOMAIN="www.centraldascertidoes.com"
APP_DIR="/var/www/guia-certidoes"
SOURCE_DIR="GUIA DAS CERTIDOES/dist"

echo -e "${GREEN}🚀 Iniciando deploy do Guia das Certidões${NC}"
echo "Servidor: ${SERVER_USER}@${SERVER_IP}"
echo "Domínio: ${DOMAIN}"
echo ""

# Verificar se o build existe
if [ ! -d "$SOURCE_DIR" ]; then
    echo -e "${YELLOW}⚠️  Build não encontrado. Compilando...${NC}"
    cd "GUIA DAS CERTIDOES"
    VITE_SYNC_SERVER_URL=https://www.portalcertidao.org/api npm run build
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

# Conectar ao servidor e criar diretório
echo -e "${YELLOW}🔌 Conectando ao servidor...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} << EOF
    echo "📁 Criando diretório $APP_DIR..."
    sudo mkdir -p $APP_DIR/dist
    sudo chown -R \$(whoami):www-data $APP_DIR
    sudo chmod -R 755 $APP_DIR
    echo "✅ Diretório criado"
EOF

# Fazer upload dos arquivos
echo -e "${YELLOW}📤 Fazendo upload dos arquivos...${NC}"
rsync -avz --delete --progress \
    "$SOURCE_DIR/" \
    ${SERVER_USER}@${SERVER_IP}:${APP_DIR}/dist/

echo -e "${GREEN}✅ Upload concluído${NC}"
echo ""

# Configurar Nginx (preserva HTTPS para não quebrar SSL)
echo -e "${YELLOW}⚙️  Configurando Nginx...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} << 'NGINX_EOF'
    CERT_DIR="/etc/letsencrypt/live/www.centraldascertidoes.com"
    [ ! -d "$CERT_DIR" ] && CERT_DIR="/etc/letsencrypt/live/centraldascertidoes.com"
    
    if [ -d "$CERT_DIR" ]; then
        sudo tee /etc/nginx/sites-available/centraldascertidoes.com > /dev/null << SSLEOF
server {
    listen 80;
    server_name www.centraldascertidoes.com centraldascertidoes.com;
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name www.centraldascertidoes.com centraldascertidoes.com;
    
    root /var/www/guia-certidoes/dist;
    index index.html;
    
    ssl_certificate ${CERT_DIR}/fullchain.pem;
    ssl_certificate_key ${CERT_DIR}/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    
    location / {
        try_files $uri $uri/ /index.html;
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
        echo "⚠️  Certificado não encontrado. Aplicando config HTTP (execute certbot para SSL)"
        sudo tee /etc/nginx/sites-available/centraldascertidoes.com > /dev/null << 'HTTPEOF'
server {
    listen 80;
    server_name www.centraldascertidoes.com centraldascertidoes.com;
    
    root /var/www/guia-certidoes/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
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

    sudo ln -sf /etc/nginx/sites-available/centraldascertidoes.com /etc/nginx/sites-enabled/
    echo "🧪 Testando configuração do Nginx..."
    sudo nginx -t
    echo "🔄 Recarregando Nginx..."
    sudo systemctl reload nginx
    echo "✅ Nginx configurado"
NGINX_EOF

echo -e "${GREEN}✅ Nginx configurado com sucesso${NC}"
echo ""

# Configurar permissões
echo -e "${YELLOW}🔐 Configurando permissões...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} << EOF
    sudo chown -R www-data:www-data $APP_DIR
    sudo chmod -R 755 $APP_DIR
    echo "✅ Permissões configuradas"
EOF

echo ""
echo -e "${GREEN}✅ Deploy concluído com sucesso!${NC}"
echo ""
echo "Próximos passos:"
echo "1. ✅ DNS já configurado (Registro A para www.centraldascertidoes.com → 143.198.10.145)"
echo "2. Aguarde propagação DNS (pode levar alguns minutos)"
echo "3. Configure SSL com: sudo certbot --nginx -d www.centraldascertidoes.com -d centraldascertidoes.com"
echo "4. Acesse: http://${DOMAIN} (ou https:// após configurar SSL)"
echo "5. Verifique se o site está funcionando corretamente"
echo ""
echo "Para configurar SSL automaticamente, execute no servidor:"
echo "  sudo certbot --nginx -d www.centraldascertidoes.com -d centraldascertidoes.com --non-interactive --agree-tos --email seu-email@exemplo.com"
