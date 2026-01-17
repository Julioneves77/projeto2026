/**
 * Helper para enviar eventos silenciosos ao Google Tag Manager do Portal Acesso
 * via dataLayer (sem GTM visível no Portal Certidão por causa do GovDocs)
 */

/**
 * Garante que dataLayer existe
 */
function ensureDataLayer() {
  if (typeof window !== 'undefined') {
    (window as any).dataLayer = (window as any).dataLayer || [];
  }
}

/**
 * Verifica se a origem é portalcacesso
 */
function detectOrigin(): 'portalcacesso' | 'solicite' | null {
  // 1. Verificar localStorage
  const storedOrigin = localStorage.getItem('payment_origin');
  if (storedOrigin === 'portalcacesso' || storedOrigin === 'solicite') {
    return storedOrigin as 'portalcacesso' | 'solicite';
  }
  
  // 2. Verificar parâmetro na URL
  const urlParams = new URLSearchParams(window.location.search);
  const urlSource = urlParams.get('source');
  if (urlSource === 'portalcacesso') {
    return 'portalcacesso';
  }
  if (urlSource === 'solicite') {
    return 'solicite';
  }
  
  // 3. Verificar referrer
  const referrer = document.referrer || '';
  if (referrer.includes('portalcacesso.online') || referrer.includes('portalcacesso')) {
    return 'portalcacesso';
  }
  if (referrer.includes('solicite.link') || referrer.includes('solicite')) {
    return 'solicite';
  }
  
  return null;
}

/**
 * Envia evento para dataLayer apenas se origem for portalcacesso
 * @param eventName Nome do evento
 * @param payload Dados adicionais do evento
 */
export function pushDLPortalcacesso(eventName: string, payload: Record<string, any> = {}) {
  if (typeof window === 'undefined') return;
  
  // Garantir dataLayer existe
  ensureDataLayer();
  
  // Verificar origem - só disparar se for portalcacesso
  const origem = detectOrigin();
  if (origem !== 'portalcacesso') {
    return;
  }
  
  const eventData = {
    event: eventName,
    funnel_stage: 'portalcacesso',
    funnel_step: payload.funnel_step || eventName,
    source: 'portalcacesso',
    timestamp: Date.now(),
    ...payload
  };
  
  (window as any).dataLayer.push(eventData);
}

