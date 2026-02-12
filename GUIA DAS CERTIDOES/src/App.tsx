import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Solicitar from "./pages/Solicitar";
import FaleConosco from "./pages/FaleConosco";
import PagamentoPix from "./pages/PagamentoPix";
import Obrigado from "./pages/Obrigado";
import TermosUso from "./pages/TermosUso";
import PoliticaPrivacidade from "./pages/PoliticaPrivacidade";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/solicitar" element={<Solicitar />} />
          <Route path="/fale-conosco" element={<FaleConosco />} />
          <Route path="/pagamento-pix" element={<PagamentoPix />} />
          <Route path="/obrigado" element={<Obrigado />} />
          <Route path="/termos-de-uso" element={<TermosUso />} />
          <Route path="/politica-de-privacidade" element={<PoliticaPrivacidade />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
