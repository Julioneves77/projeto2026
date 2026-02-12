/**
 * Serviço para criar tickets no formato da PLATAFORMA
 * Usa servidor de sincronização para integração entre Guia das Certidões e PLATAFORMA
 */

// Versão do serviço para controle de cache
const TICKET_SERVICE_VERSION = '1.0.0';

// URL do servidor de sincronização - configurável via variável de ambiente
const SYNC_SERVER_URL = import.meta.env.VITE_SYNC_SERVER_URL || 'http://localhost:3001';

// Log versão ao carregar módulo
console.log(`📋 [Guia das Certidões] TicketService v${TICKET_SERVICE_VERSION} carregado`);

// API Key para autenticação (opcional)
const SYNC_SERVER_API_KEY = import.meta.env.VITE_SYNC_SERVER_API_KEY || null;

// Validação em desenvolvimento
if (import.meta.env.DEV && !import.meta.env.VITE_SYNC_SERVER_URL) {
  console.warn('⚠️ [Guia das Certidões] VITE_SYNC_SERVER_URL não está configurada. Usando padrão: http://localhost:3001');
  console.warn('⚠️ [Guia das Certidões] Configure VITE_SYNC_SERVER_URL no arquivo .env.local para produção');
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
  console.log('🔵 [Guia das Certidões] fetchWithAuth:', {
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

interface GuiaFormData {
  // Campos básicos
  nomeCompleto?: string;
  nome?: string;
  cpf?: string;
  cnpj?: string;
  documento?: string; // CPF ou CNPJ dependendo do tipoDocumento
  tipoDocumento?: string; // 'cpf' ou 'cnpj'
  tipoPessoa?: string; // 'pf' ou 'pj'
  celular?: string;
  email?: string;
  // Campos específicos de certidões
  dataNascimento?: string;
  nomeMae?: string;
  rg?: string;
  rgOrgaoEmissor?: string;
  rgNumero?: string;
  rgOrgao?: string;
  rgUf?: string;
  nacionalidade?: string;
  estadoCivil?: string;
  sexo?: string;
  genero?: string;
  paisNascimento?: string;
  ufNascimento?: string;
  municipioNascimento?: string;
  ufDocumento?: string;
  enderecoCompleto?: string;
  endereco?: string;
  cep?: string;
  bairro?: string;
  cidade?: string;
  municipio?: string;
  municipioResidencia?: string;
  estado?: string;
  ufCidade?: string;
  estadoResidencia?: string;
  logradouro?: string;
  numero?: string;
  numeroEndereco?: string;
  razaoSocial?: string;
  comarca?: string;
  finalidade?: string;
  finalidadeOutra?: string;
  finalidadeCertidao?: string;
  instancia?: string;
  natureza?: string;
  pessoa?: string;
  grauJurisdicao?: string;
  modelo?: string;
  tipoCertidao?: string;
  domicilio?: string;
  cpfOuCnpj?: string;
  nomeCompletoOuRazao?: string;
  // UF selecionada para certidões estaduais
  selectedUF?: string;
  // Nome do serviço/certidão
  service?: string;
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
        console.log('✅ [Guia das Certidões] Código gerado pelo sync-server:', data.codigo);
        return data.codigo;
      }
    }
  } catch (error) {
    console.warn('⚠️ [Guia das Certidões] Sync-server não disponível, usando fallback localStorage:', error);
  }
  
  // Fallback para localStorage se sync-server não estiver disponível
  const TICKETS_KEY = 'gdc_tickets';
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
    console.log('⚠️ [Guia das Certidões] Código gerado via fallback localStorage:', codigo);
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
 * Extrai CPF ou CNPJ do formData
 */
function extractDocument(formData: GuiaFormData): { doc: string; tipoPessoa: 'CPF' | 'CNPJ' } {
  // Tentar diferentes campos possíveis
  let doc = '';
  
  if (formData.cpf) {
    doc = formData.cpf;
  } else if (formData.cnpj) {
    doc = formData.cnpj;
  } else if (formData.documento) {
    doc = formData.documento;
  } else if (formData.cpfOuCnpj) {
    doc = formData.cpfOuCnpj;
  }
  
  const cleanDoc = doc.replace(/\D/g, '');
  
  // Determinar tipo de pessoa
  let tipoPessoa: 'CPF' | 'CNPJ' = 'CPF';
  
  if (cleanDoc.length > 11) {
    tipoPessoa = 'CNPJ';
  } else if (formData.tipoPessoa === 'pj' || formData.pessoa === 'pj') {
    tipoPessoa = 'CNPJ';
  } else if (formData.tipoDocumento === 'cnpj') {
    tipoPessoa = 'CNPJ';
  }
  
  return { doc: cleanDoc, tipoPessoa };
}

/**
 * Extrai nome completo do formData
 */
function extractNomeCompleto(formData: GuiaFormData): string {
  return formData.nomeCompleto || 
         formData.nome || 
         formData.nomeCompletoOuRazao || 
         formData.razaoSocial || 
         'Não informado';
}

/**
 * Extrai telefone do formData
 */
function extractTelefone(formData: GuiaFormData): string {
  return formData.celular || '';
}

/**
 * Mapeia dados do formulário para estrutura Ticket da PLATAFORMA
 */
async function mapFormDataToTicket(
  formData: GuiaFormData,
  service: string
): Promise<TicketData> {
  // Extrair documento e tipo de pessoa
  const { doc, tipoPessoa } = extractDocument(formData);
  
  // Gerar código do ticket
  const codigo = await generateTicketCode();
  
  // Extrair nome completo
  const nomeCompleto = extractNomeCompleto(formData);
  
  // Extrair telefone
  const telefone = extractTelefone(formData);
  
  // Preservar TODOS os dados do formulário
  const dadosFormulario: Record<string, string | boolean> = {
    ...formData,
    service: service || formData.service || '',
    selectedUF: formData.selectedUF || '',
  };
  
  console.log('🔵 [Guia das Certidões] Dados do formulário preservados:', Object.keys(dadosFormulario));
  
  const ticket: TicketData = {
    id: generateTicketId(),
    codigo: codigo,
    tipoPessoa,
    nomeCompleto,
    cpfSolicitante: doc || '',
    telefone,
    email: formData.email || '',
    tipoCertidao: service || formData.tipoCertidao || 'Certidão',
    dominio: 'www.centraldascertidoes.com',
    dataCadastro: new Date().toISOString(),
    prioridade: 'padrao',
    status: 'GERAL', // IMPORTANTE: Tickets criados sempre começam com status GERAL
    operador: null,
    dataAtribuicao: null,
    dataConclusao: null,
    historico: [],
    dadosFormulario, // IMPORTANTE: Preserva TODOS os campos do formulário
  };
  
  console.log('🔵 [Guia das Certidões] Ticket final criado:', {
    codigo: ticket.codigo,
    status: ticket.status,
    nomeCompleto: ticket.nomeCompleto,
    tipoCertidao: ticket.tipoCertidao,
    prioridade: ticket.prioridade,
    dominio: ticket.dominio,
    email: ticket.email
  });
  
  // Garantir que status seja sempre GERAL para tickets novos
  if (ticket.status !== 'GERAL') {
    console.warn('⚠️ [Guia das Certidões] ATENÇÃO: Status do ticket não é GERAL, corrigindo...', ticket.status);
    ticket.status = 'GERAL';
  }
  
  return ticket;
}

/**
 * Cria um novo ticket na plataforma via sync-server
 */
export async function createTicket(
  formData: GuiaFormData,
  service: string
): Promise<TicketData | null> {
  try {
    console.log('🔵 [Guia das Certidões] Criando ticket com dados:', { formData, service });
    
    // Criar ticket
    const newTicket = await mapFormDataToTicket(formData, service);
    
    console.log('🔵 [Guia das Certidões] Ticket criado:', newTicket);

    // Enviar para servidor de sincronização (OBRIGATÓRIO)
    try {
      console.log('📤 [Guia das Certidões] Enviando ticket para servidor de sincronização...');
      console.log('📤 [Guia das Certidões] URL do servidor:', SYNC_SERVER_URL);
      console.log('📤 [Guia das Certidões] Ticket a ser enviado:', {
        id: newTicket.id,
        codigo: newTicket.codigo,
        status: newTicket.status,
        nomeCompleto: newTicket.nomeCompleto,
        tipoCertidao: newTicket.tipoCertidao
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
        console.log('✅ [Guia das Certidões] Ticket enviado com sucesso para servidor:', result);
        
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
        console.error('❌ [Guia das Certidões] Erro ao enviar ticket para servidor:', {
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
      
      console.error('❌ [Guia das Certidões] Erro ao enviar ticket para servidor:', {
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
    const TICKETS_KEY = 'gdc_tickets';
    const stored = localStorage.getItem(TICKETS_KEY);
    let existingTickets: any[] = [];

    if (stored) {
      try {
        existingTickets = JSON.parse(stored);
        if (!Array.isArray(existingTickets)) {
          existingTickets = [];
        }
      } catch (error) {
        console.error('❌ [Guia das Certidões] Erro ao parsear tickets existentes:', error);
        existingTickets = [];
      }
    }

    const updatedTickets = [...existingTickets, newTicket];
    localStorage.setItem(TICKETS_KEY, JSON.stringify(updatedTickets));
    localStorage.setItem('gdc_tickets_version', '1');
    
    console.log('✅ [Guia das Certidões] Ticket criado e salvo localmente');
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
    
    console.error('❌ [Guia das Certidões] Erro ao criar ticket:', {
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
      console.error('❌ [Guia das Certidões] Ticket não encontrado:', ticketId);
      return null;
    }
  } catch (error) {
    console.error('❌ [Guia das Certidões] Erro ao buscar ticket:', error);
    return null;
  }
}
