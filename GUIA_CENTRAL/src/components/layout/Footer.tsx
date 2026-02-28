import { FileCheck } from "lucide-react";
import { Link } from "react-router-dom";
import HiddenDisclaimer from "@/components/HiddenDisclaimer";

const Footer = () => {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <HiddenDisclaimer />
      <div className="container mx-auto px-6 py-12">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileCheck className="w-5 h-5 text-primary" />
              </div>
              <span className="font-semibold text-foreground">
                Guia <span className="text-primary">Central</span>
              </span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Plataforma privada de automação com inteligência artificial para processamento de documentos.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-foreground text-sm mb-4">Navegação</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" onClick={() => window.scrollTo({ top: 0, left: 0, behavior: "smooth" })} className="text-muted-foreground text-sm hover:text-primary transition-colors">
                  Início
                </Link>
              </li>
              <li>
                <Link to="/sobre" className="text-muted-foreground text-sm hover:text-primary transition-colors">Sobre</Link>
              </li>
              <li>
                <Link to="/contato" className="text-muted-foreground text-sm hover:text-primary transition-colors">Fale Conosco</Link>
              </li>
              <li>
                <button type="button" onClick={() => window.dispatchEvent(new CustomEvent("open-cookie-preferences"))} className="text-muted-foreground text-sm hover:text-primary transition-colors text-left">
                  Preferências de Cookies
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground text-sm mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/politica-privacidade" className="text-muted-foreground text-sm hover:text-primary transition-colors">Política de Privacidade</Link>
              </li>
              <li>
                <Link to="/termos-uso" className="text-muted-foreground text-sm hover:text-primary transition-colors">Termos de Uso</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-6">
          <p className="text-muted-foreground text-xs leading-relaxed mb-4 text-center max-w-3xl mx-auto">
            AVISO IMPORTANTE: Este site é uma plataforma privada de tecnologia e não possui vínculo com órgãos governamentais. O valor cobrado refere-se exclusivamente à prestação de serviços de intermediação, processamento e tecnologia para facilitar seu acesso a documentos públicos.
          </p>
          <p className="text-muted-foreground/80 text-xs text-center">
            © {new Date().getFullYear()} Guia Central — Plataforma privada • Automação com IA
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
