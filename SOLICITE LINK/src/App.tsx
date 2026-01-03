import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import ComoFunciona from "./pages/ComoFunciona";
import Privacidade from "./pages/Privacidade";
import Termos from "./pages/Termos";
import FAQ from "./pages/FAQ";
import Depoimentos from "./pages/Depoimentos";
import Contato from "./pages/Contato";
import Obrigado from "./pages/Obrigado";
import EventProxy from "./pages/EventProxy";
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
          <Route path="/event" element={<EventProxy />} />
          <Route path="/como-funciona" element={<ComoFunciona />} />
          <Route path="/privacidade" element={<Privacidade />} />
          <Route path="/termos" element={<Termos />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/depoimentos" element={<Depoimentos />} />
          <Route path="/contato" element={<Contato />} />
          <Route path="/obrigado" element={<Obrigado />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
