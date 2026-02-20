import React, { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTickets } from '@/hooks/useTickets';
import { 
  Calendar, 
  Filter, 
  FileText,
  TrendingUp,
  Globe,
  PieChart,
  DollarSign
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

    // Parse como data LOCAL (evita bug: "2026-02-18" em UTC vira 17/02 no Brasil)
    const [yi, mi, di] = dataInicio.split('-').map(Number);
    const inicio = new Date(yi, mi - 1, di, 0, 0, 0, 0);
    const [yf, mf, df] = dataFim.split('-').map(Number);
    const fim = new Date(yf, mf - 1, df, 23, 59, 59, 999);

    // Filtrar tickets que ENTRARAM (foram cadastrados) no período
    const ticketsFiltrados = tickets.filter(t => {
      const dataRef = t.dataCadastro;
      if (!dataRef) return false;
      const data = new Date(dataRef);
      return data >= inicio && data <= fim;
    });

    // Normalizar tipo de certidão para agrupar variantes (ex: "criminal-estadual", "Certidão Federal - CRIMINAL", etc.)
    const normalizarTipo = (s: string): string => {
      const v = (s || '').trim();
      if (!v) return 'Não especificado';
      const lower = v.toLowerCase();
      if (lower.includes('criminal federal') || lower.includes('federal - criminal') || lower === 'criminal-federal') return 'Certidão Negativa Criminal Federal';
      if (lower.includes('criminal estadual') || lower.includes('estadual - criminal') || lower === 'criminal-estadual' || (lower.includes('estadual') && lower.includes('criminal'))) return 'Certidão Negativa Criminal Estadual';
      if (lower.includes('cível federal') || lower.includes('civel federal') || lower.includes('civil federal') || lower === 'civel-federal') return 'Certidão Negativa Cível Federal';
      if (lower.includes('cível estadual') || lower.includes('civel estadual') || lower.includes('civil estadual') || lower === 'civel-estadual' || (lower.includes('estadual') && (lower.includes('civel') || lower.includes('civil')))) return 'Certidão Negativa Cível Estadual';
      if (lower.includes('eleitoral') || lower.includes('quitação eleitoral')) return 'Certidão de Quitação Eleitoral';
      if (lower.includes('antecedentes') || (lower.includes('pf') && lower.includes('criminal'))) return 'Antecedentes - Polícia Federal';
      if (lower.includes('cnd') || lower.includes('débitos') || lower.includes('debitos')) return 'CND - Certidão Negativa de Débitos';
      if (lower.includes('cpf regular') || lower.includes('situação cadastral')) return 'Situação Cadastral do CPF';
      return v;
    };

    // Pagos = saíram de GERAL (status EM_OPERACAO, CONCLUIDO, etc. = pagamento confirmado)
    const ticketsPagos = ticketsFiltrados.filter(t => (t.status || 'GERAL') !== 'GERAL');

    const porTipoCertidao: Record<string, number> = {};
    ticketsFiltrados.forEach(t => {
      const tipoRaw = t.tipoCertidao || (t.dadosFormulario?.tipoCertidao as string) || '';
      const tipo = normalizarTipo(tipoRaw);
      porTipoCertidao[tipo] = (porTipoCertidao[tipo] || 0) + 1;
    });

    const porTipoCertidaoPagos: Record<string, number> = {};
    ticketsPagos.forEach(t => {
      const tipoRaw = t.tipoCertidao || (t.dadosFormulario?.tipoCertidao as string) || '';
      const tipo = normalizarTipo(tipoRaw);
      porTipoCertidaoPagos[tipo] = (porTipoCertidaoPagos[tipo] || 0) + 1;
    });

    // Agrupar por domínio inicial (origem)
    const porDominio: Record<string, number> = {};
    ticketsFiltrados.forEach(t => {
      // Priorizar campo dominio (campo principal do ticket)
      const dominio = t.dominio;
      // Fallback para dadosFormulario.origem (compatibilidade com tickets antigos)
      const origem = t.dadosFormulario?.origem;
      
      let dominioFormatado = 'Não especificado';
      
      if (dominio) {
        // Formatações específicas para domínios conhecidos
        if (dominio === 'www.verificacaoassistida.online' || dominio === 'verificacaoassistida.online') {
          dominioFormatado = 'Verificação Assistida';
        } else if (dominio === 'portalcertidao.com.br' || dominio === 'www.portalcertidao.org') {
          dominioFormatado = 'Portal Certidão';
        } else if (dominio.includes('portalcacesso')) {
          dominioFormatado = 'Portal Acesso';
        } else if (dominio.includes('solicite')) {
          dominioFormatado = 'Solicite Link';
        } else {
          dominioFormatado = dominio;
        }
      } else if (origem) {
        // Fallback para origem (tickets antigos)
        dominioFormatado = origem === 'portalcacesso' ? 'Portal Acesso' 
                          : origem === 'solicite' ? 'Solicite Link'
                          : origem;
      }
      
      porDominio[dominioFormatado] = (porDominio[dominioFormatado] || 0) + 1;
    });

    // Ordenar por quantidade (maior primeiro)
    const tiposOrdenados = Object.entries(porTipoCertidao)
      .sort((a, b) => b[1] - a[1])
      .map(([tipo, quantidade]) => ({ tipo, quantidade }));

    const tiposOrdenadosPagos = Object.entries(porTipoCertidaoPagos)
      .sort((a, b) => b[1] - a[1])
      .map(([tipo, quantidade]) => ({ tipo, quantidade }));

    const dominiosOrdenados = Object.entries(porDominio)
      .sort((a, b) => b[1] - a[1])
      .map(([dominio, quantidade]) => ({ dominio, quantidade }));

    return {
      periodo: `${inicio.toLocaleDateString('pt-BR')} - ${fim.toLocaleDateString('pt-BR')}`,
      totalGeral: ticketsFiltrados.length,
      totalPagos: ticketsPagos.length,
      porTipoCertidao: tiposOrdenados,
      porTipoCertidaoPagos: tiposOrdenadosPagos,
      porDominio: dominiosOrdenados,
      tickets: ticketsFiltrados,
      ticketsPagos
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  <p className="text-sm text-muted-foreground">Total (Geral)</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{resultado.totalGeral}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">entradas no período</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
            </div>

            <div className="card-stat border-2 border-primary/30 bg-primary/5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-primary">Total Pagos</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{resultado.totalPagos}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">pagamento confirmado</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
              </div>
            </div>

            <div className="card-stat">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tipos Pagos</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{resultado.porTipoCertidaoPagos.length}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-status-financial-bg flex items-center justify-center">
                  <PieChart className="w-5 h-5 text-status-financial" />
                </div>
              </div>
            </div>
          </div>

          {/* ENFASE: Certidões Pagas por Tipo */}
          <div className="bg-card rounded-xl border-2 border-primary/30 p-6 bg-primary/5">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Certidões Pagas por Tipo</h3>
              <span className="text-sm text-muted-foreground">(qual tipo está sendo pago)</span>
            </div>
            
            {resultado.porTipoCertidaoPagos.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {resultado.porTipoCertidaoPagos.map((item, index) => {
                  const cor = coresTipo[index % coresTipo.length];
                  const pct = resultado.totalPagos > 0 ? (item.quantidade / resultado.totalPagos * 100).toFixed(1) : '0';
                  return (
                    <div 
                      key={item.tipo}
                      className="bg-background rounded-lg p-3 border-2 border-primary/20 hover:border-primary/40 transition-colors shadow-sm"
                    >
                      <p className="text-2xl font-bold text-foreground">{item.quantidade}</p>
                      <p className="text-xs text-muted-foreground truncate" title={item.tipo}>
                        {item.tipo}
                      </p>
                      <p className="text-xs font-medium text-primary mt-1">{pct}% dos pagos</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">Nenhuma certidão paga no período</p>
            )}
          </div>

          {/* Total Geral por Tipo (referência) */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-semibold text-foreground">Total Geral por Tipo</h3>
              <span className="text-sm text-muted-foreground">(todas as entradas)</span>
            </div>
            
            {resultado.porTipoCertidao.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {resultado.porTipoCertidao.map((item, index) => {
                  const cor = coresTipo[index % coresTipo.length];
                  return (
                    <div 
                      key={item.tipo}
                      className="bg-muted/30 rounded-lg p-3 border border-border hover:border-primary/20 transition-colors"
                    >
                      <p className="text-xl font-bold text-foreground">{item.quantidade}</p>
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
            {/* Por Tipo de Certidão PAGOS (ênfase) */}
            <div className="bg-card rounded-xl border-2 border-primary/20 p-6 bg-primary/5">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Tipos Pagos (distribuição)</h3>
              </div>

              {resultado.porTipoCertidaoPagos.length > 0 ? (
                <div className="space-y-3">
                  {resultado.porTipoCertidaoPagos.map((item, index) => {
                    const porcentagem = resultado.totalPagos > 0 ? (item.quantidade / resultado.totalPagos) * 100 : 0;
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
                <p className="text-center text-muted-foreground py-8">Nenhum pago no período</p>
              )}
            </div>

            {/* Por Domínio (dos pagos) */}
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Domínio de Origem (pagos)</h3>
              </div>

              {resultado.totalPagos > 0 ? (
                <div className="space-y-3">
                  {(() => {
                    const porDominioPagos: Record<string, number> = {};
                    resultado.ticketsPagos.forEach(t => {
                      const dominio = t.dominio;
                      const origem = t.dadosFormulario?.origem;
                      let dominioFormatado = 'Não especificado';
                      if (dominio) {
                        if (dominio === 'www.verificacaoassistida.online' || dominio === 'verificacaoassistida.online') dominioFormatado = 'Verificação Assistida';
                        else if (dominio === 'portalcertidao.com.br' || dominio === 'www.portalcertidao.org') dominioFormatado = 'Portal Certidão';
                        else if (dominio.includes('portalcacesso')) dominioFormatado = 'Portal Acesso';
                        else if (dominio.includes('solicite')) dominioFormatado = 'Solicite Link';
                        else if (dominio.includes('guia-central')) dominioFormatado = 'Guia Central';
                        else dominioFormatado = dominio;
                      } else if (origem) {
                        dominioFormatado = origem === 'portalcacesso' ? 'Portal Acesso' : origem === 'solicite' ? 'Solicite Link' : origem;
                      }
                      porDominioPagos[dominioFormatado] = (porDominioPagos[dominioFormatado] || 0) + 1;
                    });
                    const dominiosPagosOrdenados = Object.entries(porDominioPagos).sort((a, b) => b[1] - a[1]);
                    return dominiosPagosOrdenados.map(([dominio, qtd], index) => {
                      const porcentagem = (qtd / resultado.totalPagos) * 100;
                      const cor = coresDominio[index % coresDominio.length];
                      return (
                        <div key={dominio}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-foreground truncate max-w-[200px]" title={dominio}>{dominio}</span>
                            <span className="text-sm font-medium text-foreground">{qtd} ({porcentagem.toFixed(1)}%)</span>
                          </div>
                          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full ${cor} transition-all duration-500 rounded-full`} style={{ width: `${porcentagem}%` }} />
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">Nenhum pago no período</p>
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
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Data Entrada</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {resultado.tickets.slice(0, 20).map((ticket) => (
                      <tr key={ticket.id} className="hover:bg-[hsl(var(--table-row-hover))]">
                        <td className="px-4 py-3 font-mono text-sm text-foreground">{ticket.codigo}</td>
                        <td className="px-4 py-3 text-sm text-foreground max-w-[200px] truncate">{ticket.tipoCertidao}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {(() => {
                            // Priorizar campo dominio (campo principal do ticket)
                            const dominio = ticket.dominio;
                            // Fallback para dadosFormulario.origem (compatibilidade com tickets antigos)
                            const origem = ticket.dadosFormulario?.origem;
                            
                            if (dominio) {
                              if (dominio === 'www.verificacaoassistida.online' || dominio === 'verificacaoassistida.online') {
                                return 'Verificação Assistida';
                              }
                              if (dominio === 'portalcertidao.com.br' || dominio === 'www.portalcertidao.org') {
                                return 'Portal Certidão';
                              }
                              if (dominio.includes('portalcacesso')) {
                                return 'Portal Acesso';
                              }
                              if (dominio.includes('solicite')) {
                                return 'Solicite Link';
                              }
                              return dominio;
                            }
                            
                            // Fallback para origem (tickets antigos)
                            if (origem === 'portalcacesso') {
                              return 'Portal Acesso';
                            }
                            if (origem === 'solicite') {
                              return 'Solicite Link';
                            }
                            return origem || 'Não especificado';
                          })()}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground">{ticket.operador || '-'}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {ticket.dataCadastro && new Date(ticket.dataCadastro).toLocaleDateString('pt-BR')}
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