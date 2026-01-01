/**
 * Serviço para criar tickets no formato da PLATAFORMA
 * Usa localStorage compartilhado para integração entre PORTAL e PLATAFORMA
 */

export interface TicketData {
  id: string;
  codigo: string;
  tipoPessoa: 'CPF' | 'CNPJ';
  nomeCompleto: string;
  cpfSolicitante: string;
  dataNascimento: string;
  genero: string;
  estadoEmissao: string;
  cidadeEmissao: string;
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
}

interface PortalFormData {
  [key: string]: string | boolean;
}

interface SelectedPlan {
  id: string;
  name: string;
  price: number;
}

/**
 * Gera código único para ticket (TK-XXX)
 */
function generateTicketCode(): string {
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
    
    return `TK-${nextNumber.toString().padStart(3, '0')}`;
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
 * Mapeia dados do formulário PORTAL para estrutura Ticket da PLATAFORMA
 */
function mapFormDataToTicket(
  formData: PortalFormData,
  certificateType: string,
  state: string | undefined,
  selectedPlan: SelectedPlan
): TicketData {
  // Determinar tipo de pessoa (CPF ou CNPJ)
  const cpfOuCnpj = formData.cpf || formData.cnpj || formData.cpfOuCnpj || formData.documento || '';
  const cleanDoc = cpfOuCnpj.toString().replace(/\D/g, '');
  const tipoPessoa: 'CPF' | 'CNPJ' = cleanDoc.length > 11 ? 'CNPJ' : 'CPF';

  // Mapear prioridade do plano
  const prioridadeMap: Record<string, 'padrao' | 'prioridade' | 'premium'> = {
    padrao: 'padrao',
    prioridade: 'prioridade',
    premium: 'premium',
  };
  const prioridade = prioridadeMap[selectedPlan.id] || 'padrao';

  // Extrair dados do formulário - mapear vários possíveis nomes de campos
  const nomeCompleto = (
    formData.nomeCompleto || 
    formData.nome || 
    formData.nomeCompletoSolicitante ||
    ''
  ).toString();
  
  const cpfSolicitante = cpfOuCnpj.toString();
  
  // Formatar data de nascimento (aceitar vários formatos)
  let dataNascimento = (formData.dataNascimento || formData.dataNascimentoSolicitante || '').toString();
  if (dataNascimento) {
    // Converter DD/MM/YYYY para YYYY-MM-DD
    if (dataNascimento.includes('/')) {
      const parts = dataNascimento.split('/');
      if (parts.length === 3) {
        dataNascimento = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    } else {
      dataNascimento = dataNascimento.replace(/\//g, '-');
    }
  }
  
  const genero = (
    formData.genero || 
    formData.sexo || 
    formData.generoSolicitante ||
    ''
  ).toString() || 'Não informado';
  
  const estadoEmissao = (
    state || 
    formData.estadoEmissao || 
    formData.estado || 
    formData.estadoSolicitante ||
    ''
  ).toString();
  
  const cidadeEmissao = (
    formData.cidadeEmissao || 
    formData.cidade || 
    formData.cidadeSolicitante ||
    ''
  ).toString();
  
  const telefone = (
    formData.telefone || 
    formData.telefoneSolicitante ||
    ''
  ).toString();
  
  const email = (
    formData.email || 
    formData.emailSolicitante ||
    ''
  ).toString();

  return {
    id: generateTicketId(),
    codigo: generateTicketCode(),
    tipoPessoa,
    nomeCompleto,
    cpfSolicitante,
    dataNascimento: dataNascimento || '',
    genero,
    estadoEmissao: estadoEmissao.toString(),
    cidadeEmissao: cidadeEmissao.toString(),
    telefone,
    email,
    tipoCertidao: certificateType,
    dominio: 'portalcertidao.com.br',
    dataCadastro: new Date().toISOString(),
    prioridade,
    status: 'GERAL',
    operador: null,
    dataAtribuicao: null,
    dataConclusao: null,
    historico: [],
  };
}

/**
 * Cria um novo ticket no localStorage compartilhado com a PLATAFORMA
 */
export function createTicket(
  formData: PortalFormData,
  certificateType: string,
  state: string | undefined,
  selectedPlan: SelectedPlan
): TicketData | null {
  try {
    const TICKETS_KEY = 'av_tickets';
    
    // Criar ticket
    const newTicket = mapFormDataToTicket(formData, certificateType, state, selectedPlan);

    // Buscar tickets existentes
    const stored = localStorage.getItem(TICKETS_KEY);
    let existingTickets: any[] = [];

    if (stored) {
      try {
        existingTickets = JSON.parse(stored);
        if (!Array.isArray(existingTickets)) {
          existingTickets = [];
        }
      } catch {
        existingTickets = [];
      }
    }

    // Adicionar novo ticket
    const updatedTickets = [...existingTickets, newTicket];

    // Salvar no localStorage
    localStorage.setItem(TICKETS_KEY, JSON.stringify(updatedTickets));

    return newTicket;
  } catch (error) {
    console.error('Erro ao criar ticket:', error);
    return null;
  }
}

