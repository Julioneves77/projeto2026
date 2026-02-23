/**
 * Serviço de integração com Google Sheets
 * Exportação de conversões no formato Google Ads (Offline Conversions)
 */
const sheetsExportService = require('./sheetsExportService');
const { sheetTitleToA1 } = require('./sheetsRange');

/**
 * Testa conexão com a planilha
 */
async function testConnection(credentialsJson, spreadsheetId, worksheetName) {
  return sheetsExportService.testConnection(credentialsJson, spreadsheetId, worksheetName);
}

/**
 * Garante que o header existe na planilha
 */
async function ensureHeader(sheets, spreadsheetId, worksheetName) {
  const header = sheetsExportService.HEADER_ROW;
  const tab = (worksheetName || 'Conversões').toString().trim() || 'Conversões';
  const range = sheetTitleToA1(tab, 'A1:E1');
  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  const values = res.data.values || [];
  const current = values[0] ? values[0].join(',') : '';
  const expected = header.join(',');
  if (current !== expected) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'RAW',
      requestBody: { values: [header] }
    });
  }
}

/**
 * Adiciona conversões à planilha
 */
async function appendConversions(rows) {
  const result = await sheetsExportService.exportPendingConversions();
  return result;
}

/**
 * Exporta conversões pendentes
 */
async function exportPending() {
  return sheetsExportService.exportPendingConversions();
}

module.exports = {
  testConnection,
  ensureHeader,
  appendConversions,
  exportPending,
  HEADER_ROW: sheetsExportService.HEADER_ROW,
  formatRow: sheetsExportService.formatRow,
  formatConversionTime: sheetsExportService.formatConversionTime
};
