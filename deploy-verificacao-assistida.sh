#!/bin/bash

# Script de Deploy - Verificação Assistida
# Uso: ./deploy-verificacao-assistida.sh [usuario_ssh]

set -e

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configurações
SERVER_IP="143.198.10.145"
SERVER_USER="${1:-root}"
DOMAIN="www.verificacaoassistida.online"
APP_DIR="/var/www/verificacao-assistida"
SOURCE_DIR="Suporte Online/dist"

echo -e "${GREEN}🚀 Iniciando deploy da Verificação Assistida${NC}"
echo "Servidor: ${SERVER_USER}@${SERVER_IP}"
echo "Domínio: ${DOMAIN}"
echo ""

# Verificar se o build existe
if [ ! -d "$SOURCE_DIR" ]; then
    echo -e "${RED}❌ Erro: Pasta $SOURCE_DIR não encontrada!${NC}"
    echo "Execute 'npm run build' primeiro na pasta 'Suporte Online'"
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
    sudo mkdir -p $APP_DIR
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
    sudo tee /etc/nginx/sites-available/verificacaoassistida.online > /dev/null << 'EOF'
server {
    listen 80;
    server_name www.verificacaoassistida.online verificacaoassistida.online;
    
    root /var/www/verificacao-assistida/dist;
    index index.html;

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
    sudo ln -sf /etc/nginx/sites-available/verificacaoassistida.online /etc/nginx/sites-enabled/
    
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
echo "1. Configure SSL com: sudo certbot --nginx -d www.verificacaoassistida.online -d verificacaoassistida.online"
echo "2. Acesse: http://${DOMAIN}"
echo "3. Verifique se o site está funcionando corretamente"

