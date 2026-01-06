import { Link } from "react-router-dom";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { ArrowLeft, Mail, Clock, MessageCircle, Send } from "lucide-react";

const Contato = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title="Contato - Solicite Link"
        description="Entre em contato conosco. Estamos à disposição para ajudar."
        ogTitle="Contato - Solicite Link"
        ogDescription="Entre em contato conosco. Estamos à disposição para ajudar."
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
            <span className="badge">Fale conosco</span>
            <h1 className="section-title mt-2 mb-4">Contato</h1>
            <p className="section-subtitle max-w-xl mx-auto">
              Entre em contato conosco. Estamos à disposição para ajudar.
            </p>
          </section>

          <section className="grid gap-6 md:grid-cols-2">
            <article 
              className="card-interactive group animate-fade-in-up"
              style={{ animationDelay: '0.1s' }}
            >
              <a 
                href="mailto:contato@solicitelink.com.br"
                className="block"
              >
                <div className="flex items-start gap-4">
                  <div className="icon-box-sm bg-primary/10 group-hover:bg-primary">
                    <Mail className="w-5 h-5 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground mb-1">E-mail</h2>
                    <p className="text-primary font-medium mb-2">
                      contato@solicitelink.com.br
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Envie sua mensagem a qualquer momento.
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  <Send className="w-4 h-4" />
                  Enviar e-mail
                </div>
              </a>
            </article>

            <article 
              className="card-main animate-fade-in-up"
              style={{ animationDelay: '0.2s' }}
            >
              <div className="flex items-start gap-4">
                <div className="icon-box-sm bg-primary/10">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground mb-1">Horário de atendimento</h2>
                  <p className="text-primary font-medium mb-2">
                    Segunda a Sexta
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Das 9h às 18h (horário de Brasília).
                  </p>
                </div>
              </div>
            </article>
          </section>

          <section 
            className="mt-6 card-main animate-fade-in-up"
            style={{ animationDelay: '0.3s' }}
          >
            <div className="flex items-start gap-4">
              <div className="icon-box-sm bg-primary/10">
                <MessageCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground mb-2">Tempo de resposta</h2>
                <p className="text-muted-foreground">
                  Nosso tempo médio de resposta é de até 24 horas úteis. Todas as mensagens são respondidas por ordem de chegada.
                </p>
              </div>
            </div>
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

export default Contato;
