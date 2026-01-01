import { Link } from "react-router-dom";
import Footer from "@/components/Footer";
import { ArrowLeft, Shield, Cookie, Link2 } from "lucide-react";

const Privacidade = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="page-header">
        <Link to="/" className="back-link">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-lg font-semibold text-gradient">Solicite Link</span>
        </Link>
      </div>

      <main className="page-content">
        <div className="page-container">
          <div className="text-center mb-12 animate-fade-in-up">
            <span className="badge">Transparência</span>
            <h1 className="section-title mt-2 mb-4">Política de Privacidade</h1>
            <p className="section-subtitle max-w-xl mx-auto">
              Esta página descreve como tratamos as informações durante sua navegação.
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="card-main animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-start gap-4">
                <div className="icon-box-sm bg-primary/10">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-2">Coleta de dados</h2>
                  <p className="text-muted-foreground">
                    O Solicite Link não coleta, armazena ou processa dados pessoais. Somos apenas uma plataforma de direcionamento.
                  </p>
                </div>
              </div>
            </div>

            <div className="card-main animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-start gap-4">
                <div className="icon-box-sm bg-primary/10">
                  <Cookie className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-2">Cookies</h2>
                  <p className="text-muted-foreground">
                    Utilizamos apenas cookies essenciais para o funcionamento básico do site.
                  </p>
                </div>
              </div>
            </div>

            <div className="card-main animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-start gap-4">
                <div className="icon-box-sm bg-primary/10">
                  <Link2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-2">Links externos</h2>
                  <p className="text-muted-foreground">
                    Ao clicar em um link, você será direcionado para uma página externa. Não nos responsabilizamos pelo conteúdo ou políticas dessas páginas.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <Link to="/" className="btn-secondary">
              Voltar para a página principal
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Privacidade;
