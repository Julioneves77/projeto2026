import { Link } from "react-router-dom";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { ArrowLeft, FileText, Scale, RefreshCw } from "lucide-react";

const Termos = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title="Termos de Uso - Solicite Link"
        description="Ao utilizar o Solicite Link, você concorda com os seguintes termos."
        ogTitle="Termos de Uso - Solicite Link"
        ogDescription="Ao utilizar o Solicite Link, você concorda com os seguintes termos."
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
            <span className="badge">Acordo</span>
            <h1 className="section-title mt-2 mb-4">Termos de Uso</h1>
            <p className="section-subtitle max-w-xl mx-auto">
              Ao utilizar o Solicite Link, você concorda com os seguintes termos.
            </p>
          </section>
          
          <section className="space-y-6">
            <article className="card-main animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-start gap-4">
                <div className="icon-box-sm bg-primary/10">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-2">Uso do serviço</h2>
                  <p className="text-muted-foreground">
                    O Solicite Link é uma plataforma de direcionamento. Ao selecionar uma opção e clicar no botão, você será redirecionado para uma página externa.
                  </p>
                </div>
              </div>
            </article>

            <article className="card-main animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-start gap-4">
                <div className="icon-box-sm bg-primary/10">
                  <Scale className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-2">Responsabilidades</h2>
                  <p className="text-muted-foreground">
                    Não nos responsabilizamos pelo conteúdo, disponibilidade ou funcionamento das páginas externas para as quais direcionamos.
                  </p>
                </div>
              </div>
            </article>

            <article className="card-main animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-start gap-4">
                <div className="icon-box-sm bg-primary/10">
                  <RefreshCw className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-2">Alterações</h2>
                  <p className="text-muted-foreground">
                    Reservamos o direito de modificar estes termos a qualquer momento, sem aviso prévio.
                  </p>
                </div>
              </div>
            </article>
          </section>

          <nav className="mt-12 text-center animate-fade-in-up" style={{ animationDelay: '0.4s' }} aria-label="Navegação principal">
            <Link to="/" className="btn-secondary">
              Voltar para a página principal
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </Link>
          </nav>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Termos;
