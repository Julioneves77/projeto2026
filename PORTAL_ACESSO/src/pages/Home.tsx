import { useRef, useEffect } from 'react';
import { ServiceSelector, ServiceSelectorRef } from '@/components/ServiceSelector';
import { Footer } from '@/components/Footer';
import { Service } from '@/types';
import { pushDL } from '@/lib/dataLayer';

export const Home = () => {
  const selectorRef = useRef<ServiceSelectorRef>(null);

  // Disparar evento de page_view quando página carrega
  useEffect(() => {
    pushDL('portalcacesso_page_view', {
      funnel_step: 'home_view',
      source: 'portalcacesso',
    });
  }, []);

  const handleServiceSelect = (service: Service) => {
    window.location.href = service.portalPath;
  };

  const handleOpenSelector = () => {
    // Disparar evento quando cards "Como funciona" são clicados
    pushDL('portalcacesso_how_it_works_clicked', {
      funnel_step: 'how_it_works_interaction',
      source: 'portalcacesso',
    });
    
    selectorRef.current?.openSelect();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="pt-12 pb-8 animate-fade-in">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Portal Acesso Online
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <ServiceSelector ref={selectorRef} onServiceSelect={handleServiceSelect} />

        {/* Como Funciona Section */}
        <section className="mt-16 max-w-3xl w-full animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="text-center mb-10">
            <span className="inline-block px-4 py-1 bg-primary/10 text-primary font-semibold rounded-full text-sm mb-3">
              Simples e direto
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Como funciona
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div 
              onClick={handleOpenSelector}
              className="bg-white rounded-xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <span className="text-primary font-bold text-lg">1</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">
                    Escolha o serviço
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Selecione o serviço digital que você precisa acessar na lista
                  </p>
                </div>
              </div>
            </div>

            <div 
              onClick={handleOpenSelector}
              className="bg-white rounded-xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <span className="text-primary font-bold text-lg">2</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">
                    Acesse a plataforma
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Clique no botão para ser direcionado à plataforma de solicitação
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer onOpenSelector={handleOpenSelector} />
    </div>
  );
};
