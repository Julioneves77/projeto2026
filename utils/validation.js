/**
 * Validação e sanitização de inputs
 */

/**
 * Sanitiza string removendo caracteres perigosos
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  
  // Remove tags HTML/script
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}

/**
 * Valida e sanitiza objeto de ticket
 */
function validateTicket(ticket) {
  const errors = [];
  
  // Validar campos obrigatórios
  if (!ticket.id || typeof ticket.id !== 'string') {
    errors.push('id é obrigatório e deve ser string');
  }
  
  if (!ticket.codigo || typeof ticket.codigo !== 'string') {
    errors.push('codigo é obrigatório e deve ser string');
  }
  
  // Validar formato do código (TK-XXX)
  if (ticket.codigo && !/^TK-\d{3,}$/.test(ticket.codigo)) {
    errors.push('codigo deve estar no formato TK-XXX');
  }
  
  // Validar e sanitizar strings
  if (ticket.nomeCompleto) {
    ticket.nomeCompleto = sanitizeString(ticket.nomeCompleto);
    if (ticket.nomeCompleto.length > 200) {
      errors.push('nomeCompleto não pode ter mais de 200 caracteres');
    }
  }
  
  if (ticket.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(ticket.email)) {
      errors.push('email inválido');
    }
    if (ticket.email.length > 255) {
      errors.push('email não pode ter mais de 255 caracteres');
    }
  }
  
  if (ticket.telefone) {
    const phoneRegex = /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/;
    const cleanPhone = ticket.telefone.replace(/\D/g, '');
    if (cleanPhone.length < 8 || cleanPhone.length > 11) {
      errors.push('telefone inválido');
    }
  }
  
  // Validar status
  const validStatuses = ['GERAL', 'EM_OPERACAO', 'EM_ATENDIMENTO', 'AGUARDANDO_INFO', 'FINANCEIRO', 'CONCLUIDO'];
  if (ticket.status && !validStatuses.includes(ticket.status)) {
    errors.push(`status deve ser um dos: ${validStatuses.join(', ')}`);
  }
  
  // Garantir que ticket novo sempre tenha status GERAL se não especificado
  // IMPORTANTE: Tickets criados no PORTAL devem começar com status GERAL
  if (!ticket.status) {
    ticket.status = 'GERAL';
  }
  
  // Validar prioridade
  const validPriorities = ['padrao', 'prioridade', 'premium'];
  if (ticket.prioridade && !validPriorities.includes(ticket.prioridade)) {
    errors.push(`prioridade deve ser um dos: ${validPriorities.join(', ')}`);
  }
  
  // Validar histórico se presente
  if (ticket.historico && !Array.isArray(ticket.historico)) {
    errors.push('historico deve ser um array');
  }
  
  // Validar e sanitizar dadosFormulario se presente
  // IMPORTANTE: Este campo contém todos os dados obrigatórios do formulário (nomeMae, rg, comarca, etc.)
  let dadosFormularioSanitized = null;
  if (ticket.dadosFormulario) {
    if (typeof ticket.dadosFormulario !== 'object' || Array.isArray(ticket.dadosFormulario)) {
      errors.push('dadosFormulario deve ser um objeto');
    } else {
      dadosFormularioSanitized = {};
      for (const [key, value] of Object.entries(ticket.dadosFormulario)) {
        // Sanitizar chave (apenas alfanuméricos e underscore)
        const safeKey = key.replace(/[^a-zA-Z0-9_]/g, '');
        if (safeKey && safeKey.length <= 50) {
          // Sanitizar valor (strings são sanitizadas, booleans mantidos)
          if (typeof value === 'string') {
            const sanitizedValue = sanitizeString(value);
            if (sanitizedValue.length <= 1000) {
              dadosFormularioSanitized[safeKey] = sanitizedValue;
            }
          } else if (typeof value === 'boolean') {
            dadosFormularioSanitized[safeKey] = value;
          }
        }
      }
    }
  }
  
  // Garantir que sanitized preserve o status
  const sanitized = {
    ...ticket,
    status: ticket.status || 'GERAL', // Sempre garantir status GERAL para tickets novos
    ...(dadosFormularioSanitized && { dadosFormulario: dadosFormularioSanitized })
  };
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitized: sanitized
  };
}

/**
 * Valida dados de upload
 */
function validateUpload(data) {
  const errors = [];
  
  if (!data.fileName || typeof data.fileName !== 'string') {
    errors.push('fileName é obrigatório e deve ser string');
  }
  
  if (!data.base64 || typeof data.base64 !== 'string') {
    errors.push('base64 é obrigatório e deve ser string');
  }
  
  // Validar tamanho do base64 (máximo 50MB)
  if (data.base64) {
    const sizeInBytes = (data.base64.length * 3) / 4;
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (sizeInBytes > maxSize) {
      errors.push(`arquivo muito grande. Máximo permitido: 50MB`);
    }
  }
  
  // Validar nome do arquivo
  if (data.fileName) {
    const sanitized = sanitizeString(data.fileName);
    if (sanitized.length > 255) {
      errors.push('fileName não pode ter mais de 255 caracteres');
    }
    // Validar extensão
    const allowedExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.doc', '.docx'];
    const ext = path.extname(data.fileName).toLowerCase();
    if (ext && !allowedExtensions.includes(ext)) {
      errors.push(`extensão não permitida. Permitidas: ${allowedExtensions.join(', ')}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Valida mensagem de interação
 */
function validateInteraction(data) {
  const errors = [];
  
  if (data.mensagemInteracao && typeof data.mensagemInteracao === 'string') {
    const sanitized = sanitizeString(data.mensagemInteracao);
    if (sanitized.length > 5000) {
      errors.push('mensagemInteracao não pode ter mais de 5000 caracteres');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  sanitizeString,
  validateTicket,
  validateUpload,
  validateInteraction
};

