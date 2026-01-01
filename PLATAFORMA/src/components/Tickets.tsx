import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTickets } from '@/hooks/useTickets';
import { Ticket, TicketStatus, PrioridadeType } from '@/types';
import { TicketDetailModal } from './TicketDetailModal';
import { TicketEditModal } from './TicketEditModal';
import { 
  MoreVertical, 
  Search, 
  Eye, 
  UserPlus, 
  Trash2,
  Star,
  Phone,
  Pencil
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type TabType = 'geral' | 'em_operacao' | 'concluidos';

export function Tickets() {
  const { currentUser, userRole } = useAuth();
  const { tickets, atribuirTicket, updateTicket } = useTickets();
  const [activeTab, setActiveTab] = useState<TabType>('em_operacao');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);

  // Definir abas visíveis por perfil
  // Atendente vê "Em Operação" e "Concluídos" (somente dele no dia)
  const tabs: { id: TabType; label: string; roles: string[] }[] = [
    { id: 'geral', label: 'Geral', roles: ['admin', 'financeiro'] },
    { id: 'em_operacao', label: 'Em Operação', roles: ['admin', 'financeiro', 'atendente'] },
    { id: 'concluidos', label: 'Concluídos', roles: ['admin', 'financeiro', 'atendente'] },
  ];

  const visibleTabs = tabs.filter(tab => tab.roles.includes(userRole || ''));

  // Verifica se é hoje
  const isToday = (date: Date | null): boolean => {
    if (!date) return false;
    const today = new Date();
    const d = new Date(date);
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  };

  // Filtrar tickets por aba
  const filterByTab = (ticket: Ticket): boolean => {
    switch (activeTab) {
      case 'geral':
        return ticket.status === 'GERAL';
      case 'em_operacao':
        return ['EM_OPERACAO', 'EM_ATENDIMENTO', 'AGUARDANDO_INFO', 'FINANCEIRO'].includes(ticket.status);
      case 'concluidos':
        return ticket.status === 'CONCLUIDO';
      default:
        return false;
    }
  };

  // Filtrar por perfil (regra: financeiro/atendente só veem/detalham após atribuir)
  const canSeeTicketForRole = (ticket: Ticket, tabId: TabType): boolean => {
    if (userRole === 'admin') return true;

    if (userRole === 'financeiro') {
      // Financeiro não vê tickets atribuídos para outras pessoas.
      if (tabId === 'geral') return true;
      if (tabId === 'em_operacao') return !ticket.operador || ticket.operador === currentUser?.nome;
      if (tabId === 'concluidos') return ticket.operador === currentUser?.nome;
      return false;
    }

    if (userRole === 'atendente') {
      if (tabId === 'geral') return false;
      if (tabId === 'concluidos') return ticket.operador === currentUser?.nome && isToday(ticket.dataConclusao);
      return !ticket.operador || ticket.operador === currentUser?.nome;
    }

    return false;
  };

  // Ordenação por prioridade: Premium > Prioridade > Padrão, depois por data
  const getPrioridadeOrder = (prioridade: PrioridadeType): number => {
    switch (prioridade) {
      case 'premium': return 0;
      case 'prioridade': return 1;
      case 'padrao': return 2;
      default: return 3;
    }
  };

  // Aplicar filtros e ordenação
  const filteredTickets = tickets
    .filter(filterByTab)
    .filter((ticket) => canSeeTicketForRole(ticket, activeTab))
    .filter(ticket => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        ticket.codigo.toLowerCase().includes(term) ||
        ticket.nomeCompleto.toLowerCase().includes(term) ||
        ticket.cpfSolicitante.includes(term) ||
        ticket.telefone.includes(term)
      );
    })
    .sort((a, b) => {
      // Primeiro ordena por prioridade
      const prioridadeDiff = getPrioridadeOrder(a.prioridade) - getPrioridadeOrder(b.prioridade);
      if (prioridadeDiff !== 0) return prioridadeDiff;
      // Depois ordena por data de cadastro (mais recente primeiro)
      return new Date(b.dataCadastro).getTime() - new Date(a.dataCadastro).getTime();
    });

  const getPrioridadeBadge = (prioridade: PrioridadeType) => {
    switch (prioridade) {
      case 'premium':
        return {
          label: 'Premium',
          className: 'bg-red-500/10 text-red-600 border border-red-500/20'
        };
      case 'prioridade':
        return {
          label: 'Prioridade',
          className: 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20'
        };
      case 'padrao':
      default:
        return {
          label: 'Padrão',
          className: 'bg-muted text-muted-foreground border border-border'
        };
    }
  };

  // Cores de linha por status
  const getRowClass = (ticket: Ticket): string => {
    switch (ticket.status) {
      case 'GERAL':
      case 'EM_OPERACAO':
        return 'table-row-open'; // Cinza
      case 'EM_ATENDIMENTO':
        return 'table-row-atendimento'; // Amarelo
      case 'AGUARDANDO_INFO':
        return 'table-row-waiting'; // Vermelho
      case 'FINANCEIRO':
        return 'table-row-financial'; // Azul
      case 'CONCLUIDO':
        return 'table-row-complete';
      default:
        return '';
    }
  };

  const getStatusBadgeClass = (status: TicketStatus): string => {
    switch (status) {
      case 'GERAL':
        return 'bg-muted text-muted-foreground';
      case 'EM_OPERACAO':
        return 'bg-muted text-muted-foreground border border-border';
      case 'EM_ATENDIMENTO':
        return 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20';
      case 'AGUARDANDO_INFO':
        return 'bg-red-500/10 text-red-600 border border-red-500/20';
      case 'FINANCEIRO':
        return 'bg-blue-500/10 text-blue-600 border border-blue-500/20';
      case 'CONCLUIDO':
        return 'bg-green-500/10 text-green-600 border border-green-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: TicketStatus): string => {
    switch (status) {
      case 'GERAL':
        return 'Em Aberto';
      case 'EM_OPERACAO':
        return 'Em Aberto';
      case 'EM_ATENDIMENTO':
        return 'Em Atendimento';
      case 'AGUARDANDO_INFO':
        return 'Precisa de Dados';
      case 'FINANCEIRO':
        return 'Financeiro';
      case 'CONCLUIDO':
        return 'Concluído';
      default:
        return status;
    }
  };

  const handleAtribuir = (ticket: Ticket) => {
    if (currentUser) {
      atribuirTicket(ticket.id, currentUser.nome);
    }
  };

  const handleColocarEmOperacao = (ticket: Ticket) => {
    updateTicket(ticket.id, { status: 'EM_OPERACAO' });
  };

  const handleDelete = (ticketId: string) => {
    if (window.confirm('Tem certeza que deseja deletar este ticket?')) {
      // Em um sistema real, teria a função deleteTicket
    }
  };

  // === AÇÕES POR ROLE E ABA ===

  // Verifica se pode atribuir
  const canAtribuir = (ticket: Ticket): boolean => {
    // Admin: pode atribuir em geral (colocar em operação) e em_operacao (sempre)
    if (userRole === 'admin') {
      if (activeTab === 'geral') return true;
      if (activeTab === 'em_operacao') return true;
    }
    // Financeiro: pode atribuir em geral e em_operacao (se não tem operador)
    if (userRole === 'financeiro') {
      if (activeTab === 'geral') return true;
      if (activeTab === 'em_operacao' && !ticket.operador) return true;
    }
    // Atendente: só pode atribuir em_operacao se não tem operador
    if (userRole === 'atendente') {
      return activeTab === 'em_operacao' && !ticket.operador;
    }
    return false;
  };

  // Verifica se pode detalhar
  const canDetalhar = (ticket: Ticket): boolean => {
    if (userRole === 'admin') return true;
    // Financeiro: só pode detalhar se já atribuiu a si (em_operacao) ou em concluídos
    if (userRole === 'financeiro') {
      if (activeTab === 'concluidos') return true;
      if (activeTab === 'em_operacao') return ticket.operador === currentUser?.nome;
    }
    // Atendente: só pode detalhar se já atribuiu a si
    if (userRole === 'atendente') {
      return ticket.operador === currentUser?.nome;
    }
    return false;
  };

  // Verifica se pode alterar
  const canAlterar = (ticket: Ticket): boolean => {
    if (userRole === 'admin') return true;
    if (userRole === 'financeiro') {
      return activeTab === 'geral'; // Só altera na aba geral
    }
    return false;
  };

  // Verifica se pode deletar
  const canDeletar = (): boolean => {
    return userRole === 'admin';
  };

  // Texto do botão de atribuir baseado no contexto
  const getAtribuirLabel = (ticket: Ticket): string => {
    if (activeTab === 'geral') return 'Colocar em Operação';
    return 'Atribuir a mim';
  };

  const handleAtribuirAction = (ticket: Ticket) => {
    if (activeTab === 'geral') {
      handleColocarEmOperacao(ticket);
    } else {
      handleAtribuir(ticket);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tickets</h1>
          <p className="text-muted-foreground">Gerencie as solicitações de certidões</p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por código, nome, CPF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'text-primary border-primary'
                : 'text-muted-foreground border-transparent hover:text-foreground'
            }`}
          >
            {tab.label}
            <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-muted">
              {tickets.filter(t => {
                const matchesTab = tab.id === 'geral' ? t.status === 'GERAL' :
                  tab.id === 'em_operacao' ? ['EM_OPERACAO', 'EM_ATENDIMENTO', 'AGUARDANDO_INFO', 'FINANCEIRO'].includes(t.status) :
                  t.status === 'CONCLUIDO';
                return matchesTab && canSeeTicketForRole(t, tab.id);
              }).length}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full" style={{ minWidth: '1200px' }}>
            <thead>
              <tr className="bg-[hsl(var(--table-header))]">
                <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap w-24">Código</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap w-32">CPF</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Nome/Telefone</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap w-24">Cadastro</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap w-24">Atribuição</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap w-24">Finalização</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap w-32">Status</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap w-28">Operador</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap w-24">Prioridade</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap w-20">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTickets.map((ticket) => (
                <tr 
                  key={ticket.id} 
                  className={`hover:bg-[hsl(var(--table-row-hover))] transition-colors ${getRowClass(ticket)}`}
                >
                  <td className="px-3 py-3">
                    <span className="font-mono text-sm font-medium text-foreground">{ticket.codigo}</span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-sm text-foreground">{ticket.cpfSolicitante}</span>
                  </td>
                  <td className="px-3 py-3">
                    <div>
                      <p className="text-sm font-medium text-foreground truncate max-w-[180px]">{ticket.nomeCompleto}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {ticket.telefone}
                      </p>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-sm text-foreground">
                      {new Date(ticket.dataCadastro).toLocaleDateString('pt-BR')}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {new Date(ticket.dataCadastro).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </td>
                  <td className="px-3 py-3">
                    {ticket.dataAtribuicao ? (
                      <>
                        <span className="text-sm text-foreground">
                          {new Date(ticket.dataAtribuicao).toLocaleDateString('pt-BR')}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          {new Date(ticket.dataAtribuicao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {ticket.dataConclusao ? (
                      <>
                        <span className="text-sm text-foreground">
                          {new Date(ticket.dataConclusao).toLocaleDateString('pt-BR')}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          {new Date(ticket.dataConclusao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap ${getStatusBadgeClass(ticket.status)}`}>
                      {getStatusLabel(ticket.status)}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-sm text-foreground truncate max-w-[100px] block">
                      {ticket.operador || <span className="text-muted-foreground">-</span>}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    {(() => {
                      const badge = getPrioridadeBadge(ticket.prioridade);
                      return (
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap ${badge.className}`}>
                          {ticket.prioridade === 'premium' && <Star className="w-3 h-3 fill-current" />}
                          {ticket.prioridade === 'prioridade' && <Star className="w-3 h-3" />}
                          {badge.label}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                          <MoreVertical className="w-5 h-5 text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {canAtribuir(ticket) && (
                          <DropdownMenuItem onClick={() => handleAtribuirAction(ticket)}>
                            <UserPlus className="w-4 h-4 mr-2" />
                            {getAtribuirLabel(ticket)}
                          </DropdownMenuItem>
                        )}
                        {canDetalhar(ticket) && (
                          <DropdownMenuItem onClick={() => setSelectedTicket(ticket)}>
                            <Eye className="w-4 h-4 mr-2" />
                            Detalhar
                          </DropdownMenuItem>
                        )}
                        {canAlterar(ticket) && (
                          <DropdownMenuItem onClick={() => setEditingTicket(ticket)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Alterar
                          </DropdownMenuItem>
                        )}
                        {canDeletar() && (
                          <DropdownMenuItem 
                            onClick={() => handleDelete(ticket.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Deletar
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredTickets.length === 0 && (
            <div className="text-center py-12">
              <p className="text-lg font-medium text-muted-foreground">Nenhum registro encontrado</p>
              <p className="text-sm text-muted-foreground mt-1">
                {activeTab === 'geral' ? 'Não há tickets não pagos em aberto' :
                 activeTab === 'em_operacao' ? 'Não há tickets em operação' :
                 'Não há tickets concluídos'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Detalhes */}
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
        />
      )}

      {/* Modal de Edição (Admin) */}
      {editingTicket && (
        <TicketEditModal
          ticket={editingTicket}
          onClose={() => setEditingTicket(null)}
        />
      )}

    </div>
  );
}
