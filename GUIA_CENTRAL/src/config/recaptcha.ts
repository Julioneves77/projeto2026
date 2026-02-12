/**
 * Configuração do reCAPTCHA
 * 
 * IMPORTANTE:
 * - A Site Key é pública e pode ser exposta no frontend
 * - A Secret Key deve ser usada APENAS no backend para validação
 * - Nunca commite arquivos .env.local no git
 */

export const RECAPTCHA_CONFIG = {
  siteKey: import.meta.env.VITE_RECAPTCHA_SITE_KEY || '',
  // Secret key não deve ser exposta no frontend
  // secretKey: import.meta.env.VITE_RECAPTCHA_SECRET_KEY || '',
};

if (!RECAPTCHA_CONFIG.siteKey) {
  console.warn('⚠️ VITE_RECAPTCHA_SITE_KEY não está configurada. Configure no arquivo .env.local');
}

