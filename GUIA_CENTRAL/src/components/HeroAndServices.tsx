import { Search, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import HiddenDisclaimer from "./HiddenDisclaimer";
import HiddenCertidaoInfo from "./HiddenCertidaoInfo";

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

const HeroAndServices = () => {
  const [search, setSearch] = useState("");
  const filtered = certificates.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <section className="relative">
      <HiddenDisclaimer />
      {/* Top banner */}
      <div className="gradient-hero py-3 text-center">
        <p className="text-primary-foreground/90 text-sm font-medium">
          Plataforma privada • Automação com IA
        </p>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12 max-w-2xl">
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <input
              type="text"
              placeholder="Qual certidão você precisa?"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-xl border border-border bg-card text-foreground shadow-card focus:outline-none focus:ring-2 focus:ring-ring text-base placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Service list */}
        <div className="space-y-3">
          {filtered.map((cert, index) => (
            <div key={index}>
              <HiddenCertidaoInfo certidaoName={cert.title} />
              <Link
                to={getLink(cert)}
                className="group flex items-center justify-between bg-card border border-border rounded-xl px-6 py-5 hover:shadow-card-hover hover:border-primary/30 transition-all duration-200"
              >
                <h3 className="font-heading font-semibold text-foreground text-base group-hover:text-primary transition-colors">
                  {cert.title}
                </h3>
                <ChevronRight className="text-muted-foreground group-hover:text-primary transition-colors shrink-0" size={20} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroAndServices;
