/**
 * Serviço de integração com Pagar.me
 * Documentação: https://docs.pagar.me
 */

const PAGARME_API_URL = 'https://api.pagar.me/1/transactions';
const PAGARME_PUBLIC_KEY = import.meta.env.VITE_PAGARME_PUBLIC_KEY || '';

export interface PagarmeTransaction {
  id: string;
  status: 'processing' | 'paid' | 'pending_payment' | 'refunded' | 'refused';
  amount: number;
  payment_method: 'pix' | 'credit_card' | 'boleto';
  pix_qr_code?: string;
  pix_expiration_date?: string;
  barcode?: string;
  boleto_url?: string;
  metadata?: Record<string, string>;
}

export interface CreatePixTransactionParams {
  amount: number; // em centavos
  customer: {
    name: string;
    email: string;
    document_number: string; // CPF ou CNPJ (apenas números)
    phone?: {
      ddd: string;
      number: string;
    };
  };
  metadata?: {
    ticket_id?: string;
    ticket_code?: string;
    certificate_type?: string;
    plan_id?: string;
  };
}

/**
 * Cria uma transação PIX via Pagar.me
 */
export async function createPixTransaction(
  params: CreatePixTransactionParams
): Promise<PagarmeTransaction> {
  if (!PAGARME_PUBLIC_KEY) {
    throw new Error('VITE_PAGARME_PUBLIC_KEY não está configurada');
  }

  const payload = {
    api_key: PAGARME_PUBLIC_KEY,
    amount: params.amount,
    payment_method: 'pix',
    customer: {
      name: params.customer.name,
      email: params.customer.email,
      document_number: params.customer.document_number,
      ...(params.customer.phone && {
        phone: {
          ddd: params.customer.phone.ddd,
          number: params.customer.phone.number,
        },
      }),
    },
    ...(params.metadata && {
      metadata: params.metadata,
    }),
  };

  try {
    console.log('📦 [Pagar.me] Criando transação PIX...', {
      amount: params.amount,
      customer: params.customer.name,
    });

    const response = await fetch(PAGARME_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ [Pagar.me] Erro ao criar transação:', errorData);
      throw new Error(
        errorData.message || `Erro ${response.status} ao criar transação`
      );
    }

    const transaction = await response.json();
    console.log('✅ [Pagar.me] Transação criada:', transaction.id);

    return {
      id: transaction.id.toString(),
      status: transaction.status,
      amount: transaction.amount,
      payment_method: 'pix',
      pix_qr_code: transaction.pix_qr_code,
      pix_expiration_date: transaction.pix_expiration_date,
      metadata: transaction.metadata,
    };
  } catch (error) {
    console.error('❌ [Pagar.me] Erro ao criar transação:', error);
    throw error;
  }
}

/**
 * Consulta o status de uma transação
 */
export async function getTransactionStatus(
  transactionId: string
): Promise<PagarmeTransaction> {
  if (!PAGARME_PUBLIC_KEY) {
    throw new Error('VITE_PAGARME_PUBLIC_KEY não está configurada');
  }

  try {
    const response = await fetch(
      `${PAGARME_API_URL}/${transactionId}?api_key=${PAGARME_PUBLIC_KEY}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Erro ${response.status} ao consultar transação`
      );
    }

    const transaction = await response.json();

    return {
      id: transaction.id.toString(),
      status: transaction.status,
      amount: transaction.amount,
      payment_method: transaction.payment_method,
      pix_qr_code: transaction.pix_qr_code,
      pix_expiration_date: transaction.pix_expiration_date,
      metadata: transaction.metadata,
    };
  } catch (error) {
    console.error('❌ [Pagar.me] Erro ao consultar transação:', error);
    throw error;
  }
}

/**
 * Formata valor para centavos (Pagar.me trabalha com centavos)
 */
export function formatAmountToCents(value: number): number {
  return Math.round(value * 100);
}

/**
 * Extrai DDD e número do telefone brasileiro
 */
export function parsePhoneNumber(phone: string): { ddd: string; number: string } | null {
  // Remove caracteres não numéricos
  const digits = phone.replace(/\D/g, '');

  // Verifica se tem pelo menos 10 dígitos (DDD + número)
  if (digits.length < 10) {
    return null;
  }

  // Se começa com 0, remove
  const cleanDigits = digits.startsWith('0') ? digits.slice(1) : digits;

  // Extrai DDD (2 primeiros dígitos) e número (resto)
  const ddd = cleanDigits.slice(0, 2);
  const number = cleanDigits.slice(2);

  return { ddd, number };
}

