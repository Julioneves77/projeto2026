/**
 * Utilitário para montar ranges A1 do Google Sheets com escape correto do nome da aba.
 * Abas com acentos, espaços, hífens etc. precisam ser envolvidas em aspas simples.
 * Ex: Conversões!A1:E1 -> 'Conversões'!A1:E1
 */
'use strict';

/**
 * Verifica se o título da aba precisa de aspas (caracteres não-alfanuméricos, incluindo acentos)
 * @param {string} title - Título da aba
 * @returns {boolean}
 */
function needsQuoting(title) {
  if (!title || typeof title !== 'string') return true;
  // Apenas A-Z, a-z, 0-9 e underscore são "seguros" na A1 notation
  return !/^[A-Za-z0-9_]+$/.test(title);
}

/**
 * Escapa aspas simples no título (padrão Sheets: John's -> John''s)
 * @param {string} title - Título da aba
 * @returns {string}
 */
function escapeSingleQuotes(title) {
  if (!title || typeof title !== 'string') return '';
  return title.replace(/'/g, "''");
}

/**
 * Monta range A1 com escape correto do nome da aba.
 * @param {string} sheetTitle - Nome da aba (ex: "Conversões", "Página1")
 * @param {string} a1 - Parte A1 do range (ex: "A1:E1", "A:E", "A2:E")
 * @returns {string} Range completo (ex: "'Conversões'!A1:E1")
 */
function sheetTitleToA1(sheetTitle, a1) {
  const trimmed = (sheetTitle || '').toString().trim();
  const safeA1 = (a1 || 'A1').trim();
  if (!trimmed) return safeA1;
  const escaped = escapeSingleQuotes(trimmed);
  const wrapped = needsQuoting(escaped) ? `'${escaped}'` : escaped;
  return `${wrapped}!${safeA1}`;
}

module.exports = {
  sheetTitleToA1,
  needsQuoting,
  escapeSingleQuotes
};
