/**
 * Helper para enviar eventos ao Google Tag Manager via dataLayer
 */

// Garantir que dataLayer existe
if (typeof window !== 'undefined') {
  (window as any).dataLayer = (window as any).dataLayer || [];
}

/**
 * Envia evento para dataLayer com formato padronizado
 * @param eventName Nome do evento
 * @param payload Dados adicionais do evento
 */
export function pushDL(eventName: string, payload: Record<string, any> = {}) {
  if (typeof window === 'undefined') return;
  
  const eventData = {
    event: eventName,
    funnel_stage: 'links',
    funnel_step: payload.funnel_step || eventName,
    source: payload.source || 'links',
    timestamp: Date.now(),
    ...payload
  };
  
  (window as any).dataLayer.push(eventData);
  
  // Log apenas em desenvolvimento
  if (import.meta.env.DEV) {
    console.log(`[dataLayer] Evento disparado:`, eventData);
  }
}

