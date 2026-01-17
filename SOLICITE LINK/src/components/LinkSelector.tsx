import React, { useState, useImperativeHandle, forwardRef, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronRight } from "lucide-react";
import { pushDL } from "@/lib/dataLayer";
import { trackEvent, getFunnelId, addFunnelIdToUrl } from "@/lib/funnelTracker";

export interface LinkSelectorRef {
  openSelect: () => void;
}

// URL base do Portal
const PORTAL_BASE = 'https://www.portalcertidao.org';

// Mapeamento de serviços do SOLICITE LINK para formulários específicos do Portal
const linkOptions = [
  { 
    id: "criminal-federal", 
    label: "Certidão Criminal Federal", 
    portalPath: "/certidao/federais?type=criminal"
  },
  { 
    id: "quitacao-eleitoral", 
    label: "Certidão Quitação Eleitoral", 
    portalPath: "/certidao/federais?type=eleitoral"
  },
  { 
    id: "antecedencia-pf", 
    label: "Certidão Antecedência Criminal – PF", 
    portalPath: "/certidao/policia-federal"
  },
  { 
    id: "criminal-estadual", 
    label: "Certidão Criminal Estadual", 
    portalPath: "/certidao/estaduais"
  },
  { 
    id: "civel-federal", 
    label: "Certidão Cível Federal", 
    portalPath: "/certidao/federais?type=civel"
  },
  { 
    id: "civel-estadual", 
    label: "Certidão Cível Estadual", 
    portalPath: "/certidao/estaduais?type=civel"
  },
  { 
    id: "cnd", 
    label: "Certidão CND", 
    portalPath: "/certidao/cnd"
  },
  { 
    id: "cpf-regular", 
    label: "Certidão CPF Regular", 
    portalPath: "/certidao/cpf-regular"
  },
];

const LinkSelector = forwardRef<LinkSelectorRef>((props, ref) => {
  const [selectedLink, setSelectedLink] = useState<string>("");
  const [open, setOpen] = useState(false);

  const selectedOption = linkOptions.find((opt) => opt.id === selectedLink);

  // Evento: links_view - ao carregar componente
  useEffect(() => {
    trackEvent('links_view');
  }, []);

  // Expõe método para abrir o dropdown programaticamente
  useImperativeHandle(ref, () => ({
    openSelect: () => {
      // Scroll suave para o elemento selector
      const trigger = document.getElementById('certidao-select-trigger');
      if (trigger) {
        trigger.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Aguarda o scroll terminar e então abre
        setTimeout(() => {
          setOpen(true);
        }, 300);
      } else {
        // Se não encontrar, abre direto
        setOpen(true);
      }
    },
  }));

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
      // Evento: links_cta_click
      trackEvent('links_cta_click', {
        option_id: selectedOption.id,
        option_label: selectedOption.label
      });

      pushDL('links_access_clicked', {
        option_id: selectedOption.id,
        option_label: selectedOption.label,
        destination_hint: '/',
        funnel_step: 'access_clicked'
      });
      
      // Redirecionar para a home do Portal (com cards e preços)
      // Adicionar parâmetro source=solicite e funnel_id para rastreamento
      let portalUrl = `${PORTAL_BASE}/?source=solicite`;
      portalUrl = addFunnelIdToUrl(portalUrl);
      
      // Log para debug
      console.log('🔵 [Solicite Link] Redirecionando para:', portalUrl);
      
      window.location.href = portalUrl;
    } else {
      console.error('❌ [Solicite Link] selectedOption não encontrado');
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

      <Select value={selectedLink} onValueChange={handleSelectChange} open={open} onOpenChange={setOpen}>
        <SelectTrigger 
          id="certidao-select-trigger"
          className="w-full h-16 text-lg font-medium bg-white border-2 border-primary/30 hover:border-primary shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl focus:ring-4 focus:ring-primary/20">
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
          className="btn-action btn-blink mt-6 animate-scale-in flex flex-col items-center justify-center gap-1"
        >
          <span className="font-semibold">{selectedOption?.label}</span>
          <span className="flex items-center gap-1 text-sm">
            Continuar com suporte e entrega digital
            <ChevronRight className="w-4 h-4" />
          </span>
        </button>
      )}
    </div>
  );
});

LinkSelector.displayName = "LinkSelector";

export default LinkSelector;
