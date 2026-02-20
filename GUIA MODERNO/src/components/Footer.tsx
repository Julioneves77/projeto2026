import { Bot, Terminal } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-border/60 bg-card/50 relative">
      <div className="absolute inset-0 cyber-grid opacity-10 pointer-events-none" />

      <div className="container mx-auto px-6 py-12 relative">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center glow-blue">
                <Bot className="w-5 h-5 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="font-orbitron font-bold text-foreground text-sm tracking-widest">
                  GUIA<span className="text-primary"> CENTRAL</span>
                </span>
              </div>
            </div>
            <p className="text-muted-foreground text-xs font-mono leading-relaxed">
              Plataforma privada de automação com inteligência artificial para processamento de documentos.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-orbitron text-[10px] text-primary tracking-[0.15em] mb-4">NAVEGAÇÃO</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-muted-foreground text-sm hover:text-primary transition-colors flex items-center gap-2">
                  <Terminal className="w-3 h-3" />
                  Início
                </Link>
              </li>
              <li>
                <Link to="/contato" className="text-muted-foreground text-sm hover:text-primary transition-colors flex items-center gap-2">
                  <Terminal className="w-3 h-3" />
                  Fale Conosco
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-orbitron text-[10px] text-primary tracking-[0.15em] mb-4">LEGAL</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/politica-privacidade" className="text-muted-foreground text-sm hover:text-primary transition-colors flex items-center gap-2">
                  <Terminal className="w-3 h-3" />
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <Link to="/termos-de-uso" className="text-muted-foreground text-sm hover:text-primary transition-colors flex items-center gap-2">
                  <Terminal className="w-3 h-3" />
                  Termos de Uso
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/50 pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-muted-foreground/60 text-xs font-mono">
              © {new Date().getFullYear()} GUIA CENTRAL — Plataforma privada • Automação com IA
            </p>
            <p className="text-muted-foreground/40 text-[10px] font-mono text-center">
              Este site não é um órgão público. Somos uma empresa de tecnologia.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
