#!/bin/bash
# Deploy do Chat Guia Central para produção
# Executa após deploy-guia-central.sh ou junto com ele

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

SERVER_IP="143.198.10.145"
SERVER_USER="${1:-root}"
CHAT_DIR="/var/www/chat-guia-central"

echo -e "${GREEN}🚀 Deploy do Chat Guia Central${NC}"
echo "Servidor: ${SERVER_USER}@${SERVER_IP}"
echo ""

# 1. Build GUIA_CENTRAL (inclui chat em public/chat/)
echo -e "${YELLOW}📦 Build do Guia Central (com chat)...${NC}"
cd "GUIA_CENTRAL"
npm run build
cd ..
echo -e "${GREEN}✅ Build concluído${NC}"
echo ""

# 2. Deploy frontend (dist com chat)
echo -e "${YELLOW}📤 Upload do Guia Central (dist)...${NC}"
rsync -avz --delete --progress \
  "GUIA_CENTRAL/dist/" \
  ${SERVER_USER}@${SERVER_IP}:/var/www/guia-central/dist/
echo -e "${GREEN}✅ Frontend atualizado${NC}"
echo ""

# 3. Deploy chat server
echo -e "${YELLOW}📤 Upload do servidor do chat...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} "mkdir -p ${CHAT_DIR}"
rsync -avz --progress \
  "chat-native/server/server.js" \
  "chat-native/server/package.json" \
  "chat-native/server/ecosystem.config.cjs" \
  ${SERVER_USER}@${SERVER_IP}:${CHAT_DIR}/
echo -e "${GREEN}✅ Servidor do chat enviado${NC}"
echo ""

# 4. Instalar deps e iniciar pm2
echo -e "${YELLOW}⚙️  Configurando chat no servidor...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} << 'CHAT_EOF'
set -e
CHAT_DIR="/var/www/chat-guia-central"
cd "$CHAT_DIR"
npm install --production 2>/dev/null || npm install
npx pm2 delete chat-guia-central 2>/dev/null || true
npx pm2 start ecosystem.config.cjs
npx pm2 save 2>/dev/null || true
echo "✅ Chat iniciado com pm2"
CHAT_EOF
echo ""

# 5. Nginx (proxy /api/chat já está em deploy-guia-central.sh)
echo -e "${YELLOW}ℹ️  Se o proxy /api/chat não existir no Nginx, execute deploy-guia-central.sh${NC}"
echo ""

echo -e "${GREEN}✅ Deploy do chat concluído!${NC}"
echo ""
echo "Acesse: https://www.guia-central.online"
echo "O botão 'Ajuda' deve aparecer no canto inferior direito."
echo ""
