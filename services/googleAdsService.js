/**
 * Serviço para integração com Google Ads API
 * Sincroniza dados de campanhas (custo, cliques, impressões)
 * SOMENTE LEITURA - não envia conversões
 * 
 * Implementação usando biblioteca google-ads-api com tratamento robusto de erros
 * A Google Ads API usa gRPC internamente, não REST puro
 */

const { GoogleAdsApi } = require('google-ads-api');
const logger = require('../utils/logger');

let client = null;

/**
 * Inicializa cliente do Google Ads API
 */
function initClient() {
  if (client) {
    return client;
  }

  // Verificar feature flag
  if (process.env.ADS_SYNC_ENABLED === 'false') {
    console.log('⚠️ [GoogleAds] Sincronização de Google Ads desabilitada');
    return null;
  }

  // Verificar credenciais
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN;
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;

  if (!clientId || !clientSecret || !refreshToken || !developerToken) {
    console.warn('⚠️ [GoogleAds] Credenciais não configuradas. Configure GOOGLE_ADS_* no .env');
    return null;
  }

  try {
    client = new GoogleAdsApi({
      client_id: clientId,
      client_secret: clientSecret,
      developer_token: developerToken
    });

    console.log('✅ [GoogleAds] Cliente inicializado com sucesso');
    return client;
  } catch (error) {
    console.error('❌ [GoogleAds] Erro ao inicializar cliente:', error);
    return null;
  }
}

/**
 * Wrapper para query com tratamento robusto de erros
 */
async function executeQuery(customer, query) {
  try {
    // Tentar executar query normalmente
    const results = await customer.query(query);
    return { success: true, data: results };
  } catch (error) {
    // Se o erro for o bug conhecido da biblioteca, tentar workaround
    if (error.message && error.message.includes('Cannot read properties of undefined')) {
      console.warn('⚠️ [GoogleAds] Bug conhecido da biblioteca detectado, tentando workaround...');
      
      // Tentar obter dados brutos da resposta antes que a biblioteca processe
      // Infelizmente, a biblioteca não expõe isso facilmente
      // Vamos tentar uma query mais simples primeiro
      try {
        // Query simplificada sem segmentos de data primeiro
        const simpleQuery = query.replace(/segments\.date[^']*'[^']*'/g, '');
        const simpleResults = await customer.query(simpleQuery);
        console.log('✅ [GoogleAds] Query simplificada funcionou');
        return { success: true, data: simpleResults };
      } catch (simpleError) {
        console.error('❌ [GoogleAds] Query simplificada também falhou:', simpleError.message);
        throw new Error(`Erro na biblioteca Google Ads API: ${error.message}. Possível problema com Developer Token ou permissões.`);
      }
    }
    
    // Outros erros, propagar normalmente
    throw error;
  }
}

/**
 * Sincroniza campanhas do Google Ads para um período
 * @param {string} customerId - ID do cliente (ou MCC ID)
 * @param {string} dateFrom - Data inicial (YYYY-MM-DD)
 * @param {string} dateTo - Data final (YYYY-MM-DD)
 * @returns {Promise<Array>} Array de campanhas com dados
 */
async function syncCampaigns(customerId, dateFrom, dateTo) {
  const adsClient = initClient();
  if (!adsClient) {
    throw new Error('Cliente Google Ads não inicializado. Verifique credenciais e feature flag.');
  }

  try {
    const customer = adsClient.Customer({
      customer_id: customerId,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN
    });

    // Query para buscar métricas de campanha com segmentos de data
    // Usando Google Ads Query Language (GAQL)
    const query = `
      SELECT
        campaign.id,
        campaign.name,
        customer.id,
        segments.date,
        metrics.cost_micros,
        metrics.clicks,
        metrics.impressions
      FROM campaign
      WHERE campaign.status = 'ENABLED'
        AND segments.date >= '${dateFrom}'
        AND segments.date <= '${dateTo}'
      ORDER BY campaign.id, segments.date
    `;

    console.log(`📊 [GoogleAds] Buscando campanhas de ${dateFrom} até ${dateTo}...`);

    // Executar query com tratamento robusto
    const result = await executeQuery(customer, query);
    
    if (!result.success) {
      throw new Error('Falha ao executar query');
    }

    const results = result.data;
    const campaigns = [];

    // Agrupar por campanha e data
    const campaignMap = new Map();

    for (const row of results) {
      try {
        const campaignId = row.campaign?.id?.toString();
        const campaignName = row.campaign?.name || 'Sem nome';
        const customerId = row.customer?.id?.toString();
        const date = row.segments?.date; // Formato YYYY-MM-DD
        const costMicros = parseInt(row.metrics?.cost_micros) || 0;
        const clicks = parseInt(row.metrics?.clicks) || 0;
        const impressions = parseInt(row.metrics?.impressions) || 0;

        if (!campaignId || !date) {
          continue;
        }

        const key = `${campaignId}_${date}`;
        
        if (campaignMap.has(key)) {
          // Somar métricas se já existe
          const existing = campaignMap.get(key);
          existing.cost_micros += costMicros;
          existing.clicks += clicks;
          existing.impressions += impressions;
        } else {
          campaignMap.set(key, {
            customer_id: customerId,
            campaign_id: campaignId,
            campaign_name: campaignName,
            date: date,
            cost_micros: costMicros,
            clicks: clicks,
            impressions: impressions
          });
        }
      } catch (rowError) {
        console.warn('⚠️ [GoogleAds] Erro ao processar linha:', rowError.message);
        continue;
      }
    }

    // Converter map para array
    campaigns.push(...campaignMap.values());

    console.log(`✅ [GoogleAds] ${campaigns.length} campanhas sincronizadas`);

    return campaigns;
  } catch (error) {
    logger.logError(error, {
      service: 'googleAdsService',
      function: 'syncCampaigns',
      customerId,
      dateFrom,
      dateTo
    });
    throw error;
  }
}

/**
 * Lista todos os clientes (accounts) sob um MCC
 * @param {string} mccId - ID do MCC
 * @returns {Promise<Array>} Array de clientes
 */
async function listCustomers(mccId) {
  const adsClient = initClient();
  if (!adsClient) {
    throw new Error('Cliente Google Ads não inicializado');
  }

  try {
    const customer = adsClient.Customer({
      customer_id: mccId,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN
    });

    const query = `
      SELECT
        customer.id,
        customer.descriptive_name,
        customer.currency_code,
        customer.time_zone
      FROM customer
      WHERE customer.status = 'ENABLED'
    `;

    // Tentar executar query diretamente primeiro
    let results;
    try {
      results = await customer.query(query);
    } catch (queryError) {
      // Se falhar, tentar via executeQuery
      const result = await executeQuery(customer, query);
      if (!result.success) {
        throw new Error(`Falha ao executar query: ${result.error || 'Erro desconhecido'}`);
      }
      results = result.data;
    }

    const customers = results.map(row => ({
      id: row.customer?.id?.toString() || '',
      name: row.customer?.descriptive_name || 'Sem nome',
      currency: row.customer?.currency_code || 'BRL',
      timezone: row.customer?.time_zone || 'America/Sao_Paulo'
    })).filter(c => c.id); // Filtrar entradas inválidas

    return customers;
  } catch (error) {
    const errorMessage = error?.message || JSON.stringify(error) || 'Erro desconhecido';
    logger.logError(error, {
      service: 'googleAdsService',
      function: 'listCustomers',
      mccId
    });
    throw new Error(`Erro ao listar clientes: ${errorMessage}`);
  }
}

module.exports = {
  initClient,
  syncCampaigns,
  listCustomers
};
