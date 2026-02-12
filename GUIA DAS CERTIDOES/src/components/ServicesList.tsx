import { Search, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const services = [
  "Certidão de Quitação Eleitoral",
  "Antecedentes Criminais",
  "Certidão Criminal Federal",
  "Certidão Criminal Estadual",
  "Certidão Cível Federal",
  "Certidão Cível Estadual",
  "Certidão Negativa de Débitos (CND)",
  "Certidão de CPF Regular",
  "Certidão de Débito Trabalhista",
  "CCIR - Cadastro de Imóvel Rural",
];

const ServicesList = () => {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const filtered = services.filter((s) =>
    s.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <section className="container py-10">
      <div className="max-w-2xl mx-auto">
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Qual certidão você precisa?"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-lg border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
          />
        </div>

        <div className="space-y-2">
          {filtered.map((service) => (
            <button
              key={service}
              onClick={() => navigate("/solicitar", { state: { service } })}
              className="w-full flex items-center justify-between px-5 py-4 rounded-lg border bg-card hover:border-primary/40 hover:shadow-sm transition-all text-left group"
            >
              <span className="text-sm font-medium text-foreground">{service}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesList;
