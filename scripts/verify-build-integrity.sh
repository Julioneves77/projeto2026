#!/bin/bash

# Script para verificar integridade do build
# Compara arquivos buildados e detecta alterações suspeitas

set -e

echo "🔍 Verificando integridade do build..."
echo ""

PORTAL_ACESSO_DIR="PORTAL_ACESSO"
DIST_DIR="${PORTAL_ACESSO_DIR}/dist"

if [ ! -d "$DIST_DIR" ]; then
  echo "⚠️  Diretório dist não encontrado"
  echo "   Execute: cd ${PORTAL_ACESSO_DIR} && npm run build"
  exit 1
fi

echo "📦 Verificando arquivos buildados..."
echo ""

# Verificar arquivos principais
echo "Arquivos principais:"
if [ -f "${DIST_DIR}/index.html" ]; then
  INDEX_SIZE=$(stat -f%z "${DIST_DIR}/index.html" 2>/dev/null || stat -c%s "${DIST_DIR}/index.html" 2>/dev/null || echo "0")
  echo "   ✅ index.html (${INDEX_SIZE} bytes)"
else
  echo "   ⚠️  index.html não encontrado"
fi

ASSETS_DIR="${DIST_DIR}/assets"
if [ -d "$ASSETS_DIR" ]; then
  JS_FILES=$(find "$ASSETS_DIR" -name "*.js" 2>/dev/null | wc -l | tr -d ' ')
  CSS_FILES=$(find "$ASSETS_DIR" -name "*.css" 2>/dev/null | wc -l | tr -d ' ')
  echo "   ✅ assets/ (${JS_FILES} JS, ${CSS_FILES} CSS)"
else
  echo "   ⚠️  assets/ não encontrado"
fi
echo ""

# Verificar conteúdo suspeito
echo "🔍 Verificando conteúdo suspeito..."
echo ""

SUSPICIOUS_COUNT=0

# Verificar index.html
if [ -f "${DIST_DIR}/index.html" ]; then
  if grep -qi "userstat\|stat\.net" "${DIST_DIR}/index.html" 2>/dev/null; then
    echo "   🔴 REFERÊNCIA SUSPEITA ENCONTRADA EM index.html:"
    grep -i "userstat\|stat\.net" "${DIST_DIR}/index.html" | head -5
    SUSPICIOUS_COUNT=$((SUSPICIOUS_COUNT + 1))
  fi
fi

# Verificar arquivos JavaScript
if [ -d "$ASSETS_DIR" ]; then
  find "$ASSETS_DIR" -name "*.js" -type f | while read -r js_file; do
    if grep -qi "userstat\|stat\.net" "$js_file" 2>/dev/null; then
      echo "   🔴 REFERÊNCIA SUSPEITA ENCONTRADA EM $(basename "$js_file"):"
      grep -i "userstat\|stat\.net" "$js_file" | head -3
      SUSPICIOUS_COUNT=$((SUSPICIOUS_COUNT + 1))
    fi
  done
fi

if [ $SUSPICIOUS_COUNT -eq 0 ]; then
  echo "   ✅ Nenhuma referência suspeita encontrada"
fi
echo ""

# Calcular hashes dos arquivos principais
echo "📝 Calculando hashes dos arquivos principais..."
echo ""

if command -v md5sum >/dev/null 2>&1; then
  HASH_CMD="md5sum"
elif command -v md5 >/dev/null 2>&1; then
  HASH_CMD="md5"
else
  echo "   ⚠️  Comando de hash não encontrado (md5sum ou md5)"
  HASH_CMD=""
fi

if [ -n "$HASH_CMD" ]; then
  echo "Hashes dos arquivos principais:"
  echo ""
  
  if [ -f "${DIST_DIR}/index.html" ]; then
    if [ "$HASH_CMD" = "md5sum" ]; then
      INDEX_HASH=$(md5sum "${DIST_DIR}/index.html" | cut -d' ' -f1)
    else
      INDEX_HASH=$(md5 -q "${DIST_DIR}/index.html")
    fi
    echo "   index.html: ${INDEX_HASH}"
  fi
  
  if [ -d "$ASSETS_DIR" ]; then
    find "$ASSETS_DIR" -name "*.js" -type f | head -3 | while read -r js_file; do
      if [ "$HASH_CMD" = "md5sum" ]; then
        JS_HASH=$(md5sum "$js_file" | cut -d' ' -f1)
      else
        JS_HASH=$(md5 -q "$js_file")
      fi
      echo "   $(basename "$js_file"): ${JS_HASH}"
    done
  fi
  echo ""
fi

# Comparar com versão no servidor (se possível)
echo "🌐 Comparando com versão no servidor..."
echo ""

SERVER_USER="${1:-root}"
SERVER_HOST="${2:-143.198.10.145}"

if command -v ssh >/dev/null 2>&1; then
  ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_HOST} << 'EOF' 2>/dev/null || true
    if [ -f /var/www/portal-acesso/dist/index.html ]; then
      echo "   ✅ Arquivo encontrado no servidor"
      SERVER_SIZE=$(stat -c%s /var/www/portal-acesso/dist/index.html 2>/dev/null || stat -f%z /var/www/portal-acesso/dist/index.html 2>/dev/null || echo "0")
      echo "   Tamanho no servidor: ${SERVER_SIZE} bytes"
      
      if [ -f /var/www/portal-acesso/dist/index.html ]; then
        if grep -qi "userstat\|stat\.net" /var/www/portal-acesso/dist/index.html 2>/dev/null; then
          echo "   🔴 REFERÊNCIA SUSPEITA ENCONTRADA NO SERVIDOR!"
        else
          echo "   ✅ Nenhuma referência suspeita no servidor"
        fi
      fi
    else
      echo "   ⚠️  Arquivo não encontrado no servidor"
    fi
EOF
else
  echo "   ⚠️  SSH não disponível para comparação"
fi
echo ""

echo ""
echo "=" | head -c 60
echo ""
echo "📊 RESUMO"
echo ""
if [ $SUSPICIOUS_COUNT -eq 0 ]; then
  echo "✅ Build verificado: Nenhum problema encontrado"
else
  echo "⚠️  Build verificado: ${SUSPICIOUS_COUNT} problema(s) encontrado(s)"
fi
echo ""
echo "💡 Próximos passos:"
echo "   1. Se encontrar problemas, faça um novo build:"
echo "      cd ${PORTAL_ACESSO_DIR} && npm run build"
echo "   2. Execute: bash scripts/clear-cache.sh"
echo "   3. Execute: node scripts/security-monitor.js"
echo ""

