import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Pix from "./pages/Pix";
import Obrigado from "./pages/Obrigado";
import TermosUso from "./pages/TermosUso";
import PoliticaPrivacidade from "./pages/PoliticaPrivacidade";
import Contato from "./pages/Contato";
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
          <Route path="/pix" element={<Pix />} />
          <Route path="/obrigado" element={<Obrigado />} />
          <Route path="/termos" element={<TermosUso />} />
          <Route path="/privacidade" element={<PoliticaPrivacidade />} />
          <Route path="/contato" element={<Contato />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
