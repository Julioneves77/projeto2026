import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import HowItWorks from "./pages/HowItWorks";
import FAQ from "./pages/FAQ";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Contact from "./pages/Contact";
import CertificateForm from "./pages/CertificateForm";
import ServiceSelection from "./pages/ServiceSelection";
import Payment from "./pages/Payment";
import ThankYou from "./pages/ThankYou";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/como-funciona" element={<HowItWorks />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/politica-privacidade" element={<Privacy />} />
          <Route path="/termos-uso" element={<Terms />} />
          <Route path="/contato" element={<Contact />} />
          <Route path="/certidao/:category" element={<CertificateForm />} />
          <Route path="/selecionar-servico" element={<ServiceSelection />} />
          <Route path="/pagamento" element={<Payment />} />
          <Route path="/obrigado" element={<ThankYou />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
