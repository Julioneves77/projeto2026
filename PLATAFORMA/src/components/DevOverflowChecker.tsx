import { useEffect } from 'react';

/**
 * Utility que detecta elementos com overflow horizontal em desenvolvimento.
 * Só executa quando import.meta.env.DEV é true.
 * Loga no console os elementos que excedem a largura do viewport.
 */
export function DevOverflowChecker() {
  useEffect(() => {
    if (!import.meta.env.DEV) return;

    const check = () => {
      const vw = window.innerWidth;
      const overflowers: { el: Element; width: number; tag: string }[] = [];

      document.querySelectorAll('*').forEach((el) => {
        if (el instanceof HTMLElement) {
          const rect = el.getBoundingClientRect();
          const scrollWidth = el.scrollWidth;
          if (scrollWidth > vw && rect.width > 0) {
            overflowers.push({
              el,
              width: scrollWidth,
              tag: el.tagName + (el.id ? `#${el.id}` : '') + (el.className ? '.' + String(el.className).split(' ')[0] : ''),
            });
          }
        }
      });

      if (overflowers.length > 0) {
        console.warn('[DevOverflowChecker] Elementos que excedem viewport:', overflowers.map((o) => ({ tag: o.tag, width: o.width, viewport: vw })));
      }
    };

    check();
    const observer = new ResizeObserver(check);
    observer.observe(document.body);

    return () => observer.disconnect();
  }, []);

  return null;
}
