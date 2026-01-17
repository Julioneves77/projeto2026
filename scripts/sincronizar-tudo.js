#!/usr/bin/env node

/**
 * Script para sincronizar todas as contas Google Ads via MCC
 * e configurar mapeamentos automaticamente
 */

require('dotenv').config();
const googleAdsService = require('../services/googleAdsService');
const funnelDatabase = require('../services/funnelDatabase');

const MCC_ID = process.env.GOOGLE_ADS_CUSTOMER_ID || '591-659-0517';

async function main() {
  console.log('\n🚀 Sincronização Completa de Google Ads\n');
  console.log(`📊 MCC ID: ${MCC_ID}\n`);

  try {
    // Inicializar banco de dados
    funnelDatabase.initDatabase();
    console.log('✅ Banco de dados inicializado\n');

    // Listar todas as contas na MCC
    console.log('🔍 Listando contas na MCC...');
    const customers = await googleAdsService.listCustomers(MCC_ID);
    
    if (customers.length === 0) {
      console.log('⚠️  Nenhuma conta encontrada na MCC');
      console.log('   Verifique se a conta foi adicionada corretamente à MCC');
      process.exit(1);
    }

    console.log(`\n✅ ${customers.length} conta(s) encontrada(s):\n`);
    customers.forEach((c, idx) => {
      console.log(`${idx + 1}. Customer ID: ${c.id}`);
      console.log(`   Nome: ${c.name}`);
      console.log(`   Moeda: ${c.currency}\n`);
    });

    // Mapear domínios (assumindo primeira conta = solicite.link, segunda = portalacesso.online)
    console.log('🔧 Configurando mapeamentos...\n');
    
    if (customers.length >= 1) {
      funnelDatabase.upsertDomainMapping('solicite.link', customers[0].id, customers[0].name);
      console.log(`✅ solicite.link → ${customers[0].id} (${customers[0].name})`);
    }
    
    if (customers.length >= 2) {
      funnelDatabase.upsertDomainMapping('portalcacesso.online', customers[1].id, customers[1].name);
      console.log(`✅ portalacesso.online → ${customers[1].id} (${customers[1].name})`);
    } else {
      console.log('⚠️  Apenas 1 conta encontrada. portalacesso.online não foi mapeado.');
      console.log('   Se você tem 2 contas, verifique se ambas estão na MCC.');
    }

    // Calcular período (últimos 30 dias)
    const dateTo = new Date();
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - 30);
    
    const dateFromStr = dateFrom.toISOString().split('T')[0];
    const dateToStr = dateTo.toISOString().split('T')[0];

    console.log(`\n📅 Período: ${dateFromStr} até ${dateToStr}\n`);

    // Sincronizar todas as contas via MCC
    console.log('🔄 Sincronizando campanhas de todas as contas...\n');
    
    let totalCampaigns = 0;
    for (const customer of customers) {
      try {
        console.log(`📊 Sincronizando ${customer.name} (${customer.id})...`);
        const campaigns = await googleAdsService.syncCampaigns(
          customer.id,
          dateFromStr,
          dateToStr
        );
        
        // Identificar domain pelo customer_id
        const mapping = funnelDatabase.getAllDomainMappings().find(m => m.customer_id === customer.id);
        const domain = mapping ? mapping.domain : null;
        
        // Adicionar domain às campanhas e salvar
        let saved = 0;
        for (const campaign of campaigns) {
          campaign.domain = domain;
          funnelDatabase.upsertCampaign(campaign);
          saved++;
        }
        
        totalCampaigns += campaigns.length;
        console.log(`   ✅ ${campaigns.length} campanha(s) sincronizada(s) e ${saved} salva(s)`);
        if (domain) {
          console.log(`   🔗 Vinculado ao domain: ${domain}`);
        }
        console.log('');
      } catch (error) {
        console.error(`   ❌ Erro ao sincronizar ${customer.id}:`, error.message);
        console.log('');
      }
    }

    console.log(`\n✅ Sincronização concluída!`);
    console.log(`   Total de campanhas sincronizadas: ${totalCampaigns}\n`);

    // Mostrar resumo dos mapeamentos
    const mappings = funnelDatabase.getAllDomainMappings();
    console.log('📋 Mapeamentos configurados:');
    mappings.forEach(m => {
      console.log(`   ${m.domain} → ${m.customer_id} (${m.account_name || 'Sem nome'})`);
    });

    console.log('\n💡 Próximos passos:');
    console.log('   1. Verifique a validação na Aba Coração');
    console.log('   2. Os eventos serão automaticamente vinculados aos custos corretos');
    console.log('   3. Use GET /funnel-validation para verificar status\n');

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('\n❌ Erro fatal:', error.message);
    console.error(error);
    process.exit(1);
  });
}

module.exports = { main };

