#!/usr/bin/env node

/**
 * Script para sincronizar todas as contas Google Ads via MCC
 * 
 * Uso: node scripts/sincronizar-via-mcc.js [MCC_ID]
 * Exemplo: node scripts/sincronizar-via-mcc.js 123-456-7890
 * 
 * Se não fornecer MCC_ID, tentará usar GOOGLE_ADS_MCC_ID do .env
 * ou GOOGLE_ADS_CUSTOMER_ID como fallback
 */

require('dotenv').config();
const googleAdsService = require('../services/googleAdsService');
const funnelDatabase = require('../services/funnelDatabase');

const MCC_ID = process.argv[2] || process.env.GOOGLE_ADS_MCC_ID || process.env.GOOGLE_ADS_CUSTOMER_ID;

if (!MCC_ID) {
  console.error('❌ MCC ID não fornecido!');
  console.error('   Use: node scripts/sincronizar-via-mcc.js [MCC_ID]');
  console.error('   Ou configure GOOGLE_ADS_MCC_ID no .env');
  process.exit(1);
}

async function main() {
  console.log('\n🚀 Sincronização via MCC\n');
  console.log(`📊 MCC ID: ${MCC_ID}\n`);

  try {
    // Inicializar banco de dados
    funnelDatabase.initDatabase();
    console.log('✅ Banco de dados inicializado\n');

    // Calcular período (últimos 30 dias)
    const dateTo = new Date();
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - 30);
    
    const dateFromStr = dateFrom.toISOString().split('T')[0];
    const dateToStr = dateTo.toISOString().split('T')[0];

    console.log(`📅 Período: ${dateFromStr} até ${dateToStr}\n`);

    // Sincronizar via endpoint do sync-server (que já trata MCC corretamente)
    console.log('🔄 Sincronizando campanhas via MCC...\n');
    console.log('   Isso sincronizará todas as contas na MCC automaticamente\n');

    // Usar o sync-server via HTTP ou chamar diretamente
    const syncServer = require('../sync-server');
    
    // Simular requisição para o endpoint
    const mockReq = {
      body: {
        mcc_id: MCC_ID,
        date_from: dateFromStr,
        date_to: dateToStr
      }
    };
    
    const mockRes = {
      status: (code) => ({
        json: (data) => {
          if (code >= 400) {
            console.error(`❌ Erro ${code}:`, data);
          } else {
            console.log('✅ Resposta:', data);
          }
          return { status: code, json: () => {} };
        }
      }),
      json: (data) => {
        console.log('✅ Resposta:', data);
      }
    };

    // Chamar diretamente a função do sync-server
    const funnelDb = require('../services/funnelDatabase');
    const googleAds = require('../services/googleAdsService');
    
    let campaigns = [];
    const domainMappings = {};

    // Listar clientes da MCC
    console.log('🔍 Listando contas na MCC...');
    let customers = [];
    try {
      customers = await googleAds.listCustomers(MCC_ID);
      console.log(`✅ ${customers.length} conta(s) encontrada(s)\n`);
    } catch (err) {
      // Se falhar, pode ser que MCC_ID seja na verdade um Customer ID
      // Nesse caso, sincronizar apenas essa conta
      console.log(`⚠️  Não foi possível listar contas da MCC`);
      console.log(`   Tentando sincronizar como Customer ID único...\n`);
      customers = [{ id: MCC_ID, name: 'Conta Principal' }];
    }

    // Sincronizar cada conta
    for (const customer of customers) {
      try {
        console.log(`📊 Sincronizando ${customer.name || customer.id}...`);
        const customerCampaigns = await googleAds.syncCampaigns(
          customer.id,
          dateFromStr,
          dateToStr
        );
        
        // Tentar identificar domain pelo customer_id
        const mapping = funnelDb.getAllDomainMappings().find(m => m.customer_id === customer.id);
        const campaignDomain = mapping ? mapping.domain : null;
        
        // Adicionar domain às campanhas
        customerCampaigns.forEach(c => {
          c.domain = campaignDomain;
          if (campaignDomain) {
            domainMappings[campaignDomain] = customer.id;
          }
        });
        
        campaigns.push(...customerCampaigns);
        console.log(`   ✅ ${customerCampaigns.length} campanha(s) encontrada(s)`);
        if (campaignDomain) {
          console.log(`   🔗 Vinculado ao domain: ${campaignDomain}`);
        }
        console.log('');
      } catch (error) {
        console.error(`   ❌ Erro ao sincronizar ${customer.id}:`, error.message);
        console.log('');
      }
    }

    // Salvar campanhas
    let saved = 0;
    for (const campaign of campaigns) {
      try {
        funnelDb.upsertCampaign(campaign);
        saved++;
      } catch (error) {
        console.error(`⚠️  Erro ao salvar campanha ${campaign.campaign_id}:`, error.message);
      }
    }

    console.log(`\n✅ Sincronização concluída!`);
    console.log(`   Total de campanhas sincronizadas: ${campaigns.length}`);
    console.log(`   Total de campanhas salvas: ${saved}\n`);

    // Mostrar mapeamentos
    const mappings = funnelDb.getAllDomainMappings();
    if (mappings.length > 0) {
      console.log('📋 Mapeamentos configurados:');
      mappings.forEach(m => {
        console.log(`   ${m.domain} → ${m.customer_id} (${m.account_name || 'Sem nome'})`);
      });
      console.log('');
    }

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

