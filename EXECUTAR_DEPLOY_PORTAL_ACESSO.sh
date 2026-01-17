#!/bin/bash

# Script para executar deploy do Portal Acesso
# Execute: bash EXECUTAR_DEPLOY_PORTAL_ACESSO.sh

echo "🚀 Deploy Portal Acesso - Produção"
echo "=================================="
echo ""
echo "Este script irá:"
echo "1. Verificar/fazer build do PORTAL_ACESSO"
echo "2. Fazer upload para o servidor"
echo "3. Configurar nginx no servidor"
echo ""
read -p "Pressione ENTER para continuar ou CTRL+C para cancelar..."

# Verificar se o script de deploy existe
if [ ! -f "deploy-portal-acesso.sh" ]; then
    echo "❌ Script deploy-portal-acesso.sh não encontrado!"
    exit 1
fi

# Executar deploy
bash deploy-portal-acesso.sh

echo ""
echo "✅ Deploy concluído!"
echo ""
echo "📋 Próximos passos:"
echo "1. Verifique: http://portalcacesso.online"
echo "2. Se necessário, configure SSL: sudo certbot --nginx -d portalcacesso.online"

