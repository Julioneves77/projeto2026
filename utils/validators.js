/**
 * Funções de validação reutilizáveis para email e telefone
 */

/**
 * Valida formato de email
 * @param {string} email - Email a ser validado
 * @returns {boolean} - true se válido, false caso contrário
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  // Regex básico para validação de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Valida formato de telefone brasileiro
 * Aceita formatos: (XX) XXXXX-XXXX, (XX) XXXX-XXXX, XX XXXXXXXX, XX XXXXXXXXX
 * @param {string} phone - Telefone a ser validado
 * @returns {boolean} - true se válido, false caso contrário
 */
function validatePhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return false;
  }
  
  // Remover caracteres não numéricos
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Telefone brasileiro deve ter 10 ou 11 dígitos (com DDD)
  // 10 dígitos: DDD (2) + número (8) - telefone fixo
  // 11 dígitos: DDD (2) + número (9) - celular
  if (cleanPhone.length < 10 || cleanPhone.length > 11) {
    return false;
  }
  
  // Verificar se DDD é válido (11-99)
  const ddd = parseInt(cleanPhone.substring(0, 2), 10);
  if (ddd < 11 || ddd > 99) {
    return false;
  }
  
  return true;
}

module.exports = {
  validateEmail,
  validatePhone
};

