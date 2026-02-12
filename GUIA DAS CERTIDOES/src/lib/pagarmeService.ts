/**
 * Serviço de integração com Pagar.me
 * Documentação: https://docs.pagar.me
 * 
 * IMPORTANTE: As transações são criadas via sync-server (backend) para evitar problemas de CORS.
 * O frontend não chama diretamente a API do Pagar.me.
 */

// URL do servidor de sincronização - configurável via variável de ambiente
const SYNC_SERVER_URL = import.meta.env.VITE_SYNC_SERVER_URL || 'http://localhost:3001';

// API Key para autenticação
const SYNC_SERVER_API_KEY = import.meta.env.VITE_SYNC_SERVER_API_KEY || null;

export interface PagarmeTransaction {
  id: string;
  status: 'processing' | 'paid' | 'pending_payment' | 'refunded' | 'refused';
  amount: number;
  payment_method: 'pix' | 'credit_card' | 'boleto';
  pix_qr_code?: string;
  pix_qr_code_url?: string;
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
 * Helper para fazer requisições autenticadas ao sync-server
 */
async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers);
  
  // Adicionar API Key se configurada
  if (SYNC_SERVER_API_KEY) {
    headers.set('X-API-Key', SYNC_SERVER_API_KEY);
  }
  
  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Cria uma transação PIX via sync-server (que chama Pagar.me)
 */
export async function createPixTransaction(
  params: CreatePixTransactionParams
): Promise<PagarmeTransaction> {
  try {
    const url = `${SYNC_SERVER_URL}/transactions/pix`;
    console.log('📦 [Guia das Certidões] Criando transação PIX via sync-server...', {
      url,
      amount: params.amount,
      customer: params.customer.name,
      syncServerUrl: SYNC_SERVER_URL,
      hasApiKey: !!SYNC_SERVER_API_KEY,
    });

    const payload = {
      amount: params.amount,
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

    console.log('📤 [Guia das Certidões] Payload enviado:', {
      ...payload,
      customer: {
        ...payload.customer,
        document_number: payload.customer.document_number.substring(0, 3) + '***', // Ocultar documento completo
      },
    });

    const response = await fetchWithAuth(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('📥 [Guia das Certidões] Resposta recebida:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        const text = await response.text();
        errorData = { error: text || `Erro ${response.status}` };
      }
      
      console.error('❌ [Guia das Certidões] Erro ao criar transação:', {
        status: response.status,
        statusText: response.statusText,
        errorData,
      });
      
      throw new Error(
        errorData.error || errorData.message || errorData.details || `Erro ${response.status} ao criar transação`
      );
    }

    const transaction = await response.json();
    console.log('✅ [Guia das Certidões] Transação criada via sync-server:', {
      id: transaction.id,
      status: transaction.status,
      hasQrCode: !!transaction.pix_qr_code,
      hasQrCodeUrl: !!transaction.pix_qr_code_url,
    });

    return {
      id: transaction.id.toString(),
      status: transaction.status,
      amount: transaction.amount,
      payment_method: 'pix',
      pix_qr_code: transaction.pix_qr_code,
      pix_qr_code_url: transaction.pix_qr_code_url,
      pix_expiration_date: transaction.pix_expiration_date,
      metadata: transaction.metadata || {},
    };
  } catch (error) {
    console.error('❌ [Guia das Certidões] Erro ao criar transação:', {
      error,
      message: error instanceof Error ? error.message : String(error),
      syncServerUrl: SYNC_SERVER_URL,
    });
    throw error;
  }
}

/**
 * Consulta o status de uma transação via sync-server
 */
export async function getTransactionStatus(
  transactionId: string
): Promise<PagarmeTransaction> {
  try {
    const response = await fetchWithAuth(
      `${SYNC_SERVER_URL}/transactions/${transactionId}`,
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
        errorData.error || errorData.message || `Erro ${response.status} ao consultar transação`
      );
    }

    const transaction = await response.json();

    return {
      id: transaction.id.toString(),
      status: transaction.status,
      amount: transaction.amount,
      payment_method: transaction.payment_method,
      pix_qr_code: transaction.pix_qr_code,
      pix_qr_code_url: transaction.pix_qr_code_url,
      pix_expiration_date: transaction.pix_expiration_date,
      metadata: transaction.metadata || {},
    };
  } catch (error) {
    console.error('❌ [Guia das Certidões] Erro ao consultar transação:', error);
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
