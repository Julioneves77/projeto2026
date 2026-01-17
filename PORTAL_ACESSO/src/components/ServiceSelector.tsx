import { useState, useImperativeHandle, forwardRef } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowRight } from 'lucide-react';
import { services } from '@/lib/services';
import { Service } from '@/types';
import { pushDL } from '@/lib/dataLayer';

export interface ServiceSelectorRef {
  openSelect: () => void;
}

interface ServiceSelectorProps {
  onServiceSelect: (service: Service) => void;
}

export const ServiceSelector = forwardRef<ServiceSelectorRef, ServiceSelectorProps>(
  ({ onServiceSelect }, ref) => {
    const [selectedServiceId, setSelectedServiceId] = useState<string>('');
    const [open, setOpen] = useState(false);

    const selectedService = services.find((s) => s.id === selectedServiceId);

    useImperativeHandle(ref, () => ({
      openSelect: () => {
        const trigger = document.getElementById('service-select-trigger');
        if (trigger) {
          trigger.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => {
            setOpen(true);
          }, 300);
        } else {
          setOpen(true);
        }
      },
    }));

    const handleSelectChange = (value: string) => {
      setSelectedServiceId(value);
      
      // Disparar evento GTM quando serviço é selecionado
      const selectedService = services.find((s) => s.id === value);
      if (selectedService) {
        pushDL('portalcacesso_option_selected', {
          funnel_step: 'service_selected',
          source: 'portalcacesso',
          serviceId: selectedService.id,
          serviceName: selectedService.title,
        });
      }
    };

    const handleAccessClick = () => {
      if (selectedService) {
        // Disparar evento GTM quando botão "Acessar" é clicado
        pushDL('portalcacesso_access_clicked', {
          funnel_step: 'access_clicked',
          source: 'portalcacesso',
          serviceId: selectedService.id,
          serviceName: selectedService.title,
          portalPath: selectedService.portalPath,
        });
        
        onServiceSelect(selectedService);
      }
    };

  return (
    <div className="selector-container animate-slide-up">
      <div className="text-center mb-8">
        <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2">
          Selecione o Serviço Digital
        </h2>
        <p className="text-sm text-muted-foreground">
          Escolha o serviço que você precisa acessar
        </p>
      </div>

      <Select value={selectedServiceId} onValueChange={handleSelectChange} open={open} onOpenChange={setOpen}>
        <SelectTrigger id="service-select-trigger" className="selector-trigger">
          <SelectValue placeholder="Clique para ver os serviços disponíveis" />
        </SelectTrigger>
        <SelectContent>
          {services.map((service) => (
            <SelectItem key={service.id} value={service.id}>
              {service.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedServiceId && selectedService && (
        <button
          onClick={handleAccessClick}
          className="btn-access btn-blink mt-6 animate-scale-in flex items-center justify-center gap-2"
        >
          Acessar {selectedService.title}
          <ArrowRight className="w-5 h-5" />
        </button>
      )}
    </div>
  );
});

ServiceSelector.displayName = 'ServiceSelector';

