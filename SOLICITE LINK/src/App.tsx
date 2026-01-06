import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Obrigado from "./pages/Obrigado";
import EventProxy from "./pages/EventProxy";

// Lazy load para rotas não críticas
const ComoFunciona = lazy(() => import("./pages/ComoFunciona"));
const Privacidade = lazy(() => import("./pages/Privacidade"));
const Termos = lazy(() => import("./pages/Termos"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Depoimentos = lazy(() => import("./pages/Depoimentos"));
const Contato = lazy(() => import("./pages/Contato"));
const NotFound = lazy(() => import("./pages/NotFound"));

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
          <Route 
            path="/como-funciona" 
            element={
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-muted-foreground">Carregando...</div></div>}>
                <ComoFunciona />
              </Suspense>
            } 
          />
          <Route 
            path="/privacidade" 
            element={
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-muted-foreground">Carregando...</div></div>}>
                <Privacidade />
              </Suspense>
            } 
          />
          <Route 
            path="/termos" 
            element={
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-muted-foreground">Carregando...</div></div>}>
                <Termos />
              </Suspense>
            } 
          />
          <Route 
            path="/faq" 
            element={
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-muted-foreground">Carregando...</div></div>}>
                <FAQ />
              </Suspense>
            } 
          />
          <Route 
            path="/depoimentos" 
            element={
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-muted-foreground">Carregando...</div></div>}>
                <Depoimentos />
              </Suspense>
            } 
          />
          <Route 
            path="/contato" 
            element={
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-muted-foreground">Carregando...</div></div>}>
                <Contato />
              </Suspense>
            } 
          />
          <Route path="/obrigado" element={<Obrigado />} />
          <Route 
            path="*" 
            element={
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-muted-foreground">Carregando...</div></div>}>
                <NotFound />
              </Suspense>
            } 
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
