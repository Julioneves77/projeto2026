import { FileText, ChevronDown, Vote, ShieldAlert, FileX, Briefcase, Scale, Landmark, UserCheck, MapPin, Menu, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";

const services = [
  { name: "Certidão de Quitação Eleitoral", icon: Vote },
  { name: "Antecedentes Criminais", icon: ShieldAlert },
  { name: "Certidão Criminal Federal", icon: Scale },
  { name: "Certidão Criminal Estadual", icon: Scale },
  { name: "Certidão Cível Federal", icon: Landmark },
  { name: "Certidão Cível Estadual", icon: Landmark },
  { name: "Certidão Negativa de Débitos (CND)", icon: FileX },
  { name: "Certidão de CPF Regular", icon: UserCheck },
  { name: "Certidão de Débito Trabalhista", icon: Briefcase },
  { name: "CCIR - Cadastro de Imóvel Rural", icon: MapPin },
];

const Header = () => {
  const [open, setOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
      if (mobileRef.current && !mobileRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
        setMobileServicesOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="border-b bg-card relative z-50">
      <div className="container flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <FileText className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="leading-tight hidden sm:block">
            <span className="block text-lg font-extrabold text-foreground tracking-tight">Guia das Certidões</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <div className="relative" ref={ref}>
            <button
              onClick={() => setOpen(!open)}
              className={`flex items-center gap-1 text-sm font-medium transition-colors px-3 py-1.5 rounded-md border ${
                open ? "border-primary text-primary bg-primary/5" : "border-transparent text-foreground hover:text-primary"
              }`}
            >
              Serviços <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>

            {open && (
              <div className="absolute right-0 top-full mt-2 w-[480px] bg-card border rounded-xl shadow-lg p-5 z-50">
                <h3 className="font-bold text-foreground mb-1">Serviços Disponíveis</h3>
                <p className="text-xs text-muted-foreground mb-4">Escolha o serviço que você precisa</p>
                <div className="grid grid-cols-2 gap-3">
                  {services.map((s) => (
                    <button
                      key={s.name}
                      onClick={() => {
                        setOpen(false);
                        navigate("/solicitar", { state: { service: s.name } });
                      }}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                    >
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <s.icon className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-foreground">{s.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Link to="/fale-conosco" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            Fale Conosco
          </Link>
          <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
            Minha Conta
          </Button>
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-foreground hover:text-primary transition-colors"
          aria-label="Menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-card" ref={mobileRef}>
          <div className="container py-4 space-y-3">
            {/* Serviços Dropdown Mobile */}
            <div>
              <button
                onClick={() => setMobileServicesOpen(!mobileServicesOpen)}
                className="w-full flex items-center justify-between text-sm font-medium text-foreground hover:text-primary transition-colors py-2"
              >
                <span>Serviços</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${mobileServicesOpen ? "rotate-180" : ""}`} />
              </button>
              {mobileServicesOpen && (
                <div className="mt-2 space-y-2 pl-4">
                  {services.map((s) => (
                    <button
                      key={s.name}
                      onClick={() => {
                        setMobileServicesOpen(false);
                        setMobileMenuOpen(false);
                        navigate("/solicitar", { state: { service: s.name } });
                      }}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <s.icon className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-foreground">{s.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fale Conosco Mobile */}
            <Link
              to="/fale-conosco"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-foreground hover:text-primary transition-colors py-2"
            >
              Fale Conosco
            </Link>

            {/* Minha Conta Mobile */}
            <Button
              size="sm"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
            >
              Minha Conta
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
