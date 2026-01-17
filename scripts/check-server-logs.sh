#!/bin/bash

# Script para verificar logs do servidor
# Detecta redirecionamentos e requisições suspeitas

set -e

echo "🔍 Verificando logs do servidor..."
echo ""

SERVER_USER="${1:-root}"
SERVER_HOST="${2:-143.198.10.145}"
SUSPICIOUS_DOMAINS=("userstat.net" "userstat.com" "stat.net")

echo "📋 Configuração:"
echo "   Servidor: ${SERVER_USER}@${SERVER_HOST}"
echo ""

# Verificar logs do Nginx
echo "📄 Verificando logs do Nginx..."
echo ""

ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_HOST} << 'EOF'
  echo "🔍 Últimos redirecionamentos (301/302):"
  echo ""
  tail -n 1000 /var/log/nginx/access.log 2>/dev/null | grep -E " 30[12] " | tail -20 || echo "   Nenhum redirecionamento recente encontrado"
  echo ""
  
  echo "🔍 Requisições para domínios suspeitos:"
  echo ""
  grep -i "userstat\|stat\.net" /var/log/nginx/access.log 2>/dev/null | tail -20 || echo "   Nenhuma requisição suspeita encontrada"
  echo ""
  
  echo "🔍 Erros recentes:"
  echo ""
  tail -n 100 /var/log/nginx/error.log 2>/dev/null | tail -20 || echo "   Nenhum erro recente"
  echo ""
  
  echo "🔍 Requisições para portalacesso.online:"
  echo ""
  tail -n 500 /var/log/nginx/access.log 2>/dev/null | grep -i "portalacesso\|portalcacesso" | tail -20 || echo "   Nenhuma requisição recente"
  echo ""
EOF

# Verificar logs do sync-server se existir
echo "📄 Verificando logs do sync-server..."
echo ""

ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_HOST} << 'EOF'
  if [ -f /var/www/portal-certidao/.pm2/logs/sync-server-out.log ]; then
    echo "🔍 Últimas linhas do sync-server:"
    echo ""
    tail -n 50 /var/www/portal-certidao/.pm2/logs/sync-server-out.log 2>/dev/null || echo "   Log não encontrado"
    echo ""
  fi
  
  if [ -f /var/www/portal-certidao/.pm2/logs/sync-server-error.log ]; then
    echo "🔍 Erros do sync-server:"
    echo ""
    tail -n 50 /var/www/portal-certidao/.pm2/logs/sync-server-error.log 2>/dev/null || echo "   Nenhum erro encontrado"
    echo ""
  fi
EOF

echo ""
echo "=" | head -c 60
echo ""
echo "📊 RESUMO"
echo ""
echo "✅ Verificação de logs concluída"
echo ""
echo "💡 Se encontrar redirecionamentos suspeitos:"
echo "   1. Anote o timestamp e IP"
echo "   2. Verifique a configuração do Nginx"
echo "   3. Execute: bash scripts/verify-dns-redirects.sh"
echo ""

