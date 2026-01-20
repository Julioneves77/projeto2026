#!/bin/bash

# Script de Deploy - Suporte Online
# Uso: ./deploy-suporte-online.sh [usuario_ssh]

set -e

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configurações
SERVER_IP="143.198.10.145"
SERVER_USER="${1:-root}"
DOMAIN="www.suporteonline.digital"
APP_DIR="/var/www/suporte-online"
SOURCE_DIR="SUPORTE ONLINE 2/dist"

echo -e "${GREEN}🚀 Iniciando deploy do Suporte Online${NC}"
echo "Servidor: ${SERVER_USER}@${SERVER_IP}"
echo "Domínio: ${DOMAIN}"
echo ""

# Verificar se o build existe
if [ ! -d "$SOURCE_DIR" ]; then
    echo -e "${RED}❌ Erro: Pasta $SOURCE_DIR não encontrada!${NC}"
    echo "Execute 'npm run build' primeiro na pasta 'SUPORTE ONLINE 2'"
    exit 1
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

# Configurar Nginx
echo -e "${YELLOW}⚙️  Configurando Nginx...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} << 'NGINX_EOF'
    sudo tee /etc/nginx/sites-available/suporteonline.digital > /dev/null << 'EOF'
server {
    listen 80;
    server_name www.suporteonline.digital suporteonline.digital;
    
    # Redirecionar HTTP para HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name www.suporteonline.digital suporteonline.digital;
    
    root /var/www/suporte-online/dist;
    index index.html;

    # SSL Configuration (se certificado existir)
    ssl_certificate /etc/letsencrypt/live/www.suporteonline.digital/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/www.suporteonline.digital/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    # Cache para assets estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

    # Habilitar site
    sudo ln -sf /etc/nginx/sites-available/suporteonline.digital /etc/nginx/sites-enabled/
    
    # Testar configuração
    echo "🧪 Testando configuração do Nginx..."
    sudo nginx -t
    
    # Recarregar Nginx
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
echo "1. Configure DNS: Registro A para www.suporteonline.digital → 143.198.10.145"
echo "2. Aguarde propagação DNS (pode levar alguns minutos)"
echo "3. Configure SSL com: sudo certbot --nginx -d www.suporteonline.digital -d suporteonline.digital"
echo "4. Acesse: https://${DOMAIN}"
echo "5. Verifique se o site está funcionando corretamente"

