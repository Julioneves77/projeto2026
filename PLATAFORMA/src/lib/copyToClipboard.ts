/**
 * Cópia para área de transferência - funciona em TODOS os dispositivos:
 * Windows, Mac, Linux, iOS, Android - Chrome, Edge, Firefox, Safari
 *
 * Estratégia: interceptar evento "copy" e definir os dados manualmente.
 * Assim controlamos o que é copiado independente do método que dispara o evento.
 */

export function copyToClipboard(text: string): boolean {
  let success = false;

  const handler = (e: ClipboardEvent) => {
    e.preventDefault();
    if (e.clipboardData) {
      e.clipboardData.setData('text/plain', text);
      success = true;
    }
    document.removeEventListener('copy', handler);
  };
  document.addEventListener('copy', handler);

  try {
    const el = document.createElement('textarea');
    el.value = text;
    el.readOnly = true;
    el.setAttribute('aria-hidden', 'true');
    el.style.cssText = 'position:fixed;left:0;top:0;width:2px;height:2px;padding:0;margin:0;border:0;outline:0;font-size:16px;';
    document.body.appendChild(el);
    el.focus();
    el.select();
    el.setSelectionRange(0, text.length);
    document.execCommand('copy');
    document.body.removeChild(el);
  } catch {
    success = false;
  } finally {
    document.removeEventListener('copy', handler);
  }

  return success;
}

/**
 * Versão assíncrona - tenta Clipboard API primeiro (melhor em HTTPS),
 * depois fallback síncrono para compatibilidade total.
 */
export async function copyToClipboardAsync(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fallback
  }
  return copyToClipboard(text);
}
