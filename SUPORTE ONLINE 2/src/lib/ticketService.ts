/**
 * Serviço para criar tickets no formato da PLATAFORMA
 * Usa servidor de sincronização para integração entre Suporte Online 2 e PLATAFORMA
 */

// Versão do serviço para controle de cache
const TICKET_SERVICE_VERSION = '1.0.0';

// URL do servidor de sincronização - configurável via variável de ambiente
const SYNC_SERVER_URL = import.meta.env.VITE_SYNC_SERVER_URL || 'http://localhost:3001';

// Log versão ao carregar módulo
console.log(`📋 [Suporte Online 2] TicketService v${TICKET_SERVICE_VERSION} carregado`);

// API Key para autenticação (opcional)
const SYNC_SERVER_API_KEY = import.meta.env.VITE_SYNC_SERVER_API_KEY || null;

// Validação em desenvolvimento
if (import.meta.env.DEV && !import.meta.env.VITE_SYNC_SERVER_URL) {
  console.warn('⚠️ [Suporte Online 2] VITE_SYNC_SERVER_URL não está configurada. Usando padrão: http://localhost:3001');
  console.warn('⚠️ [Suporte Online 2] Configure VITE_SYNC_SERVER_URL no arquivo .env.local para produção');
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
  
  // Log para debug
  console.log('🔵 [Suporte Online 2] fetchWithAuth:', {
    url,
    method: options.method || 'GET',
    hasApiKey: !!SYNC_SERVER_API_KEY,
  });
  
  return fetch(url, {
    ...options,
    headers,
  });
}

export interface TicketData {
  id: string;
  codigo: string;
  tipoPessoa: 'CPF' | 'CNPJ';
  nomeCompleto: string;
  cpfSolicitante: string;
  telefone: string;
  email: string;
  tipoCertidao: string;
  dominio: string;
  dataCadastro: string; // ISO string para serialização
  prioridade: 'padrao' | 'prioridade' | 'premium';
  status: 'GERAL' | 'EM_OPERACAO';
  operador: null;
  dataAtribuicao: null;
  dataConclusao: null;
  historico: any[];
  dadosFormulario: Record<string, string | boolean>;
}

interface FormData {
  uf: string;
  tipoPessoa: string;
  nome: string;
  cpf?: string;
  cnpj?: string;
  whatsapp: string;
  email: string;
}

/**
 * Gera código único para ticket (TK-XXX)
 * Tenta obter do sync-server primeiro, com fallback para localStorage
 */
async function generateTicketCode(): Promise<string> {
  // Tentar obter código do sync-server primeiro
  try {
    const response = await fetchWithAuth(`${SYNC_SERVER_URL}/tickets/generate-code`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.codigo) {
        console.log('✅ [Suporte Online 2] Código gerado pelo sync-server:', data.codigo);
        return data.codigo;
      }
    }
  } catch (error) {
    console.warn('⚠️ [Suporte Online 2] Sync-server não disponível, usando fallback localStorage:', error);
  }
  
  // Fallback para localStorage se sync-server não estiver disponível
  const TICKETS_KEY = 'so2_tickets';
  const stored = localStorage.getItem(TICKETS_KEY);
  
  if (!stored) {
    return 'TK-001';
  }

  try {
    const tickets = JSON.parse(stored);
    if (!Array.isArray(tickets) || tickets.length === 0) {
      return 'TK-001';
    }

    // Extrair número do último código
    const lastCode = tickets[tickets.length - 1]?.codigo || 'TK-000';
    const match = lastCode.match(/TK-(\d+)/);
    const lastNumber = match ? parseInt(match[1], 10) : 0;
    const nextNumber = lastNumber + 1;
    
    const codigo = `TK-${nextNumber.toString().padStart(3, '0')}`;
    console.log('⚠️ [Suporte Online 2] Código gerado via fallback localStorage:', codigo);
    return codigo;
  } catch {
    return 'TK-001';
  }
}

/**
 * Gera ID único para ticket
 */
