/**
 * Exportação de conversões para Google Sheets (formato Google Ads Offline Conversions)
 */
const { google } = require('googleapis');
const { decrypt } = require('./sheetsEncryption');
const { sheetTitleToA1 } = require('./sheetsRange');
const gclidDb = require('./gclidSheetsDatabase');
const { getSafeConversionTime, addMinutesToConversionTime, validateChicagoConversionTime } = require('../utils/formatGoogleAdsDate');
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

const PARAM_ROW_A1 = 'Parameters:TimeZone=America/Sao_Paulo';
const HEADER_ROW = ['Google Click ID', 'Conversion Name', 'Conversion Time', 'Conversion Value', 'Conversion Currency'];

/**
 * Conversion Time para teste/diagnóstico (usa "agora" +30min).
 * Formato: YYYY-MM-DD HH:MM:SS (America/Sao_Paulo)
 */
function formatConversionTime() {
  return addMinutesToConversionTime(getSafeConversionTime(), 30);
}

/**
 * Conversion Time para exportação: original +30min (evita "conversão antes do clique").
 * Formato: YYYY-MM-DD HH:MM:SS (America/Sao_Paulo)
 * Retorna null se data inválida (não exportar).
 */
function getConversionTimeForExport(conv) {
  const source = conv?.conversion_time || getSafeConversionTime();
  const result = addMinutesToConversionTime(source, 30);
  if (!result) return null;
  return result;
}

/**
 * Validador central: identifica conversão de TESTE (NUNCA exportar).
 * Critérios: nome, flags, valor, gclid inválido.
 */
function isTestConversion(conv) {
  if (!conv) return true;

  const name = (conv.conversion_name || '').toUpperCase();
  const gclid = (conv.gclid || '').trim();
  const gclidUpper = gclid.toUpperCase();
  const val = Number(conv.conversion_value);
  const ticketId = (conv.ticket_id || '').toString();

  if (conv.is_test === true || conv.test_mode === true || conv.exportable === false) return true;
  if (['dev', 'staging', 'test'].includes((conv.environment || '').toLowerCase())) return true;
  if (['test', 'healthcheck', 'debug'].includes((conv.source || conv.origin || '').toLowerCase())) return true;
  if (conv.status === 'TEST' || conv.status === 'SKIP') return true;

  if (['TEST', 'TESTE', 'TEST-CONN', 'TEST_CONN', 'CONNTEST'].some((t) => name.includes(t))) return true;

  if (!isNaN(val) && val <= 0.01) return true;

  if (ticketId === '_test_write_' || ticketId.startsWith('test-')) return true;
  if (['TEST-CONN', 'TESTE123', 'TESTE'].includes(gclidUpper)) return true;
  if (!gclid || gclid.length < 10) return true;
  if (!/^[A-Za-z0-9_-]+$/.test(gclid) || gclid.length > 200) return true;

  return false;
}

/**
 * Validador central: conversão EXPORTÁVEL (usar em manual e automático).
 */
function isExportableConversion(conv) {
  if (!conv) return false;
  if (isTestConversion(conv)) return false;
  const g = (conv.gclid || '').trim();
  if (!g || g.length < 10) return false;
  if (conv.status === 'TEST' || conv.status === 'SKIP') return false;
  return true;
}

/**
 * Formata linha para exportação.
 * A: Google Click ID, B: Conversion Name, C: Conversion Time, D: Conversion Value (2 decimais), E: Conversion Currency
 * Retorna null se conversion time inválido (não exportar).
 */
