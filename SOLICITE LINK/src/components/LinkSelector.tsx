import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronRight } from "lucide-react";

// URL do PORTAL - configurável via variável de ambiente
const PORTAL_URL = import.meta.env.VITE_PORTAL_URL || 'http://localhost:8083';

// Mapeamento de serviços do SOLICITE LINK para tipos do PORTAL
const linkOptions = [
  { 
    id: "criminal-federal", 
    label: "Criminal Federal", 
    portalPath: "/certidao/federais?type=criminal"
  },
  { 
    id: "quitacao-eleitoral", 
    label: "Quitação Eleitoral", 
    portalPath: "/certidao/federais?type=eleitoral"
  },
  { 
    id: "antecedencia-pf", 
    label: "Antecedência Criminal – PF", 
    portalPath: "/certidao/policia-federal"
  },
  { 
    id: "criminal-estadual", 
    label: "Criminal Estadual", 
    portalPath: "/certidao/estaduais"
  },
  { 
    id: "civel-federal", 
    label: "Cível Federal", 
    portalPath: "/certidao/federais?type=civel"
  },
  { 
    id: "civel-estadual", 
    label: "Cível Estadual", 
    portalPath: "/certidao/estaduais?type=civel"
  },
  { 
    id: "cnd", 
    label: "CND", 
    portalPath: "/certidao/cnd"
  },
  { 
    id: "cpf-regular", 
    label: "CPF Regular", 
    portalPath: "/certidao/cpf-regular"
  },
];

const LinkSelector = () => {
  const [selectedLink, setSelectedLink] = useState<string>("");

  const selectedOption = linkOptions.find((opt) => opt.id === selectedLink);

  const handleAccessClick = () => {
    if (selectedOption) {
      // Redirecionar para PORTAL com o caminho correto
      const portalFullUrl = `${PORTAL_URL}${selectedOption.portalPath}`;
      window.location.href = portalFullUrl;
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
