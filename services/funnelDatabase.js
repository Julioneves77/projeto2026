/**
 * Banco de dados SQLite para eventos do funil
 * Gerencia tabelas e operações de eventos do funil, campanhas Google Ads e associações
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_DIR = path.join(__dirname, '..');
const DB_FILE = path.join(DB_DIR, 'funnel-database.db');

// Garantir que o diretório existe
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

let db = null;

/**
 * Inicializa o banco de dados e cria as tabelas se não existirem
 */
function initDatabase() {
  try {
    db = new Database(DB_FILE);
    
    // Habilitar foreign keys
    db.pragma('foreign_keys = ON');
    
    // Criar tabela de eventos do funil
    db.exec(`
      CREATE TABLE IF NOT EXISTS funnel_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        funnel_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        utm_campaign TEXT,
        utm_term TEXT,
        domain TEXT,
        path TEXT,
        ticket_id TEXT,
        metadata TEXT,
        timestamp INTEGER NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      );

      CREATE INDEX IF NOT EXISTS idx_funnel_id ON funnel_events(funnel_id);
      CREATE INDEX IF NOT EXISTS idx_event_type ON funnel_events(event_type);
      CREATE INDEX IF NOT EXISTS idx_ticket_id ON funnel_events(ticket_id);
      CREATE INDEX IF NOT EXISTS idx_timestamp ON funnel_events(timestamp);
      CREATE INDEX IF NOT EXISTS idx_utm_campaign ON funnel_events(utm_campaign);
    `);
    
    // Criar tabela de campanhas Google Ads
    db.exec(`
      CREATE TABLE IF NOT EXISTS google_ads_campaigns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id TEXT NOT NULL,
        campaign_id TEXT NOT NULL,
        campaign_name TEXT NOT NULL,
        date TEXT NOT NULL,
        cost_micros INTEGER NOT NULL,
        clicks INTEGER NOT NULL,
        impressions INTEGER NOT NULL,
        domain TEXT,
        synced_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        UNIQUE(campaign_id, date)
      );

      CREATE INDEX IF NOT EXISTS idx_campaign_date ON google_ads_campaigns(campaign_id, date);
      CREATE INDEX IF NOT EXISTS idx_date ON google_ads_campaigns(date);
      CREATE INDEX IF NOT EXISTS idx_customer_id ON google_ads_campaigns(customer_id);
    `);
    
    // Adicionar coluna domain se não existir (migração)
    try {
      // Verificar se a coluna já existe
      const tableInfo = db.prepare(`PRAGMA table_info(google_ads_campaigns)`).all();
      const hasDomainColumn = tableInfo.some(col => col.name === 'domain');
      
      if (!hasDomainColumn) {
        db.exec(`ALTER TABLE google_ads_campaigns ADD COLUMN domain TEXT;`);
        console.log('✅ [FunnelDatabase] Coluna domain adicionada à tabela google_ads_campaigns');
      }
      
      // Criar índice apenas se a coluna existe
      db.exec(`CREATE INDEX IF NOT EXISTS idx_domain ON google_ads_campaigns(domain);`);
    } catch (e) {
      // Ignorar erro se já existe
      console.log('⚠️ [FunnelDatabase] Erro ao adicionar coluna domain (pode já existir):', e.message);
    }
    
    // Criar tabela de mapeamento domain → customer_id
    db.exec(`
      CREATE TABLE IF NOT EXISTS domain_customer_mapping (
        domain TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        account_name TEXT,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      );

      CREATE INDEX IF NOT EXISTS idx_domain_customer_mapping_domain ON domain_customer_mapping(domain);
      CREATE INDEX IF NOT EXISTS idx_domain_customer_mapping_customer_id ON domain_customer_mapping(customer_id);
    `);
    
    // Criar tabela de associação funnel_id ↔ utm_campaign
    db.exec(`
      CREATE TABLE IF NOT EXISTS funnel_campaigns (
        funnel_id TEXT NOT NULL,
        utm_campaign TEXT NOT NULL,
        utm_term TEXT,
        first_seen INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        PRIMARY KEY (funnel_id, utm_campaign)
      );

      CREATE INDEX IF NOT EXISTS idx_utm_campaign ON funnel_campaigns(utm_campaign);
      CREATE INDEX IF NOT EXISTS idx_funnel_campaigns_funnel_id ON funnel_campaigns(funnel_id);
    `);
    
    console.log('✅ [FunnelDatabase] Banco de dados inicializado com sucesso');
    return db;
  } catch (error) {
    console.error('❌ [FunnelDatabase] Erro ao inicializar banco de dados:', error);
    throw error;
  }
}

/**
 * Obtém instância do banco de dados (inicializa se necessário)
 */
function getDatabase() {
  if (!db) {
    return initDatabase();
  }
  return db;
}

/**
 * Insere um evento do funil
 */
function insertEvent(eventData) {
  const db = getDatabase();
  const {
    funnel_id,
    event_type,
    utm_campaign,
    utm_term,
    domain,
    path,
    ticket_id,
    metadata,
    timestamp
  } = eventData;
  
  const stmt = db.prepare(`
    INSERT INTO funnel_events 
    (funnel_id, event_type, utm_campaign, utm_term, domain, path, ticket_id, metadata, timestamp, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
  `);
  
  const result = stmt.run(
    funnel_id,
    event_type,
    utm_campaign || null,
    utm_term || null,
    domain || null,
    path || null,
    ticket_id || null,
    metadata ? JSON.stringify(metadata) : null,
    timestamp || Date.now()
  );
  
  // Se tem utm_campaign, registrar associação
  if (utm_campaign) {
    const assocStmt = db.prepare(`
      INSERT OR IGNORE INTO funnel_campaigns (funnel_id, utm_campaign, utm_term, first_seen)
      VALUES (?, ?, ?, strftime('%s', 'now'))
    `);
    assocStmt.run(funnel_id, utm_campaign, utm_term || null);
  }
  
  return result.lastInsertRowid;
}

