#!/bin/bash

# Script para testar os builds localmente

echo "🧪 TESTANDO BUILDS LOCALMENTE"
echo "================================"
echo ""

# Matar processos anteriores
pkill -f "python3 -m http.server" 2>/dev/null || true
sleep 1

# Testar PORTAL
echo "📦 Testando PORTAL..."
cd PORTAL/dist
python3 -m http.server 8888 > /tmp/test-portal.log 2>&1 &
PORTAL_PID=$!
sleep 2

if curl -s http://localhost:8888 | grep -q "Portal Certidão"; then
    echo "✅ PORTAL: HTML carregando corretamente"
else
    echo "❌ PORTAL: Erro ao carregar HTML"
fi

if curl -s http://localhost:8888/assets/index-BSOdaI8N.js | head -1 | grep -q "!function"; then
    echo "✅ PORTAL: JavaScript carregando corretamente"
else
    echo "❌ PORTAL: Erro ao carregar JavaScript"
fi

kill $PORTAL_PID 2>/dev/null || true
sleep 1

# Testar PLATAFORMA
echo ""
echo "📦 Testando PLATAFORMA..."
cd ../../PLATAFORMA/dist
python3 -m http.server 8889 > /tmp/test-plataforma.log 2>&1 &
PLATAFORMA_PID=$!
sleep 2

if curl -s http://localhost:8889 | grep -q "Atendimento Virtual"; then
    echo "✅ PLATAFORMA: HTML carregando corretamente"
else
    echo "❌ PLATAFORMA: Erro ao carregar HTML"
    echo "   Conteúdo recebido:"
    curl -s http://localhost:8889 | head -10
fi

if curl -s http://localhost:8889/assets/index-DBkTQohY.js | head -1 | grep -q "!function"; then
    echo "✅ PLATAFORMA: JavaScript carregando corretamente"
else
    echo "❌ PLATAFORMA: Erro ao carregar JavaScript"
fi

kill $PLATAFORMA_PID 2>/dev/null || true
sleep 1

# Testar SOLICITE LINK
echo ""
echo "📦 Testando SOLICITE LINK..."
cd "../../SOLICITE LINK/dist"
python3 -m http.server 8890 > /tmp/test-solicite.log 2>&1 &
SOLICITE_PID=$!
sleep 2

if curl -s http://localhost:8890 | grep -q "Solicite Link"; then
    echo "✅ SOLICITE LINK: HTML carregando corretamente"
else
    echo "❌ SOLICITE LINK: Erro ao carregar HTML"
    echo "   Conteúdo recebido:"
    curl -s http://localhost:8890 | head -10
fi

if curl -s http://localhost:8890/assets/index-DqJzFaMa.js | head -1 | grep -q "!function"; then
    echo "✅ SOLICITE LINK: JavaScript carregando corretamente"
else
    echo "❌ SOLICITE LINK: Erro ao carregar JavaScript"
fi

kill $SOLICITE_PID 2>/dev/null || true

echo ""
echo "================================"
echo "✅ Testes concluídos!"
echo ""
echo "Para testar manualmente no navegador:"
echo "  PORTAL: http://localhost:8888"
echo "  PLATAFORMA: http://localhost:8889"
echo "  SOLICITE LINK: http://localhost:8890"




