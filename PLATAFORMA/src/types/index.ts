export type UserRole = 'admin' | 'financeiro' | 'atendente';
export type TicketStatus = 'GERAL' | 'EM_OPERACAO' | 'EM_ATENDIMENTO' | 'AGUARDANDO_INFO' | 'FINANCEIRO' | 'CONCLUIDO';
export type PersonType = 'CPF' | 'CNPJ';
export type PrioridadeType = 'padrao' | 'prioridade' | 'premium';
export type AutomationStatus = 'IDLE' | 'PROCESSING' | 'FAILED_TRANSIENT' | 'FAILED_FINAL' | 'WAITING_DATA' | 'DONE' | 'BLOCKED';
export type CompletedBy = 'AUTO_PLEXI' | 'MANUAL_SUPPORT';

export interface User {
  id: number;
  nome: string;
  email: string;
  senha: string;
  role: UserRole;
  status: 'ativo' | 'inativo';
  valorPadrao: number;
  valorPrioridade: number;
  valorPremium: number;
  metaDiariaCertidoes: number;
}

export interface HistoricoItem {
  id: string;
  dataHora: Date;
  autor: string;
  statusAnterior: TicketStatus;
  statusNovo: TicketStatus;
  mensagem: string;
  enviouEmail?: boolean;
  enviouWhatsApp?: boolean;
  dataEnvioEmail?: string | null;
  dataEnvioWhatsApp?: string | null;
  anexo?: {
    nome: string;
    url: string;
    tipo: string;
  };
}

export interface Ticket {
  id: string;
  codigo: string;
  tipoPessoa: PersonType;
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
  dataCadastro: Date;
  prioridade: PrioridadeType;
  status: TicketStatus;
  operador: string | null;
  dataAtribuicao: Date | null;
  dataConclusao: Date | null;
  historico: HistoricoItem[];
  // Dados completos do formulário (nomeMae, rg, comarca, nacionalidade, etc.)
  dadosFormulario?: Record<string, string | boolean>;
  // Automação Plexi
  plexiRequestId?: string | null;
  plexiStatus?: string | null;
  automationStatus?: AutomationStatus;
  automationAttempts?: number;
  automationLastError?: string | null;
  plexiLastCheckAt?: string | null;
  automationLockAt?: string | null;
  automationLockOwner?: string | null;
  pdfLocalPath?: string | null;
  completedEmailSentAt?: string | null;
  completedBy?: CompletedBy;
}

export interface RespostaPronta {
  id: number;
  texto: string;
}
