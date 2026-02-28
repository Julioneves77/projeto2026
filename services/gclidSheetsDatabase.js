/**
 * Banco SQLite para GCLID/Conversões e integração Google Sheets
 */
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_DIR = path.join(__dirname, '..');
const DB_FILE = path.join(DB_DIR, 'gclid-sheets.db');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

let db = null;

function initDatabase() {
  try {
    db = new Database(DB_FILE);
    db.pragma('foreign_keys = ON');

    db.exec(`
      CREATE TABLE IF NOT EXISTS sheets_integrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        spreadsheet_id TEXT NOT NULL,
        worksheet_name TEXT NOT NULL DEFAULT 'Conversões',
        conversion_name TEXT NOT NULL,
        default_conversion_value REAL,
        currency TEXT NOT NULL DEFAULT 'BRL',
        is_enabled INTEGER NOT NULL DEFAULT 0,
        schedule_times TEXT,
        service_account_json_encrypted TEXT,
        service_account_json_hash TEXT,
        last_test_status TEXT,
        last_test_message TEXT,
        last_export_at TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS offline_conversions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticket_id TEXT,
        gclid TEXT,
        click_id_type TEXT,
        conversion_name TEXT NOT NULL,
        conversion_time TEXT NOT NULL,
        conversion_value REAL NOT NULL,
        conversion_currency TEXT NOT NULL DEFAULT 'BRL',
        status TEXT NOT NULL DEFAULT 'PENDING',
        exported_at TEXT,
        export_batch_id TEXT,
        error_message TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(ticket_id, conversion_name)
      );

      CREATE INDEX IF NOT EXISTS idx_offline_status ON offline_conversions(status);
      CREATE INDEX IF NOT EXISTS idx_offline_ticket ON offline_conversions(ticket_id);
      CREATE INDEX IF NOT EXISTS idx_offline_exported ON offline_conversions(exported_at);

      CREATE TABLE IF NOT EXISTS sheets_export_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        status TEXT NOT NULL,
        exported_count INTEGER DEFAULT 0,
        error_message TEXT,
        batch_id TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_export_log_created ON sheets_export_log(created_at);
    `);

    // Migration: add click_id_type if not exists
    try {
      const cols = db.prepare("PRAGMA table_info(offline_conversions)").all();
      if (!cols.some(c => c.name === 'click_id_type')) {
        db.exec('ALTER TABLE offline_conversions ADD COLUMN click_id_type TEXT');
        console.log('✅ [GclidSheets] Coluna click_id_type adicionada');
      }
    } catch (e) { /* ignore */ }

    // Migration: add last_test_at, last_write_at to sheets_integrations
    try {
      const intCols = db.prepare("PRAGMA table_info(sheets_integrations)").all();
      if (!intCols.some(c => c.name === 'last_test_at')) {
        db.exec('ALTER TABLE sheets_integrations ADD COLUMN last_test_at TEXT');
        console.log('✅ [GclidSheets] Coluna last_test_at adicionada');
      }
      if (!intCols.some(c => c.name === 'last_write_at')) {
        db.exec('ALTER TABLE sheets_integrations ADD COLUMN last_write_at TEXT');
        console.log('✅ [GclidSheets] Coluna last_write_at adicionada');
      }
    } catch (e) { /* ignore */ }

    // Migration: marcar conversões de teste existentes como status=TEST (nunca exportar)
    try {
      const updated = db.prepare(`
        UPDATE offline_conversions SET status='TEST' WHERE status IN ('PENDING','PENDING_NO_CLICKID')
        AND (ticket_id LIKE 'test-%' OR ticket_id = '_test_write_' OR UPPER(gclid) IN ('TEST-CONN','TESTE123','TESTE')
          OR UPPER(conversion_name) LIKE '%TEST%' OR UPPER(conversion_name) LIKE '%TEST-CONN%' OR conversion_value <= 0.01)
      `).run();
      if (updated.changes > 0) {
        console.log(`✅ [GclidSheets] ${updated.changes} conversões de teste marcadas como status=TEST`);
      }
    } catch (e) { /* ignore */ }

    console.log('✅ [GclidSheets] Banco inicializado');
    return db;
  } catch (e) {
    console.error('❌ [GclidSheets] Erro ao inicializar:', e.message);
    throw e;
  }
}

function getDb() {
  if (!db) initDatabase();
  return db;
}

// sheets_integrations
function getIntegration() {
  const row = getDb().prepare('SELECT * FROM sheets_integrations ORDER BY id DESC LIMIT 1').get();
  return row || null;
}

