import { Shield } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-12 bg-foreground text-background/80">
      <div className="container">
        <div className="max-w-4xl mx-auto">
          {/* Logo and name */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <Shield className="w-6 h-6 text-background" />
            <span className="text-lg font-semibold text-background">
              Suporte Online
            </span>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 mb-8 text-sm">
            <Link to="/termos" className="hover:text-background transition-colors">
              Termos de Uso
            </Link>
            <span className="text-background/30">•</span>
            <Link to="/privacidade" className="hover:text-background transition-colors">
              Política de Privacidade
            </Link>
          </div>

          {/* Private service notice */}
          <div className="text-center text-sm mb-8 p-4 bg-background/5 rounded-lg max-w-xl mx-auto">
            <p>
              <strong className="text-background">Este é um serviço privado de assistência.</strong>
            </p>
            <p className="mt-1 text-background/60">
              Não somos um órgão governamental ou entidade pública.
            </p>
          </div>

          {/* Copyright */}
          <div className="text-center text-sm text-background/50">
            <p>© {currentYear} Suporte Online. Todos os direitos reservados.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
