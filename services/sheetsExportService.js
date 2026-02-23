/**
 * Exportação de conversões para Google Sheets (formato Google Ads Offline Conversions)
 */
const { google } = require('googleapis');
const { decrypt } = require('./sheetsEncryption');
const { sheetTitleToA1 } = require('./sheetsRange');
const gclidDb = require('./gclidSheetsDatabase');
const path = require('path');
const fs = require('fs');

const LOG_DIR = path.join(__dirname, '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'sheets-export.log');

function log(msg, data = {}) {
  const line = `[${new Date().toISOString()}] ${msg} ${Object.keys(data).length ? JSON.stringify(data) : ''}\n`;
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
  fs.appendFileSync(LOG_FILE, line);
  console.log(line.trim());
}

const HEADER_ROW = ['Google Click ID', 'Conversion Name', 'Conversion Time', 'Conversion Value', 'Conversion Currency'];

function formatConversionTime(isoString) {
  const d = new Date(isoString);
  // Formato exigido pelo Google Ads: "yyyy-mm-dd hh:mm:ss±hh:mm" (ex: 2026-02-23 18:05:00-03:00)
  const s = d.toLocaleString('sv-SE', { timeZone: 'America/Sao_Paulo', hour12: false }).replace('T', ' ');
  return s + '-03:00';
}

function formatRow(conv) {
  return [
    conv.gclid || '',
    conv.conversion_name || '',
    formatConversionTime(conv.conversion_time),
    String(conv.conversion_value || 0).replace(',', '.'),
    conv.conversion_currency || 'BRL'
  ];
}

async function getAuthClient(credentialsJson) {
  const creds = typeof credentialsJson === 'string' ? JSON.parse(credentialsJson) : credentialsJson;
  const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });
  return auth.getClient();
}

async function ensureWorksheetExists(sheets, spreadsheetId, sheetName) {
  const tab = (sheetName || 'Conversões').toString().trim() || 'Conversões';
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const sheetsList = meta.data.sheets || [];
  const exists = sheetsList.some((s) => (s.properties?.title || '').trim() === tab);
  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{ addSheet: { properties: { title: tab } } }]
      }
    });
    log('Worksheet criada', { sheetName: tab });
  }
  return tab;
}

async function ensureHeader(sheets, spreadsheetId, sheetName) {
  const tab = await ensureWorksheetExists(sheets, spreadsheetId, sheetName);
  const range = sheetTitleToA1(tab, 'A1:E1');
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range
  });
  const values = res.data.values || [];
  const current = values[0] ? values[0].join(',') : '';
  const expected = HEADER_ROW.join(',');
  if (current !== expected) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'RAW',
      requestBody: { values: [HEADER_ROW] }
    });
    log('Cabeçalho escrito/atualizado', { range });
  }
}

async function appendRows(sheets, spreadsheetId, sheetName, rows) {
  const tab = (sheetName || 'Conversões').toString().trim() || 'Conversões';
  const range = sheetTitleToA1(tab, 'A:E');
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: rows }
  });
}

