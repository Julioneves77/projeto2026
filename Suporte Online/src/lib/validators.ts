/**
 * Funções de validação de CPF e CNPJ
 * Algoritmos de validação implementados manualmente
 */

/**
 * Remove caracteres não numéricos de uma string
 */
const cleanDocument = (doc: string): string => {
  return doc.replace(/\D/g, "");
};

/**
 * Valida CPF usando algoritmo oficial
 * @param cpf - CPF com ou sem formatação
 * @returns true se o CPF é válido
 */
export const validateCPF = (cpf: string): boolean => {
  const cleaned = cleanDocument(cpf);

  // Verifica se tem 11 dígitos
  if (cleaned.length !== 11) {
    return false;
  }

  // Verifica se todos os dígitos são iguais (CPF inválido)
  if (/^(\d)\1{10}$/.test(cleaned)) {
    return false;
  }

  // Valida primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleaned.charAt(9))) {
    return false;
  }

  // Valida segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleaned.charAt(10))) {
    return false;
  }

  return true;
};

/**
 * Valida CNPJ usando algoritmo oficial
 * @param cnpj - CNPJ com ou sem formatação
 * @returns true se o CNPJ é válido
 */
export const validateCNPJ = (cnpj: string): boolean => {
  const cleaned = cleanDocument(cnpj);

  // Verifica se tem 14 dígitos
  if (cleaned.length !== 14) {
    return false;
  }

  // Verifica se todos os dígitos são iguais (CNPJ inválido)
  if (/^(\d)\1{13}$/.test(cleaned)) {
    return false;
  }

  // Valida primeiro dígito verificador
  let length = cleaned.length - 2;
  let numbers = cleaned.substring(0, length);
  const digits = cleaned.substring(length);
  let sum = 0;
  let pos = length - 7;

  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) {
    return false;
  }

  // Valida segundo dígito verificador
  length = length + 1;
  numbers = cleaned.substring(0, length);
  sum = 0;
  pos = length - 7;

  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) {
    return false;
  }

  return true;
};

