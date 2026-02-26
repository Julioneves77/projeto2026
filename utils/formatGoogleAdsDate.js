/**
 * Aplica offset de minutos e formata em America/Sao_Paulo.
 * @param {string} dateString - Data original
 * @param {number} minutesOffset - Minutos a adicionar (default 10)
 * @returns {string} YYYY-MM-DD HH:MM:SS
 */
function addMinutesToConversionTime(dateString, minutesOffset = 10) {
  if (!dateString || typeof dateString !== 'string') return '';
  const trimmed = dateString.trim();
  if (/<<.*>>|ausente/i.test(trimmed)) return '';
  let d;
  if (/[-+]\d{2}:?\d{2}$|Z$/i.test(trimmed) || /T/.test(trimmed)) {
    d = new Date(trimmed);
  } else {
    d = new Date(trimmed.replace(/\s+/, 'T') + '-03:00');
  }
  if (isNaN(d.getTime())) return '';
  d.setMinutes(d.getMinutes() + minutesOffset);
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const parts = formatter.formatToParts(d);
  const get = (type) => parts.find((p) => p.type === type)?.value ?? '00';
  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')}`;
}

/** @deprecated Use addMinutesToConversionTime */
function addHoursToConversionTime(dateString, hoursOffset = 3) {
  return addMinutesToConversionTime(dateString, hoursOffset * 60);
}


/**
 * Converte horário de Brasília (UTC-03) para Chicago (UTC-06).
 * Retorna STRING no formato Google Ads: YYYY-MM-DD HH:MM:SS (SEM timezone).
 * @param {string} dateString - Data em qualquer formato (ex: "2026-02-24 16:05:30-03:00")
 * @returns {string} Ex: "2026-02-24 13:05:30"
 */
function convertToChicagoTime(dateString) {
  if (!dateString || typeof dateString !== 'string') return '';
  const trimmed = dateString.trim();
  if (/<<.*>>|ausente/i.test(trimmed)) return '';
  let d;
  if (/[-+]\d{2}:?\d{2}$|Z$/i.test(trimmed) || /T/.test(trimmed)) {
    d = new Date(trimmed);
  } else {
    d = new Date(trimmed.replace(/\s+/, 'T') + '-03:00');
  }
  if (isNaN(d.getTime())) return '';
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const parts = formatter.formatToParts(d);
  const get = (type) => parts.find((p) => p.type === type)?.value ?? '00';
  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')}`;
}

/** Regex do formato aceito: yyyy-mm-dd hh:mm:ss (sem timezone) */
const CONVERSION_TIME_PATTERN = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

/**
 * Valida conversion_time no formato Google Ads: yyyy-mm-dd hh:mm:ss (SEM timezone).
 * @returns {{ valid: boolean, error?: string }}
 */
function validateChicagoConversionTime(str) {
  if (!str || typeof str !== 'string') return { valid: false, error: 'Data vazia' };
  const trimmed = str.trim();
  if (!trimmed) return { valid: false, error: 'Data vazia' };
  if (/<<.*>>|ausente/i.test(trimmed)) return { valid: false, error: 'Data/hora ausente' };
  if (/[-+]\d{2}:?\d{2}|Z|T/i.test(trimmed)) return { valid: false, error: 'Não usar timezone (-06:00, Z, T)' };
  if (!CONVERSION_TIME_PATTERN.test(trimmed)) return { valid: false, error: 'Formato deve ser yyyy-mm-dd hh:mm:ss' };
  const d = new Date(trimmed + '-03:00');
  if (isNaN(d.getTime())) return { valid: false, error: 'Data inválida' };
  // Não checar "data no futuro" - offset +3h pode gerar datas futuras intencionalmente
  return { valid: true };
}

/**
 * Horário de conversão SEGURO para Google Ads Offline Conversions.
 * Garante que a conversão NUNCA seja anterior ao clique (erro: "A conversão não pode ocorrer antes do clique").
 * Adiciona 5 minutos de margem. Formato ISO 8601 com fuso explícito -03:00 (Brasília).
 * @returns {string} Ex: "2026-02-24 16:05:30-03:00"
 */
function getSafeConversionTime() {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 5);

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const parts = formatter.formatToParts(now);
  const get = (type) => parts.find((p) => p.type === type)?.value ?? '00';

  const year = get('year');
  const month = get('month');
  const day = get('day');
  const hours = get('hour');
  const minutes = get('minute');
  const seconds = get('second');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}-03:00`;
}

/**
 * Formato legado para compatibilidade. Preferir getSafeConversionTime().
 */
function formatGoogleAdsDate(date = new Date()) {
  const d = date ? new Date(date) : new Date();
  if (isNaN(d.getTime())) return getSafeConversionTime();

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const parts = formatter.formatToParts(d);
  const get = (type) => parts.find((p) => p.type === type)?.value ?? '00';
  const year = get('year');
  const month = get('month');
  const day = get('day');
  const hours = get('hour');
  const minutes = get('minute');
  const seconds = get('second');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}-03:00`;
}

module.exports = { formatGoogleAdsDate, getSafeConversionTime, convertToChicagoTime, addHoursToConversionTime, addMinutesToConversionTime, validateChicagoConversionTime };
