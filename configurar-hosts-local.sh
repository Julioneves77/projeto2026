#!/bin/bash

# Script para adicionar portalcacesso.online ao /etc/hosts localmente
# Execute: bash configurar-hosts-local.sh

echo "🔧 Configurando /etc/hosts para portalcacesso.online..."
echo ""

# Verificar se já existe
if grep -q "portalcacesso.online" /etc/hosts 2>/dev/null; then
    echo "⚠️  Entrada já existe no /etc/hosts"
    echo "Removendo entrada antiga..."
    sudo sed -i '' '/portalcacesso.online/d' /etc/hosts 2>/dev/null || sudo sed -i '/portalcacesso.online/d' /etc/hosts
fi

# Adicionar nova entrada
echo "📝 Adicionando entrada..."
echo "143.198.10.145 portalcacesso.online www.portalcacesso.online" | sudo tee -a /etc/hosts

echo ""
echo "✅ Configuração concluída!"
echo ""
echo "📋 Entrada adicionada:"
grep portalcacesso /etc/hosts
echo ""
echo "🌐 Agora você pode acessar:"
echo "   http://portalcacesso.online"
echo "   http://www.portalcacesso.online"
echo ""
echo "💡 Para remover depois: sudo sed -i '' '/portalcacesso.online/d' /etc/hosts"