function formatRow(conv) {
  const conversionTime = getConversionTimeForExport(conv);
  if (!conversionTime) return null;
  const value = Number(conv.conversion_value || 0);
  const valueStr = (isNaN(value) ? 0 : value).toFixed(2);
  return [
    conv.gclid || '',
    conv.conversion_name || '',
    conversionTime,
    valueStr,
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

/** Normaliza nome da aba para matching flexível (Página1 = Página 1, Sheet1 = Sheet 1) */
function normalizeTabName(name) {
  if (!name || typeof name !== 'string') return '';
  return name.trim().replace(/\s+/g, ' ');
}

/** Verifica se dois nomes de aba correspondem (ignora espaços, acentos e "Ads") */
function tabNamesMatch(a, b) {
  const na = normalizeTabName(a);
  const nb = normalizeTabName(b);
  if (na === nb) return true;
  // Página1 vs Página 1: remover espaços
  const sa = na.replace(/\s/g, '');
  const sb = nb.replace(/\s/g, '');
  if (sa === sb) return true;
  // Conversões vs Conversoes Ads: normalizar (remover acentos, "Ads", espaços)
  const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '').replace(/ads$/i, '');
  return norm(na) === norm(nb);
}

async function ensureWorksheetExists(sheets, spreadsheetId, sheetName) {
  const requestedTab = (sheetName || 'Página1').toString().trim() || 'Página1';
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const sheetsList = meta.data.sheets || [];
  const exact = sheetsList.find((s) => (s.properties?.title || '').trim() === requestedTab);
  if (exact) return exact.properties.title.trim();
  const flex = sheetsList.find((s) => tabNamesMatch(s.properties?.title || '', requestedTab));
  if (flex) {
    const actualName = flex.properties.title.trim();
    if (actualName !== requestedTab) {
      log('Aba encontrada com nome similar', { requested: requestedTab, using: actualName });
    }
    return actualName;
  }
  // Se não existe: usar a PRIMEIRA aba em vez de criar nova (onde o usuário está vendo os dados)
  const firstSheet = sheetsList[0];
  const firstTabName = firstSheet?.properties?.title?.trim();
  if (firstTabName) {
    log('Aba solicitada inexistente, usando primeira aba', { requested: requestedTab, using: firstTabName });
    return firstTabName;
  }
  // Fallback: criar a aba solicitada
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests: [{ addSheet: { properties: { title: requestedTab } } }] }
  });
  log('Worksheet criada', { sheetName: requestedTab });
  return requestedTab;
}

/**
 * Garante A1 (Parameters) e cabeçalho na linha 2.
 * Template: Linha 1 = Parameters:TimeZone=America/Sao_Paulo, Linha 2 = header, Linhas 3+ = dados.
 * Só restaura se estiver vazio ou diferente — nunca reescreve o sheet inteiro.
 */
async function ensureHeaderAndParams(sheets, spreadsheetId, sheetName) {
  const tab = await ensureWorksheetExists(sheets, spreadsheetId, sheetName);

  // 1) A1 imutável: Parameters:TimeZone=America/Sao_Paulo
  const rangeA1 = sheetTitleToA1(tab, 'A1');
  const resA1 = await sheets.spreadsheets.values.get({ spreadsheetId, range: rangeA1 });
  const a1Val = (resA1.data.values?.[0]?.[0] ?? '').toString().trim();
  if (a1Val !== PARAM_ROW_A1) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: rangeA1,
      valueInputOption: 'RAW',
      requestBody: { values: [[PARAM_ROW_A1]] }
    });
    log('A1 restaurado (Parameters)', { anterior: a1Val || '(vazio)' });
  }

  // 2) Linha 2: cabeçalho
  const rangeA2 = sheetTitleToA1(tab, 'A2:E2');
  const resA2 = await sheets.spreadsheets.values.get({ spreadsheetId, range: rangeA2 });
  const row2 = resA2.data.values?.[0] || [];
  const currentHeader = row2.map((c) => (c ?? '').toString().trim()).join(',');
  const expectedHeader = HEADER_ROW.join(',');
  if (!currentHeader || currentHeader !== expectedHeader) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: rangeA2,
      valueInputOption: 'RAW',
      requestBody: { values: [HEADER_ROW] }
    });
    log('Cabeçalho (linha 2) restaurado', { anterior: currentHeader || '(vazio)' });
  }

  return tab;
}

/** Lê linhas de dados (A3:E) para checagem de duplicidade. Linhas 1-2 são template (params + header). */
async function getExistingConversionKeys(sheets, spreadsheetId, sheetName) {
  const tab = (sheetName || 'Página1').toString().trim() || 'Página1';
  const range = sheetTitleToA1(tab, 'A3:E');
  try {
    const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    const values = res.data.values || [];
    const keys = new Set();
    for (const row of values) {
      const gclid = (row[0] || '').toString().trim();
      const name = (row[1] || '').toString().trim();
      const ct = (row[2] || '').toString().trim();
      const val = (row[3] || '').toString().trim();
      if (gclid && ct) keys.add(`${gclid}|${name}|${ct}|${val}`);
    }
    return keys;
  } catch (e) {
    log('Falha ao ler planilha para duplicidade', { error: e.message });
    return new Set();
  }
}

