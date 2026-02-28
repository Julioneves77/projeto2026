#!/usr/bin/env node
/**
 * Converte Conversion Time de Brasília (GMT-3) para Chicago (GMT-6)
 * para upload de conversões offline no Google Ads.
 *
 * Uso:
 *   node scripts/convert-conversion-time-brasilia-to-chicago.js <arquivo.csv>
 *   node scripts/convert-conversion-time-brasilia-to-chicago.js <arquivo.csv> -o saida.csv
 *
 * Colunas esperadas: GCLID, Conversion Name, Conversion Time
 * Saída: yyyy-MM-dd HH:mm:ss (compatível com Google Sheets/CSV)
 */

const fs = require('fs');
const path = require('path');

/**
 * Interpreta a string como horário de Brasília (GMT-3) e retorna o equivalente em Chicago (GMT-6).
 * Brasília está 3h à frente de Chicago → subtrai 3 horas.
 * @param {string} input - Data/hora em qualquer formato comum (ISO, yyyy-MM-dd HH:mm:ss, com/sem timezone)
 * @returns {string} Formato yyyy-MM-dd HH:mm:ss em horário de Chicago
 */
function convertBrasiliaToChicago(input) {
  if (!input || typeof input !== 'string') return '';

  let d;
  const trimmed = input.trim();

  // Se já tem timezone (ex: -03:00, -0300, Z), o Date parseia corretamente
  if (/[-+]\d{2}:?\d{2}$|Z$/i.test(trimmed)) {
    d = new Date(trimmed);
  } else if (/T/.test(trimmed)) {
    // ISO com T
    d = new Date(trimmed);
  } else {
    // Assume Brasília: yyyy-MM-dd HH:mm:ss ou similar
    const brasiliaStr = trimmed.replace(/\s+/, 'T') + '-03:00';
    d = new Date(brasiliaStr);
  }

  if (isNaN(d.getTime())) return '';

  // Formatar em horário de Chicago (America/Chicago)
  const chicago = d.toLocaleString('sv-SE', {
    timeZone: 'America/Chicago',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  // sv-SE retorna "yyyy-MM-dd HH:mm:ss" (ou "yyyy-mm-dd, hh:mm:ss" - verificar)
  return chicago.replace(',', ' ').replace(/\//g, '-');
}

/**
 * Formato alternativo mais explícito para garantir yyyy-MM-dd HH:mm:ss
 */
function formatChicagoTime(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).formatToParts(date);

  const get = (type) => parts.find((p) => p.type === type)?.value ?? '00';
  const year = get('year');
  const month = get('month');
  const day = get('day');
  const hour = get('hour');
  const minute = get('minute');
  const second = get('second');
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

function convertBrasiliaToChicagoStrict(input) {
  if (!input || typeof input !== 'string') return '';
  const trimmed = input.trim();

  let d;
  if (/[-+]\d{2}:?\d{2}$|Z$/i.test(trimmed) || /T/.test(trimmed)) {
    d = new Date(trimmed);
  } else {
    d = new Date(trimmed.replace(/\s+/, 'T') + '-03:00');
  }

  if (isNaN(d.getTime())) return '';
  return formatChicagoTime(d);
}

/**
 * Parse simples de CSV (suporta vírgula e ponto-e-vírgula)
 */
function parseCSV(content) {
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };

  const sep = lines[0].includes(';') ? ';' : ',';
  const headers = lines[0].split(sep).map((h) => h.trim().replace(/^["']|["']$/g, ''));

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = [];
    let current = '';
    let inQuotes = false;
    for (let j = 0; j < lines[i].length; j++) {
      const c = lines[i][j];
      if (c === '"' || c === "'") inQuotes = !inQuotes;
      else if (!inQuotes && (c === sep || c === '\t')) {
        values.push(current.trim());
        current = '';
      } else {
        current += c;
      }
    }
    values.push(current.trim());
    rows.push(values);
  }

  return { headers, rows };
}

function findColumnIndex(headers, possibleNames) {
  const lower = headers.map((h) => h.toLowerCase());
  for (const name of possibleNames) {
    const idx = lower.findIndex((h) => h.includes(name.toLowerCase()));
    if (idx >= 0) return idx;
  }
  return -1;
}

function main() {
  const args = process.argv.slice(2);
  const inputPath = args.find((a) => !a.startsWith('-'));
  const outIdx = args.indexOf('-o');
  const outputPath = outIdx >= 0 ? args[outIdx + 1] : null;

  if (!inputPath) {
    console.error('Uso: node convert-conversion-time-brasilia-to-chicago.js <arquivo.csv> [-o saida.csv]');
    process.exit(1);
  }

  const fullPath = path.resolve(inputPath);
  if (!fs.existsSync(fullPath)) {
    console.error('Arquivo não encontrado:', fullPath);
    process.exit(1);
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  const { headers, rows } = parseCSV(content);

  const gclidIdx = findColumnIndex(headers, ['gclid', 'google click id']);
  const convNameIdx = findColumnIndex(headers, ['conversion name', 'conversion_name']);
  const convTimeIdx = findColumnIndex(headers, ['conversion time', 'conversion_time']);

  if (convTimeIdx < 0) {
    console.error('Coluna "Conversion Time" não encontrada. Colunas:', headers.join(', '));
    process.exit(1);
  }

  const sep = content.includes(';') ? ';' : ',';
  const outLines = [headers.join(sep)];

  let converted = 0;
  for (const row of rows) {
    const newRow = [...row];
    const raw = row[convTimeIdx] || '';
    const convertedTime = convertBrasiliaToChicagoStrict(raw);
    if (convertedTime) {
      newRow[convTimeIdx] = convertedTime;
      converted++;
    }
    outLines.push(newRow.join(sep));
  }

  const result = outLines.join('\n');
  if (outputPath) {
    fs.writeFileSync(path.resolve(outputPath), result, 'utf-8');
    console.log(`✅ ${converted} conversões processadas. Salvo em: ${outputPath}`);
  } else {
    console.log(result);
  }
}

main();