function generateTicketId(): string {
  return `ticket-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Mapeia dados do formulário para estrutura Ticket da PLATAFORMA
 */
async function mapFormDataToTicket(
  formData: FormData
): Promise<TicketData> {
  // Determinar tipo de pessoa (CPF ou CNPJ)
  const doc = formData.cpf || formData.cnpj || '';
  const cleanDoc = doc.replace(/\D/g, '');
  const tipoPessoa: 'CPF' | 'CNPJ' = cleanDoc.length > 11 ? 'CNPJ' : 'CPF';

  // Gerar código do ticket
  const codigo = await generateTicketCode();
  
  // Preservar TODOS os dados do formulário
  const dadosFormulario: Record<string, string | boolean> = {
    tipoPessoa: formData.tipoPessoa,
    nome: formData.nome,
    cpfCnpj: cleanDoc,
    telefone: formData.whatsapp,
    email: formData.email,
    uf: formData.uf || '',
  };
  
  console.log('🔵 [Suporte Online 2] Dados do formulário preservados:', Object.keys(dadosFormulario));
  
  const ticket: TicketData = {
    id: generateTicketId(),
    codigo: codigo,
    tipoPessoa,
    nomeCompleto: formData.nome || 'Não informado',
    cpfSolicitante: cleanDoc || '',
    telefone: formData.whatsapp || '',
    email: formData.email || '',
    tipoCertidao: 'Certidão Criminal Federal',
    dominio: 'www.suporteonline.digital',
    dataCadastro: new Date().toISOString(),
    prioridade: 'padrao',
    status: 'GERAL', // IMPORTANTE: Tickets criados sempre começam com status GERAL
    operador: null,
    dataAtribuicao: null,
    dataConclusao: null,
    historico: [],
    dadosFormulario, // IMPORTANTE: Preserva TODOS os campos do formulário
  };
  
  console.log('🔵 [Suporte Online 2] Ticket final criado:', {
    codigo: ticket.codigo,
    status: ticket.status,
    nomeCompleto: ticket.nomeCompleto,
    prioridade: ticket.prioridade,
    dominio: ticket.dominio,
    email: ticket.email
  });
  
  // Garantir que status seja sempre GERAL para tickets novos
  if (ticket.status !== 'GERAL') {
    console.warn('⚠️ [Suporte Online 2] ATENÇÃO: Status do ticket não é GERAL, corrigindo...', ticket.status);
    ticket.status = 'GERAL';
  }
  
  return ticket;
}

/**
 * Cria um novo ticket na plataforma via sync-server
 */
export async function createTicket(
  formData: FormData
): Promise<TicketData | null> {
  try {
    console.log('🔵 [Suporte Online 2] Criando ticket com dados:', formData);
    
    // Criar ticket
    const newTicket = await mapFormDataToTicket(formData);
    
    console.log('🔵 [Suporte Online 2] Ticket criado:', newTicket);

    // Enviar para servidor de sincronização (OBRIGATÓRIO)
    try {
      console.log('📤 [Suporte Online 2] Enviando ticket para servidor de sincronização...');
      console.log('📤 [Suporte Online 2] URL do servidor:', SYNC_SERVER_URL);
      console.log('📤 [Suporte Online 2] Ticket a ser enviado:', {
        id: newTicket.id,
        codigo: newTicket.codigo,
        status: newTicket.status,
        nomeCompleto: newTicket.nomeCompleto
      });
      
      const response = await fetchWithAuth(`${SYNC_SERVER_URL}/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTicket),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ [Suporte Online 2] Ticket enviado com sucesso para servidor:', result);
        
        // IMPORTANTE: Usar dados retornados pelo servidor (podem ter sido modificados)
        if (result.id) {
          newTicket.id = result.id;
        }
        if (result.codigo) {
          newTicket.codigo = result.codigo;
        }
        if (result.status) {
          newTicket.status = result.status;
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorType = response.status >= 500 ? 'SERVIDOR' : response.status >= 400 ? 'VALIDAÇÃO' : 'DESCONHECIDO';
        console.error('❌ [Suporte Online 2] Erro ao enviar ticket para servidor:', {
          tipo: errorType,
          status: response.status,
          statusText: response.statusText,
          errorData,
          url: `${SYNC_SERVER_URL}/tickets`,
          hasApiKey: !!SYNC_SERVER_API_KEY
        });
        // IMPORTANTE: Lançar erro para não continuar sem ticket no servidor
        const errorMessage = errorData.error || errorData.message || response.statusText || 'Erro desconhecido';
        const enhancedError = new Error(`Erro ao criar ticket no servidor (${errorType}): ${errorMessage}`);
        (enhancedError as any).type = errorType;
        (enhancedError as any).status = response.status;
        throw enhancedError;
      }
    } catch (error) {
      // Identificar tipo de erro
      const isNetworkError = error instanceof TypeError && (
        error.message.includes('fetch') || 
        error.message.includes('Failed to fetch') ||
        error.message.includes('NetworkError')
      );
      const isConnectionError = error instanceof Error && (
        error.message.includes('ERR_CONNECTION_REFUSED') ||
        error.message.includes('ERR_NETWORK_CHANGED') ||
        error.message.includes('net::ERR')
      );
      
      const errorType = isNetworkError || isConnectionError ? 'REDE' : 
                       (error as any).type || 'DESCONHECIDO';
      
      console.error('❌ [Suporte Online 2] Erro ao enviar ticket para servidor:', {
        tipo: errorType,
        error,
        message: error instanceof Error ? error.message : String(error),
        url: `${SYNC_SERVER_URL}/tickets`,
        syncServerAvailable: !isNetworkError && !isConnectionError
      });
      
      // IMPORTANTE: Lançar erro para não continuar sem ticket no servidor
      // Preservar informações do erro original
      if (error instanceof Error) {
        (error as any).type = errorType;
        throw error;
      }
      throw new Error(`Erro ao criar ticket: ${String(error)}`);
    }

    // Salvar no localStorage como backup
    const TICKETS_KEY = 'so2_tickets';
    const stored = localStorage.getItem(TICKETS_KEY);
    let existingTickets: any[] = [];

    if (stored) {
      try {
        existingTickets = JSON.parse(stored);
        if (!Array.isArray(existingTickets)) {
          existingTickets = [];
        }
      } catch (error) {
        console.error('❌ [Suporte Online 2] Erro ao parsear tickets existentes:', error);
        existingTickets = [];
      }
    }

    const updatedTickets = [...existingTickets, newTicket];
    localStorage.setItem(TICKETS_KEY, JSON.stringify(updatedTickets));
    localStorage.setItem('so2_tickets_version', '1');
    
    console.log('✅ [Suporte Online 2] Ticket criado e salvo localmente');
    return newTicket;
  } catch (error) {
    // Identificar tipo de erro para logs mais detalhados
    const isNetworkError = error instanceof TypeError && (
      error.message.includes('fetch') || 
      error.message.includes('Failed to fetch')
    );
    const isConnectionError = error instanceof Error && (
      error.message.includes('ERR_CONNECTION_REFUSED') ||
      error.message.includes('ERR_NETWORK_CHANGED')
    );
    const errorType = isNetworkError || isConnectionError ? 'REDE' : 
                      (error as any).type || 'DESCONHECIDO';
    
    console.error('❌ [Suporte Online 2] Erro ao criar ticket:', {
      tipo: errorType,
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      syncServerUrl: SYNC_SERVER_URL,
      syncServerAvailable: !isNetworkError && !isConnectionError
    });
    
    return null;
  }
}

/**
 * Busca um ticket por ID
 */
export async function findTicket(ticketId: string): Promise<TicketData | null> {
  try {
    const response = await fetchWithAuth(`${SYNC_SERVER_URL}/tickets/${ticketId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const ticket = await response.json();
      return ticket;
    } else {
      console.error('❌ [Suporte Online 2] Ticket não encontrado:', ticketId);
      return null;
    }
  } catch (error) {
    console.error('❌ [Suporte Online 2] Erro ao buscar ticket:', error);
    return null;
  }
}

