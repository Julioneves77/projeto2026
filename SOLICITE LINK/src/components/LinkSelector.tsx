import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronRight } from "lucide-react";
import { pushDL } from "@/lib/dataLayer";


// URL do Portal - todos os serviços vão para a home
const PORTAL_HOME = 'https://www.portalcertidao.org';

// Mapeamento de serviços do SOLICITE LINK
const linkOptions = [
  { 
    id: "criminal-federal", 
    label: "Certidão Criminal Federal", 
    portalPath: ""
  },
  { 
    id: "quitacao-eleitoral", 
    label: "Certidão Quitação Eleitoral", 
    portalPath: ""
  },
  { 
    id: "antecedencia-pf", 
    label: "Certidão Antecedência Criminal – PF", 
    portalPath: ""
  },
  { 
    id: "criminal-estadual", 
    label: "Certidão Criminal Estadual", 
    portalPath: ""
  },
  { 
    id: "civel-federal", 
    label: "Certidão Cível Federal", 
    portalPath: ""
  },
  { 
    id: "civel-estadual", 
    label: "Certidão Cível Estadual", 
    portalPath: ""
  },
  { 
    id: "cnd", 
    label: "Certidão CND", 
    portalPath: ""
  },
  { 
    id: "cpf-regular", 
    label: "Certidão CPF Regular", 
    portalPath: ""
  },
];

const LinkSelector = () => {
  const [selectedLink, setSelectedLink] = useState<string>("");

  const selectedOption = linkOptions.find((opt) => opt.id === selectedLink);

  const handleSelectChange = (value: string) => {
    setSelectedLink(value);
    const option = linkOptions.find((opt) => opt.id === value);
    if (option) {
      pushDL('links_option_selected', {
        option_id: option.id,
        option_label: option.label,
        funnel_step: 'option_selected'
      });
    }
  };

  const handleAccessClick = () => {
    if (selectedOption) {
      pushDL('links_access_clicked', {
        option_id: selectedOption.id,
        option_label: selectedOption.label,
        destination_hint: selectedOption.portalPath,
        funnel_step: 'access_clicked'
      });
      
      // Redirecionar para a home do PORTAL
      window.location.href = PORTAL_HOME;
    }
  };

  return (
    <div className="max-w-lg w-full mx-auto animate-fade-in-up p-10 rounded-3xl border-2 border-primary/20" style={{
      background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,245,255,0.9) 100%)',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255,255,255,0.5) inset'
    }}>
      <div className="text-center mb-6">
        <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800">
          Escolha o Tipo de Solicitação
        </h2>
      </div>

      <Select value={selectedLink} onValueChange={handleSelectChange}>
        <SelectTrigger className="w-full h-16 text-lg font-medium bg-white border-2 border-primary/30 hover:border-primary shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl focus:ring-4 focus:ring-primary/20">
          <SelectValue placeholder="Selecione qual Documento precisa pedir" />
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
