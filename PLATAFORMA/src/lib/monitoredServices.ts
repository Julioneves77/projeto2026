/**
 * Biblioteca para gerenciar serviços monitorados
 * Persiste configuração em localStorage com fallback para serviços padrão
 */

import { MonitoredService, ServiceStatus, ServiceStatusResult } from '@/types/monitoring';

const STORAGE_KEY = 'av_monitored_services';
const DEFAULT_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutos

// Serviços padrão (fallback se não houver configuração)
const DEFAULT_SERVICES: MonitoredService[] = [
  {
    id: 'portal-certidao',
    name: 'PortalCertidao.org',
    description: 'Portal principal de solicitação de certidões',
    url: 'https://www.portalcertidao.org',
    category: 'domain',
    icon: 'Globe',
    enabled: true,
    checkInterval: DEFAULT_CHECK_INTERVAL,
  },
  {
    id: 'solicite-link',
    name: 'Solicite.link',
    description: 'Domínio de links curtos e redirecionamento',
    url: 'https://www.solicite.link',
    category: 'domain',
    icon: 'Globe',
    enabled: true,
    checkInterval: DEFAULT_CHECK_INTERVAL,
  },
  {
    id: 'portal-acesso',
    name: 'PortalAcesso.online',
    description: 'Portal de acesso e serviços digitais',
    url: 'https://www.portalcacesso.online',
    category: 'domain',
    icon: 'Globe',
    enabled: true,
    checkInterval: DEFAULT_CHECK_INTERVAL,
  },
  {
    id: 'suporte-online',
    name: 'Suporte Online',
    description: 'Portal de suporte online',
    url: 'https://www.suporteonline.digital',
    category: 'domain',
    icon: 'Globe',
    enabled: true,
    checkInterval: DEFAULT_CHECK_INTERVAL,
  },
  {
    id: 'sendpulse',
    name: 'SendPulse',
    description: 'Emails de confirmação de pagamento e certidões prontas',
    endpoint: '/system/email/health',
    category: 'email',
    icon: 'Mail',
    enabled: true,
    checkInterval: DEFAULT_CHECK_INTERVAL,
  },
  {
    id: 'zap-api',
    name: 'Zap API',
    description: 'WhatsApp de confirmação e notificações',
    endpoint: '/system/whatsapp/health',
    category: 'whatsapp',
    icon: 'MessageSquare',
    enabled: true,
    checkInterval: DEFAULT_CHECK_INTERVAL,
  },
];

/**
 * Carrega serviços do localStorage ou retorna serviços padrão
 */
export function loadServices(): MonitoredService[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      // Primeira vez: salvar serviços padrão
      saveServices(DEFAULT_SERVICES);
      return DEFAULT_SERVICES;
    }
    
    const services = JSON.parse(stored);
    if (!Array.isArray(services) || services.length === 0) {
      return DEFAULT_SERVICES;
    }
    
    // Migrar serviços antigos que não têm createdAt
    const migrated = services.map(service => ({
      ...service,
      createdAt: service.createdAt || new Date().toISOString(),
      updatedAt: service.updatedAt || new Date().toISOString(),
    }));
    
    return migrated;
  } catch (error) {
    console.error('Erro ao carregar serviços:', error);
    return DEFAULT_SERVICES;
  }
}

/**
 * Salva serviços no localStorage
 */
