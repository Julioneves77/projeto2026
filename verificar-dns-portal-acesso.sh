#!/bin/bash

# Script para verificar se o DNS está configurado corretamente

echo "🔍 Verificando DNS para portalcacesso.online..."
echo ""

# Verificar registro A principal
echo "📋 Registro A (portalcacesso.online):"
DNS_RESULT=$(dig portalcacesso.online +short 2>/dev/null)
if [ -z "$DNS_RESULT" ]; then
    echo "❌ DNS não configurado ou não propagado"
    echo "   Configure o registro A apontando para: 143.198.10.145"
else
    echo "✅ DNS encontrado: $DNS_RESULT"
    if [ "$DNS_RESULT" = "143.198.10.145" ]; then
        echo "   ✅ Apontando para o servidor correto!"
    else
        echo "   ⚠️  Apontando para IP diferente: $DNS_RESULT"
        echo "   Esperado: 143.198.10.145"
    fi
fi

echo ""

# Verificar registro A para www
echo "📋 Registro A (www.portalcacesso.online):"
WWW_RESULT=$(dig www.portalcacesso.online +short 2>/dev/null)
if [ -z "$WWW_RESULT" ]; then
    echo "❌ DNS não configurado ou não propagado"
    echo "   Configure o registro A para 'www' apontando para: 143.198.10.145"
else
    echo "✅ DNS encontrado: $WWW_RESULT"
    if [ "$WWW_RESULT" = "143.198.10.145" ]; then
        echo "   ✅ Apontando para o servidor correto!"
    else
        echo "   ⚠️  Apontando para IP diferente: $WWW_RESULT"
        echo "   Esperado: 143.198.10.145"
    fi
fi

echo ""

# Verificar se o servidor está acessível
echo "🌐 Testando conectividade com o servidor..."
if curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://143.198.10.145 | grep -q "200\|301\|302"; then
    echo "✅ Servidor está acessível"
else
    echo "⚠️  Servidor pode não estar acessível ou nginx não está rodando"
fi

echo ""
echo "📋 Próximos passos:"
if [ "$DNS_RESULT" = "143.198.10.145" ] && [ "$WWW_RESULT" = "143.198.10.145" ]; then
    echo "✅ DNS configurado corretamente!"
    echo "   Execute: bash configurar-https-agora.sh root"
else
    echo "⚠️  Configure o DNS primeiro:"
    echo "   1. Acesse o painel do registrador do domínio"
    echo "   2. Configure registro A: @ -> 143.198.10.145"
    echo "   3. Configure registro A: www -> 143.198.10.145"
    echo "   4. Aguarde propagação (5-30 minutos)"
    echo "   5. Execute novamente: bash verificar-dns-portal-acesso.sh"
fi

