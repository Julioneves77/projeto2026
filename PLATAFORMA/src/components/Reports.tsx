import React, { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTickets } from '@/hooks/useTickets';
import { PrioridadeType } from '@/types';
import { 
  Calendar, 
  Download,
  FileText,
  Filter,
  User,
  DollarSign
} from 'lucide-react';

export function Reports() {
  const { userRole, users } = useAuth();
  const { tickets } = useTickets();
  
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [usuarioSelecionado, setUsuarioSelecionado] = useState('');

  if (userRole !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Acesso não autorizado.</p>
      </div>
    );
  }

  // Lista de todos os usuários (exceto admin para seleção)
  const operadores = users.filter(u => u.status === 'ativo');

  const resultado = useMemo(() => {
    if (!usuarioSelecionado || !dataInicio || !dataFim) return null;

    const inicio = new Date(dataInicio);
    inicio.setHours(0, 0, 0, 0);
    const fim = new Date(dataFim);
    fim.setHours(23, 59, 59, 999);

    const ticketsFiltrados = tickets.filter(t => {
      if (t.status !== 'CONCLUIDO') return false;
      if (t.operador !== usuarioSelecionado) return false;
      if (!t.dataConclusao) return false;
      
      const conclusao = new Date(t.dataConclusao);
      return conclusao >= inicio && conclusao <= fim;
    });

    const usuario = users.find(u => u.nome === usuarioSelecionado);
    
    // Agrupar por prioridade
    const porPrioridade: Record<PrioridadeType, { quantidade: number; valor: number }> = {
      padrao: { quantidade: 0, valor: usuario?.valorPadrao || 0 },
      prioridade: { quantidade: 0, valor: usuario?.valorPrioridade || 0 },
      premium: { quantidade: 0, valor: usuario?.valorPremium || 0 }
    };

    ticketsFiltrados.forEach(t => {
      if (porPrioridade[t.prioridade]) {
        porPrioridade[t.prioridade].quantidade++;
      }
    });

    const totalCertidoes = ticketsFiltrados.length;
    const totalAPagar = 
      (porPrioridade.padrao.quantidade * porPrioridade.padrao.valor) +
      (porPrioridade.prioridade.quantidade * porPrioridade.prioridade.valor) +
      (porPrioridade.premium.quantidade * porPrioridade.premium.valor);

    return {
      usuario: usuarioSelecionado,
      periodo: `${new Date(dataInicio).toLocaleDateString('pt-BR')} - ${new Date(dataFim).toLocaleDateString('pt-BR')}`,
      totalCertidoes,
      porPrioridade,
      totalAPagar,
      tickets: ticketsFiltrados
    };
  }, [usuarioSelecionado, dataInicio, dataFim, tickets, users]);

  const exportCSV = () => {
    if (!resultado) return;
    
    const headers = ['Código', 'Nome', 'CPF/CNPJ', 'Telefone', 'E-mail', 'Certidão', 'Prioridade', 'Valor', 'Data Conclusão'];
    const rows = resultado.tickets.map(t => {
      const usuario = users.find(u => u.nome === usuarioSelecionado);
      const valor = t.prioridade === 'padrao' 
        ? usuario?.valorPadrao 
        : t.prioridade === 'prioridade' 
          ? usuario?.valorPrioridade 
          : usuario?.valorPremium;
      return [
        t.codigo,
        t.nomeCompleto,
        t.cpfSolicitante,
        t.telefone,
        t.email,
        t.tipoCertidao,
        t.prioridade,
        `R$ ${(valor || 0).toFixed(2)}`,
        t.dataConclusao ? new Date(t.dataConclusao).toLocaleDateString('pt-BR') : '-'
      ];
    });

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_${usuarioSelecionado}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getPrioridadeLabel = (prioridade: PrioridadeType) => {
    const labels: Record<PrioridadeType, { label: string; className: string }> = {
      padrao: { label: 'Padrão', className: 'bg-muted text-foreground' },
      prioridade: { label: 'Prioridade', className: 'bg-status-priority-bg text-status-priority' },
      premium: { label: 'Premium', className: 'bg-status-complete-bg text-status-complete' }
    };
    return labels[prioridade];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground">Relatório de certidões por usuário e período</p>
        </div>

        {resultado && (
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary-hover transition-colors"
          >
            <Download className="w-5 h-5" />
            Exportar CSV
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Filtros</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              <User className="w-4 h-4 inline mr-1" />
              Usuário
            </label>
            <select
              value={usuarioSelecionado}
              onChange={(e) => setUsuarioSelecionado(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              <option value="">Selecione um usuário</option>
              {operadores.map((user) => (
                <option key={user.id} value={user.nome}>
                  {user.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Data Início
            </label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Data Fim
            </label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Results */}
      {resultado && (
        <div className="space-y-6 animate-fade-in">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="card-stat">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Usuário</p>
                  <p className="text-lg font-bold text-foreground mt-1">{resultado.usuario}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-status-progress-bg flex items-center justify-center">
                  <User className="w-5 h-5 text-status-progress" />
                </div>
              </div>
            </div>

            <div className="card-stat">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Padrão</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{resultado.porPrioridade.padrao.quantidade}</p>
                  <p className="text-xs text-muted-foreground">R$ {resultado.porPrioridade.padrao.valor.toFixed(2)}/un</p>
                </div>
              </div>
            </div>

            <div className="card-stat">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Prioridade</p>
                  <p className="text-2xl font-bold text-status-priority mt-1">{resultado.porPrioridade.prioridade.quantidade}</p>
                  <p className="text-xs text-muted-foreground">R$ {resultado.porPrioridade.prioridade.valor.toFixed(2)}/un</p>
                </div>
              </div>
            </div>

            <div className="card-stat">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Premium</p>
                  <p className="text-2xl font-bold text-status-complete mt-1">{resultado.porPrioridade.premium.quantidade}</p>
                  <p className="text-xs text-muted-foreground">R$ {resultado.porPrioridade.premium.valor.toFixed(2)}/un</p>
                </div>
              </div>
            </div>

            <div className="card-stat bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total a Pagar</p>
                  <p className="text-2xl font-bold text-primary mt-1">R$ {resultado.totalAPagar.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">{resultado.totalCertidoes} certidões</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
              </div>
            </div>
          </div>

          {/* Period Info */}
          <div className="bg-muted/30 rounded-xl p-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Período:</span>
            <span className="text-sm font-medium text-foreground">{resultado.periodo}</span>
          </div>

          {/* Tickets List */}
          {resultado.tickets.length > 0 && (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <h3 className="font-semibold text-foreground">Certidões Concluídas</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[hsl(var(--table-header))]">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Código</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Cliente</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Certidão</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Prioridade</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Valor</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Data Conclusão</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {resultado.tickets.map((ticket) => {
                      const prioridadeInfo = getPrioridadeLabel(ticket.prioridade);
                      const usuario = users.find(u => u.nome === usuarioSelecionado);
                      const valor = ticket.prioridade === 'padrao' 
                        ? usuario?.valorPadrao 
                        : ticket.prioridade === 'prioridade' 
                          ? usuario?.valorPrioridade 
                          : usuario?.valorPremium;
                      return (
                        <tr key={ticket.id} className="hover:bg-[hsl(var(--table-row-hover))]">
                          <td className="px-4 py-3 font-mono text-sm text-foreground">{ticket.codigo}</td>
                          <td className="px-4 py-3 text-sm text-foreground">{ticket.nomeCompleto}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground max-w-[200px] truncate">{ticket.tipoCertidao}</td>
                          <td className="px-4 py-3">
                            <span className={`status-badge ${prioridadeInfo.className}`}>
                              {prioridadeInfo.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-foreground">
                            R$ {(valor || 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {ticket.dataConclusao && new Date(ticket.dataConclusao).toLocaleDateString('pt-BR')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {resultado.tickets.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Nenhuma certidão concluída neste período</p>
            </div>
          )}
        </div>
      )}

      {!resultado && (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <FileText className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">Selecione um usuário e o período para visualizar o relatório</p>
        </div>
      )}
    </div>
  );
}