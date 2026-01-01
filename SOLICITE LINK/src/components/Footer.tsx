import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-card/50 border-t border-border mt-auto backdrop-blur-sm">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <p className="text-lg font-semibold text-gradient mb-3">Solicite Link</p>
            <p className="text-sm text-muted-foreground">
              Plataforma simples e direta de direcionamento.
            </p>
          </div>

          {/* A Empresa */}
          <div>
            <h3 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wider">A Empresa</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/como-funciona" className="footer-link text-sm">
                  Como funciona
                </Link>
              </li>
              <li>
                <Link to="/privacidade" className="footer-link text-sm">
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <Link to="/termos" className="footer-link text-sm">
                  Termos de Uso
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wider">Links</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/faq" className="footer-link text-sm">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/depoimentos" className="footer-link text-sm">
                  Depoimentos
                </Link>
              </li>
              <li>
                <Link to="/contato" className="footer-link text-sm">
                  Contato
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Solicite Link. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
