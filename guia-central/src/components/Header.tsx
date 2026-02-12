import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";

const services = [
  { name: "Certidão de Quitação Eleitoral", slug: "quitacao-eleitoral" },
  { name: "Antecedentes Criminais", slug: "antecedentes-criminais" },
  { name: "Certidão Negativa de Débitos (CND)", slug: "cnd" },
  { name: "Certidão de Débito Trabalhista", slug: "debito-trabalhista" },
  { name: "Certidão Negativa Criminal", slug: "negativa-criminal" },
  { name: "Certidão Negativa Cível", slug: "negativa-civel" },
  { name: "Certidão de CPF Regular", slug: "cpf-regular" },
  { name: "CCIR - Cadastro de Imóvel Rural", slug: "ccir" },
];

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
      <div className="container mx-auto flex items-center justify-between py-3 px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg gradient-hero flex items-center justify-center">
            <span className="text-primary-foreground font-heading font-bold text-lg">G</span>
          </div>
          <div className="leading-tight">
            <span className="font-heading font-bold text-foreground text-lg tracking-tight">GUIA CENTRAL</span>
            <span className="block text-xs text-muted-foreground font-medium -mt-0.5">Plataforma Online</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          <div className="relative" onMouseEnter={() => setServicesOpen(true)} onMouseLeave={() => setServicesOpen(false)}>
            <button className="text-sm font-medium text-foreground hover:text-primary transition-colors flex items-center gap-1">
              Serviços
              <svg className={`w-4 h-4 transition-transform ${servicesOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {servicesOpen && (
              <div className="absolute top-full left-0 mt-1 w-72 bg-card rounded-lg shadow-card-hover border border-border p-2 animate-scale-in">
                {services.map((s) => (
                  <Link key={s.slug} to={`/finalizar-pedido?type=${encodeURIComponent(s.name)}`} className="block px-3 py-2 text-sm rounded-md hover:bg-secondary transition-colors text-foreground">
                    {s.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <Link to="/fale-conosco" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            Fale Conosco
          </Link>
          <Link to="/minha-conta" className="px-5 py-2 rounded-lg gradient-hero text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity shadow-hero">
            Minha Conta
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button className="md:hidden text-foreground" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-border bg-card animate-slide-up">
          <div className="container mx-auto px-4 py-4 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Serviços</p>
            {services.map((s) => (
              <Link key={s.slug} to={`/finalizar-pedido?type=${encodeURIComponent(s.name)}`} className="block px-3 py-2 text-sm rounded-md hover:bg-secondary transition-colors text-foreground" onClick={() => setMenuOpen(false)}>
                {s.name}
              </Link>
            ))}
            <div className="border-t border-border pt-3 mt-3 flex flex-col gap-2">
              <Link to="/fale-conosco" className="text-sm font-medium text-foreground px-3 py-2" onClick={() => setMenuOpen(false)}>Fale Conosco</Link>
              <Link to="/minha-conta" className="px-5 py-2 rounded-lg gradient-hero text-primary-foreground text-sm font-semibold text-center" onClick={() => setMenuOpen(false)}>Minha Conta</Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
