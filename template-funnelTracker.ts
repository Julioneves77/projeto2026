/**
 * Template: Biblioteca de Tracking de Eventos do Funil
 * 
 * COMO USAR:
 * 1. Copie este arquivo para seu novo domínio: src/lib/funnelTracker.ts
 * 2. Configure VITE_SYNC_SERVER_URL no .env
 * 3. Configure VITE_COLLECTOR_ENABLED=true no .env
 * 4. Importe e use trackEvent() nas suas páginas
 * 
 * EXEMPLO:
 * import { trackEvent } from '@/lib/funnelTracker';
 * 
 * useEffect(() => {
 *   trackEvent('links_view');
 * }, []);
 */

const FUNNEL_ID_COOKIE = 'funnel_id';
const FUNNEL_ID_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 dias
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
 * Extrai parâmetros UTM da URL
 */
function getUtmParams(): { utm_campaign?: string; utm_term?: string } {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    utm_campaign: urlParams.get('utm_campaign') || undefined,
    utm_term: urlParams.get('utm_term') || undefined
  };
}

/**
 * Envia evento para o backend
 * 
 * @param eventType Tipo do evento (links_view, form_start, payment_confirmed, etc.)
 * @param metadata Dados adicionais do evento (opcional)
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
 * 
 * @param url URL de destino
 * @returns URL com funnel_id adicionado
 */
export function addFunnelIdToUrl(url: string): string {
  const funnelId = getFunnelId();
  const urlObj = new URL(url);
  urlObj.searchParams.set('funnel_id', funnelId);
  return urlObj.toString();
}

