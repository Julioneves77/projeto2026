#!/bin/bash

# Script de Deploy Completo - Portal Certidão
# Execute este script LOCALMENTE (não no servidor)

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 DEPLOY COMPLETO - Portal Certidão${NC}"
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

# Verificar se os builds existem
echo -e "${BLUE}📦 Verificando builds...${NC}"
if [ ! -d "PORTAL/dist" ]; then
    echo -e "${RED}❌ PORTAL/dist não encontrado!${NC}"
    echo "Execute: cd PORTAL && npm run build"
    exit 1
fi

if [ ! -d "PLATAFORMA/dist" ]; then
    echo -e "${RED}❌ PLATAFORMA/dist não encontrado!${NC}"
    echo "Execute: cd PLATAFORMA && npm run build"
    exit 1
fi

if [ ! -d "SOLICITE LINK/dist" ]; then
    echo -e "${RED}❌ SOLICITE LINK/dist não encontrado!${NC}"
    echo "Execute: cd 'SOLICITE LINK' && npm run build"
    exit 1
fi

if [ ! -f "sync-server.js" ]; then
    echo -e "${RED}❌ sync-server.js não encontrado!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Todos os builds encontrados!${NC}"
echo ""

# Testar conexão SSH
echo -e "${BLUE}🔌 Testando conexão SSH...${NC}"
if ! ssh -o ConnectTimeout=5 -o BatchMode=yes ${SERVER_USER}@${SERVER_IP} "echo 'OK'" 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Não foi possível conectar via SSH sem senha${NC}"
    echo "Você precisará digitar a senha algumas vezes"
    echo ""
fi

# Criar diretórios no servidor
echo -e "${BLUE}📁 Criando diretórios no servidor...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
mkdir -p /var/www/portal/dist
mkdir -p /var/www/plataforma/dist
mkdir -p /var/www/solicite-link/dist
mkdir -p /var/www/portal-certidao
mkdir -p /var/www/portal-certidao/uploads
mkdir -p /var/www/portal-certidao/logs
chown -R $USER:$USER /var/www/portal
chown -R $USER:$USER /var/www/plataforma
chown -R $USER:$USER /var/www/solicite-link
chown -R $USER:$USER /var/www/portal-certidao
ENDSSH

echo -e "${GREEN}✅ Diretórios criados!${NC}"
echo ""

# Upload PORTAL
echo -e "${BLUE}📤 Fazendo upload do PORTAL...${NC}"
rsync -avz --delete PORTAL/dist/ ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/portal/dist/
echo -e "${GREEN}✅ PORTAL enviado!${NC}"
echo ""

# Upload PLATAFORMA
echo -e "${BLUE}📤 Fazendo upload da PLATAFORMA...${NC}"
rsync -avz --delete PLATAFORMA/dist/ ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/plataforma/dist/
echo -e "${GREEN}✅ PLATAFORMA enviada!${NC}"
echo ""

# Upload SOLICITE LINK
echo -e "${BLUE}📤 Fazendo upload do SOLICITE LINK...${NC}"
rsync -avz --delete "SOLICITE LINK/dist/" ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/solicite-link/dist/
echo -e "${GREEN}✅ SOLICITE LINK enviado!${NC}"
echo ""

# Upload sync-server
echo -e "${BLUE}📤 Fazendo upload do sync-server...${NC}"
rsync -avz sync-server.js ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/portal-certidao/
rsync -avz services/ ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/portal-certidao/services/
rsync -avz utils/ ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/portal-certidao/utils/
rsync -avz package.json ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/portal-certidao/
rsync -avz ecosystem.config.js ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/portal-certidao/

# Verificar se .env existe localmente
if [ -f ".env" ]; then
    echo -e "${YELLOW}⚠️  Arquivo .env encontrado localmente${NC}"
    read -p "Deseja enviar o .env para o servidor? (s/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        rsync -avz .env ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/portal-certidao/
        echo -e "${GREEN}✅ .env enviado!${NC}"
    else
        echo -e "${YELLOW}⚠️  .env não foi enviado. Configure manualmente no servidor.${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Arquivo .env não encontrado localmente${NC}"
    echo "Você precisará criar/editar o .env no servidor"
fi

echo -e "${GREEN}✅ sync-server enviado!${NC}"
echo ""

echo -e "${GREEN}=========================================="
echo "✅ UPLOAD CONCLUÍDO!"
echo "==========================================${NC}"
echo ""
echo -e "${YELLOW}📋 PRÓXIMOS PASSOS NO SERVIDOR:${NC}"
echo ""
echo "1. Conecte ao servidor:"
echo -e "   ${BLUE}ssh ${SERVER_USER}@${SERVER_IP}${NC}"
echo ""
echo "2. Execute o script de configuração:"
echo -e "   ${BLUE}bash <(curl -s https://raw.githubusercontent.com/your-repo/configure-server.sh)${NC}"
echo ""
echo "   OU execute manualmente os comandos do arquivo:"
echo -e "   ${BLUE}FAZER_DEPLOY_AGORA.md${NC}"
echo ""
echo "3. Configure o Nginx (passo 6 do guia)"
echo "4. Configure SSL (passo 7 do guia)"
echo "5. Inicie o sync-server com PM2 (passo 8 do guia)"
echo ""
echo -e "${GREEN}🎉 Upload concluído! Agora configure o servidor.${NC}"




