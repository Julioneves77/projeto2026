/**
 * Biblioteca de tracking de eventos do funil
 * Gera e persiste funnel_id UUID, envia eventos para o backend
 */

const FUNNEL_ID_COOKIE = 'funnel_id';
const FUNNEL_ID_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 dias em milissegundos
const UTM_CAMPAIGN_STORAGE_KEY = 'utm_campaign';
const UTM_CAMPAIGN_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 dias em milissegundos
const SYNC_SERVER_URL = import.meta.env.VITE_SYNC_SERVER_URL || 'http://localhost:3001';

/**
 * Gera um UUID v4
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Salva funnel_id em cookie
 */
function setCookie(name: string, value: string, maxAge: number) {
  const expires = new Date(Date.now() + maxAge).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

/**
 * Lê cookie
 */
function getCookie(name: string): string | null {
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

/**
 * Gera um novo funnel_id UUID e persiste
 */
export function generateFunnelId(): string {
  const funnelId = generateUUID();
  
  // Salvar em cookie (prioridade)
  setCookie(FUNNEL_ID_COOKIE, funnelId, FUNNEL_ID_COOKIE_MAX_AGE);
  
  // Salvar em localStorage (fallback)
  try {
    localStorage.setItem(FUNNEL_ID_COOKIE, funnelId);
  } catch (e) {
    // Ignorar erro se localStorage não disponível
  }
  
  return funnelId;
}

/**
 * Recupera funnel_id existente ou gera novo
 */
export function getFunnelId(): string {
  // Tentar ler de cookie primeiro
  let funnelId = getCookie(FUNNEL_ID_COOKIE);
  
  // Se não encontrou no cookie, tentar localStorage
  if (!funnelId) {
    try {
      funnelId = localStorage.getItem(FUNNEL_ID_COOKIE);
    } catch (e) {
      // Ignorar erro
    }
  }
  
  // Se ainda não encontrou, tentar URL params (para cross-domain)
  if (!funnelId) {
    const urlParams = new URLSearchParams(window.location.search);
    funnelId = urlParams.get('funnel_id') || urlParams.get('fid');
    
    // Se encontrou na URL, persistir
    if (funnelId) {
      setCookie(FUNNEL_ID_COOKIE, funnelId, FUNNEL_ID_COOKIE_MAX_AGE);
      try {
        localStorage.setItem(FUNNEL_ID_COOKIE, funnelId);
      } catch (e) {
        // Ignorar erro
      }
    }
  }
  
  // Se ainda não encontrou, gerar novo
  if (!funnelId) {
    funnelId = generateFunnelId();
  } else {
    // Atualizar cookie para renovar expiração
    setCookie(FUNNEL_ID_COOKIE, funnelId, FUNNEL_ID_COOKIE_MAX_AGE);
  }
  
  return funnelId;
}

/**
 * Salva utm_campaign no localStorage
 */
function saveUtmCampaign(campaign: string): void {
  try {
    localStorage.setItem(UTM_CAMPAIGN_STORAGE_KEY, campaign);
    // Também salvar timestamp para expiração futura se necessário
    localStorage.setItem(`${UTM_CAMPAIGN_STORAGE_KEY}_timestamp`, Date.now().toString());
  } catch (e) {
    // Ignorar erro se localStorage não disponível
  }
}

/**
 * Recupera utm_campaign do localStorage ou URL
 */
export function getUtmCampaign(): string | undefined {
  // 1. Tentar da URL primeiro (prioridade)
  const urlParams = new URLSearchParams(window.location.search);
  const urlCampaign = urlParams.get('utm_campaign');
  if (urlCampaign) {
    saveUtmCampaign(urlCampaign); // Salvar para uso futuro
    return urlCampaign;
  }
  
  // 2. Tentar do localStorage
  try {
    const storedCampaign = localStorage.getItem(UTM_CAMPAIGN_STORAGE_KEY);
    if (storedCampaign) {
      // Verificar se não expirou (opcional, por enquanto não expira)
      return storedCampaign;
    }
  } catch (e) {
    // Ignorar erro
  }
  
  return undefined;
}

/**
 * Extrai parâmetros UTM da URL e salva utm_campaign
 */
function getUtmParams(): { utm_campaign?: string; utm_term?: string } {
  const urlParams = new URLSearchParams(window.location.search);
  const utm_campaign = urlParams.get('utm_campaign') || undefined;
  const utm_term = urlParams.get('utm_term') || undefined;
  
  // Salvar utm_campaign se encontrado na URL
  if (utm_campaign) {
    saveUtmCampaign(utm_campaign);
  }
  
  return {
    utm_campaign: utm_campaign || getUtmCampaign(), // Tentar recuperar do storage se não estiver na URL
    utm_term: utm_term || undefined
  };
}

/**
 * Envia evento para o backend
 */
export async function trackEvent(
  eventType: string,
  metadata?: Record<string, any>
): Promise<void> {
  // Verificar feature flag
  if (import.meta.env.VITE_COLLECTOR_ENABLED === 'false') {
    if (import.meta.env.DEV) {
      console.log('[FunnelTracker] Collector desabilitado, evento ignorado:', eventType);
    }
    return;
  }

  try {
    const funnelId = getFunnelId();
    const utmParams = getUtmParams();
    
    const eventData = {
      funnel_id: funnelId,
      event_type: eventType,
      utm_campaign: utmParams.utm_campaign,
      utm_term: utmParams.utm_term,
      domain: window.location.hostname,
      path: window.location.pathname,
      metadata: metadata || null,
      timestamp: Date.now()
    };

    // Enviar para backend (não bloquear UI)
    fetch(`${SYNC_SERVER_URL}/funnel-events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventData),
      keepalive: true // Garantir que request seja enviado mesmo se página fechar
    }).catch(error => {
      // Log apenas em desenvolvimento
      if (import.meta.env.DEV) {
        console.error('[FunnelTracker] Erro ao enviar evento:', error);
      }
    });

    // Log apenas em desenvolvimento
    if (import.meta.env.DEV) {
      console.log('[FunnelTracker] Evento enviado:', eventType, eventData);
    }
  } catch (error) {
    // Não quebrar aplicação se tracking falhar
    if (import.meta.env.DEV) {
      console.error('[FunnelTracker] Erro ao rastrear evento:', error);
    }
  }
}

/**
 * Adiciona funnel_id a uma URL para repassar entre domínios
 */
export function addFunnelIdToUrl(url: string): string {
  const funnelId = getFunnelId();
  const urlObj = new URL(url);
  urlObj.searchParams.set('funnel_id', funnelId);
  
  // Também adicionar utm_campaign se disponível
  const utmCampaign = getUtmCampaign();
  if (utmCampaign) {
    urlObj.searchParams.set('utm_campaign', utmCampaign);
  }
  
  return urlObj.toString();
}


