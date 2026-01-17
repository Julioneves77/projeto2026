/**
 * Funções de máscara para formatação de documentos
 */

/**
 * Aplica máscara de CPF (000.000.000-00)
 * @param value - Valor a ser formatado
 * @returns CPF formatado
 */
export const maskCPF = (value: string): string => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})/, "$1-$2")
    .replace(/(-\d{2})\d+?$/, "$1");
};

/**
 * Aplica máscara de CNPJ (00.000.000/0000-00)
 * @param value - Valor a ser formatado
 * @returns CNPJ formatado
 */
export const maskCNPJ = (value: string): string => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})/, "$1-$2")
    .replace(/(-\d{2})\d+?$/, "$1");
};

