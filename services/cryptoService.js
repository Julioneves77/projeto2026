/**
 * Serviço de criptografia AES-256 para credenciais sensíveis
 * Usado para criptografar JSON da Service Account do Google Sheets
 */
const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

function getKey() {
  const keyB64 = process.env.SHEETS_CREDENTIALS_ENCRYPTION_KEY;
  if (!keyB64 || keyB64.length < 32) {
    throw new Error('SHEETS_CREDENTIALS_ENCRYPTION_KEY deve ser configurada (32 bytes em base64)');
  }
  const key = Buffer.from(keyB64, 'base64');
  if (key.length !== KEY_LENGTH) {
    throw new Error('SHEETS_CREDENTIALS_ENCRYPTION_KEY deve decodificar para 32 bytes');
  }
  return key;
}

/**
 * Criptografa texto usando AES-256-GCM
 * @param {string} text - Texto a criptografar
 * @returns {object} - { iv, tag, data } em base64
 */
function encrypt(text) {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    data: encrypted.toString('base64')
  };
}

/**
 * Descriptografa payload
 * @param {object} payload - { iv, tag, data }
 * @returns {string} - Texto original
 */
function decrypt(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Payload inválido');
  }
  const key = getKey();
  const iv = Buffer.from(payload.iv, 'base64');
  const tag = Buffer.from(payload.tag, 'base64');
  const data = Buffer.from(payload.data, 'base64');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
  decipher.setAuthTag(tag);
  return decipher.update(data) + decipher.final('utf8');
}

module.exports = { encrypt, decrypt, getKey };
