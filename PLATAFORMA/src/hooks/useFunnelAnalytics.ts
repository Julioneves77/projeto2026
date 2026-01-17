/**
 * Hook para buscar e calcular métricas do funil
 */

import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const SYNC_SERVER_URL = import.meta.env.VITE_SYNC_SERVER_URL || 'http://localhost:3001';
const SYNC_SERVER_API_KEY = import.meta.env.VITE_SYNC_SERVER_API_KEY || null;

interface FunnelAnalytics {
  events: Record<string, number>;
  conversion_rates: {
    links_to_cta: number;
    portal_to_form: number;
    form_to_submit: number;
    pix_to_payment: number;
  };
  costs: {
    total: number;
    spent_without_conversion: number;
    tickets_burned: number;
  };
  metrics: {
    cpa: number | null;
    roi: number | null;
    payments: number;
    ticket_price: number;
  };
  bottleneck: string | null;
  reliability: 'ALTA' | 'MÉDIA' | 'BAIXA';
  total_events: number;
}

interface CampaignMetrics {
  campaign_id: string;
  campaign_name: string;
  status: string;
  emoji: string;
  gasto: number;
  pagamentos: number;
  roi: number | null;
  cpa: number | null;
  gargalo: string | null;
  acao_sugerida: string;
}

export function useFunnelAnalytics() {
  const { currentUser } = useAuth();
  const [analytics, setAnalytics] = useState<FunnelAnalytics | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignMetrics[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async (params: {
    utm_campaign?: string;
    date_from?: string;
    date_to?: string;
  } = {}) => {
    if (!currentUser) return;

    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params.utm_campaign) queryParams.set('utm_campaign', params.utm_campaign);
      if (params.date_from) queryParams.set('date_from', params.date_from);
      if (params.date_to) queryParams.set('date_to', params.date_to);

      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };

      if (SYNC_SERVER_API_KEY) {
        headers['X-API-Key'] = SYNC_SERVER_API_KEY;
      }

      const response = await fetch(
        `${SYNC_SERVER_URL}/funnel-analytics?${queryParams.toString()}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`Erro ao buscar analytics: ${response.statusText}`);
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('[useFunnelAnalytics] Erro:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const fetchCampaigns = useCallback(async (params: {
    date_from?: string;
    date_to?: string;
  } = {}) => {
    if (!currentUser) return;

    setLoading(true);
    setError(null);

    try {
      // Buscar eventos agrupados por campanha
      const queryParams = new URLSearchParams();
      if (params.date_from) queryParams.set('date_from', params.date_from);
      if (params.date_to) queryParams.set('date_to', params.date_to);

      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };

      if (SYNC_SERVER_API_KEY) {
        headers['X-API-Key'] = SYNC_SERVER_API_KEY;
      }

      // Buscar eventos
      const eventsResponse = await fetch(
        `${SYNC_SERVER_URL}/funnel-events?${queryParams.toString()}`,
        { headers }
      );

      if (!eventsResponse.ok) {
        throw new Error(`Erro ao buscar eventos: ${eventsResponse.statusText}`);
      }

      const events = await eventsResponse.json();

      // Agrupar por utm_campaign
      const campaignsMap = new Map<string, CampaignMetrics>();

      events.forEach((event: any) => {
        if (!event.utm_campaign) return;

        if (!campaignsMap.has(event.utm_campaign)) {
          campaignsMap.set(event.utm_campaign, {
            campaign_id: event.utm_campaign,
            campaign_name: event.utm_campaign,
            status: 'OBSERVACAO',
            emoji: '🟡',
            gasto: 0,
            pagamentos: 0,
            roi: null,
            cpa: null,
            gargalo: null,
            acao_sugerida: ''
          });
        }
      });

      // Buscar analytics por campanha
      const campaignsArray: CampaignMetrics[] = [];
      for (const [campaignId] of campaignsMap) {
        try {
          const campaignParams = {
            ...params,
            utm_campaign: campaignId
          };
          
          const campaignQueryParams = new URLSearchParams();
          if (campaignParams.utm_campaign) campaignQueryParams.set('utm_campaign', campaignParams.utm_campaign);
          if (campaignParams.date_from) campaignQueryParams.set('date_from', campaignParams.date_from);
          if (campaignParams.date_to) campaignQueryParams.set('date_to', campaignParams.date_to);

          const campaignResponse = await fetch(
            `${SYNC_SERVER_URL}/funnel-analytics?${campaignQueryParams.toString()}`,
            { headers }
          );

          if (campaignResponse.ok) {
            const campaignData = await campaignResponse.json();
            
            // Importar funções de diagnóstico e semáforo
            const { identifyBottleneck } = await import('../lib/funnelDiagnostics');
            const { getSemaphoreStatus } = await import('../lib/funnelSemaphore');

            const bottleneck = identifyBottleneck(
              campaignData.events,
              campaignData.costs
            );

            const semaphore = getSemaphoreStatus(
              campaignData.costs,
              campaignData.metrics.payments,
              campaignData.metrics.cpa,
              campaignData.metrics.roi
            );

            campaignsArray.push({
              campaign_id: campaignId,
              campaign_name: campaignId,
              status: semaphore.status,
              emoji: semaphore.emoji,
              gasto: campaignData.costs.total,
              pagamentos: campaignData.metrics.payments,
              roi: campaignData.metrics.roi,
              cpa: campaignData.metrics.cpa,
              gargalo: bottleneck.bottleneck,
              acao_sugerida: bottleneck.suggestedAction
            });
          }
        } catch (err) {
          console.error(`Erro ao buscar analytics da campanha ${campaignId}:`, err);
        }
      }

      setCampaigns(campaignsArray);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('[useFunnelAnalytics] Erro ao buscar campanhas:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const syncGoogleAds = useCallback(async (dateFrom?: string, dateTo?: string) => {
    if (!currentUser) {
      toast({
        title: "Não autorizado",
        description: "Você precisa estar logado para sincronizar o Google Ads.",
        variant: "destructive",
      });
      return;
    }
    if (currentUser.role !== 'admin') {
      toast({
        title: "Permissão negada",
        description: "Apenas administradores podem sincronizar o Google Ads.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setError(null);
    toast({
      title: "Sincronizando Google Ads...",
      description: "Isso pode levar alguns minutos.",
    });

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      if (SYNC_SERVER_API_KEY) {
        headers['X-API-Key'] = SYNC_SERVER_API_KEY;
      }

      const body: any = {
        customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID || '591-659-0517',
      };
      if (dateFrom) body.date_from = dateFrom;
      if (dateTo) body.date_to = dateTo;

      const response = await fetch(`${SYNC_SERVER_URL}/google-ads/sync`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erro ao sincronizar Google Ads: ${response.statusText}`);
      }

      const result = await response.json();
      
      toast({
        title: "Sincronização Google Ads concluída!",
        description: `${result.saved || 0} campanhas sincronizadas com sucesso.`,
      });

      // Atualizar dados após sincronização
      const from = dateFrom || format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
      const to = dateTo || format(new Date(), 'yyyy-MM-dd');
      fetchAnalytics({ date_from: from, date_to: to });
      fetchCampaigns({ date_from: from, date_to: to });
    } catch (err: any) {
      console.error('Erro ao sincronizar Google Ads:', err);
      setError(err.message || 'Erro desconhecido ao sincronizar Google Ads.');
      toast({
        title: "Erro na sincronização Google Ads",
        description: err.message || "Verifique as credenciais no .env e a conexão com a API.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [currentUser, fetchAnalytics, fetchCampaigns]);

  const fetchValidation = useCallback(async (params: {
    date_from?: string;
    date_to?: string;
  } = {}) => {
    if (!currentUser) return null;

    try {
      const queryParams = new URLSearchParams();
      if (params.date_from) queryParams.set('date_from', params.date_from);
      if (params.date_to) queryParams.set('date_to', params.date_to);

      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };

      if (SYNC_SERVER_API_KEY) {
        headers['X-API-Key'] = SYNC_SERVER_API_KEY;
      }

      const response = await fetch(
        `${SYNC_SERVER_URL}/funnel-validation?${queryParams.toString()}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`Erro ao buscar validação: ${response.statusText}`);
      }

      return await response.json();
    } catch (err: any) {
      console.error('Erro ao buscar validação:', err);
      throw err;
    }
  }, [currentUser]);

  return {
    analytics,
    campaigns,
    loading,
    error,
    fetchAnalytics,
    fetchCampaigns,
    syncGoogleAds,
    fetchValidation
  };
}

