#!/usr/bin/env node
/**
 * Script de Validação da Configuração Google Ads API
 * 
 * Verifica todas as credenciais, testa conexão e valida funcionalidade básica
 * após ativação da API no Google Cloud Console
 */

require('dotenv').config();
const { GoogleAdsApi } = require('google-ads-api');
const path = require('path');

// Cores para output no terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Flag para controlar se deve mostrar logs (apenas em execução direta)
let shouldLog = require.main === module;

function setLogging(enabled) {
  shouldLog = enabled;
}

function log(message, color = 'reset') {
  if (shouldLog) {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }
}

function logSection(title) {
  if (shouldLog) {
    console.log('\n' + '='.repeat(60));
    log(title, 'cyan');
    console.log('='.repeat(60));
  }
}

/**
 * Validação 1: Variáveis de Ambiente
 */
function checkEnvVariables() {
  logSection('1. Verificando Variáveis de Ambiente');
  
  const requiredVars = {
    'GOOGLE_ADS_CLIENT_ID': process.env.GOOGLE_ADS_CLIENT_ID,
    'GOOGLE_ADS_CLIENT_SECRET': process.env.GOOGLE_ADS_CLIENT_SECRET,
    'GOOGLE_ADS_REFRESH_TOKEN': process.env.GOOGLE_ADS_REFRESH_TOKEN,
    'GOOGLE_ADS_DEVELOPER_TOKEN': process.env.GOOGLE_ADS_DEVELOPER_TOKEN
  };

  const optionalVars = {
    'GOOGLE_ADS_CUSTOMER_ID': process.env.GOOGLE_ADS_CUSTOMER_ID,
    'ADS_SYNC_ENABLED': process.env.ADS_SYNC_ENABLED
  };

  const missing = [];
  const present = [];
  const warnings = [];

  // Verificar variáveis obrigatórias
  for (const [key, value] of Object.entries(requiredVars)) {
    if (!value || value.trim() === '') {
      missing.push(key);
      log(`❌ ${key}: NÃO CONFIGURADO`, 'red');
    } else {
      present.push(key);
      // Mostrar apenas primeiros e últimos caracteres para segurança
      const masked = value.length > 10 
        ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}`
        : '***';
      log(`✅ ${key}: Configurado (${masked})`, 'green');
    }
  }

  // Verificar variáveis opcionais
  for (const [key, value] of Object.entries(optionalVars)) {
    if (!value || value.trim() === '') {
      if (key === 'GOOGLE_ADS_CUSTOMER_ID') {
        warnings.push(`${key} não configurado (recomendado para testes)`);
        log(`⚠️  ${key}: Não configurado (opcional)`, 'yellow');
      } else if (key === 'ADS_SYNC_ENABLED' && value === 'false') {
        warnings.push(`${key} está desabilitado`);
        log(`⚠️  ${key}: Desabilitado (false)`, 'yellow');
      }
    } else {
      log(`✅ ${key}: ${value}`, 'green');
    }
  }

  const status = missing.length === 0 ? 'success' : 'error';
  const details = missing.length > 0 
    ? `Faltam ${missing.length} variável(is): ${missing.join(', ')}`
    : 'Todas as variáveis obrigatórias estão configuradas';

  return {
    status,
    details,
    missing,
    present,
    warnings
  };
}

/**
 * Validação 2: Inicialização do Cliente
 */
function checkClientInit() {
  logSection('2. Testando Inicialização do Cliente');

  try {
    const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
    const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;

    if (!clientId || !clientSecret || !developerToken) {
      return {
        status: 'error',
        details: 'Não é possível inicializar cliente: credenciais faltando',
        error: 'Credenciais incompletas'
      };
    }

    // Validar formato básico
    if (!clientId.includes('.apps.googleusercontent.com')) {
      log(`⚠️  Client ID pode estar em formato incorreto`, 'yellow');
    }

    if (!clientSecret.startsWith('GOCSPX-')) {
      log(`⚠️  Client Secret pode estar em formato incorreto`, 'yellow');
    }

    const client = new GoogleAdsApi({
      client_id: clientId,
      client_secret: clientSecret,
      developer_token: developerToken
    });

    log('✅ Cliente Google Ads API inicializado com sucesso', 'green');
    
    return {
      status: 'success',
      details: 'Cliente inicializado corretamente',
      client
    };
  } catch (error) {
    log(`❌ Erro ao inicializar cliente: ${error.message}`, 'red');
    return {
      status: 'error',
      details: `Erro na inicialização: ${error.message}`,
      error: error.message
    };
  }
}

/**
 * Validação 3: Teste de Autenticação
 */
async function checkAuthentication(client) {
  logSection('3. Testando Autenticação (Refresh Token)');

  if (!client) {
    return {
      status: 'error',
      details: 'Cliente não inicializado, não é possível testar autenticação'
    };
  }

  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID || '591-659-0517';
  const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN;

  if (!refreshToken) {
    return {
      status: 'error',
      details: 'Refresh Token não configurado'
    };
  }

  try {
    log(`📡 Tentando conectar com Customer ID: ${customerId}...`, 'blue');
    
    const customer = client.Customer({
      customer_id: customerId,
      refresh_token: refreshToken
    });

    // Query simples para testar autenticação
    const testQuery = `SELECT customer.id FROM customer LIMIT 1`;
    
    log('🔍 Executando query de teste...', 'blue');
    const results = await customer.query(testQuery);
    
    if (results && results.length > 0) {
      const customerIdResult = results[0].customer?.id?.toString();
      log(`✅ Autenticação bem-sucedida! Customer ID: ${customerIdResult}`, 'green');
      
      return {
        status: 'success',
        details: `Autenticação OK. Customer ID verificado: ${customerIdResult}`,
        customerId: customerIdResult,
        customer
      };
    } else {
      return {
        status: 'warning',
        details: 'Query executada mas não retornou resultados',
        customer
      };
    }
  } catch (error) {
    const errorMessage = error?.message || error?.toString() || String(error) || 'Erro desconhecido';
    log(`❌ Erro na autenticação: ${errorMessage}`, 'red');
    
    let recommendation = '';
    if (errorMessage.includes('invalid_grant') || errorMessage.includes('invalid_token')) {
      recommendation = 'Refresh Token inválido ou expirado. Gere um novo token via OAuth Playground.';
    } else if (errorMessage.includes('unauthorized')) {
      recommendation = 'Token não autorizado. Verifique se o Refresh Token foi gerado com as credenciais corretas.';
    } else if (errorMessage.includes('permission') || errorMessage.includes('access')) {
      recommendation = 'Problema de permissões. Verifique se a API Google Ads está ativada no Google Cloud Console.';
    } else {
      recommendation = `Erro: ${errorMessage}. Verifique as credenciais e a conexão com a API do Google Ads.`;
    }

    return {
      status: 'error',
      details: `Erro na autenticação: ${errorMessage}`,
      error: errorMessage,
      recommendation
    };
  }
}

/**
 * Validação 4: Teste de Listagem de Clientes (se MCC)
 */
async function checkCustomerAccess(customer) {
  logSection('4. Testando Acesso aos Recursos da Conta');

  if (!customer) {
    return {
      status: 'skip',
      details: 'Customer não disponível para teste'
    };
  }

  try {
    const query = `
      SELECT
        customer.id,
        customer.descriptive_name,
        customer.currency_code,
        customer.time_zone
      FROM customer
      WHERE customer.status = 'ENABLED'
      LIMIT 5
    `;

    log('🔍 Buscando informações da conta...', 'blue');
    const results = await customer.query(query);

    if (results && results.length > 0) {
      const accountInfo = results.map(row => ({
        id: row.customer?.id?.toString(),
        name: row.customer?.descriptive_name || 'Sem nome',
        currency: row.customer?.currency_code || 'N/A',
        timezone: row.customer?.time_zone || 'N/A'
      }));

      log(`✅ Acesso aos recursos confirmado!`, 'green');
      log(`   Conta: ${accountInfo[0].name} (${accountInfo[0].id})`, 'green');
      log(`   Moeda: ${accountInfo[0].currency}`, 'green');
      log(`   Timezone: ${accountInfo[0].timezone}`, 'green');

      return {
        status: 'success',
        details: `Acesso OK. ${results.length} conta(s) encontrada(s)`,
        accounts: accountInfo
      };
    } else {
      return {
        status: 'warning',
        details: 'Query executada mas não retornou contas'
      };
    }
  } catch (error) {
    log(`⚠️  Erro ao acessar recursos: ${error.message}`, 'yellow');
    return {
      status: 'warning',
      details: `Erro ao acessar recursos: ${error.message}`,
      error: error.message
    };
  }
}

/**
 * Validação 5: Teste de Query de Campanhas
 */
async function checkCampaignQuery(customer) {
  logSection('5. Testando Query de Campanhas');

  if (!customer) {
    return {
      status: 'skip',
      details: 'Customer não disponível para teste'
    };
  }

  try {
    // Calcular datas (últimos 7 dias)
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    const dateTo = today.toISOString().split('T')[0];
    const dateFrom = sevenDaysAgo.toISOString().split('T')[0];

    const query = `
      SELECT
        campaign.id,
        campaign.name,
        segments.date,
        metrics.cost_micros,
        metrics.clicks,
        metrics.impressions
      FROM campaign
      WHERE campaign.status = 'ENABLED'
        AND segments.date >= '${dateFrom}'
        AND segments.date <= '${dateTo}'
      ORDER BY campaign.id, segments.date
      LIMIT 10
    `;

    log(`🔍 Buscando campanhas de ${dateFrom} até ${dateTo}...`, 'blue');
    const results = await customer.query(query);

    if (results && results.length > 0) {
      const campaigns = results.map(row => ({
        id: row.campaign?.id?.toString(),
        name: row.campaign?.name || 'Sem nome',
        date: row.segments?.date,
        cost: row.metrics?.cost_micros ? (row.metrics.cost_micros / 1000000).toFixed(2) : '0.00',
        clicks: row.metrics?.clicks || 0,
        impressions: row.metrics?.impressions || 0
      }));

      log(`✅ Query de campanhas bem-sucedida!`, 'green');
      log(`   ${results.length} registro(s) encontrado(s)`, 'green');
      
      if (campaigns.length > 0) {
        log(`   Exemplo: ${campaigns[0].name} (${campaigns[0].date})`, 'green');
      }

      return {
        status: 'success',
        details: `Query OK. ${results.length} registro(s) encontrado(s)`,
        campaignsCount: results.length,
        sampleCampaign: campaigns[0]
      };
    } else {
      log(`⚠️  Query executada mas não retornou campanhas`, 'yellow');
      log(`   Isso pode ser normal se não houver campanhas ativas no período`, 'yellow');
      
      return {
        status: 'warning',
        details: 'Query executada mas sem resultados (pode ser normal se não houver campanhas)'
      };
    }
  } catch (error) {
    log(`❌ Erro na query de campanhas: ${error.message}`, 'red');
    
    // Verificar se é o bug conhecido da biblioteca
    if (error.message && error.message.includes('Cannot read properties of undefined')) {
      return {
        status: 'warning',
        details: 'Bug conhecido da biblioteca detectado. A query pode funcionar com workaround.',
        error: error.message,
        recommendation: 'Este é um bug conhecido da biblioteca google-ads-api. O sistema tem workaround implementado.'
      };
    }

    return {
      status: 'error',
      details: `Erro na query: ${error.message}`,
      error: error.message
    };
  }
}

/**
 * Gerar relatório final
 */
function generateReport(checks) {
  logSection('📊 RELATÓRIO FINAL');

  const statusCounts = {
    success: 0,
    warning: 0,
    error: 0,
    skip: 0
  };

  for (const check of Object.values(checks)) {
    if (check.status) {
      statusCounts[check.status] = (statusCounts[check.status] || 0) + 1;
    }
  }

  // Determinar status geral
  let overallStatus = 'success';
  if (statusCounts.error > 0) {
    overallStatus = 'error';
  } else if (statusCounts.warning > 0) {
    overallStatus = 'warning';
  }

  // Exibir resumo
  log('\n📋 Resumo das Validações:', 'cyan');
  console.log(`   ✅ Sucesso: ${statusCounts.success}`);
  console.log(`   ⚠️  Avisos: ${statusCounts.warning}`);
  console.log(`   ❌ Erros: ${statusCounts.error}`);
  console.log(`   ⏭️  Pulados: ${statusCounts.skip}`);

  // Recomendações
  const recommendations = [];
  const nextSteps = [];

  if (checks.env_variables && checks.env_variables.status === 'error') {
    recommendations.push('Configure todas as variáveis de ambiente obrigatórias no arquivo .env');
    nextSteps.push('1. Edite o arquivo .env e adicione as variáveis faltantes');
    nextSteps.push('2. Reinicie o servidor após configurar');
  }

  if (checks.client_init && checks.client_init.status === 'error') {
    recommendations.push('Verifique o formato das credenciais (Client ID, Client Secret, Developer Token)');
    nextSteps.push('1. Confirme que o Client ID termina com .apps.googleusercontent.com');
    nextSteps.push('2. Confirme que o Client Secret começa com GOCSPX-');
  }

  if (checks.authentication && checks.authentication.status === 'error') {
    if (checks.authentication.recommendation) {
      recommendations.push(checks.authentication.recommendation);
    }
    nextSteps.push('1. Acesse https://developers.google.com/oauthplayground/');
    nextSteps.push('2. Configure suas credenciais OAuth (ícone ⚙️)');
    nextSteps.push('3. Selecione escopo: https://www.googleapis.com/auth/adwords');
    nextSteps.push('4. Gere novo Refresh Token');
    nextSteps.push('5. Atualize GOOGLE_ADS_REFRESH_TOKEN no .env');
  }

  if (checks.authentication && checks.authentication.status === 'error' && checks.authentication.error?.includes('API')) {
    recommendations.push('Verifique se a Google Ads API está ativada no Google Cloud Console');
    nextSteps.push('1. Acesse https://console.cloud.google.com/');
    nextSteps.push('2. Vá em APIs & Services > Library');
    nextSteps.push('3. Procure por "Google Ads API" e ative');
  }

  if (checks.campaign_query && checks.campaign_query.status === 'warning' && checks.campaign_query.recommendation) {
    recommendations.push(checks.campaign_query.recommendation);
  }

  if (overallStatus === 'success') {
    log('\n✅ CONFIGURAÇÃO VALIDADA COM SUCESSO!', 'green');
    log('   O sistema está pronto para sincronizar dados do Google Ads.', 'green');
    nextSteps.push('1. Execute a sincronização via endpoint POST /google-ads/sync');
    nextSteps.push('2. Ou use a interface da plataforma para sincronizar');
  }

  // Exibir recomendações
  if (recommendations.length > 0) {
    log('\n💡 Recomendações:', 'yellow');
    recommendations.forEach((rec, i) => {
      log(`   ${i + 1}. ${rec}`, 'yellow');
    });
  }

  // Exibir próximos passos
  if (nextSteps.length > 0) {
    log('\n🎯 Próximos Passos:', 'blue');
    nextSteps.forEach(step => {
      log(`   ${step}`, 'blue');
    });
  }

  // Retornar objeto JSON para uso programático
  return {
    status: overallStatus,
    checks: {
      env_variables: checks.env_variables ? {
        status: checks.env_variables.status,
        details: checks.env_variables.details
      } : { status: 'skip', details: 'Não executado' },
      client_init: checks.client_init ? {
        status: checks.client_init.status,
        details: checks.client_init.details
      } : { status: 'skip', details: 'Não executado' },
      authentication: checks.authentication ? {
        status: checks.authentication.status,
        details: checks.authentication.details
      } : { status: 'skip', details: 'Não executado' },
      customer_access: checks.customer_access ? {
        status: checks.customer_access.status,
        details: checks.customer_access.details
      } : { status: 'skip', details: 'Não executado' },
      campaign_query: checks.campaign_query ? {
        status: checks.campaign_query.status,
        details: checks.campaign_query.details
      } : { status: 'skip', details: 'Não executado' }
    },
    recommendations,
    next_steps: nextSteps,
    summary: {
      success: statusCounts.success,
      warnings: statusCounts.warning,
      errors: statusCounts.error,
      skipped: statusCounts.skip
    }
  };
}

/**
 * Função principal
 * @param {boolean} exitOnComplete - Se true, faz process.exit() ao finalizar (padrão: true)
 */
async function main(exitOnComplete = true) {
  // Controlar logging baseado em como foi chamado
  const isDirectExecution = require.main === module;
  setLogging(isDirectExecution);
  
  if (isDirectExecution) {
    log('\n' + '='.repeat(60), 'cyan');
    log('🔍 VALIDAÇÃO DA CONFIGURAÇÃO GOOGLE ADS API', 'cyan');
    log('='.repeat(60) + '\n', 'cyan');
  }

  const checks = {};

  // 1. Verificar variáveis de ambiente
  checks.env_variables = checkEnvVariables();

  // Inicializar checks que podem não ser executados
  checks.client_init = { status: 'skip', details: 'Não executado' };
  checks.authentication = { status: 'skip', details: 'Não executado' };
  checks.customer_access = { status: 'skip', details: 'Não executado' };
  checks.campaign_query = { status: 'skip', details: 'Não executado' };

  // Se faltam variáveis críticas, parar aqui mas gerar relatório completo
  if (checks.env_variables.status === 'error') {
    const report = generateReport(checks);
    if (exitOnComplete) {
      process.exit(1);
    }
    return report;
  }

  // 2. Inicializar cliente
  checks.client_init = checkClientInit();

  if (checks.client_init.status === 'error') {
    const report = generateReport(checks);
    if (exitOnComplete) {
      process.exit(1);
    }
    return report;
  }

  const client = checks.client_init.client;

  // 3. Testar autenticação
  checks.authentication = await checkAuthentication(client);

  let customer = null;
  if (checks.authentication && checks.authentication.customer) {
    customer = checks.authentication.customer;
  }

  // 4. Testar acesso aos recursos
  if (customer) {
    checks.customer_access = await checkCustomerAccess(customer);
  } else {
    checks.customer_access = {
      status: 'skip',
      details: 'Customer não disponível'
    };
  }

  // 5. Testar query de campanhas
  if (customer) {
    checks.campaign_query = await checkCampaignQuery(customer);
  } else {
    checks.campaign_query = {
      status: 'skip',
      details: 'Customer não disponível'
    };
  }

  // Gerar relatório final
  const report = generateReport(checks);

  // Exit code baseado no status (apenas se exitOnComplete for true)
  if (exitOnComplete) {
    if (report.status === 'error') {
      process.exit(1);
    } else if (report.status === 'warning') {
      process.exit(0); // Avisos não são críticos
    } else {
      process.exit(0);
    }
  }

  return report;
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(error => {
    log(`\n❌ Erro fatal: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  });
}

module.exports = { 
  main, 
  checkEnvVariables, 
  checkClientInit, 
  checkAuthentication, 
  checkCustomerAccess, 
  checkCampaignQuery,
  setLogging
};

