import { Link } from "react-router-dom";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { ArrowLeft, HelpCircle, Zap, ShieldCheck, CreditCard } from "lucide-react";

const faqItems = [
  {
    icon: HelpCircle,
    question: "O que é o Solicite Link?",
    answer: "É uma plataforma simples de direcionamento que facilita o acesso às páginas de solicitação.",
  },
  {
    icon: Zap,
    question: "Como utilizo a plataforma?",
    answer: "Basta selecionar uma opção na lista e clicar no botão para ser direcionado.",
  },
  {
    icon: ShieldCheck,
    question: "A plataforma coleta meus dados?",
    answer: "Não. O Solicite Link não coleta, armazena ou processa dados pessoais.",
  },
  {
    icon: CreditCard,
    question: "Preciso pagar algo?",
    answer: "O uso da plataforma de direcionamento é gratuito.",
  },
];

const FAQ = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title="Perguntas Frequentes - Solicite Link"
        description="Encontre respostas para as dúvidas mais comuns sobre nossa plataforma."
        ogTitle="Perguntas Frequentes - Solicite Link"
        ogDescription="Encontre respostas para as dúvidas mais comuns sobre nossa plataforma."
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
            <span className="badge">Tire suas dúvidas</span>
            <h1 className="section-title mt-2 mb-4">Perguntas Frequentes</h1>
            <p className="section-subtitle max-w-xl mx-auto">
              Encontre respostas para as dúvidas mais comuns sobre nossa plataforma.
            </p>
          </section>
          
          <section className="grid gap-4 md:grid-cols-2">
            {faqItems.map((item, index) => (
              <article 
                key={index} 
                className="card-main animate-fade-in-up"
                style={{ animationDelay: `${0.1 * (index + 1)}s` }}
              >
                <div className="flex items-start gap-4">
                  <div className="icon-box-sm bg-primary/10">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground mb-2">{item.question}</h2>
                    <p className="text-muted-foreground text-sm">{item.answer}</p>
                  </div>
                </div>
              </article>
            ))}
          </section>

          <nav className="mt-12 text-center animate-fade-in-up" style={{ animationDelay: '0.5s' }} aria-label="Navegação principal">
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

export default FAQ;
