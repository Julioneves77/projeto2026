/**
 * Componente para gerenciar serviços monitorados
 * Permite adicionar, editar e remover serviços
 */

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Globe,
  Mail,
  MessageSquare,
  Settings,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  MonitoredService,
  ServiceCategory,
} from '@/types/monitoring';
import {
  loadServices,
  saveServices,
  addService,
  updateService,
  removeService,
} from '@/lib/monitoredServices';

const iconMap: Record<string, React.ElementType> = {
  Globe,
  Mail,
  MessageSquare,
  Settings,
};

interface ServiceManagerProps {
  onServicesChange?: () => void;
}

export function ServiceManager({ onServicesChange }: ServiceManagerProps) {
  const [services, setServices] = useState<MonitoredService[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingService, setEditingService] = useState<MonitoredService | null>(null);
  const [formData, setFormData] = useState<Partial<MonitoredService>>({
    name: '',
    description: '',
    url: '',
    endpoint: '',
    category: 'domain',
    icon: 'Globe',
    enabled: true,
  });

  useEffect(() => {
    if (isOpen) {
      loadServicesList();
    }
  }, [isOpen]);

  const loadServicesList = () => {
    const loaded = loadServices();
    setServices(loaded);
  };

  const handleAdd = () => {
    setEditingService(null);
    setFormData({
      name: '',
      description: '',
      url: '',
      endpoint: '',
      category: 'domain',
      icon: 'Globe',
      enabled: true,
    });
  };

  const handleEdit = (service: MonitoredService) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description,
      url: service.url || '',
      endpoint: service.endpoint || '',
      category: service.category,
      icon: service.icon,
      enabled: service.enabled,
    });
  };

  const handleSave = () => {
    if (!formData.name || !formData.description) {
      alert('Nome e descrição são obrigatórios');
      return;
    }

    if (formData.category === 'domain' && !formData.url) {
      alert('URL é obrigatória para domínios');
      return;
    }

    if ((formData.category === 'email' || formData.category === 'whatsapp') && !formData.endpoint) {
      alert('Endpoint é obrigatório para serviços de email/WhatsApp');
      return;
    }

    if (editingService) {
      updateService(editingService.id, formData as Partial<MonitoredService>);
    } else {
      addService(formData as Omit<MonitoredService, 'id' | 'createdAt' | 'updatedAt'>);
    }

    loadServicesList();
    setEditingService(null);
    setFormData({
      name: '',
      description: '',
      url: '',
      endpoint: '',
      category: 'domain',
      icon: 'Globe',
      enabled: true,
    });
    onServicesChange?.();
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja remover este serviço?')) {
      removeService(id);
      loadServicesList();
      onServicesChange?.();
    }
  };

  const handleToggleEnabled = (id: string, enabled: boolean) => {
    updateService(id, { enabled });
    loadServicesList();
    onServicesChange?.();
  };

  const getIconComponent = (iconName: string) => {
    const Icon = iconMap[iconName] || Globe;
    return <Icon className="w-4 h-4" />;
  };

  const getCategoryLabel = (category: ServiceCategory) => {
    const labels: Record<ServiceCategory, string> = {
      domain: 'Domínio',
      email: 'Email',
      whatsapp: 'WhatsApp',
      other: 'Outro',
    };
    return labels[category];
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Settings className="w-4 h-4" />
          Gerenciar Serviços
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Serviços Monitorados</DialogTitle>
          <DialogDescription>
            Adicione, edite ou remova serviços para monitoramento de status
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Formulário de Adicionar/Editar */}
          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">
                {editingService ? 'Editar Serviço' : 'Adicionar Novo Serviço'}
              </h3>
              {editingService && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingService(null);
                    setFormData({
                      name: '',
                      description: '',
                      url: '',
                      endpoint: '',
                      category: 'domain',
                      icon: 'Globe',
                      enabled: true,
                    });
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: PortalCertidao.org"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value as ServiceCategory })
                  }
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="domain">Domínio</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição *</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ex: Portal principal de solicitação de certidões"
              />
            </div>

            {formData.category === 'domain' && (
              <div className="space-y-2">
                <Label htmlFor="url">URL *</Label>
                <Input
                  id="url"
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://www.exemplo.com"
                />
              </div>
            )}

            {(formData.category === 'email' || formData.category === 'whatsapp' || formData.category === 'other') && (
              <div className="space-y-2">
                <Label htmlFor="endpoint">Endpoint *</Label>
                <Input
                  id="endpoint"
                  value={formData.endpoint}
                  onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
                  placeholder="/api/health ou /system/email/health"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="icon">Ícone</Label>
                <Select
                  value={formData.icon}
                  onValueChange={(value) => setFormData({ ...formData, icon: value })}
                >
                  <SelectTrigger id="icon">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Globe">Globe (Domínio)</SelectItem>
                    <SelectItem value="Mail">Mail (Email)</SelectItem>
                    <SelectItem value="MessageSquare">MessageSquare (WhatsApp)</SelectItem>
                    <SelectItem value="Settings">Settings (Outro)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 pt-8">
                <Switch
                  id="enabled"
                  checked={formData.enabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
                />
                <Label htmlFor="enabled" className="cursor-pointer">
                  Habilitado
                </Label>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button onClick={handleSave} className="gap-2">
                <Save className="w-4 h-4" />
                {editingService ? 'Salvar Alterações' : 'Adicionar Serviço'}
              </Button>
            </div>
          </div>

          {/* Lista de Serviços */}
          <div className="space-y-2">
            <h3 className="font-semibold">Serviços Configurados ({services.length})</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {services.map((service) => {
                const Icon = iconMap[service.icon] || Globe;
                return (
                  <div
                    key={service.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <Icon className="w-5 h-5 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{service.name}</p>
                          <Badge variant="secondary" className="text-xs">
                            {getCategoryLabel(service.category)}
                          </Badge>
                          {!service.enabled && (
                            <Badge variant="outline" className="text-xs">
                              Desabilitado
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {service.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {service.url || service.endpoint}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={service.enabled}
                        onCheckedChange={(checked) =>
                          handleToggleEnabled(service.id, checked)
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(service)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(service.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

