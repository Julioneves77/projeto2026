import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, MessageCircle } from 'lucide-react';

export const Contact = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="pt-8 pb-4">
        <div className="container mx-auto px-4">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
          Entre em Contato
        </h1>

        <div className="bg-white rounded-xl p-8 border border-border shadow-sm">
          <p className="text-muted-foreground mb-8">
            Tem dúvidas, sugestões ou precisa de ajuda? Entre em contato conosco 
            através dos canais abaixo.
          </p>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  E-mail
                </h3>
                <p className="text-muted-foreground">
                  Envie-nos um e-mail e responderemos o mais breve possível.
                </p>
                <a 
                  href="mailto:contato@portalcacesso.online" 
                  className="text-primary hover:text-primary/80 transition-colors"
                >
                  contato@portalcacesso.online
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  Suporte
                </h3>
                <p className="text-muted-foreground">
                  Nossa equipe está pronta para ajudá-lo com qualquer dúvida sobre 
                  nossos serviços digitais.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-border">
            <h3 className="font-semibold text-foreground mb-4">
              Horário de Atendimento
            </h3>
            <p className="text-muted-foreground">
              Segunda a Sexta: 9h às 18h<br />
              Sábado: 9h às 13h<br />
              Domingo: Fechado
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};


