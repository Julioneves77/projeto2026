import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTickets } from '@/hooks/useTickets';
import { 
  Ticket, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp,
  Target,
  Calendar,
  Save
} from 'lucide-react';

export function Dashboard() {
  const { currentUser, userRole, updateUser } = useAuth();
  const { tickets } = useTickets();

  const [editandoMeta, setEditandoMeta] = useState(false);
  const [novaMeta, setNovaMeta] = useState(currentUser?.metaDiariaCertidoes || 0);
  
  // Filtros para admin
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getVisibleTickets = () => {
    if (userRole === 'admin') return tickets;
    return tickets.filter(t => 
      t.operador === currentUser?.nome ||
      t.historico.some(h => h.autor === currentUser?.nome)
    );
  };

  const visibleTickets = getVisibleTickets();

  // Filtrar por período (apenas admin)
  const ticketsFiltrados = userRole === 'admin' && dataInicio && dataFim
    ? visibleTickets.filter(t => {
        const inicio = new Date(dataInicio);
        inicio.setHours(0, 0, 0, 0);
        const fim = new Date(dataFim);
        fim.setHours(23, 59, 59, 999);
        const data = new Date(t.dataCadastro);
        return data >= inicio && data <= fim;
      })
    : visibleTickets;

  // Stats
  const totalTickets = ticketsFiltrados.length;
  const ticketsGeral = ticketsFiltrados.filter(t => t.status === 'GERAL').length;
  const ticketsEmOperacao = ticketsFiltrados.filter(t => 
    ['EM_OPERACAO', 'EM_ATENDIMENTO', 'AGUARDANDO_INFO', 'FINANCEIRO'].includes(t.status)
  ).length;
  const ticketsConcluidos = ticketsFiltrados.filter(t => t.status === 'CONCLUIDO').length;

  // Tickets concluídos hoje
  const ticketsConcluidosHoje = visibleTickets.filter(t => {
    if (t.status !== 'CONCLUIDO' || !t.dataConclusao) return false;
    const conclusao = new Date(t.dataConclusao);
    conclusao.setHours(0, 0, 0, 0);
    return conclusao.getTime() === today.getTime();
  }).length;

  const metaDiaria = currentUser?.metaDiariaCertidoes || 0;
  const progressoMeta = metaDiaria > 0 ? Math.min((ticketsConcluidosHoje / metaDiaria) * 100, 100) : 0;

  const handleSaveMeta = () => {
    if (currentUser) {
      updateUser(currentUser.id, { metaDiariaCertidoes: novaMeta });
      setEditandoMeta(false);
    }
  };

  const stats = userRole === 'admin' 
    ? [
        { label: 'Total de Tickets', value: totalTickets, icon: Ticket, color: 'text-foreground', bg: 'bg-muted' },
        { label: 'Aguardando', value: ticketsGeral, icon: Clock, color: 'text-status-waiting', bg: 'bg-status-waiting-bg' },
        { label: 'Em Operação', value: ticketsEmOperacao, icon: AlertCircle, color: 'text-status-progress', bg: 'bg-status-progress-bg' },
        { label: 'Concluídos', value: ticketsConcluidos, icon: CheckCircle2, color: 'text-status-complete', bg: 'bg-status-complete-bg' },
      ]
    : [
        { label: 'Meus Tickets', value: totalTickets, icon: Ticket, color: 'text-foreground', bg: 'bg-muted' },
        { label: 'Em Operação', value: ticketsEmOperacao, icon: AlertCircle, color: 'text-status-progress', bg: 'bg-status-progress-bg' },
        { label: 'Concluídos Hoje', value: ticketsConcluidosHoje, icon: CheckCircle2, color: 'text-status-complete', bg: 'bg-status-complete-bg' },
      ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Olá, {currentUser?.nome}!
          </h1>
          <p className="text-muted-foreground">
            {userRole === 'admin' 
              ? 'Visão geral do sistema de atendimento.'
              : 'Acompanhe sua produtividade diária.'}
          </p>
        </div>

        {/* Filtros de período para admin */}
        {userRole === 'admin' && (
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="px-3 py-1.5 text-sm rounded-lg border border-input bg-background text-foreground"
              placeholder="Início"
            />
            <span className="text-muted-foreground">-</span>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="px-3 py-1.5 text-sm rounded-lg border border-input bg-background text-foreground"
              placeholder="Fim"
            />
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="card-stat">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Meta Diária - apenas para atendente/financeiro */}
      {userRole !== 'admin' && (
        <div className="card-stat">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-status-priority-bg flex items-center justify-center">
                <Target className="w-6 h-6 text-status-priority" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Meta Diária</h3>
                <p className="text-sm text-muted-foreground">Certidões concluídas hoje</p>
              </div>
            </div>
            <div className="text-right flex items-center gap-3">
              {editandoMeta ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={novaMeta}
                    onChange={(e) => setNovaMeta(Number(e.target.value))}
                    min="0"
                    className="w-20 px-2 py-1 text-right rounded-lg border border-input bg-background text-foreground"
                  />
                  <button
                    onClick={handleSaveMeta}
                    className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <p className="text-3xl font-bold text-foreground">
                      {ticketsConcluidosHoje}/{metaDiaria}
                    </p>
                    <p className="text-sm text-muted-foreground">{progressoMeta.toFixed(0)}% concluído</p>
                  </div>
                  <button
                    onClick={() => {
                      setNovaMeta(metaDiaria);
                      setEditandoMeta(true);
                    }}
                    className="text-xs text-primary hover:underline"
                  >
                    Alterar meta
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-status-progress to-status-complete transition-all duration-500 rounded-full"
              style={{ width: `${progressoMeta}%` }}
            />
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card-stat">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Atividade Recente</h3>
          </div>
          <div className="space-y-3">
            {ticketsFiltrados
              .sort((a, b) => new Date(b.dataCadastro).getTime() - new Date(a.dataCadastro).getTime())
              .slice(0, 5)
              .map((ticket) => (
                <div key={ticket.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{ticket.codigo}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[180px]">{ticket.nomeCompleto}</p>
                  </div>
                  <span className={`status-badge ${
                    ticket.status === 'CONCLUIDO' ? 'status-complete' :
                    ticket.status === 'AGUARDANDO_INFO' ? 'status-waiting' :
                    ticket.status === 'FINANCEIRO' ? 'status-financial' :
                    'status-progress'
                  }`}>
                    {ticket.status === 'CONCLUIDO' ? 'Concluído' :
                     ticket.status === 'AGUARDANDO_INFO' ? 'Aguardando' :
                     ticket.status === 'FINANCEIRO' ? 'Financeiro' :
                     ticket.status === 'GERAL' ? 'Geral' : 'Em operação'}
                  </span>
                </div>
              ))}
            {ticketsFiltrados.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum ticket encontrado
              </p>
            )}
          </div>
        </div>

        <div className="card-stat">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className="w-5 h-5 text-status-complete" />
            <h3 className="font-semibold text-foreground">Concluídos Recentemente</h3>
          </div>
          <div className="space-y-3">
            {ticketsFiltrados
              .filter(t => t.status === 'CONCLUIDO')
              .sort((a, b) => new Date(b.dataConclusao || 0).getTime() - new Date(a.dataConclusao || 0).getTime())
              .slice(0, 5)
              .map((ticket) => (
                <div key={ticket.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{ticket.codigo}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[180px]">{ticket.nomeCompleto}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {ticket.dataConclusao && new Date(ticket.dataConclusao).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              ))}
            {ticketsFiltrados.filter(t => t.status === 'CONCLUIDO').length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum ticket concluído
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}