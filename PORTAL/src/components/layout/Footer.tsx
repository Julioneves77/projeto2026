import { Link } from "react-router-dom";
import { Mail, Phone, FileText } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-muted/30 mt-auto">
      <div className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Sobre nós */}
          <div>
            <h3 className="font-heading font-bold text-foreground mb-3">
              Sobre nós:
            </h3>
            <p className="text-sm text-muted-foreground">
              Portal Certidão é uma plataforma digital dedicada à emissão de certidões negativas e documentos oficiais, oferecendo serviços com agilidade, segurança e atendimento qualificado. Nosso compromisso é facilitar o acesso a documentos essenciais de forma prática e confiável.
            </p>
          </div>

          {/* Contato */}
          <div>
            <h3 className="font-heading font-bold text-foreground mb-3">
              Contato:
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-sm text-muted-foreground">
                  contato@portalcertidao.org
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-sm text-muted-foreground">
                  (11) 994392-5211
                </span>
              </div>
            </div>
          </div>

          {/* Atendimento */}
          <div>
            <h3 className="font-heading font-bold text-foreground mb-3">
              Atendimento:
            </h3>
            <p className="text-sm text-muted-foreground">
              Segundas às sexta-feiras das 08:00h às 17:00h
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-heading font-bold text-foreground mb-3">
              Links:
            </h3>
            <nav className="flex flex-col gap-2">
              <Link 
                to="/termos-uso" 
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Termos de uso
              </Link>
              <Link 
                to="/politica-privacidade" 
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Política de Privacidade
              </Link>
            </nav>
          </div>
        </div>

        {/* Logo e Copyright */}
        <div className="border-t border-border/50 pt-6">
          <div className="flex flex-col items-center gap-3">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary shadow-md">
                <FileText className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-heading text-xl font-bold text-primary">
                Portal Certidão
              </span>
            </Link>
            
            {/* Copyright */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Copyright © {currentYear} Portal Certidão
              </p>
              <p className="text-sm text-muted-foreground">
                54.673.333/0001-00
              </p>
              <p className="text-sm text-muted-foreground">
                Todos os direitos reservados.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
