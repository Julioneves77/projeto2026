#!/bin/bash
# Script para corrigir o email do SendPulse

echo "🔧 Correção do Email SendPulse"
echo ""

# Verificar qual email usar
echo "Escolha o email remetente (já verificado no SendPulse):"
echo "1) links@soliciterapido1.online (Recomendado)"
echo "2) atendimento@insssoliciterapido.online"
echo "3) contato@soliciterapidodocumentos.online"
echo ""
read -p "Escolha (1-3): " escolha

case $escolha in
    1)
        EMAIL="links@soliciterapido1.online"
        ;;
    2)
        EMAIL="atendimento@insssoliciterapido.online"
        ;;
    3)
        EMAIL="contato@soliciterapidodocumentos.online"
        ;;
    *)
        echo "Opção inválida"
        exit 1
        ;;
esac

echo ""
echo "📝 Configurando SENDPULSE_SENDER_EMAIL=$EMAIL"
echo ""

# No servidor de produção
ssh root@143.198.10.145 << EOF
cd /var/www/portal-certidao

# Fazer backup do .env
cp .env .env.backup.\$(date +%Y%m%d_%H%M%S)

# Atualizar SENDPULSE_SENDER_EMAIL
sed -i "s|SENDPULSE_SENDER_EMAIL=.*|SENDPULSE_SENDER_EMAIL=$EMAIL|g" .env

# Verificar se foi alterado
echo "✅ Configuração atualizada:"
grep SENDPULSE_SENDER_EMAIL .env

# Reiniciar servidor
pm2 restart sync-server

echo ""
echo "✅ Servidor reiniciado!"
EOF

echo ""
echo "✅ Correção aplicada!"
echo ""
echo "💡 Teste enviando um email e verifique no histórico do SendPulse"
