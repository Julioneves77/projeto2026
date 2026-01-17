#!/bin/bash

# Script de Deploy do Portal Acesso para Produção
# Execute este script LOCALMENTE (não no servidor)

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 DEPLOY PORTAL ACESSO - Produção${NC}"
echo "=========================================="
echo ""

# Configuração
SERVER_USER="${1:-root}"
SERVER_IP="143.198.10.145"
SERVER_PATH="/var/www"

echo -e "${YELLOW}⚠️  IMPORTANTE:${NC}"
echo "1. Você precisa ter acesso SSH ao servidor"
echo "2. Certifique-se de que tem a chave SSH configurada"
echo "3. O servidor deve estar acessível em ${SERVER_IP}"
echo ""
read -p "Pressione ENTER para continuar ou CTRL+C para cancelar..."

# Verificar se o build existe
echo -e "${BLUE}📦 Verificando build do PORTAL_ACESSO...${NC}"
if [ ! -d "PORTAL_ACESSO/dist" ]; then
    echo -e "${YELLOW}⚠️  PORTAL_ACESSO/dist não encontrado!${NC}"
    echo "Fazendo build..."
    cd PORTAL_ACESSO
    npm run build
    cd ..
    
    if [ ! -d "PORTAL_ACESSO/dist" ]; then
        echo -e "${RED}❌ Erro ao fazer build do PORTAL_ACESSO!${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ Build encontrado!${NC}"
echo ""

# Testar conexão SSH
echo -e "${BLUE}🔌 Testando conexão SSH...${NC}"
if ! ssh -o ConnectTimeout=5 -o BatchMode=yes ${SERVER_USER}@${SERVER_IP} "echo 'OK'" 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Não foi possível conectar via SSH sem senha${NC}"
    echo "Você precisará digitar a senha algumas vezes"
    echo ""
fi

# Criar diretório no servidor
echo -e "${BLUE}📁 Criando diretório no servidor...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
mkdir -p /var/www/portal-acesso/dist
chown -R $USER:$USER /var/www/portal-acesso
ENDSSH

echo -e "${GREEN}✅ Diretório criado!${NC}"
echo ""

# Upload PORTAL_ACESSO
echo -e "${BLUE}📤 Fazendo upload do PORTAL_ACESSO...${NC}"
rsync -avz --delete PORTAL_ACESSO/dist/ ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/portal-acesso/dist/
echo -e "${GREEN}✅ PORTAL_ACESSO enviado!${NC}"
echo ""

# Upload script de configuração do nginx
echo -e "${BLUE}📤 Enviando script de configuração do nginx...${NC}"
rsync -avz scripts/configure-portal-acesso.sh ${SERVER_USER}@${SERVER_IP}:/tmp/
echo -e "${GREEN}✅ Script enviado!${NC}"
echo ""

# Configurar nginx no servidor
echo -e "${BLUE}🔧 Configurando nginx no servidor...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
chmod +x /tmp/configure-portal-acesso.sh
sudo bash /tmp/configure-portal-acesso.sh
ENDSSH

# Perguntar se deseja configurar SSL
echo ""
read -p "Deseja configurar SSL/HTTPS agora? (s/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${BLUE}🔒 Configurando SSL/HTTPS...${NC}"
    ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
    if [ -f "scripts/configure-ssl-portal-acesso.sh" ]; then
        sudo bash scripts/configure-ssl-portal-acesso.sh
    else
        sudo certbot --nginx \
            -d www.portalcacesso.online \
            -d portalcacesso.online \
            -d portalacesso.online \
            --non-interactive \
            --agree-tos \
            --email contato@portalcertidao.org \
            --redirect || echo "⚠️  Erro ao configurar SSL. Execute manualmente: sudo bash scripts/configure-ssl-portal-acesso.sh"
    fi
ENDSSH
    echo -e "${GREEN}✅ SSL configurado!${NC}"
else
    echo -e "${YELLOW}⚠️  SSL não configurado. Configure depois com:${NC}"
    echo "   ssh ${SERVER_USER}@${SERVER_IP}"
    echo "   sudo bash scripts/configure-ssl-portal-acesso.sh"
fi

echo ""
echo -e "${GREEN}✅ Deploy do Portal Acesso concluído!${NC}"
echo ""
echo -e "${YELLOW}📋 Verificações:${NC}"
echo "1. Verifique se o domínio portalcacesso.online está apontando para o IP do servidor"
if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo "2. Teste o acesso: https://portalcacesso.online"
else
    echo "2. Teste o acesso: http://portalcacesso.online"
    echo "3. Configure SSL: sudo bash scripts/configure-ssl-portal-acesso.sh"
fi
echo ""

