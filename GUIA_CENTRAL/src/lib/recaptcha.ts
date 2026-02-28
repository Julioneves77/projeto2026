/**
 * reCAPTCHA v3 - API nativa (sem biblioteca React)
 * Script carregado dinamicamente apenas quando necessário (formulário de contato)
 * para não bloquear páginas como PIX/pagamento
 */

declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

let recaptchaLoadPromise: Promise<void> | null = null;

function loadRecaptchaScript(siteKey: string): Promise<void> {
  if (window.grecaptcha) return Promise.resolve();
  if (recaptchaLoadPromise) return recaptchaLoadPromise;
  recaptchaLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("reCAPTCHA não carregado. Verifique sua conexão."));
    document.head.appendChild(script);
  });
  return recaptchaLoadPromise;
}

export function getRecaptchaToken(siteKey: string, action = "contact_submit"): Promise<string> {
  return loadRecaptchaScript(siteKey).then(
    () =>
      new Promise((resolve, reject) => {
        if (!window.grecaptcha) {
          reject(new Error("reCAPTCHA não carregado. Recarregue a página."));
          return;
        }
        window.grecaptcha.ready(async () => {
          try {
            const token = await window.grecaptcha!.execute(siteKey, { action });
            resolve(token);
          } catch (err) {
            reject(err);
          }
        });
      })
  );
}
