/**
 * Utilitários de scroll para UX mobile e navegação.
 * - scrollToTop: leva viewport ao topo (comportamento instantâneo)
 * - scrollToFormStart: posiciona no início do formulário (com offset do header fixo)
 */

const HEADER_OFFSET = 80; // altura aproximada do header sticky

/**
 * Scroll instantâneo para o topo da página.
 * Usado em trocas de rota, etapa, formulário.
 */
export function scrollToTop(): void {
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  if (document.documentElement) {
    document.documentElement.scrollTop = 0;
    document.documentElement.scrollLeft = 0;
  }
  if (document.body) {
    document.body.scrollTop = 0;
    document.body.scrollLeft = 0;
  }
}

/**
 * Posiciona o scroll no início do bloco do formulário,
 * com offset para não ficar escondido pelo header fixo.
 * @param elementRef - ref do elemento âncora (ex: início do form)
 */
export function scrollToFormStart(element: HTMLElement | null): void {
  if (!element) {
    scrollToTop();
    return;
  }
  const rect = element.getBoundingClientRect();
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const targetY = scrollTop + rect.top - HEADER_OFFSET;
  window.scrollTo({ top: Math.max(0, targetY), left: 0, behavior: "auto" });
}
