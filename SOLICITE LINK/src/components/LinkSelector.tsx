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
    <div className="max-w-lg w-full mx-auto animate-fade-in-up p-10 rounded-3xl border-2 border-primary/20" style={{
      background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,245,255,0.9) 100%)',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255,255,255,0.5) inset'
    }}>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-3">
          Selecione a Opção
        </h2>
        <p className="text-gray-500">Escolha o tipo de certidão desejada</p>
      </div>

      <Select value={selectedLink} onValueChange={setSelectedLink}>
        <SelectTrigger className="w-full h-16 text-lg font-medium bg-white border-2 border-primary/30 hover:border-primary shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl focus:ring-4 focus:ring-primary/20">
          <SelectValue placeholder="Selecione uma opção na lista" />
        </SelectTrigger>
        <SelectContent className="bg-white border-2 border-primary/20 shadow-2xl rounded-xl z-50 max-h-80">
          {linkOptions.map((option) => (
            <SelectItem
              key={option.id}
              value={option.id}
              className="text-base py-4 cursor-pointer hover:bg-primary/10 focus:bg-primary/10 transition-colors font-medium"
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
