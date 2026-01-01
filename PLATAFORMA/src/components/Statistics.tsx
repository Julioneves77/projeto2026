import React, { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTickets } from '@/hooks/useTickets';
import { 
  Calendar, 
  Filter, 
  FileText,
  TrendingUp,
  Globe,
  PieChart
} from 'lucide-react';

export function Statistics() {
  const { userRole } = useAuth();
  const { tickets } = useTickets();
  
  // Definir data de hoje como padrão
  const hoje = new Date().toISOString().split('T')[0];
  const [dataInicio, setDataInicio] = useState(hoje);
  const [dataFim, setDataFim] = useState(hoje);

  if (userRole !== 'admin' && userRole !== 'financeiro') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Acesso não autorizado.</p>
      </div>
    );
  }

  const resultado = useMemo(() => {
    if (!dataInicio || !dataFim) return null;

    const inicio = new Date(dataInicio);
    inicio.setHours(0, 0, 0, 0);
    const fim = new Date(dataFim);
    fim.setHours(23, 59, 59, 999);

    // Filtrar tickets concluídos no período
    const ticketsFiltrados = tickets.filter(t => {
      if (t.status !== 'CONCLUIDO') return false;
      if (!t.dataConclusao) return false;
      
      const conclusao = new Date(t.dataConclusao);
      return conclusao >= inicio && conclusao <= fim;
    });

    // Agrupar por tipo de certidão
    const porTipoCertidao: Record<string, number> = {};
    ticketsFiltrados.forEach(t => {
      const tipo = t.tipoCertidao || 'Não especificado';
      porTipoCertidao[tipo] = (porTipoCertidao[tipo] || 0) + 1;
    });

    // Agrupar por domínio
    const porDominio: Record<string, number> = {};
    ticketsFiltrados.forEach(t => {
      const dominio = t.dominio || 'Não especificado';
      porDominio[dominio] = (porDominio[dominio] || 0) + 1;
    });

    // Ordenar por quantidade (maior primeiro)
    const tiposOrdenados = Object.entries(porTipoCertidao)
      .sort((a, b) => b[1] - a[1])
      .map(([tipo, quantidade]) => ({ tipo, quantidade }));

    const dominiosOrdenados = Object.entries(porDominio)
      .sort((a, b) => b[1] - a[1])
      .map(([dominio, quantidade]) => ({ dominio, quantidade }));

    return {
      periodo: `${new Date(dataInicio).toLocaleDateString('pt-BR')} - ${new Date(dataFim).toLocaleDateString('pt-BR')}`,
      totalCertidoes: ticketsFiltrados.length,
      porTipoCertidao: tiposOrdenados,
      porDominio: dominiosOrdenados,
      tickets: ticketsFiltrados
    };
  }, [dataInicio, dataFim, tickets]);

  // Cores para os gráficos
  const coresTipo = [
    'bg-primary', 'bg-status-complete', 'bg-status-priority', 'bg-status-progress', 
    'bg-status-financial', 'bg-status-waiting', 'bg-purple-500', 'bg-pink-500'
  ];

  const coresDominio = [
    'bg-emerald-500', 'bg-blue-500', 'bg-orange-500', 'bg-red-500',
    'bg-indigo-500', 'bg-teal-500', 'bg-amber-500', 'bg-rose-500'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Estatísticas</h1>
        <p className="text-muted-foreground">Análise de certidões por tipo e domínio</p>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Filtros</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card-stat">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Período</p>
                  <p className="text-lg font-bold text-foreground mt-1">{resultado.periodo}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-status-progress-bg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-status-progress" />
                </div>
              </div>
            </div>

            <div className="card-stat">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Certidões</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{resultado.totalCertidoes}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-status-complete-bg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-status-complete" />
                </div>
              </div>
            </div>

            <div className="card-stat">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tipos de Certidão</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{resultado.porTipoCertidao.length}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-status-financial-bg flex items-center justify-center">
                  <PieChart className="w-5 h-5 text-status-financial" />
                </div>
              </div>
            </div>
          </div>

          {/* Resumo Rápido por Tipo de Certidão */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Certidões por Tipo (Resumo do Dia)</h3>
            </div>
            
            {resultado.porTipoCertidao.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {resultado.porTipoCertidao.map((item, index) => {
                  const cor = coresTipo[index % coresTipo.length];
                  return (
                    <div 
                      key={item.tipo}
                      className="bg-muted/50 rounded-lg p-3 border border-border hover:border-primary/30 transition-colors"
                    >
                      <p className="text-2xl font-bold text-foreground">{item.quantidade}</p>
                      <p className="text-xs text-muted-foreground truncate" title={item.tipo}>
                        {item.tipo}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">Nenhuma certidão no período</p>
            )}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Por Tipo de Certidão */}
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center gap-2 mb-4">
                <PieChart className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Por Tipo de Certidão</h3>
              </div>

              {resultado.porTipoCertidao.length > 0 ? (
                <div className="space-y-3">
                  {resultado.porTipoCertidao.map((item, index) => {
                    const porcentagem = (item.quantidade / resultado.totalCertidoes) * 100;
                    const cor = coresTipo[index % coresTipo.length];
                    return (
                      <div key={item.tipo}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-foreground truncate max-w-[200px]" title={item.tipo}>
                            {item.tipo}
                          </span>
                          <span className="text-sm font-medium text-foreground">
                            {item.quantidade} ({porcentagem.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${cor} transition-all duration-500 rounded-full`}
                            style={{ width: `${porcentagem}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">Sem dados para exibir</p>
              )}
            </div>

            {/* Por Domínio */}
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Por Domínio de Origem</h3>
              </div>

              {resultado.porDominio.length > 0 ? (
                <div className="space-y-3">
                  {resultado.porDominio.map((item, index) => {
                    const porcentagem = (item.quantidade / resultado.totalCertidoes) * 100;
                    const cor = coresDominio[index % coresDominio.length];
                    return (
                      <div key={item.dominio}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-foreground truncate max-w-[200px]" title={item.dominio}>
                            {item.dominio}
                          </span>
                          <span className="text-sm font-medium text-foreground">
                            {item.quantidade} ({porcentagem.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${cor} transition-all duration-500 rounded-full`}
                            style={{ width: `${porcentagem}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">Sem dados para exibir</p>
              )}
            </div>
          </div>

          {/* Table */}
          {resultado.tickets.length > 0 && (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <h3 className="font-semibold text-foreground">Detalhamento</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[hsl(var(--table-header))]">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Código</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Tipo Certidão</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Domínio</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Operador</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Data Conclusão</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {resultado.tickets.slice(0, 20).map((ticket) => (
                      <tr key={ticket.id} className="hover:bg-[hsl(var(--table-row-hover))]">
                        <td className="px-4 py-3 font-mono text-sm text-foreground">{ticket.codigo}</td>
                        <td className="px-4 py-3 text-sm text-foreground max-w-[200px] truncate">{ticket.tipoCertidao}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{ticket.dominio}</td>
                        <td className="px-4 py-3 text-sm text-foreground">{ticket.operador || '-'}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {ticket.dataConclusao && new Date(ticket.dataConclusao).toLocaleDateString('pt-BR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {resultado.tickets.length > 20 && (
                <div className="px-4 py-3 border-t border-border text-center">
                  <p className="text-sm text-muted-foreground">
                    Exibindo 20 de {resultado.tickets.length} registros
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!resultado && (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <TrendingUp className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">Selecione o período para visualizar as estatísticas</p>
        </div>
      )}
    </div>
  );
}