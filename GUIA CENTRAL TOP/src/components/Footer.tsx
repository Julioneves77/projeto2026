import { Link } from "react-router-dom";
import HiddenDisclaimer from "./HiddenDisclaimer";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card py-10">
      <HiddenDisclaimer />
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center">
                <span className="text-primary-foreground font-heading font-bold">G</span>
              </div>
              <span className="font-heading font-bold text-foreground">GUIA CENTRAL</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Plataforma privada de tecnologia para processamento digital de documentos e certidões.
            </p>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-foreground mb-3 text-sm">Links Úteis</h4>
            <div className="space-y-2">
              <Link to="/politica-privacidade" className="block text-sm text-muted-foreground hover:text-primary transition-colors">Política de Privacidade</Link>
              <Link to="/termos-de-uso" className="block text-sm text-muted-foreground hover:text-primary transition-colors">Termos de Uso</Link>
              <Link to="/fale-conosco" className="block text-sm text-muted-foreground hover:text-primary transition-colors">Fale Conosco</Link>
            </div>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-foreground mb-3 text-sm">Aviso Legal</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Esta é uma plataforma privada e independente. NÃO possuímos vínculo com órgãos públicos. Os documentos são emitidos pelas fontes oficiais. Nosso serviço automatiza a solicitação.
            </p>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-6 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Guia Central — guia-central.online — Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
