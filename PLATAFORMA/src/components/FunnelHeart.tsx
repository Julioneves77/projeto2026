/**
 * Componente Coração - Validação de Funil
 * Identifica gargalos e sugere ações baseadas em dados reais
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFunnelAnalytics } from '@/hooks/useFunnelAnalytics';
import { identifyBottleneck } from '@/lib/funnelDiagnostics';
import { getSemaphoreStatus } from '@/lib/funnelSemaphore';
import { 
  Heart, 
  TrendingUp, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  BarChart3,
  Info
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export function FunnelHeart() {
  const { analytics, campaigns, loading, error, fetchAnalytics, fetchCampaigns, fetchValidation } = useFunnelAnalytics();
  const [dateFrom, setDateFrom] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30); // Últimos 30 dias
    return date.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [validation, setValidation] = useState<any>(null);
  const [loadingValidation, setLoadingValidation] = useState(false);

  const loadData = useCallback(async () => {
    await Promise.all([
      fetchAnalytics({ date_from: dateFrom, date_to: dateTo }),
      fetchCampaigns({ date_from: dateFrom, date_to: dateTo })
    ]);
    
    // Carregar validação também
    setLoadingValidation(true);
    try {
      const validationData = await fetchValidation({ date_from: dateFrom, date_to: dateTo });
      // O endpoint retorna { success: true, validation: [...], summary: {...} }
      // Ajustar para o formato esperado pelo componente
      if (validationData && validationData.success) {
        setValidation({
          validation: validationData.validation || [],
          summary: validationData.summary || null
        });
      } else {
        // Mesmo sem sucesso, definir estrutura vazia para mostrar a seção
        setValidation({
          validation: [],
          summary: null
        });
      }
    } catch (err) {
      console.error('Erro ao carregar validação:', err);
      // Em caso de erro, ainda mostrar a seção com estrutura vazia
      setValidation({
        validation: [],
        summary: null,
        error: err instanceof Error ? err.message : 'Erro desconhecido'
      });
    } finally {
      setLoadingValidation(false);
    }
  }, [dateFrom, dateTo, fetchAnalytics, fetchCampaigns, fetchValidation]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Se está carregando pela primeira vez, mostrar loading
  if (loading && !analytics && !error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Carregando dados do funil...</p>
      </div>
    );
  }

  // Se há erro, mostrar mensagem de erro
  if (error && !analytics) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Heart className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Coração — Validação de Funil</h1>
              <p className="text-muted-foreground">Diagnóstico automático de gargalos e ações sugeridas</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">De:</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-3 py-1 border rounded-md text-sm bg-background text-foreground dark:text-black dark:bg-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">Até:</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-3 py-1 border rounded-md text-sm bg-background text-foreground dark:text-black dark:bg-white"
              />
            </div>
            <Button onClick={loadData} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Erro ao carregar dados
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Se não há analytics ainda, mostrar interface vazia com instruções
  if (!analytics) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Heart className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Coração — Validação de Funil</h1>
              <p className="text-muted-foreground">Diagnóstico automático de gargalos e ações sugeridas</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">De:</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-3 py-1 border rounded-md text-sm bg-background text-foreground dark:text-black dark:bg-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">Até:</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-3 py-1 border rounded-md text-sm bg-background text-foreground dark:text-black dark:bg-white"
              />
            </div>
            <Button onClick={loadData} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              Aguardando dados
            </CardTitle>
            <CardDescription>
              Selecione um período e clique em "Atualizar" para carregar os dados do funil.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Calcular diagnóstico
  const bottleneck = identifyBottleneck(analytics.events, analytics.costs);
  const semaphore = getSemaphoreStatus(
    analytics.costs,
    analytics.metrics.payments,
    analytics.metrics.cpa,
    analytics.metrics.roi
  );

  // Dados para gráfico do funil (sempre mostrar todas as etapas, mesmo com 0)
  const funnelData = [
    { name: 'Links View', value: analytics.events?.links_view || 0, color: '#3b82f6' },
    { name: 'CTA Click', value: analytics.events?.links_cta_click || 0, color: '#60a5fa' },
    { name: 'Portal View', value: analytics.events?.portal_view || 0, color: '#93c5fd' },
    { name: 'Form Start', value: analytics.events?.form_start || 0, color: '#cbd5e1' },
    { name: 'Form Submit', value: analytics.events?.form_submit_success || 0, color: '#e2e8f0' },
    { name: 'PIX View', value: analytics.events?.pix_view || 0, color: '#f1f5f9' },
    { name: 'PIX Initiated', value: analytics.events?.pix_initiated || 0, color: '#f8fafc' },
    { name: 'Payment', value: analytics.events?.payment_confirmed || 0, color: '#10b981' }
  ];

  // Verificar se há dados no período
  const hasData = analytics.total_events > 0 || analytics.costs?.total > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Heart className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Coração — Validação de Funil</h1>
            <p className="text-muted-foreground">Diagnóstico automático de gargalos e ações sugeridas</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">De:</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
                className="px-3 py-1 border rounded-md text-sm bg-background text-foreground dark:text-black dark:bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Até:</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
                className="px-3 py-1 border rounded-md text-sm bg-background text-foreground dark:text-black dark:bg-white"
            />
          </div>
          <Button onClick={loadData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Mensagem quando não há dados */}
      {!hasData && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
              <Info className="w-5 h-5" />
              Nenhum dado encontrado no período selecionado
            </CardTitle>
            <CardDescription className="text-yellow-600 dark:text-yellow-500">
              O período de {new Date(dateFrom).toLocaleDateString('pt-BR')} até {new Date(dateTo).toLocaleDateString('pt-BR')} não possui eventos registrados.
              <br />
              Verifique se há campanhas ativas ou tente um período diferente.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Resumo Geral */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Status do Funil</CardTitle>
            <span className="text-2xl">{semaphore.emoji}</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{semaphore.label}</div>
            <p className="text-xs text-muted-foreground mt-1">{semaphore.description}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Gasto sem Conversão</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              R$ {(analytics.costs?.spent_without_conversion || 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {(analytics.costs?.tickets_burned || 0).toFixed(2)}× ticket queimado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pagamentos</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {analytics.metrics?.payments || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.metrics?.cpa 
                ? `CPA: R$ ${analytics.metrics.cpa.toFixed(2)}` 
                : 'CPA: N/A'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">ROI</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${analytics.metrics?.roi && analytics.metrics.roi >= 1.2 ? 'text-green-600' : 'text-destructive'}`}>
              {analytics.metrics?.roi ? analytics.metrics.roi.toFixed(2) : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Mínimo aceitável: 1.2
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gargalo Dominante e Ação Sugerida */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className={bottleneck.bottleneck ? 'border-2 border-destructive' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Gargalo Dominante
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bottleneck.bottleneck ? (
              <>
                <div className="text-3xl font-bold text-destructive mb-2">
                  {bottleneck.bottleneck}
                </div>
                <p className="text-sm text-muted-foreground">{bottleneck.diagnosis}</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                {bottleneck.diagnosis}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ação Sugerida</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{bottleneck.suggestedAction}</p>
            <div className="mt-4 p-3 bg-muted rounded-md">
              <p className="text-xs text-muted-foreground">
                <strong>Confiabilidade:</strong> {analytics.reliability}
              </p>
              {analytics.reliability === 'BAIXA' && (
                <p className="text-xs text-destructive mt-1">
                  Corrigir instrumentação antes de decidir. Dados podem estar incompletos.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Funil Visual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Funil Visual
          </CardTitle>
          <CardDescription>Contagem por etapa até PIX</CardDescription>
        </CardHeader>
        <CardContent>
          {hasData && funnelData.some(item => item.value > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={funnelData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value">
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-2">
                Nenhum evento registrado no período selecionado
              </p>
              <p className="text-xs text-muted-foreground">
                Os eventos do funil aparecerão aqui quando houver dados coletados.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Validação por Domínio */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            Validação por Domínio
          </CardTitle>
          <CardDescription>
            Status da configuração e coleta de eventos por domínio
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingValidation ? (
            <div className="flex items-center justify-center h-24">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
              <p className="ml-2 text-sm text-muted-foreground">Carregando validação...</p>
            </div>
          ) : validation && validation.validation && validation.validation.length > 0 ? (
              <div className="space-y-4">
                {validation.validation.map((val: any) => {
                  const statusColors = {
                    OK: 'bg-green-100 border-green-300 text-green-800 dark:bg-green-900 dark:border-green-700 dark:text-green-200',
                    WARNING: 'bg-yellow-100 border-yellow-300 text-yellow-800 dark:bg-yellow-900 dark:border-yellow-700 dark:text-yellow-200',
                    ERROR: 'bg-red-100 border-red-300 text-red-800 dark:bg-red-900 dark:border-red-700 dark:text-red-200'
                  };
                  
                  const statusIcons = {
                    OK: <CheckCircle2 className="w-5 h-5" />,
                    WARNING: <AlertCircle className="w-5 h-5" />,
                    ERROR: <AlertCircle className="w-5 h-5" />
                  };
                  
                  return (
                    <div
                      key={val.domain}
                      className={`p-4 rounded-lg border ${statusColors[val.status as keyof typeof statusColors] || statusColors.WARNING}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {statusIcons[val.status as keyof typeof statusIcons]}
                          <h3 className="font-semibold">{val.domain}</h3>
                          <span className="text-xs px-2 py-1 rounded bg-white/50 dark:bg-black/20">
                            {val.status}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                        <div>
                          <div className="font-medium">Eventos</div>
                          <div className="text-lg">{val.events?.total || 0}</div>
                        </div>
                        <div>
                          <div className="font-medium">Campanhas</div>
                          <div className="text-lg">{val.campaigns?.total || 0}</div>
                        </div>
                        <div>
                          <div className="font-medium">Custos</div>
                          <div className="text-lg">R$ {(val.campaigns?.total_cost || 0).toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="font-medium">Customer ID</div>
                          <div className="text-lg">{val.mapping?.customer_id || '-'}</div>
                        </div>
                      </div>
                      
                      {val.warnings && val.warnings.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-current/20">
                          <div className="text-sm font-medium mb-1">Avisos:</div>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            {val.warnings.map((warning: string, idx: number) => (
                              <li key={idx}>{warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground mb-2">
                  {validation === null ? 'Carregando validação...' : 'Nenhum domínio configurado ainda'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {validation === null 
                    ? 'Aguarde enquanto verificamos os domínios mapeados...'
                    : 'Configure os mapeamentos de domínio → Customer ID para ver a validação.'}
                </p>
              </div>
            )}
            
            {validation && validation.summary && (
              <div className="mt-4 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  <strong>Resumo:</strong> {validation.summary.total_domains} domínios encontrados,{' '}
                  {validation.summary.domains_with_events} com eventos,{' '}
                  {validation.summary.domains_with_mapping} mapeados,{' '}
                  {validation.summary.domains_with_campaigns} com campanhas sincronizadas
                </div>
              </div>
            )}
          </CardContent>
        </Card>

      {/* Tabela por Campanha */}
      <Card>
        <CardHeader>
          <CardTitle>Tabela por Campanha</CardTitle>
          <CardDescription>Status, métricas e ações sugeridas por campanha</CardDescription>
        </CardHeader>
        <CardContent>
          {campaigns.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Campanha</th>
                    <th className="text-right p-2">Gasto</th>
                    <th className="text-right p-2">Pagamentos</th>
                    <th className="text-right p-2">ROI</th>
                    <th className="text-right p-2">CPA</th>
                    <th className="text-left p-2">Gargalo</th>
                    <th className="text-left p-2">Ação Sugerida</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((campaign) => (
                    <tr key={campaign.campaign_id} className="border-b hover:bg-muted/50">
                      <td className="p-2">
                        <span className="text-xl">{campaign.emoji}</span>
                      </td>
                      <td className="p-2 font-medium">{campaign.campaign_name}</td>
                      <td className="p-2 text-right">R$ {campaign.gasto.toFixed(2)}</td>
                      <td className="p-2 text-right">{campaign.pagamentos}</td>
                      <td className={`p-2 text-right ${campaign.roi && campaign.roi >= 1.2 ? 'text-green-600' : 'text-destructive'}`}>
                        {campaign.roi ? campaign.roi.toFixed(2) : 'N/A'}
                      </td>
                      <td className="p-2 text-right">
                        {campaign.cpa ? `R$ ${campaign.cpa.toFixed(2)}` : 'N/A'}
                      </td>
                      <td className="p-2 text-sm text-muted-foreground">
                        {campaign.gargalo || '-'}
                      </td>
                      <td className="p-2 text-sm text-muted-foreground max-w-xs">
                        {campaign.acao_sugerida || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma campanha encontrada no período selecionado
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


