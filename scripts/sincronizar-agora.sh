#!/bin/bash

# Script rápido para sincronizar tudo via MCC
# Assumindo que o MCC_ID é o mesmo do GOOGLE_ADS_CUSTOMER_ID ou será fornecido

cd "$(dirname "$0")/.."
source .env 2>/dev/null || true

MCC_ID="${1:-${GOOGLE_ADS_MCC_ID:-${GOOGLE_ADS_CUSTOMER_ID}}}"

if [ -z "$MCC_ID" ]; then
  echo "❌ MCC ID não fornecido!"
  echo ""
  echo "Uso:"
  echo "  ./scripts/sincronizar-agora.sh [MCC_ID]"
  echo ""
  echo "Ou configure GOOGLE_ADS_MCC_ID no .env"
  exit 1
fi

echo "🚀 Sincronizando Google Ads via MCC: $MCC_ID"
echo ""

# Calcular período (últimos 30 dias)
DATE_TO=$(date +%Y-%m-%d)
DATE_FROM=$(date -v-30d +%Y-%m-%d 2>/dev/null || date -d "30 days ago" +%Y-%m-%d)

echo "📅 Período: $DATE_FROM até $DATE_TO"
echo ""

# Usar Node.js para sincronizar
node -e "
require('dotenv').config();
const googleAdsService = require('./services/googleAdsService');
const funnelDatabase = require('./services/funnelDatabase');

async function sync() {
  try {
    funnelDatabase.initDatabase();
    
    // Tentar listar contas
    let customers = [];
    try {
      customers = await googleAdsService.listCustomers('$MCC_ID');
      console.log(\`✅ \${customers.length} conta(s) encontrada(s) na MCC\n\`);
    } catch (err) {
      // Se falhar, pode ser que seja um Customer ID único
      console.log('⚠️  Não foi possível listar como MCC, sincronizando como Customer ID único\n');
      customers = [{ id: '$MCC_ID', name: 'Conta Principal' }];
    }
    
    let totalCampaigns = 0;
    for (const customer of customers) {
      try {
        console.log(\`📊 Sincronizando \${customer.name || customer.id}...\`);
        const campaigns = await googleAdsService.syncCampaigns(
          customer.id,
          '$DATE_FROM',
          '$DATE_TO'
        );
        
        // Identificar domain
        const mapping = funnelDatabase.getAllDomainMappings().find(m => m.customer_id === customer.id);
        const domain = mapping ? mapping.domain : null;
        
        // Salvar campanhas
        let saved = 0;
        for (const campaign of campaigns) {
          campaign.domain = domain;
          funnelDatabase.upsertCampaign(campaign);
          saved++;
        }
        
        totalCampaigns += campaigns.length;
        console.log(\`   ✅ \${campaigns.length} campanha(s) sincronizada(s)\`);
        if (domain) {
          console.log(\`   🔗 Domain: \${domain}\`);
        }
        console.log('');
      } catch (error) {
        console.error(\`   ❌ Erro: \${error.message}\`);
      }
    }
    
    console.log(\`\n✅ Total: \${totalCampaigns} campanha(s) sincronizada(s)\`);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

sync();
"

echo ""
echo "✅ Sincronização concluída!"
echo ""
echo "💡 Verifique na Aba Coração se tudo está funcionando"

