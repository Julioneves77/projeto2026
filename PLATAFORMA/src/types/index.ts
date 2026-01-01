export type UserRole = 'admin' | 'financeiro' | 'atendente';
export type TicketStatus = 'GERAL' | 'EM_OPERACAO' | 'EM_ATENDIMENTO' | 'AGUARDANDO_INFO' | 'FINANCEIRO' | 'CONCLUIDO';
export type PersonType = 'CPF' | 'CNPJ';
export type PrioridadeType = 'padrao' | 'prioridade' | 'premium';

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
  enviouEmail: boolean;
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
}

export interface RespostaPronta {
  id: number;
  texto: string;
}
