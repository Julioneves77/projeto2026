import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-muted/30 mt-auto">
      <div className="container py-8">
        <div className="flex flex-col items-center gap-4">
          {/* Links */}
          <nav className="flex flex-wrap items-center justify-center gap-6">
            <Link 
              to="/politica-privacidade" 
              className="text-sm text-primary hover:text-primary/80 transition-colors font-medium"
            >
              Política de Privacidade
            </Link>
            <Link 
              to="/termos-uso" 
              className="text-sm text-primary hover:text-primary/80 transition-colors font-medium"
            >
              Termos de Uso
            </Link>
            <Link 
              to="/contato" 
              className="text-sm text-primary hover:text-primary/80 transition-colors font-medium"
            >
              Contato
            </Link>
          </nav>

          {/* Copyright */}
          <p className="text-sm text-muted-foreground text-center">
            Copyright © {currentYear} Portal Certidão - Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
