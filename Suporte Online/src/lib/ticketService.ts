/**
 * Serviço para criar tickets no formato da PLATAFORMA
 * Usa servidor de sincronização para integração entre Verificação Assistida e PLATAFORMA
 */

// Versão do serviço para controle de cache
const TICKET_SERVICE_VERSION = '1.0.0';

// URL do servidor de sincronização - configurável via variável de ambiente
const SYNC_SERVER_URL = import.meta.env.VITE_SYNC_SERVER_URL || 'http://localhost:3001';

// Log versão ao carregar módulo
console.log(`📋 [Verificação Assistida] TicketService v${TICKET_SERVICE_VERSION} carregado`);

// API Key para autenticação (opcional)
const SYNC_SERVER_API_KEY = import.meta.env.VITE_SYNC_SERVER_API_KEY || null;

// Validação em desenvolvimento
if (import.meta.env.DEV && !import.meta.env.VITE_SYNC_SERVER_URL) {
  console.warn('⚠️ [Verificação Assistida] VITE_SYNC_SERVER_URL não está configurada. Usando padrão: http://localhost:3001');
  console.warn('⚠️ [Verificação Assistida] Configure VITE_SYNC_SERVER_URL no arquivo .env.local para produção');
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
  console.log('🔵 [Verificação Assistida] fetchWithAuth:', {
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
  status: 'GERAL';
  operador: null;
  dataAtribuicao: null;
  dataConclusao: null;
  historico: any[];
  dadosFormulario: Record<string, string | boolean>;
}

interface FormData {
  tipoPessoa: 'fisica' | 'juridica';
  nome: string;
  cpfCnpj: string;
  telefone: string;
  email: string;
  estado?: string;
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
        console.log('✅ [Verificação Assistida] Código gerado pelo sync-server:', data.codigo);
        return data.codigo;
      }
    }
  } catch (error) {
    console.warn('⚠️ [Verificação Assistida] Sync-server não disponível, usando fallback localStorage:', error);
  }
  
  // Fallback para localStorage se sync-server não estiver disponível
  const TICKETS_KEY = 'av_tickets';
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
    console.log('⚠️ [Verificação Assistida] Código gerado via fallback localStorage:', codigo);
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
  const cleanDoc = formData.cpfCnpj.replace(/\D/g, '');
  const tipoPessoa: 'CPF' | 'CNPJ' = cleanDoc.length > 11 ? 'CNPJ' : 'CPF';

  // Gerar código do ticket
  const codigo = await generateTicketCode();
  
  // Preservar TODOS os dados do formulário
  const dadosFormulario: Record<string, string | boolean> = {
    tipoPessoa: formData.tipoPessoa,
    nome: formData.nome,
    cpfCnpj: formData.cpfCnpj,
    telefone: formData.telefone,
    email: formData.email,
    estado: formData.estado || '',
  };
  
  console.log('🔵 [Verificação Assistida] Dados do formulário preservados:', Object.keys(dadosFormulario));
  
  const ticket: TicketData = {
    id: generateTicketId(),
    codigo: codigo,
    tipoPessoa,
    nomeCompleto: formData.nome || 'Não informado',
    cpfSolicitante: formData.cpfCnpj || '',
    telefone: formData.telefone || '',
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
  
  console.log('🔵 [Verificação Assistida] Ticket final criado:', {
    codigo: ticket.codigo,
    status: ticket.status,
    nomeCompleto: ticket.nomeCompleto,
    prioridade: ticket.prioridade
  });
  
  // Garantir que status seja sempre GERAL para tickets novos
  if (ticket.status !== 'GERAL') {
    console.warn('⚠️ [Verificação Assistida] ATENÇÃO: Status do ticket não é GERAL, corrigindo...', ticket.status);
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
    console.log('🔵 [Verificação Assistida] Criando ticket com dados:', formData);
    
    // Criar ticket
    const newTicket = await mapFormDataToTicket(formData);
    
    console.log('🔵 [Verificação Assistida] Ticket criado:', newTicket);

    // Enviar para servidor de sincronização (OBRIGATÓRIO)
    try {
      console.log('📤 [Verificação Assistida] Enviando ticket para servidor de sincronização...');
      console.log('📤 [Verificação Assistida] URL do servidor:', SYNC_SERVER_URL);
      console.log('📤 [Verificação Assistida] Ticket a ser enviado:', {
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
        console.log('✅ [Verificação Assistida] Ticket enviado com sucesso para servidor:', result);
        
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
        console.error('❌ [Verificação Assistida] Erro ao enviar ticket para servidor:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        // IMPORTANTE: Lançar erro para não continuar sem ticket no servidor
        throw new Error(`Erro ao criar ticket no servidor: ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      console.error('❌ [Verificação Assistida] Erro ao enviar ticket para servidor:', error);
      // IMPORTANTE: Lançar erro para não continuar sem ticket no servidor
      throw error;
    }

    // Salvar no localStorage como backup
    const TICKETS_KEY = 'av_tickets';
    const stored = localStorage.getItem(TICKETS_KEY);
    let existingTickets: any[] = [];

    if (stored) {
      try {
        existingTickets = JSON.parse(stored);
        if (!Array.isArray(existingTickets)) {
          existingTickets = [];
        }
      } catch (error) {
        console.error('❌ [Verificação Assistida] Erro ao parsear tickets existentes:', error);
        existingTickets = [];
      }
    }

    const updatedTickets = [...existingTickets, newTicket];
    localStorage.setItem(TICKETS_KEY, JSON.stringify(updatedTickets));
    localStorage.setItem('av_tickets_version', '1');
    
    console.log('✅ [Verificação Assistida] Ticket criado e salvo localmente');
    return newTicket;
  } catch (error) {
    console.error('❌ [Verificação Assistida] Erro ao criar ticket:', error);
    return null;
  }
}

/**
 * Atualiza o status de um ticket
 */
export async function updateTicketStatus(
  ticketId: string,
  status: string
): Promise<boolean> {
  try {
    console.log('🔄 [Verificação Assistida] Atualizando status do ticket:', { ticketId, status });
    
    // IMPORTANTE: Usar PUT /tickets/:id (não /tickets/:id/status)
    const response = await fetchWithAuth(`${SYNC_SERVER_URL}/tickets/${ticketId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    if (response.ok) {
      const updatedTicket = await response.json();
      console.log('✅ [Verificação Assistida] Status do ticket atualizado com sucesso:', {
        ticketId,
        statusAnterior: 'GERAL',
        statusNovo: updatedTicket.status || status,
      });
      return true;
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ [Verificação Assistida] Erro ao atualizar status:', {
        status: response.status,
        statusText: response.statusText,
        errorData,
      });
      return false;
    }
  } catch (error) {
    console.error('❌ [Verificação Assistida] Erro ao atualizar status do ticket:', error);
    return false;
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
      console.error('❌ [Verificação Assistida] Ticket não encontrado:', ticketId);
      return null;
    }
  } catch (error) {
    console.error('❌ [Verificação Assistida] Erro ao buscar ticket:', error);
    return null;
  }
}

/**
 * Envia confirmação de pagamento (email e WhatsApp)
 */
export async function sendPaymentConfirmation(ticketId: string): Promise<{
  success: boolean;
  email?: { success: boolean; error?: string; alreadySent?: boolean };
  whatsapp?: { success: boolean; error?: string; alreadySent?: boolean };
  error?: string;
}> {
  try {
    console.log('📧📱 [Verificação Assistida] Enviando confirmação de pagamento para ticket:', ticketId);
    
    const response = await fetchWithAuth(`${SYNC_SERVER_URL}/tickets/${ticketId}/send-confirmation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ [Verificação Assistida] Confirmação enviada:', {
        email: result.email?.success ? '✅' : '❌',
        whatsapp: result.whatsapp?.success ? '✅' : '❌',
      });
      
      return {
        success: result.success || false,
        email: result.email,
        whatsapp: result.whatsapp,
      };
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ [Verificação Assistida] Erro ao enviar confirmação:', {
        status: response.status,
        statusText: response.statusText,
        errorData,
      });
      
      return {
        success: false,
        error: errorData.error || 'Erro ao enviar confirmação',
        email: errorData.email,
        whatsapp: errorData.whatsapp,
      };
    }
  } catch (error) {
    console.error('❌ [Verificação Assistida] Erro ao enviar confirmação:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao enviar confirmação',
    };
  }
}

