import { useState } from "react";
import { Menu, X, FileCheck, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import HiddenDisclaimer from "@/components/HiddenDisclaimer";

const certificates = [
  { id: "federais", type: "criminal" as const, title: "Certidão Negativa Criminal Federal" },
  { id: "estaduais", type: null, title: "Certidão Negativa Criminal Estadual" },
  { id: "policia-federal", type: null, title: "Antecedentes Criminais de Polícia Federal" },
  { id: "federais", type: "eleitoral" as const, title: "Certidão de Quitação Eleitoral" },
  { id: "federais", type: "civel" as const, title: "Certidão Negativa Cível Federal" },
  { id: "estaduais", type: "civel" as const, title: "Certidão Negativa Cível Estadual" },
  { id: "cnd", type: null, title: "Certidão Negativa de Débitos (CND)" },
  { id: "cpf-regular", type: null, title: "Certidão CPF Regular" },
];

const getLink = (cert: (typeof certificates)[0]) => {
  if (cert.type) return `/certidao/${cert.id}?type=${cert.type}`;
  return `/certidao/${cert.id}`;
};

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);

  return (
    <>
      <header className="border-b border-slate-200 bg-white sticky top-0 z-50 shadow-sm">
        <HiddenDisclaimer />
        <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-foreground text-base">
                Guia <span className="text-primary">Central</span>
              </span>
              <span className="text-xs text-muted-foreground">
                Certidões e Documentos
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <div className="relative" onMouseEnter={() => setServicesOpen(true)} onMouseLeave={() => setServicesOpen(false)}>
              <button className="text-sm font-medium text-foreground hover:text-primary transition-colors flex items-center gap-1">
                Serviços
                <svg className={`w-4 h-4 transition-transform ${servicesOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {servicesOpen && (
                <div className="absolute top-full left-0 mt-1 w-72 bg-white rounded-xl shadow-md border border-slate-200 p-2 animate-scale-in z-50">
                  {certificates.map((cert, idx) => (
                    <Link
                      key={idx}
                      to={getLink(cert)}
                      className="block px-3 py-2 text-sm rounded-lg hover:bg-slate-50 transition-colors text-foreground"
                      onClick={() => setServicesOpen(false)}
                    >
                      {cert.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <Link
              to="/contato"
              className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
            >
              <Phone className="w-4 h-4" />
              Fale Conosco
            </Link>
          </nav>

          <button className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center text-foreground -mr-2" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white animate-slide-up">
            <div className="container mx-auto px-4 py-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Serviços</p>
              {certificates.map((cert, idx) => (
                <Link
                  key={idx}
                  to={getLink(cert)}
                  className="block px-3 py-2 text-sm rounded-lg hover:bg-slate-50 transition-colors text-foreground"
                  onClick={() => setMenuOpen(false)}
                >
                  {cert.title}
                </Link>
              ))}
              <div className="border-t border-slate-200 pt-3 mt-3 flex flex-col gap-2">
                <Link to="/contato" className="text-sm text-foreground px-3 py-2 flex items-center gap-2 hover:bg-slate-50 rounded-lg" onClick={() => setMenuOpen(false)}>
                  <Phone className="w-4 h-4" />
                  Fale Conosco
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      <div className="bg-primary py-3 text-center">
        <span className="text-xs text-primary-foreground font-medium tracking-wide">
          Plataforma privada • Automação com IA • Processamento digital
        </span>
      </div>
    </>
  );
};

export default Header;
