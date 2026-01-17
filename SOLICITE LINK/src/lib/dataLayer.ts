/**
 * Helper para enviar eventos ao Google Tag Manager via dataLayer
 */

// Garantir que dataLayer existe
if (typeof window !== 'undefined') {
  (window as any).dataLayer = (window as any).dataLayer || [];
}

/**
 * Recupera utm_campaign do localStorage ou URL
 */
function getUtmCampaign(): string | undefined {
  // Tentar da URL primeiro
  const urlParams = new URLSearchParams(window.location.search);
  const urlCampaign = urlParams.get('utm_campaign');
  if (urlCampaign) {
    // Salvar no localStorage para uso futuro
    try {
      localStorage.setItem('utm_campaign', urlCampaign);
    } catch (e) {
      // Ignorar erro
    }
    return urlCampaign;
  }
  
  // Tentar do localStorage
  try {
    return localStorage.getItem('utm_campaign') || undefined;
  } catch (e) {
    return undefined;
  }
}

/**
 * Envia evento para dataLayer com formato padronizado
 * @param eventName Nome do evento
 * @param payload Dados adicionais do evento
 */
export function pushDL(eventName: string, payload: Record<string, any> = {}) {
  if (typeof window === 'undefined') return;
  
  // Recuperar utm_campaign se não estiver no payload
  const utmCampaign = payload.utm_campaign || getUtmCampaign();
  
  const eventData = {
    event: eventName,
    funnel_stage: 'links',
    funnel_step: payload.funnel_step || eventName,
    source: payload.source || 'links',
    timestamp: Date.now(),
    ...(utmCampaign && { utm_campaign: utmCampaign }), // Incluir utm_campaign se disponível
    ...payload
  };
  
  (window as any).dataLayer.push(eventData);
  
  // Log apenas em desenvolvimento
  if (import.meta.env.DEV) {
    console.log(`[dataLayer] Evento disparado:`, eventData);
  }
}



