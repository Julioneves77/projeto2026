#!/bin/bash

# Script de Deploy - Portal Certidão
# Execute no servidor (IP: 143.198.10.145)

set -e

echo "🚀 Iniciando deploy do Portal Certidão..."

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar se está rodando como root ou com sudo
if [ "$EUID" -ne 0 ]; then 
    echo -e "${YELLOW}⚠️  Alguns comandos precisam de sudo. Execute: sudo bash deploy.sh${NC}"
fi

# Diretórios
WWW_DIR="/var/www"
PROJECT_DIR="$WWW_DIR/portal-certidao"
PORTAL_DIR="$WWW_DIR/portal"
PLATAFORMA_DIR="$WWW_DIR/plataforma"
SOLICITE_LINK_DIR="$WWW_DIR/solicite-link"

echo -e "${GREEN}📦 Instalando dependências do sistema...${NC}"

# Atualizar sistema
sudo apt-get update -y

# Instalar Node.js 18+
if ! command -v node &> /dev/null; then
    echo "📦 Instalando Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "✅ Node.js já instalado: $(node --version)"
fi

# Instalar PM2
if ! command -v pm2 &> /dev/null; then
    echo "📦 Instalando PM2..."
    sudo npm install -g pm2
else
    echo "✅ PM2 já instalado"
fi

# Instalar Nginx
if ! command -v nginx &> /dev/null; then
    echo "📦 Instalando Nginx..."
    sudo apt-get install -y nginx
else
    echo "✅ Nginx já instalado"
fi

# Criar diretórios
echo -e "${GREEN}📁 Criando diretórios...${NC}"
sudo mkdir -p $PROJECT_DIR
sudo mkdir -p $PORTAL_DIR
sudo mkdir -p $PLATAFORMA_DIR
sudo mkdir -p $SOLICITE_LINK_DIR
sudo mkdir -p $PROJECT_DIR/uploads
sudo mkdir -p $PROJECT_DIR/logs

# Definir permissões
echo -e "${GREEN}🔐 Configurando permissões...${NC}"
sudo chown -R $USER:$USER $PROJECT_DIR
sudo chown -R $USER:$USER $PORTAL_DIR
sudo chown -R $USER:$USER $PLATAFORMA_DIR
sudo chown -R $USER:$USER $SOLICITE_LINK_DIR

echo -e "${GREEN}✅ Preparação concluída!${NC}"
echo ""
echo "📋 Próximos passos:"
echo "1. Faça upload dos arquivos buildados para os diretórios:"
echo "   - PORTAL/dist/* → $PORTAL_DIR/dist/"
echo "   - PLATAFORMA/dist/* → $PLATAFORMA_DIR/dist/"
echo "   - SOLICITE LINK/dist/* → $SOLICITE_LINK_DIR/dist/"
echo "   - sync-server.js, services/, utils/, package.json, .env → $PROJECT_DIR/"
echo ""
echo "2. Execute: sudo bash scripts/configure-nginx.sh"
echo ""
echo "3. Execute: sudo bash scripts/configure-ssl.sh"
echo ""
echo "4. Execute: bash scripts/start-services.sh"