async function exportPendingConversions() {
  const integration = gclidDb.getIntegration();
  if (!integration || !integration.is_enabled) {
    log('Exportação ignorada: integração desabilitada ou inexistente');
    return { success: false, reason: 'Integração desabilitada', exported: 0 };
  }

  if (!integration.spreadsheet_id || !integration.service_account_json_encrypted) {
    log('Exportação ignorada: spreadsheet_id ou credenciais ausentes');
    return { success: false, reason: 'Configuração incompleta', exported: 0 };
  }

  let credentialsJson;
  try {
    const payload = JSON.parse(integration.service_account_json_encrypted);
    credentialsJson = decrypt(payload);
  } catch (e) {
    log('Erro de autenticação', { error: e.message });
    return { success: false, reason: 'Credenciais inválidas', error: e.message, exported: 0 };
  }

  const pending = gclidDb.getPendingConversions(500);
  if (pending.length === 0) {
    log('Nenhuma conversão pendente para exportar');
    return { success: true, exported: 0 };
  }

  const auth = await getAuthClient(credentialsJson);
  const sheets = google.sheets({ version: 'v4', auth });
  const sheetName = integration.worksheet_name || 'Conversões';
  const batchId = `batch-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  try {
    await ensureHeader(sheets, integration.spreadsheet_id, sheetName);
    const rows = pending.map((c) => formatRow(c));
    await appendRows(sheets, integration.spreadsheet_id, sheetName, rows);
    gclidDb.markExported(pending.map((c) => c.id), batchId);
    gclidDb.updateIntegrationLastExport();
    gclidDb.insertExportLog('OK', pending.length, null, batchId);
    log('Exportação realizada', { exported: pending.length, batchId });
    return { success: true, exported: pending.length, batchId };
  } catch (err) {
    const msg = normalizeErrorMessage(err);
    log('Falha na exportação', { error: err.message, stack: err.stack?.slice(0, 300) });
    gclidDb.insertExportLog('ERROR', 0, msg, null);
    for (const c of pending) {
      gclidDb.markError(c.id, msg);
    }
    return { success: false, reason: 'Erro na API', error: msg, exported: 0 };
  }
}

function normalizeErrorMessage(err) {
  const msg = (err && err.message) ? String(err.message) : String(err);
  if (/Unable to parse range/i.test(msg)) {
    return 'Nome da aba precisa ser válido. Verifique se o nome no campo "Worksheet/Tab" bate com o nome real no Google Sheets. A aba será criada automaticamente se não existir.';
  }
  if (/caller does not have permission|permission denied|403/i.test(msg)) {
    return 'Compartilhe a planilha com o e-mail do Service Account (Editor) e tente de novo.';
  }
  return msg;
}

async function testConnection(credentialsJson, spreadsheetId, sheetName) {
  if (!credentialsJson || !spreadsheetId) {
    return { success: false, message: 'Credenciais e Spreadsheet ID são obrigatórios' };
  }
  try {
    const creds = typeof credentialsJson === 'string' ? JSON.parse(credentialsJson) : credentialsJson;
    const auth = await getAuthClient(creds);
    const sheets = google.sheets({ version: 'v4', auth });
    const tab = (sheetName || 'Conversões').toString().trim() || 'Conversões';
    await ensureWorksheetExists(sheets, spreadsheetId, tab);
    const range = sheetTitleToA1(tab, 'A1:E1');
    await sheets.spreadsheets.values.get({
      spreadsheetId,
      range
    });
    log('Sheets conectado', { spreadsheetId });
    return { success: true, message: 'Conexão OK' };
  } catch (err) {
    log('Erro de autenticação Sheets', { error: err.message });
    return { success: false, message: normalizeErrorMessage(err) };
  }
}

function extractClientEmail(credentialsJson) {
  try {
    const creds = typeof credentialsJson === 'string' ? JSON.parse(credentialsJson) : credentialsJson;
    return creds.client_email || null;
  } catch {
    return null;
  }
}

async function clearWorksheetData(credentialsJson, spreadsheetId, sheetName) {
  if (!credentialsJson || !spreadsheetId) {
    return { success: false, message: 'Credenciais e Spreadsheet ID são obrigatórios' };
  }
  try {
    const auth = await getAuthClient(credentialsJson);
    const sheets = google.sheets({ version: 'v4', auth });
    const tab = (sheetName || 'Conversões').toString().trim() || 'Conversões';
    await ensureWorksheetExists(sheets, spreadsheetId, tab);
    const range = sheetTitleToA1(tab, 'A2:E');
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range
    });
    return { success: true, message: 'Dados da planilha limpos (header mantido)' };
  } catch (err) {
    return { success: false, message: normalizeErrorMessage(err) };
  }
}

module.exports = {
  exportPendingConversions,
  testConnection,
  extractClientEmail,
  clearWorksheetData,
  ensureWorksheetExists,
  formatRow,
  formatConversionTime,
  HEADER_ROW,
  log
};
