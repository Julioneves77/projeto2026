#!/bin/bash
echo "🌐 Abrindo Portal Acesso..."
echo ""
echo "Opção 1: Adicionar ao /etc/hosts e abrir no navegador"
echo "Execute: echo '143.198.10.145 portalcacesso.online www.portalcacesso.online' | sudo tee -a /etc/hosts"
echo ""
echo "Opção 2: Abrir diretamente pelo IP"
open "http://143.198.10.145" 2>/dev/null || xdg-open "http://143.198.10.145" 2>/dev/null || echo "Abra manualmente: http://143.198.10.145"
