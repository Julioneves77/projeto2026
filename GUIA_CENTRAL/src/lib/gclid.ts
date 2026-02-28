/**
 * Utilitário para obter Click ID no contexto React
 * Usa window.gclidUtils (carregado via gclid.js no index.html)
 */

export interface StoredClickId {
  value: string;
  type: 'GCLID' | 'WBRAID' | 'GBRAID';
}

declare global {
  interface Window {
    gclidUtils?: {
      getGclid: () => string;
      getStoredClickId: () => StoredClickId | null;
      __GCLID_DEBUG?: () => object;
    };
  }
}

/** Retorna o melhor click ID (prioridade: gclid > wbraid > gbraid) */
export function getStoredClickId(): StoredClickId | null {
  if (typeof window === 'undefined') return null;
  if (window.gclidUtils?.getStoredClickId) {
    return window.gclidUtils.getStoredClickId();
  }
  const match = document.cookie.match(/(^| )gc_gclid=([^;]+)/);
  if (match) return { value: decodeURIComponent(match[2]), type: 'GCLID' };
  return null;
}

/** Compatibilidade: retorna apenas o valor string */
export function getGclid(): string {
  const click = getStoredClickId();
  return click ? click.value : '';
}
