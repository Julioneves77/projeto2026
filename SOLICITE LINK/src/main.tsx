import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Inicializar GTM se configurado
const gtmId = import.meta.env.VITE_GTM_CONTAINER_ID;
if (gtmId && gtmId !== 'GTM-XXXXXXX' && typeof window !== 'undefined') {
  // Criar dataLayer se não existir
  (window as any).dataLayer = (window as any).dataLayer || [];
  
  // Carregar script do GTM
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`;
  document.head.appendChild(script);
  
  // Adicionar noscript iframe
  const noscript = document.createElement('noscript');
  const iframe = document.createElement('iframe');
  iframe.src = `https://www.googletagmanager.com/ns.html?id=${gtmId}`;
  iframe.height = '0';
  iframe.width = '0';
  iframe.style.display = 'none';
  iframe.style.visibility = 'hidden';
  noscript.appendChild(iframe);
  document.body.insertBefore(noscript, document.body.firstChild);
  
  console.log('✅ [SOLICITE LINK] GTM inicializado com ID:', gtmId);
}

createRoot(document.getElementById("root")!).render(<App />);