/**
 * Busca eventos com filtros opcionais
 */
function getEvents(filters = {}) {
  const db = getDatabase();
  const {
    funnel_id,
    event_type,
    utm_campaign,
    ticket_id,
    domain,
    date_from,
    date_to
  } = filters;
  
  let query = 'SELECT * FROM funnel_events WHERE 1=1';
  const params = [];
  
  if (funnel_id) {
    query += ' AND funnel_id = ?';
    params.push(funnel_id);
  }
  
  if (event_type) {
    query += ' AND event_type = ?';
    params.push(event_type);
  }
  
  if (utm_campaign) {
    query += ' AND utm_campaign = ?';
    params.push(utm_campaign);
  }
  
  if (ticket_id) {
    query += ' AND ticket_id = ?';
    params.push(ticket_id);
  }
  
  if (domain) {
    query += ' AND domain = ?';
    params.push(domain);
  }
  
  if (date_from) {
    query += ' AND timestamp >= ?';
    params.push(new Date(date_from).getTime());
  }
  
  if (date_to) {
    query += ' AND timestamp <= ?';
    params.push(new Date(date_to).getTime());
  }
  
  query += ' ORDER BY timestamp DESC';
  
  const stmt = db.prepare(query);
  const rows = stmt.all(...params);
  
  return rows.map(row => ({
    ...row,
    metadata: row.metadata ? JSON.parse(row.metadata) : null
  }));
}

/**
 * Insere ou atualiza dados de campanha Google Ads
 */
function upsertCampaign(campaignData) {
  const db = getDatabase();
  const {
    customer_id,
    campaign_id,
    campaign_name,
    date,
    cost_micros,
    clicks,
    impressions,
    domain
  } = campaignData;
  
  const stmt = db.prepare(`
    INSERT INTO google_ads_campaigns 
    (customer_id, campaign_id, campaign_name, date, cost_micros, clicks, impressions, domain, synced_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
    ON CONFLICT(campaign_id, date) DO UPDATE SET
      cost_micros = excluded.cost_micros,
      clicks = excluded.clicks,
      impressions = excluded.impressions,
      domain = excluded.domain,
      synced_at = strftime('%s', 'now')
  `);
  
  return stmt.run(
    customer_id,
    campaign_id,
    campaign_name,
    date,
    cost_micros,
    clicks,
    impressions,
    domain || null
  );
}

/**
 * Busca dados de campanhas Google Ads
 */
function getCampaigns(filters = {}) {
  const db = getDatabase();
  const {
    customer_id,
    campaign_id,
    domain,
    date_from,
    date_to
  } = filters;
  
  let query = 'SELECT * FROM google_ads_campaigns WHERE 1=1';
  const params = [];
  
  if (customer_id) {
    query += ' AND customer_id = ?';
    params.push(customer_id);
  }
  
  if (campaign_id) {
    query += ' AND campaign_id = ?';
    params.push(campaign_id);
  }
  
  if (domain) {
    query += ' AND domain = ?';
    params.push(domain);
  }
  
  if (date_from) {
    query += ' AND date >= ?';
    params.push(date_from);
  }
  
  if (date_to) {
    query += ' AND date <= ?';
    params.push(date_to);
  }
  
  query += ' ORDER BY date DESC, campaign_name ASC';
  
  const stmt = db.prepare(query);
  return stmt.all(...params);
}

/**
 * Busca associações funnel_id ↔ utm_campaign
 */
function getFunnelCampaigns(funnel_id) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM funnel_campaigns WHERE funnel_id = ?');
  return stmt.all(funnel_id);
}

/**
 * Busca campanhas por utm_campaign
 */
function getCampaignsByUtm(utm_campaign) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT DISTINCT funnel_id FROM funnel_campaigns WHERE utm_campaign = ?');
  return stmt.all(utm_campaign);
}

/**
 * Insere ou atualiza mapeamento domain → customer_id
 */
function upsertDomainMapping(domain, customerId, accountName = null) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO domain_customer_mapping (domain, customer_id, account_name, created_at)
    VALUES (?, ?, ?, strftime('%s', 'now'))
    ON CONFLICT(domain) DO UPDATE SET
      customer_id = excluded.customer_id,
      account_name = excluded.account_name
  `);
  
  return stmt.run(domain, customerId, accountName);
}

/**
 * Busca customer_id por domain
 */
function getCustomerIdByDomain(domain) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM domain_customer_mapping WHERE domain = ?');
  const result = stmt.get(domain);
  return result ? result.customer_id : null;
}

/**
 * Busca todos os mapeamentos domain → customer_id
 */
function getAllDomainMappings() {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM domain_customer_mapping ORDER BY domain');
  return stmt.all();
}

/**
 * Remove mapeamento domain → customer_id
 */
function deleteDomainMapping(domain) {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM domain_customer_mapping WHERE domain = ?');
  return stmt.run(domain);
}

module.exports = {
  initDatabase,
  getDatabase,
  insertEvent,
  getEvents,
  upsertCampaign,
  getCampaigns,
  getFunnelCampaigns,
  getCampaignsByUtm,
  upsertDomainMapping,
  getCustomerIdByDomain,
  getAllDomainMappings,
  deleteDomainMapping
};


