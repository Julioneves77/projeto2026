import { Link } from "react-router-dom";
import { useRef } from "react";
import LinkSelector, { LinkSelectorRef } from "@/components/LinkSelector";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import StructuredData from "@/components/StructuredData";
import { ListChecks, MousePointerClick } from "lucide-react";

const Index = () => {
  const linkSelectorRef = useRef<LinkSelectorRef>(null);

  const handleOpenSelector = () => {
    console.log('[Index] handleOpenSelector chamado');
    linkSelectorRef.current?.openSelect();
  };

  return (
    <>
      <SEOHead
        title="Solicite Link - Acesse suas páginas de solicitação"
        description="Selecione uma opção e acesse a página de solicitação correspondente. Plataforma simples e direta."
        ogTitle="Solicite Link"
        ogDescription="Selecione uma opção e acesse a página de solicitação correspondente."
      />
      <StructuredData />
      <div className="min-h-screen flex flex-col">
        {/* Logo/Brand */}
        <header className="pt-8 pb-4 animate-fade-in">
          <p className="text-center text-lg font-semibold text-gradient">
            Solicite Link
          </p>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          <LinkSelector ref={linkSelectorRef} />

          {/* Como Funciona Section */}
          <section className="mt-20 max-w-2xl w-full animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="text-center mb-8">
              <span className="badge">Simples e rápido</span>
              <h1 className="text-2xl font-bold text-foreground mt-1">
                Como funciona
              </h1>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <article className="card-main flex items-start gap-4">
                <div className="icon-box-sm bg-primary/10">
                  <span className="text-primary font-bold">1</span>
                </div>
                <div>
                  <a 
                    href="#escolha"
                    aria-label="Clique para abrir o seletor de certidões"
                    onClick={(e) => { e.preventDefault(); handleOpenSelector(); }}
                    className="font-semibold text-foreground mb-1 cursor-pointer hover:text-primary transition-colors block no-underline"
                  >
                    Escolha
                  </a>
                  <p className="text-sm text-muted-foreground">
                    Escolha uma das opções disponíveis na lista.
                  </p>
                </div>
              </article>
              
              <article className="card-main flex items-start gap-4">
                <div className="icon-box-sm bg-primary/10">
                  <span className="text-primary font-bold">2</span>
                </div>
                <div>
                  <a 
                    href="#acesse"
                    aria-label="Clique para abrir o seletor de certidões"
                    onClick={(e) => { e.preventDefault(); handleOpenSelector(); }}
                    className="font-semibold text-foreground mb-1 cursor-pointer hover:text-primary transition-colors block no-underline"
                  >
                    Acesse
                  </a>
                  <p className="text-sm text-muted-foreground">
                    Clique no botão para ir à página correspondente.
                  </p>
                </div>
              </article>
            </div>
          </section>
        </main>

        <Footer onOpenSelector={handleOpenSelector} />
      </div>
    </>
  );
};

export default Index;