/**
 * SEMPRE append no final — NUNCA insertRowBefore/prepend/rewrite.
 * O range A:E faz o append após a última linha com dados (linhas 1-2 nunca tocadas).
 */
async function appendRowsOnly(sheets, spreadsheetId, sheetName, rows) {
  if (!rows || rows.length === 0) return null;
  const tab = (sheetName || 'Página1').toString().trim() || 'Página1';
  const range = sheetTitleToA1(tab, 'A:E');
  const res = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: rows }
  });
  return res.data?.updates?.updatedRange || null;
}

async function exportPendingConversions(opts = {}) {
  const { forceManual = false, credentialsJson: overrideCreds, spreadsheetId: overrideSpreadsheetId, worksheetName: overrideWorksheetName } = opts;
  const integration = gclidDb.getIntegration();
  if (!integration && !overrideCreds) {
    log('Exportação ignorada: integração inexistente');
    return { success: false, reason: 'Integração inexistente', exported: 0 };
  }
  if (!forceManual && integration && !integration.is_enabled) {
    log('Exportação automática ignorada: integração desabilitada');
    return { success: false, reason: 'Integração desabilitada', exported: 0 };
  }

  let credentialsJson = overrideCreds;
  let spreadsheetId = overrideSpreadsheetId || integration?.spreadsheet_id;
  let sheetName = overrideWorksheetName || integration?.worksheet_name || 'Página1';

  if (!credentialsJson && integration?.service_account_json_encrypted) {
    try {
      const payload = JSON.parse(integration.service_account_json_encrypted);
      credentialsJson = decrypt(payload);
    } catch (e) {
      log('Erro de autenticação', { error: e.message });
      return { success: false, reason: 'Credenciais inválidas', error: e.message, exported: 0 };
    }
  }

  if (!spreadsheetId || !credentialsJson) {
    log('Exportação ignorada: spreadsheet_id ou credenciais ausentes');
    return { success: false, reason: 'Configuração incompleta (Spreadsheet ID + JSON da Service Account)', exported: 0 };
  }

  let pending = gclidDb.getPendingConversions(500);
  const blockedTest = pending.filter((c) => !isExportableConversion(c));
  pending = pending.filter((c) => isExportableConversion(c));
  for (const c of blockedTest) {
    log('EXPORT SKIP (TEST)', { id: c.id, name: c.conversion_name, value: c.conversion_value, gclid: (c.gclid || '').slice(0, 20), reason: 'isTestConversion' });
  }
  if (blockedTest.length > 0) {
    log('Eventos de teste bloqueados (não exportados)', { count: blockedTest.length, ids: blockedTest.map((c) => c.id) });
  }
  if (pending.length === 0) {
    log('Nenhuma conversão pendente para exportar');
    return { success: true, exported: 0 };
  }

  const auth = await getAuthClient(credentialsJson);
  const sheets = google.sheets({ version: 'v4', auth });
  const batchId = `batch-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  try {
    const tab = await ensureHeaderAndParams(sheets, spreadsheetId, sheetName);
    const existingKeys = await getExistingConversionKeys(sheets, spreadsheetId, tab);
    const rows = [];
    const exportedIds = [];
    const invalid = [];
    const duplicates = [];
    for (const c of pending) {
      const row = formatRow(c);
      if (!row) {
        log('EXPORT SKIP (invalid conversion_time)', { id: c.id, conversion_time: c.conversion_time });
        invalid.push({ id: c.id, conversion_time: c.conversion_time, error: 'Data inválida ou não parseável' });
        continue;
      }
      const ct = row[2];
      const gclid = row[0] || '';
      const name = row[1] || '';
      const valueStr = row[3] || '';
      const dupKey = `${gclid}|${name}|${ct}|${valueStr}`;
      if (existingKeys.has(dupKey)) {
        log('Deduplicação: linha já existe, pulando inserção', { id: c.id, dupKey });
        duplicates.push({ id: c.id, gclid, conversion_time: ct });
        continue;
      }
      const v = validateChicagoConversionTime(ct);
      if (!v.valid) {
        invalid.push({ id: c.id, conversion_time: c.conversion_time, error: v.error });
        continue;
      }
      rows.push(row);
      exportedIds.push(c.id);
      existingKeys.add(dupKey);
    }
    if (invalid.length > 0) {
      log('Conversões ignoradas (validação)', { invalid: invalid.slice(0, 5), totalInvalid: invalid.length });
    }
    if (duplicates.length > 0) {
      log('Conversões duplicadas ignoradas', { totalDuplicates: duplicates.length });
    }
    if (rows.length === 0) {
      const reason = invalid.length > 0 ? 'Validação' : duplicates.length > 0 ? 'Duplicadas' : 'Nenhuma válida';
      log('Nenhuma conversão para exportar', { reason });
      return { success: false, reason: `Todas as conversões falharam (${reason})`, exported: 0 };
    }
    const conversionTime = rows[0]?.[2];
    if (conversionTime) {
      log('Offset +30min aplicado em todas as conversões', { conversionTime, count: rows.length });
    }
    await appendRowsOnly(sheets, spreadsheetId, tab, rows);
    gclidDb.markExported(exportedIds, batchId);
    gclidDb.updateIntegrationLastExport();
    gclidDb.insertExportLog('OK', exportedIds.length, null, batchId);
    log('EXPORT SUMMARY', { total: pending.length + blockedTest.length, exported: exportedIds.length, skipped_test: blockedTest.length, skipped_invalid: invalid.length, skipped_duplicates: duplicates.length });
    log('Exportação realizada', { exported: exportedIds.length, batchId, skipped: invalid.length });
    return { success: true, exported: exportedIds.length, batchId, skipped: invalid.length };
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
    const tab = (sheetName || 'Página1').toString().trim() || 'Página1';
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

/**
 * Diagnóstico completo: read, write, permissão, aba, A1 (params), header (linha 2).
 * @param {object} opts - { includeWriteTest: boolean } — se true, anexa linha de teste (só quando usuário clica "Re-testar")
 */
async function fullDiagnostic(credentialsJson, spreadsheetId, sheetName, opts = {}) {
  const { includeWriteTest = false } = opts;
  const now = new Date().toISOString();
  const base = {
    ok: false,
    checks: {
      canRead: false,
      canWrite: false,
      hasPermission: false,
      sheetExists: false,
      paramsOk: false,
      headerOk: false
    },
    lastTestAt: now,
    message: ''
  };
  if (!credentialsJson || !spreadsheetId) {
    base.message = 'Credenciais e Spreadsheet ID são obrigatórios';
    return base;
  }
  try {
    const creds = typeof credentialsJson === 'string' ? JSON.parse(credentialsJson) : credentialsJson;
    const auth = await getAuthClient(creds);
    const sheets = google.sheets({ version: 'v4', auth });
    const requestedTab = (sheetName || 'Página1').toString().trim() || 'Página1';
    const tab = await ensureWorksheetExists(sheets, spreadsheetId, requestedTab);
    base.checks.sheetExists = true;
    base.checks.hasPermission = true;

    await ensureHeaderAndParams(sheets, spreadsheetId, tab);

    const rangeA1 = sheetTitleToA1(tab, 'A1');
    const rangeA2 = sheetTitleToA1(tab, 'A2:E2');
    try {
      const [resA1, resA2] = await Promise.all([
        sheets.spreadsheets.values.get({ spreadsheetId, range: rangeA1 }),
        sheets.spreadsheets.values.get({ spreadsheetId, range: rangeA2 })
      ]);
      base.checks.canRead = true;
      const a1Val = (resA1.data.values?.[0]?.[0] ?? '').toString().trim();
      const row2 = resA2.data.values?.[0] || [];
      const headerStr = row2.map((c) => (c ?? '').toString().trim()).join(',');
      base.checks.paramsOk = a1Val === PARAM_ROW_A1;
      base.checks.headerOk = headerStr === HEADER_ROW.join(',');
    } catch (e) {
      base.message = normalizeErrorMessage(e);
      return base;
    }

    if (includeWriteTest) {
      const testRow = ['TEST-CONN', 'TEST', formatConversionTime(), '0.00', 'BRL'];
      try {
        await appendRowsOnly(sheets, spreadsheetId, tab, [testRow]);
        base.checks.canWrite = true;
      } catch (e) {
        base.message = normalizeErrorMessage(e);
        return base;
      }
    } else {
      base.checks.canWrite = true;
    }

    base.ok = base.checks.canRead && base.checks.canWrite && base.checks.hasPermission && base.checks.paramsOk && base.checks.headerOk;
    base.message = base.ok ? 'Conexão OK (leitura e escrita)' : base.message || 'Falha no diagnóstico';
    log('Diagnóstico Sheets', { ok: base.ok, checks: base.checks, includeWriteTest });
    return base;
  } catch (err) {
    base.message = normalizeErrorMessage(err);
    return base;
  }
}

/**
 * Verifica conexão com a planilha (leitura). NUNCA escreve linha de teste (evita contaminação Google Ads).
 */
async function testWrite(credentialsJson, spreadsheetId, sheetName) {
  const now = new Date().toISOString();
  if (!credentialsJson || !spreadsheetId) {
    return { ok: false, message: 'Credenciais e Spreadsheet ID são obrigatórios. Salve a configuração com o JSON da Service Account.', lastWriteAt: null };
  }
  try {
    const creds = typeof credentialsJson === 'string' ? JSON.parse(credentialsJson) : credentialsJson;
    const auth = await getAuthClient(creds);
    const sheets = google.sheets({ version: 'v4', auth });
    const requestedTab = (sheetName || 'Página1').toString().trim() || 'Página1';
    const tab = await ensureWorksheetExists(sheets, spreadsheetId, requestedTab);
    await ensureHeaderAndParams(sheets, spreadsheetId, tab);

    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetsList = meta.data.sheets || [];
    const allTabNames = sheetsList.map((s) => (s.properties?.title || '').trim()).filter(Boolean);
    const ourSheet = sheetsList.find((s) => tabNamesMatch(s.properties?.title || '', tab));
    const gid = ourSheet?.properties?.sheetId ?? 0;
    const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit#gid=${gid}`;

    const rangeA1 = sheetTitleToA1(tab, 'A1:E2');
    await sheets.spreadsheets.values.get({ spreadsheetId, range: rangeA1 });

    log('Teste de conexão (sem escrita)', { spreadsheetId, tab, allTabNames });
    return {
      ok: true,
      message: `Conexão OK. Aba "${tab}" acessível. Nenhuma linha de teste foi escrita (planilha protegida).`,
      lastWriteAt: now,
      spreadsheetId,
      worksheetName: tab,
      sheetUrl,
      allTabNames,
      verified: true,
      spreadsheetIdShort: spreadsheetId ? `${spreadsheetId.slice(0, 8)}...` : null,
    };
  } catch (err) {
    return { ok: false, message: normalizeErrorMessage(err), lastWriteAt: null };
  }
}

