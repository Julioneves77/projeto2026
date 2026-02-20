import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/SEOHead";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <Layout>
      <SEOHead
        title="Página não encontrada - Guia Central"
        description="A página que você está procurando não foi encontrada."
      />
      <div className="flex min-h-screen items-center justify-center">
        <div className="tech-card hex-corners text-center max-w-md mx-auto p-12 border border-border/60 bg-card">
          <h1 className="mb-4 font-orbitron text-6xl font-bold text-primary">404</h1>
          <p className="mb-6 text-xl text-muted-foreground font-mono">Página não encontrada</p>
          <a href="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg gradient-hero text-primary-foreground font-semibold hover:opacity-90 transition-opacity">
            Voltar ao Início
          </a>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
