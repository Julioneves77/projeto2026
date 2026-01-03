import { Link } from "react-router-dom";
import LinkSelector from "@/components/LinkSelector";
import Footer from "@/components/Footer";
import { ListChecks, MousePointerClick } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Logo/Brand */}
      <header className="pt-8 pb-4 animate-fade-in">
        <p className="text-center text-lg font-semibold text-gradient">
          Solicite Link
        </p>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <LinkSelector />

        {/* Como Funciona Section */}
        <section className="mt-20 max-w-2xl w-full animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <div className="text-center mb-8">
            <span className="badge">Simples e rápido</span>
            <h2 className="text-2xl font-bold text-foreground mt-1">
              Como funciona
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="card-main flex items-start gap-4">
              <div className="icon-box-sm bg-primary/10">
                <span className="text-primary font-bold">1</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Selecione</h3>
                <p className="text-sm text-muted-foreground">
                  Escolha uma das opções disponíveis na lista.
                </p>
              </div>
            </div>
            
            <div className="card-main flex items-start gap-4">
              <div className="icon-box-sm bg-primary/10">
                <span className="text-primary font-bold">2</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Acesse</h3>
                <p className="text-sm text-muted-foreground">
                  Clique no botão para ir à página correspondente.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
