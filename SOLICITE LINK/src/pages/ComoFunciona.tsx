import { Link } from "react-router-dom";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { ArrowLeft, MousePointerClick, ListChecks, ExternalLink } from "lucide-react";

const ComoFunciona = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title="Como funciona - Solicite Link"
        description="O Solicite Link é uma plataforma simples de direcionamento. Nosso objetivo é facilitar o acesso às páginas de solicitação que você precisa."
        ogTitle="Como funciona - Solicite Link"
        ogDescription="O Solicite Link é uma plataforma simples de direcionamento. Nosso objetivo é facilitar o acesso às páginas de solicitação que você precisa."
      />
      <header className="page-header">
        <Link to="/" className="back-link">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-lg font-semibold text-gradient">Solicite Link</span>
        </Link>
      </header>

      <main className="page-content">
        <div className="page-container">
          <section className="text-center mb-12 animate-fade-in-up">
            <span className="badge">Processo simplificado</span>
            <h1 className="section-title mt-2 mb-4">Como funciona</h1>
            <p className="section-subtitle max-w-xl mx-auto">
              O Solicite Link é uma plataforma simples de direcionamento. Nosso objetivo é facilitar o acesso às páginas de solicitação que você precisa.
            </p>
          </section>

          <section className="grid gap-6 md:grid-cols-3">
            <article className="card-interactive text-center group animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <div className="icon-box mx-auto mb-5 group-hover:bg-primary group-hover:scale-110">
                <ListChecks className="w-6 h-6 text-secondary-foreground group-hover:text-primary-foreground transition-colors duration-300" />
              </div>
              <span className="badge">Passo 1</span>
              <h2 className="text-lg font-semibold text-foreground mt-1 mb-2">Selecione</h2>
              <p className="text-muted-foreground text-sm">
                Escolha a opção desejada na lista disponível na página principal.
              </p>
            </article>

            <article className="card-interactive text-center group animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="icon-box mx-auto mb-5 group-hover:bg-primary group-hover:scale-110">
                <MousePointerClick className="w-6 h-6 text-secondary-foreground group-hover:text-primary-foreground transition-colors duration-300" />
              </div>
              <span className="badge">Passo 2</span>
              <h2 className="text-lg font-semibold text-foreground mt-1 mb-2">Clique</h2>
              <p className="text-muted-foreground text-sm">
                Após a seleção, clique no botão para acessar a página correspondente.
              </p>
            </article>

            <article className="card-interactive text-center group animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <div className="icon-box mx-auto mb-5 group-hover:bg-primary group-hover:scale-110">
                <ExternalLink className="w-6 h-6 text-secondary-foreground group-hover:text-primary-foreground transition-colors duration-300" />
              </div>
              <span className="badge">Passo 3</span>
              <h2 className="text-lg font-semibold text-foreground mt-1 mb-2">Acesse</h2>
              <p className="text-muted-foreground text-sm">
                Você será direcionado para a página de solicitação em uma nova aba.
              </p>
            </article>
          </section>

          <nav className="mt-12 text-center animate-fade-in-up" style={{ animationDelay: '0.4s' }} aria-label="Navegação principal">
            <Link to="/" className="btn-secondary">
              Ir para a página principal
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </Link>
          </nav>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ComoFunciona;
