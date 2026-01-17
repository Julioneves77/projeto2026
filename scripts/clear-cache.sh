#!/bin/bash

# Script para limpar cache do navegador e servidor
# Remove conteúdo em cache que possa estar comprometido

set -e

echo "🧹 Limpando cache..."
echo ""

SERVER_USER="${1:-root}"
SERVER_HOST="${2:-143.198.10.145}"

# Limpar cache do Nginx no servidor
echo "🌐 Limpando cache do Nginx no servidor..."
echo ""

ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_HOST} << 'EOF'
  echo "Verificando configuração de cache do Nginx..."
  
  if [ -d /var/cache/nginx ]; then
    echo "   Limpando cache do Nginx..."
    sudo rm -rf /var/cache/nginx/*
    echo "   ✅ Cache do Nginx limpo"
  else
    echo "   ℹ️  Diretório de cache não encontrado (pode não estar configurado)"
  fi
  
  echo ""
  
  echo "Recarregando configuração do Nginx..."
  if sudo nginx -t 2>/dev/null; then
    sudo systemctl reload nginx
    echo "   ✅ Nginx recarregado"
  else
    echo "   ⚠️  Erro ao recarregar Nginx"
  fi
  
  echo ""
EOF

# Limpar cache local (se aplicável)
echo "💻 Instruções para limpar cache local:"
echo ""
echo "Chrome/Edge:"
echo "   1. Pressione Cmd+Shift+Delete (Mac) ou Ctrl+Shift+Delete (Windows)"
echo "   2. Selecione 'Imagens e arquivos em cache'"
echo "   3. Selecione 'Todo o período'"
echo "   4. Clique em 'Limpar dados'"
echo ""
echo "Firefox:"
echo "   1. Pressione Cmd+Shift+Delete (Mac) ou Ctrl+Shift+Delete (Windows)"
echo "   2. Selecione 'Cache'"
echo "   3. Selecione 'Tudo'"
echo "   4. Clique em 'Limpar agora'"
echo ""
echo "Safari:"
echo "   1. Pressione Cmd+Option+E para limpar cache"
echo "   2. Ou: Desenvolvedor > Limpar Caches"
echo ""

# Limpar cache do build local
echo "📦 Limpando cache do build local..."
echo ""

if [ -d "PORTAL_ACESSO/node_modules/.vite" ]; then
  echo "   Limpando cache do Vite..."
  rm -rf PORTAL_ACESSO/node_modules/.vite
  echo "   ✅ Cache do Vite limpo"
fi

if [ -d "PORTAL_ACESSO/dist" ]; then
  echo "   ⚠️  Diretório dist encontrado"
  echo "   Para fazer um novo build limpo, execute:"
  echo "   cd PORTAL_ACESSO && rm -rf dist && npm run build"
fi

echo ""
echo "=" | head -c 60
echo ""
echo "📊 RESUMO"
echo ""
echo "✅ Limpeza de cache concluída"
echo ""
echo "💡 Próximos passos:"
echo "   1. Limpe o cache do navegador seguindo as instruções acima"
echo "   2. Faça um novo build se necessário:"
echo "      cd PORTAL_ACESSO && npm run build"
echo "   3. Faça deploy do novo build:"
echo "      bash deploy-portal-acesso.sh"
echo "   4. Teste novamente no navegador"
echo ""

