/**
 * Tipos para sistema de monitoramento configurável
 */

export type ServiceCategory = 'domain' | 'email' | 'whatsapp' | 'other';

export type ServiceStatus = 'online' | 'offline' | 'warning' | 'checking';

export interface MonitoredService {
  id: string;
  name: string;
  description: string;
  url?: string; // Para domínios (ex: https://www.portalcertidao.org)
  endpoint?: string; // Para APIs (ex: /api/health)
  category: ServiceCategory;
  icon: string; // Nome do ícone do lucide-react (ex: 'Globe', 'Mail', 'MessageSquare')
  enabled: boolean;
  checkInterval?: number; // ms (opcional, padrão: 5 minutos)
  createdAt?: string; // ISO string
  updatedAt?: string; // ISO string
}

export interface ServiceStatusResult {
  service: MonitoredService;
  status: ServiceStatus;
  lastCheck: Date;
  responseTime?: number; // ms
  error?: string;
}

