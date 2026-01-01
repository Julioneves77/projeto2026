import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronRight } from "lucide-react";

const linkOptions = [
  { id: "criminal-federal", label: "Criminal Federal", url: "https://portal.stf.jus.br/" },
  { id: "quitacao-eleitoral", label: "Quitação Eleitoral", url: "https://www.tse.jus.br/" },
  { id: "antecedencia-pf", label: "Antecedência Criminal – PF", url: "https://www.pf.gov.br/" },
  { id: "criminal-estadual", label: "Criminal Estadual", url: "https://www.tjsp.jus.br/" },
  { id: "civel-federal", label: "Cível Federal", url: "https://www.cjf.jus.br/" },
  { id: "civel-estadual", label: "Cível Estadual", url: "https://www.tjsp.jus.br/" },
  { id: "cnd", label: "CND", url: "https://solucoes.receita.fazenda.gov.br/" },
  { id: "cpf-regular", label: "CPF Regular", url: "https://servicos.receita.fazenda.gov.br/" },
];

const LinkSelector = () => {
  const [selectedLink, setSelectedLink] = useState<string>("");

  const selectedOption = linkOptions.find((opt) => opt.id === selectedLink);

  const handleAccessClick = () => {
    if (selectedOption) {
      window.open(selectedOption.url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="card-main max-w-md w-full mx-auto animate-fade-in-up">
      <div className="text-center mb-6">
        <span className="badge">Selecione abaixo</span>
        <h2 className="text-xl font-semibold text-foreground mt-1">
          Escolha seu link
        </h2>
      </div>

      <Select value={selectedLink} onValueChange={setSelectedLink}>
        <SelectTrigger className="w-full h-14 text-base bg-background border-border hover:border-primary/50 transition-colors">
          <SelectValue placeholder="Selecione uma opção na lista" />
        </SelectTrigger>
        <SelectContent className="bg-popover border-border z-50">
          {linkOptions.map((option) => (
            <SelectItem
              key={option.id}
              value={option.id}
              className="text-base py-3 cursor-pointer focus:bg-secondary"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedLink && (
        <button
          onClick={handleAccessClick}
          className="btn-action mt-6 animate-scale-in flex items-center justify-center gap-2"
        >
          Acessar a página de solicitação
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default LinkSelector;