export function saveServices(services: MonitoredService[]): void {
  try {
    const toSave = services.map(service => ({
      ...service,
      updatedAt: new Date().toISOString(),
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (error) {
    console.error('Erro ao salvar serviços:', error);
  }
}

/**
 * Adiciona um novo serviço
 */
export function addService(service: Omit<MonitoredService, 'id' | 'createdAt' | 'updatedAt'>): MonitoredService {
  const services = loadServices();
  const newService: MonitoredService = {
    ...service,
    id: `service-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    checkInterval: service.checkInterval || DEFAULT_CHECK_INTERVAL,
  };
  
  services.push(newService);
  saveServices(services);
  return newService;
}

/**
 * Atualiza um serviço existente
 */
export function updateService(id: string, updates: Partial<MonitoredService>): MonitoredService | null {
  const services = loadServices();
  const index = services.findIndex(s => s.id === id);
  
  if (index === -1) {
    return null;
  }
  
  services[index] = {
    ...services[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  saveServices(services);
  return services[index];
}

/**
 * Remove um serviço
 */
export function removeService(id: string): boolean {
  const services = loadServices();
  const filtered = services.filter(s => s.id !== id);
  
  if (filtered.length === services.length) {
    return false; // Serviço não encontrado
  }
  
  saveServices(filtered);
  return true;
}

/**
 * Obtém um serviço por ID
 */
export function getService(id: string): MonitoredService | null {
  const services = loadServices();
  return services.find(s => s.id === id) || null;
}

/**
 * Obtém todos os serviços habilitados
 */
export function getEnabledServices(): MonitoredService[] {
  return loadServices().filter(s => s.enabled);
}

/**
 * Reseta para serviços padrão
 */
export function resetToDefaults(): void {
  localStorage.removeItem(STORAGE_KEY);
  saveServices(DEFAULT_SERVICES);
}

/**
 * Verifica status de um domínio usando múltiplas estratégias
 */
export async function checkDomainStatus(url: string): Promise<{ status: ServiceStatus; responseTime?: number; error?: string }> {
  const startTime = Date.now();
  
  // Estratégia 1: Tentar com CORS primeiro (mais preciso)
  try {
    const controller1 = new AbortController();
    const timeoutId1 = setTimeout(() => controller1.abort(), 5000);
    
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      signal: controller1.signal,
      cache: 'no-cache',
    });
    
    clearTimeout(timeoutId1);
    const responseTime = Date.now() - startTime;
    
    if (response.ok || response.status < 500) {
      return {
        status: 'online',
        responseTime,
      };
    } else {
      return {
        status: response.status >= 500 ? 'offline' : 'warning',
        responseTime,
        error: `HTTP ${response.status}`,
      };
    }
  } catch (error: any) {
    // Se for erro de CORS ou network, tentar estratégia 2 com no-cors
    if (error.name === 'AbortError') {
      const responseTime = Date.now() - startTime;
      return {
        status: 'offline',
        responseTime,
        error: 'Timeout - servidor não respondeu em 5 segundos',
      };
    }
    
    // Estratégia 2: Tentar com no-cors (não verifica CORS, mas detecta se servidor responde)
    if (error.message?.includes('CORS') || error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
      try {
        const controller2 = new AbortController();
        const timeoutId2 = setTimeout(() => controller2.abort(), 5000);
        
        // Com no-cors, não conseguimos ver o status HTTP, mas se não der erro, o servidor está respondendo
        await fetch(url, {
          method: 'HEAD', // HEAD é mais leve que GET
          mode: 'no-cors',
          signal: controller2.signal,
          cache: 'no-cache',
        });
        
        clearTimeout(timeoutId2);
        const responseTime = Date.now() - startTime;
        
        // Se chegou aqui sem erro, o servidor está respondendo (mesmo que não possamos ver o status)
        return {
          status: 'online',
          responseTime,
        };
      } catch (noCorsError: any) {
        const responseTime = Date.now() - startTime;
        
        if (noCorsError.name === 'AbortError') {
          return {
            status: 'offline',
            responseTime,
            error: 'Timeout - servidor não respondeu em 5 segundos',
          };
        }
        
        // Se mesmo com no-cors deu erro, provavelmente está offline
        return {
          status: 'offline',
          responseTime,
          error: 'Servidor não está respondendo',
        };
      }
    }
    
    // Outros erros
    const responseTime = Date.now() - startTime;
    return {
      status: 'offline',
      responseTime,
      error: error.message || 'Erro ao verificar domínio',
    };
  }
}

/**
 * Verifica status de uma API (GET request para endpoint)
 */
export async function checkApiStatus(endpoint: string, baseUrl?: string): Promise<{ status: ServiceStatus; responseTime?: number; error?: string }> {
  const SYNC_SERVER_URL = import.meta.env.VITE_SYNC_SERVER_URL || 'http://localhost:3001';
  const SYNC_SERVER_API_KEY = import.meta.env.VITE_SYNC_SERVER_API_KEY || null;
  
  const url = baseUrl ? `${baseUrl}${endpoint}` : `${SYNC_SERVER_URL}${endpoint}`;
  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (SYNC_SERVER_API_KEY) {
      headers['X-API-Key'] = SYNC_SERVER_API_KEY;
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      // Verificar se a resposta é um health check com status
      try {
        const contentType = response.headers.get('content-type');
        // Verificar se é JSON antes de tentar parsear
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          // Se for um health check endpoint, verificar o campo status
          if (data.status === 'ok') {
            return {
              status: 'online',
              responseTime,
            };
          } else if (data.status === 'not_configured') {
            return {
              status: 'warning',
              responseTime,
              error: data.message || 'Serviço não configurado',
            };
          } else if (data.status === 'error') {
            return {
              status: 'offline',
              responseTime,
              error: data.error || 'Erro no serviço',
            };
          }
        } else {
          // Se não for JSON, pode ser HTML de erro (endpoint não existe)
          const text = await response.text();
          if (text.includes('Cannot GET') || text.includes('404') || text.includes('Not Found')) {
            return {
              status: 'warning',
              responseTime,
              error: 'Endpoint não encontrado - verifique se o sync-server está atualizado',
            };
          }
        }
      } catch (parseError) {
        // Se não conseguir parsear, verificar se é erro conhecido
        console.warn('Erro ao parsear resposta do health check:', parseError);
      }
      
      // Se chegou aqui e response.ok é true, considerar como online
      return {
        status: 'online',
        responseTime,
      };
    } else {
      // Se response não é OK, verificar o status HTTP
      if (response.status === 404) {
        return {
          status: 'warning',
          responseTime,
          error: 'Endpoint não encontrado',
        };
      }
      return {
        status: response.status >= 500 ? 'offline' : 'warning',
        responseTime,
        error: `HTTP ${response.status}`,
      };
    }
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    
    if (error.name === 'AbortError') {
      return {
        status: 'offline',
        responseTime,
        error: 'Timeout - API não respondeu em 5 segundos',
      };
    }
    
    return {
      status: 'offline',
      responseTime,
      error: error.message || 'Erro ao verificar API',
    };
  }
}

/**
 * Verifica status de um serviço
 */
export async function checkServiceStatus(service: MonitoredService): Promise<ServiceStatusResult> {
  if (!service.enabled) {
    return {
      service,
      status: 'checking',
      lastCheck: new Date(),
    };
  }
  
  let result: { status: ServiceStatus; responseTime?: number; error?: string };
  
  if (service.url) {
    // Verificar domínio
    result = await checkDomainStatus(service.url);
  } else if (service.endpoint) {
    // Verificar API
    result = await checkApiStatus(service.endpoint);
  } else {
    // Sem URL nem endpoint, não pode verificar
    result = {
      status: 'warning',
      error: 'Serviço sem URL ou endpoint configurado',
    };
  }
  
  return {
    service,
    status: result.status,
    lastCheck: new Date(),
    responseTime: result.responseTime,
    error: result.error,
  };
}

/**
 * Verifica status de todos os serviços habilitados
 */
export async function checkAllServices(): Promise<ServiceStatusResult[]> {
  const services = getEnabledServices();
  const results = await Promise.all(services.map(checkServiceStatus));
  return results;
}

