// Storage utilities for persisting user data

export interface UserData {
  uf: string;
  tipoPessoa: string;
  nome: string;
  cpf: string;
  cnpj?: string;
  whatsapp: string;
  email: string;
}

export interface MetaData {
  protocolo: string;
  createdAt: string;
  progress: number;
  paid: boolean;
  paidAt?: string;
  sentToPlatform: boolean;
}

export interface CheckoutData {
  valor: number;
}

const STORAGE_KEYS = {
  userData: 'funnel_userData',
  meta: 'funnel_meta',
  checkout: 'funnel_checkout',
} as const;

export function generateProtocolo(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SP${timestamp}${random}`;
}

export function saveUserData(data: Partial<UserData>): void {
  const existing = getUserData();
  localStorage.setItem(STORAGE_KEYS.userData, JSON.stringify({ ...existing, ...data }));
}

export function getUserData(): UserData | null {
  const data = localStorage.getItem(STORAGE_KEYS.userData);
  return data ? JSON.parse(data) : null;
}

export function saveMeta(data: Partial<MetaData>): void {
  const existing = getMeta();
  localStorage.setItem(STORAGE_KEYS.meta, JSON.stringify({ ...existing, ...data }));
}

export function getMeta(): MetaData | null {
  const data = localStorage.getItem(STORAGE_KEYS.meta);
  return data ? JSON.parse(data) : null;
}

export function saveCheckout(data: CheckoutData): void {
  localStorage.setItem(STORAGE_KEYS.checkout, JSON.stringify(data));
}

export function getCheckout(): CheckoutData {
  const data = localStorage.getItem(STORAGE_KEYS.checkout);
  return data ? JSON.parse(data) : { valor: 39.97 };
}

export function clearAllData(): void {
  Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
}

export function formatCPF(value: string): string {
  const numbers = value.replace(/\D/g, '').slice(0, 11);
  return numbers
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

export function formatPhone(value: string): string {
  const numbers = value.replace(/\D/g, '').slice(0, 11);
  if (numbers.length <= 10) {
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return numbers
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

export function validateCPF(cpf: string): boolean {
  const numbers = cpf.replace(/\D/g, '');
  if (numbers.length !== 11) return false;
  
  // Rejeita CPFs com todos os dígitos iguais
  if (/^(\d)\1+$/.test(numbers)) return false;
  
  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(numbers[i]) * (10 - i);
  }
  let digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  if (parseInt(numbers[9]) !== digit) return false;
  
  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(numbers[i]) * (11 - i);
  }
  digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  if (parseInt(numbers[10]) !== digit) return false;
  
  return true;
}

export function formatCNPJ(value: string): string {
  const numbers = value.replace(/\D/g, '').slice(0, 14);
  return numbers
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

export function validateCNPJ(cnpj: string): boolean {
  const numbers = cnpj.replace(/\D/g, '');
  if (numbers.length !== 14) return false;
  if (/^(\d)\1+$/.test(numbers)) return false;
  
  // Validação do primeiro dígito
  let sum = 0;
  let weight = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (let i = 0; i < 12; i++) {
    sum += parseInt(numbers[i]) * weight[i];
  }
  let digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (parseInt(numbers[12]) !== digit) return false;
  
  // Validação do segundo dígito
  sum = 0;
  weight = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (let i = 0; i < 13; i++) {
    sum += parseInt(numbers[i]) * weight[i];
  }
  digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (parseInt(numbers[13]) !== digit) return false;
  
  return true;
}

export const UF_LIST = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
] as const;