function saveIntegration(config) {
  const d = getDb();
  const existing = getIntegration();
  const now = new Date().toISOString();
  const data = {
    spreadsheet_id: config.spreadsheet_id || '',
    worksheet_name: config.worksheet_name || 'Página1',
    conversion_name: config.conversion_name || '',
    default_conversion_value: config.default_conversion_value ?? null,
    currency: config.currency || 'BRL',
    is_enabled: config.is_enabled ? 1 : 0,
    schedule_times: config.schedule_times ? JSON.stringify(config.schedule_times) : null,
    service_account_json_encrypted: config.service_account_json_encrypted ?? null,
    service_account_json_hash: config.service_account_json_hash ?? null,
    last_test_status: config.last_test_status ?? null,
    last_test_message: config.last_test_message ?? null,
    last_export_at: config.last_export_at ?? null,
    updated_at: now
  };

  if (existing) {
    d.prepare(`
      UPDATE sheets_integrations SET
        spreadsheet_id=?, worksheet_name=?, conversion_name=?, default_conversion_value=?,
        currency=?, is_enabled=?, schedule_times=?, service_account_json_encrypted=?,
        service_account_json_hash=?, last_test_status=?, last_test_message=?,
        last_export_at=?, updated_at=?
      WHERE id=?
    `).run(
      data.spreadsheet_id, data.worksheet_name, data.conversion_name, data.default_conversion_value,
      data.currency, data.is_enabled, data.schedule_times, data.service_account_json_encrypted,
      data.service_account_json_hash, data.last_test_status, data.last_test_message,
      data.last_export_at, data.updated_at, existing.id
    );
    return { id: existing.id, ...data };
  } else {
    const r = d.prepare(`
      INSERT INTO sheets_integrations (
        spreadsheet_id, worksheet_name, conversion_name, default_conversion_value,
        currency, is_enabled, schedule_times, service_account_json_encrypted,
        service_account_json_hash, last_test_status, last_test_message, last_export_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(
      data.spreadsheet_id, data.worksheet_name, data.conversion_name, data.default_conversion_value,
      data.currency, data.is_enabled, data.schedule_times, data.service_account_json_encrypted,
      data.service_account_json_hash, data.last_test_status, data.last_test_message, data.last_export_at
    );
    return { id: r.lastInsertRowid, ...data };
  }
}

function updateIntegrationTest(status, message) {
  const existing = getIntegration();
  if (!existing) return;
  getDb().prepare('UPDATE sheets_integrations SET last_test_status=?, last_test_message=?, updated_at=? WHERE id=?')
    .run(status, message, new Date().toISOString(), existing.id);
}

function updateIntegrationLastTest(lastTestAt, ok, message) {
  const existing = getIntegration();
  if (!existing) return;
  const cols = getDb().prepare("PRAGMA table_info(sheets_integrations)").all();
  const now = new Date().toISOString();
  if (cols.some(c => c.name === 'last_test_at')) {
    getDb().prepare('UPDATE sheets_integrations SET last_test_at=?, last_test_status=?, last_test_message=?, updated_at=? WHERE id=?')
      .run(lastTestAt || now, ok ? 'ok' : 'error', message || '', now, existing.id);
  } else {
    getDb().prepare('UPDATE sheets_integrations SET last_test_status=?, last_test_message=?, updated_at=? WHERE id=?')
      .run(ok ? 'ok' : 'error', message || '', now, existing.id);
  }
}

function updateIntegrationLastWrite(lastWriteAt) {
  const existing = getIntegration();
  if (!existing || !lastWriteAt) return;
  const cols = getDb().prepare("PRAGMA table_info(sheets_integrations)").all();
  if (!cols.some(c => c.name === 'last_write_at')) return;
  getDb().prepare('UPDATE sheets_integrations SET last_write_at=?, updated_at=? WHERE id=?')
    .run(lastWriteAt, new Date().toISOString(), existing.id);
}

function updateIntegrationLastExport() {
  const existing = getIntegration();
  if (!existing) return;
  getDb().prepare('UPDATE sheets_integrations SET last_export_at=?, updated_at=? WHERE id=?')
    .run(new Date().toISOString(), new Date().toISOString(), existing.id);
}

// offline_conversions
function upsertConversion(conv) {
  const d = getDb();
  const now = new Date().toISOString();
  const clickIdType = conv.click_id_type || null;
  try {
    d.prepare(`
      INSERT INTO offline_conversions (ticket_id, gclid, click_id_type, conversion_name, conversion_time, conversion_value, conversion_currency, status, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(ticket_id, conversion_name) DO UPDATE SET
        gclid=excluded.gclid,
        click_id_type=excluded.click_id_type,
        conversion_time=excluded.conversion_time,
        conversion_value=excluded.conversion_value,
        status=excluded.status,
        error_message=excluded.error_message,
        updated_at=excluded.updated_at
    `).run(
      conv.ticket_id || null,
      conv.gclid || null,
      clickIdType,
      conv.conversion_name,
      conv.conversion_time,
      conv.conversion_value,
      conv.conversion_currency || 'BRL',
      conv.status || 'PENDING',
      now
    );
  } catch (e) {
    d.prepare(`
      INSERT INTO offline_conversions (ticket_id, gclid, conversion_name, conversion_time, conversion_value, conversion_currency, status, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(ticket_id, conversion_name) DO UPDATE SET
        gclid=excluded.gclid,
        conversion_time=excluded.conversion_time,
        conversion_value=excluded.conversion_value,
        status=excluded.status,
        error_message=excluded.error_message,
        updated_at=excluded.updated_at
    `).run(
      conv.ticket_id || null,
      conv.gclid || null,
      conv.conversion_name,
      conv.conversion_time,
      conv.conversion_value,
      conv.conversion_currency || 'BRL',
      conv.status || 'PENDING',
      now
    );
  }
}

function getPendingConversions(limit = 500) {
  return getDb().prepare(`
    SELECT * FROM offline_conversions
    WHERE status IN ('PENDING', 'PENDING_NO_CLICKID')
    AND ticket_id NOT LIKE 'test-%' AND ticket_id != '_test_write_'
    AND gclid IS NOT NULL AND gclid != '' AND LENGTH(gclid) >= 10
    AND UPPER(gclid) NOT IN ('TEST-CONN', 'TESTE123', 'TESTE')
    AND UPPER(conversion_name) NOT LIKE '%TEST%' AND UPPER(conversion_name) NOT LIKE '%TEST-CONN%' AND UPPER(conversion_name) NOT LIKE '%TESTE%'
    AND (conversion_value IS NULL OR conversion_value > 0.01)
    ORDER BY id ASC LIMIT ?
  `).all(limit);
}

function markExported(ids, batchId) {
  const now = new Date().toISOString();
  const stmt = getDb().prepare(`
    UPDATE offline_conversions SET status='EXPORTED', exported_at=?, export_batch_id=?, error_message=NULL, updated_at=? WHERE id=?
  `);
  for (const id of ids) {
    stmt.run(now, batchId, now, id);
  }
}

function markError(id, errorMessage) {
  const now = new Date().toISOString();
  getDb().prepare(`
    UPDATE offline_conversions SET status='ERROR', error_message=?, updated_at=? WHERE id=?
  `).run((errorMessage || '').substring(0, 500), now, id);
}

function markSkipped(id) {
  const now = new Date().toISOString();
  getDb().prepare(`UPDATE offline_conversions SET status='SKIPPED', updated_at=? WHERE id=?`).run(now, id);
}

function insertExportLog(status, exportedCount, errorMessage, batchId) {
  getDb().prepare(`
    INSERT INTO sheets_export_log (status, exported_count, error_message, batch_id) VALUES (?, ?, ?, ?)
  `).run(status, exportedCount || 0, errorMessage || null, batchId || null);
}

function setPending(id) {
  const now = new Date().toISOString();
  getDb().prepare(`
    UPDATE offline_conversions SET status='PENDING', exported_at=NULL, export_batch_id=NULL, error_message=NULL, updated_at=? WHERE id=?
  `).run(now, id);
}

function listConversions(filters = {}) {
  let sql = "SELECT * FROM offline_conversions WHERE ticket_id != '_test_write_'";
  const params = [];
  if (filters.status) {
    if (filters.status === 'PENDING') {
      sql += " AND status IN ('PENDING', 'PENDING_NO_CLICKID')";
    } else {
      sql += ' AND status = ?';
      params.push(filters.status);
    }
  }
  if (filters.hasGclid === true) {
    sql += " AND gclid IS NOT NULL AND gclid != ''";
  }
  if (filters.hasGclid === false) {
    sql += ' AND (gclid IS NULL OR gclid = "")';
  }
  if (filters.dateFrom) {
    sql += ' AND date(conversion_time) >= date(?)';
    params.push(filters.dateFrom);
  }
  if (filters.dateTo) {
    sql += ' AND date(conversion_time) <= date(?)';
    params.push(filters.dateTo);
  }
  sql += ' ORDER BY id DESC LIMIT ?';
  params.push(filters.limit || 200);
  return getDb().prepare(sql).all(...params);
}

function getConversionStats() {
  const d = getDb();
  const pending = d.prepare("SELECT COUNT(*) as c FROM offline_conversions WHERE status IN ('PENDING', 'PENDING_NO_CLICKID')").get();
  const exportedToday = d.prepare(`
    SELECT COUNT(*) as c FROM offline_conversions
    WHERE status='EXPORTED' AND date(exported_at) = date('now', 'localtime')
    AND ticket_id != '_test_write_'
  `).get();
  const lastError = d.prepare(`
    SELECT error_message FROM offline_conversions WHERE status='ERROR' ORDER BY id DESC LIMIT 1
  `).get();
  return {
    pending: pending?.c || 0,
    exportedToday: exportedToday?.c || 0,
    lastError: lastError?.error_message || null
  };
}

module.exports = {
  initDatabase,
  getDb,
  getIntegration,
  saveIntegration,
  updateIntegrationTest,
  updateIntegrationLastTest,
  updateIntegrationLastWrite,
  updateIntegrationLastExport,
  upsertConversion,
  getPendingConversions,
  markExported,
  markError,
  markSkipped,
  setPending,
  listConversions,
  getConversionStats,
  insertExportLog
};

