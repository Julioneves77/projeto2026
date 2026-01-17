#!/bin/bash

# Script para verificar DNS e redirecionamentos
# Detecta problemas de configuração DNS e redirecionamentos no servidor

set -e

echo "🔍 Verificando DNS e redirecionamentos..."
echo ""

DOMAIN="www.portalacesso.online"
SERVER_IP="143.198.10.145"

echo "📋 Domínio: ${DOMAIN}"
echo "📋 IP do servidor: ${SERVER_IP}"
echo ""

# Verificar DNS
echo "🌐 Verificando DNS..."
echo ""

echo "Registro A:"
DNS_A=$(dig +short ${DOMAIN} A 2>/dev/null || echo "")
if [ -z "$DNS_A" ]; then
  echo "   ⚠️  DNS não encontrado ou não propagado"
else
  echo "   ${DNS_A}"
  if [ "$DNS_A" = "$SERVER_IP" ]; then
    echo "   ✅ Apontando para o servidor correto"
  else
    echo "   ⚠️  Apontando para IP diferente do esperado"
    echo "   Esperado: ${SERVER_IP}"
  fi
fi
echo ""

echo "Registro AAAA (IPv6):"
DNS_AAAA=$(dig +short ${DOMAIN} AAAA 2>/dev/null || echo "")
if [ -z "$DNS_AAAA" ]; then
  echo "   ℹ️  Nenhum registro IPv6 encontrado (normal)"
else
  echo "   ${DNS_AAAA}"
fi
echo ""

echo "Registro CNAME:"
DNS_CNAME=$(dig +short ${DOMAIN} CNAME 2>/dev/null || echo "")
if [ -z "$DNS_CNAME" ]; then
  echo "   ✅ Nenhum CNAME encontrado (correto)"
else
  echo "   ⚠️  CNAME encontrado: ${DNS_CNAME}"
  echo "   Verifique se este CNAME não está causando redirecionamento"
fi
echo ""

# Verificar redirecionamentos HTTP
echo "🌐 Testando redirecionamentos HTTP..."
echo ""

echo "Teste HTTP (sem seguir redirecionamentos):"
HTTP_RESPONSE=$(curl -sI -L --max-redirs 0 "http://${DOMAIN}" 2>&1 | head -10 || echo "")
if echo "$HTTP_RESPONSE" | grep -q "301\|302"; then
  REDIRECT_URL=$(echo "$HTTP_RESPONSE" | grep -i "location:" | cut -d' ' -f2- | tr -d '\r')
  echo "   ⚠️  Redirecionamento detectado:"
  echo "   ${REDIRECT_URL}"
  
  if echo "$REDIRECT_URL" | grep -qi "userstat"; then
    echo "   🔴 REDIRECIONAMENTO SUSPEITO PARA USERSTAT!"
  fi
else
  echo "   ✅ Nenhum redirecionamento HTTP detectado"
fi
echo ""

echo "Teste HTTPS (seguindo redirecionamentos):"
HTTPS_RESPONSE=$(curl -sI -L "https://${DOMAIN}" 2>&1 | head -15 || echo "")
if echo "$HTTPS_RESPONSE" | grep -q "301\|302"; then
  REDIRECT_URL=$(echo "$HTTPS_RESPONSE" | grep -i "location:" | head -1 | cut -d' ' -f2- | tr -d '\r')
  echo "   ⚠️  Redirecionamento detectado:"
  echo "   ${REDIRECT_URL}"
  
  if echo "$REDIRECT_URL" | grep -qi "userstat"; then
    echo "   🔴 REDIRECIONAMENTO SUSPEITO PARA USERSTAT!"
  fi
else
  echo "   ✅ Nenhum redirecionamento HTTPS suspeito"
fi
echo ""

# Verificar configuração do Nginx no servidor
echo "🔧 Verificando configuração do Nginx no servidor..."
echo ""

SERVER_USER="${1:-root}"
SERVER_HOST="${2:-143.198.10.145}"

ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_HOST} << EOF
  echo "Configuração do Nginx para ${DOMAIN}:"
  echo ""
  
  if [ -f /etc/nginx/sites-enabled/portalcacesso.online ]; then
    echo "📄 Arquivo de configuração encontrado:"
    cat /etc/nginx/sites-enabled/portalcacesso.online | grep -E "server_name|location|return|rewrite" | head -20
    echo ""
    
    # Verificar redirecionamentos
    if grep -q "return.*301\|return.*302\|rewrite" /etc/nginx/sites-enabled/portalcacesso.online; then
      echo "⚠️  Redirecionamentos encontrados na configuração:"
      grep -E "return.*301|return.*302|rewrite" /etc/nginx/sites-enabled/portalcacesso.online
      echo ""
    fi
    
    # Verificar se há referências a userstat
    if grep -qi "userstat" /etc/nginx/sites-enabled/portalcacesso.online; then
      echo "🔴 REFERÊNCIA A USERSTAT ENCONTRADA NA CONFIGURAÇÃO!"
      grep -i "userstat" /etc/nginx/sites-enabled/portalcacesso.online
      echo ""
    fi
  else
    echo "⚠️  Arquivo de configuração não encontrado"
    echo ""
  fi
  
  echo "Verificando certificados SSL:"
  if [ -d /etc/letsencrypt/live/www.portalacesso.online ]; then
    echo "   ✅ Certificado SSL encontrado"
    ls -la /etc/letsencrypt/live/www.portalacesso.online/ 2>/dev/null | head -5
  else
    echo "   ⚠️  Certificado SSL não encontrado"
  fi
  echo ""
EOF

echo ""
echo "=" | head -c 60
echo ""
echo "📊 RESUMO"
echo ""
echo "✅ Verificação de DNS e redirecionamentos concluída"
echo ""
echo "💡 Se encontrar problemas:"
echo "   1. Verifique as configurações DNS no registrador"
echo "   2. Verifique a configuração do Nginx"
echo "   3. Execute: bash scripts/verify-build-integrity.sh"
echo ""

