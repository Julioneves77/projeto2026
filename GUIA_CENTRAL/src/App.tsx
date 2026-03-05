import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ScrollToTop from "@/components/ScrollToTop";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import HowItWorks from "./pages/HowItWorks";
import FAQ from "./pages/FAQ";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Contact from "./pages/Contact";
import Sobre from "./pages/Sobre";
import CertificateForm from "./pages/CertificateForm";
import Processamento from "./pages/Processamento";
import Payment from "./pages/Payment";
import ThankYou from "./pages/ThankYou";
import CookieBanner from "./components/CookieBanner";
import SocialProofToasts from "./components/SocialProofToasts";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <ScrollToTop />
        <CookieBanner />
        <SocialProofToasts />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/como-funciona" element={<HowItWorks />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/politica-privacidade" element={<Privacy />} />
          <Route path="/termos-uso" element={<Terms />} />
          <Route path="/termos-de-uso" element={<Terms />} />
          <Route path="/contato" element={<Contact />} />
          <Route path="/sobre" element={<Sobre />} />
          <Route path="/certidao/:category" element={<CertificateForm />} />
          <Route path="/confirmar-pagamento" element={<Navigate to={`/pagamento${window.location.search}`} replace />} />
          <Route path="/processamento" element={<Processamento />} />
          <Route path="/pagamento" element={<Payment />} />
          <Route path="/obrigado" element={<ThankYou />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