/**
 * Limpa APENAS dados (A3:E10000). NUNCA toca em A1 (Parameters) nem A2 (cabeçalho).
 */
async function clearWorksheetData(credentialsJson, spreadsheetId, sheetName) {
  if (!credentialsJson || !spreadsheetId) {
    return { success: false, message: 'Credenciais e Spreadsheet ID são obrigatórios' };
  }
  try {
    const auth = await getAuthClient(credentialsJson);
    const sheets = google.sheets({ version: 'v4', auth });
    const requestedTab = (sheetName || 'Página1').toString().trim() || 'Página1';
    const tab = await ensureWorksheetExists(sheets, spreadsheetId, requestedTab);
    const range = sheetTitleToA1(tab, 'A3:E10000');
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range
    });
    log('Dados limpos (A3:E), A1 e linha 2 preservados', { spreadsheetId, tab });
    return { success: true, message: `Dados da aba "${tab}" limpos (Parameters e cabeçalho preservados)` };
  } catch (err) {
    return { success: false, message: normalizeErrorMessage(err) };
  }
}

module.exports = {
  exportPendingConversions,
  testConnection,
  fullDiagnostic,
  testWrite,
  extractClientEmail,
  clearWorksheetData,
  ensureWorksheetExists,
  formatRow,
  formatConversionTime,
  isTestConversion,
  isExportableConversion,
  HEADER_ROW,
  log
};
