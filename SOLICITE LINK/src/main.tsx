import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// GTM já está inicializado via index.html com ID GTM-5M37FK67
// Garantir que dataLayer existe para eventos dinâmicos
if (typeof window !== 'undefined') {
  (window as any).dataLayer = (window as any).dataLayer || [];
}

createRoot(document.getElementById("root")!).render(<App />);
