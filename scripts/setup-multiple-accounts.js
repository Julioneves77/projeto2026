#!/usr/bin/env node

/**
 * Script para configurar mapeamento domain → customer_id
 * 
 * Uso: node scripts/setup-multiple-accounts.js
 * 
 * Este script ajuda a configurar o mapeamento entre domínios de anúncios
 * e contas Google Ads (customer_id).
 */

require('dotenv').config();
const readline = require('readline');
const path = require('path');

const funnelDatabase = require('../services/funnelDatabase');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('\n🔧 Configuração de Múltiplas Contas Google Ads\n');
  console.log('Este script ajuda a mapear domínios para customer_ids do Google Ads.\n');

  try {
    // Listar mapeamentos existentes
    const existingMappings = funnelDatabase.getAllDomainMappings();
    
    if (existingMappings.length > 0) {
      console.log('📋 Mapeamentos existentes:');
      existingMappings.forEach(m => {
        console.log(`   ${m.domain} → ${m.customer_id} (${m.account_name || 'Sem nome'})`);
      });
      console.log('');
    }

    // Perguntar se quer adicionar novo mapeamento
    const addNew = await question('Deseja adicionar um novo mapeamento? (s/n): ');
    
    if (addNew.toLowerCase() !== 's' && addNew.toLowerCase() !== 'sim') {
      console.log('\n✅ Nenhuma alteração realizada.');
      rl.close();
      return;
    }

    // Coletar informações
    const domain = await question('\n� domain (ex: solicite.link ou portalacesso.online): ');
    if (!domain) {
      console.log('❌ Domain é obrigatório!');
      rl.close();
      return;
    }

    const customerId = await question('🔑 Customer ID do Google Ads (ex: 591-659-0517): ');
    if (!customerId) {
      console.log('❌ Customer ID é obrigatório!');
      rl.close();
      return;
    }

    const accountName = await question('📝 Nome da conta (opcional): ');

    // Confirmar
    console.log(`\n📋 Resumo:`);
    console.log(`   Domain: ${domain}`);
    console.log(`   Customer ID: ${customerId}`);
    console.log(`   Nome: ${accountName || '(não especificado)'}`);
    
    const confirm = await question('\n✅ Confirmar criação deste mapeamento? (s/n): ');
    
    if (confirm.toLowerCase() !== 's' && confirm.toLowerCase() !== 'sim') {
      console.log('\n❌ Operação cancelada.');
      rl.close();
      return;
    }

    // Criar mapeamento
    funnelDatabase.upsertDomainMapping(domain, customerId, accountName || null);
    
    console.log(`\n✅ Mapeamento criado com sucesso!`);
    console.log(`   ${domain} → ${customerId}`);
    
    // Listar todos os mapeamentos novamente
    const allMappings = funnelDatabase.getAllDomainMappings();
    console.log('\n📋 Todos os mapeamentos:');
    allMappings.forEach(m => {
      console.log(`   ${m.domain} → ${m.customer_id} (${m.account_name || 'Sem nome'})`);
    });

    console.log('\n💡 Próximos passos:');
    console.log('   1. Sincronize as campanhas do Google Ads usando:');
    console.log(`      POST /google-ads/sync com "domain": "${domain}"`);
    console.log('   2. Verifique a validação usando:');
    console.log('      GET /funnel-validation');
    console.log('   3. Os eventos do domínio serão automaticamente vinculados aos custos corretos!\n');

    rl.close();
  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    rl.close();
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

