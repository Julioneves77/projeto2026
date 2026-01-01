import React, { useState, useEffect } from 'react';
import { useTickets } from '@/hooks/useTickets';
import { 
  Globe, 
  Mail, 
  MessageSquare, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Activity,
  Server,
  Wifi,
  Clock,
  FileText,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ServiceStatus {
  id: string;
  name: string;
  description: string;
  status: 'online' | 'offline' | 'warning' | 'checking';
  lastCheck: Date;
  responseTime?: number;
  icon: React.ElementType;
  category: 'domain' | 'email' | 'whatsapp';
}

const initialServices: ServiceStatus[] = [
  {
    id: 'portal-certidao',
    name: 'PortalCertidao.org',
    description: 'Portal principal de solicitação de certidões',
    status: 'checking',
    lastCheck: new Date(),
    icon: Globe,
    category: 'domain'
  },
  {
    id: 'solicite-link',
    name: 'Solicite.link',
    description: 'Domínio de links curtos e redirecionamento',
    status: 'checking',
    lastCheck: new Date(),
    icon: Globe,
    category: 'domain'
  },
  {
    id: 'sendpulse',
    name: 'SendPulse',
    description: 'Emails de confirmação de pagamento e certidões prontas',
    status: 'checking',
    lastCheck: new Date(),
    icon: Mail,
    category: 'email'
  },
  {
    id: 'zap-api',
    name: 'Zap API',
    description: 'WhatsApp de confirmação e notificações',
    status: 'checking',
    lastCheck: new Date(),
    icon: MessageSquare,
    category: 'whatsapp'
  }
];

export function SystemStability() {
  const { tickets } = useTickets();
  const [services, setServices] = useState<ServiceStatus[]>(initialServices);
  const [isChecking, setIsChecking] = useState(false);
  const [lastFullCheck, setLastFullCheck] = useState<Date | null>(null);
  const [showAllEmissions, setShowAllEmissions] = useState(false);

  const checkServices = async () => {
    setIsChecking(true);
    
    // Simular verificação de cada serviço
    const updatedServices = [...services];
    
    for (let i = 0; i < updatedServices.length; i++) {
      updatedServices[i] = { ...updatedServices[i], status: 'checking' };
      setServices([...updatedServices]);
      
      // Simular delay de verificação
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
      
      // Simular resultado (90% online, 5% warning, 5% offline)
      const random = Math.random();
      let status: 'online' | 'offline' | 'warning' = 'online';
      if (random > 0.95) status = 'offline';
      else if (random > 0.90) status = 'warning';
      
      updatedServices[i] = {
        ...updatedServices[i],
        status,
        lastCheck: new Date(),
        responseTime: Math.floor(50 + Math.random() * 200)
      };
      setServices([...updatedServices]);
    }
    
    setLastFullCheck(new Date());
    setIsChecking(false);
  };

  useEffect(() => {
    checkServices();
    // Verificar a cada 5 minutos
    const interval = setInterval(checkServices, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const allOnline = services.every(s => s.status === 'online');
  const hasWarning = services.some(s => s.status === 'warning');
  const hasOffline = services.some(s => s.status === 'offline');

  const getOverallStatus = () => {
    if (services.some(s => s.status === 'checking')) return { label: 'Verificando...', color: 'bg-muted', textColor: 'text-muted-foreground' };
    if (hasOffline) return { label: 'Sistema com Falhas', color: 'bg-destructive', textColor: 'text-destructive-foreground' };
    if (hasWarning) return { label: 'Atenção Necessária', color: 'bg-yellow-500', textColor: 'text-white' };
    return { label: 'Todos os Sistemas Operacionais', color: 'bg-green-500', textColor: 'text-white' };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'offline':
        return <XCircle className="w-5 h-5 text-destructive" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'checking':
        return <RefreshCw className="w-5 h-5 text-muted-foreground animate-spin" />;
      default:
        return <AlertCircle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Online</Badge>;
      case 'offline':
        return <Badge variant="destructive">Offline</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Instável</Badge>;
      case 'checking':
        return <Badge variant="secondary">Verificando...</Badge>;
      default:
        return <Badge variant="secondary">Desconhecido</Badge>;
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const overallStatus = getOverallStatus();
  const domainServices = services.filter(s => s.category === 'domain');
  const emailServices = services.filter(s => s.category === 'email');
  const whatsappServices = services.filter(s => s.category === 'whatsapp');

  return (
    <div className="space-y-6">
      {/* Header com Status Geral */}
      <Card className="border-2">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl ${overallStatus.color} flex items-center justify-center`}>
                <Activity className={`w-7 h-7 ${overallStatus.textColor}`} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">{overallStatus.label}</h2>
                <p className="text-sm text-muted-foreground">
                  {lastFullCheck 
                    ? `Última verificação: ${formatTime(lastFullCheck)}` 
                    : 'Aguardando verificação inicial...'}
                </p>
              </div>
            </div>
            <Button 
              onClick={checkServices} 
              disabled={isChecking}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
              {isChecking ? 'Verificando...' : 'Verificar Agora'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Grid de Categorias */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Domínios */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Globe className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <CardTitle className="text-base">Domínios</CardTitle>
                <CardDescription className="text-xs">Status dos sites</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {domainServices.map((service) => {
              const Icon = service.icon;
              return (
                <div 
                  key={service.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(service.status)}
                    <div>
                      <p className="text-sm font-medium text-foreground">{service.name}</p>
                      <p className="text-xs text-muted-foreground">{service.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(service.status)}
                    {service.responseTime && service.status === 'online' && (
                      <p className="text-xs text-muted-foreground mt-1">{service.responseTime}ms</p>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Email */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Mail className="w-4 h-4 text-purple-500" />
              </div>
              <div>
                <CardTitle className="text-base">Envio de Emails</CardTitle>
                <CardDescription className="text-xs">Confirmações e notificações</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {emailServices.map((service) => (
              <div 
                key={service.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(service.status)}
                  <div>
                    <p className="text-sm font-medium text-foreground">{service.name}</p>
                    <p className="text-xs text-muted-foreground">{service.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  {getStatusBadge(service.status)}
                  {service.responseTime && service.status === 'online' && (
                    <p className="text-xs text-muted-foreground mt-1">{service.responseTime}ms</p>
                  )}
                </div>
              </div>
            ))}
            <div className="pt-2 border-t border-border">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>✓ Confirmação de pagamento</span>
                <span>Ativo</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                <span>✓ Certidões prontas</span>
                <span>Ativo</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* WhatsApp */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-green-500" />
              </div>
              <div>
                <CardTitle className="text-base">WhatsApp API</CardTitle>
                <CardDescription className="text-xs">Mensagens automáticas</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {whatsappServices.map((service) => (
              <div 
                key={service.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(service.status)}
                  <div>
                    <p className="text-sm font-medium text-foreground">{service.name}</p>
                    <p className="text-xs text-muted-foreground">{service.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  {getStatusBadge(service.status)}
                  {service.responseTime && service.status === 'online' && (
                    <p className="text-xs text-muted-foreground mt-1">{service.responseTime}ms</p>
                  )}
                </div>
              </div>
            ))}
            <div className="pt-2 border-t border-border">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>✓ Confirmação de pagamento</span>
                <span>Ativo</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                <span>✓ Certidões prontas</span>
                <span>Ativo</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Histórico de Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Resumo do Fluxo
          </CardTitle>
          <CardDescription>Verificação do fluxo completo de atendimento</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
            
            <div className="space-y-4">
              <div className="flex items-start gap-4 relative">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center z-10">
                  <span className="text-white text-xs font-bold">1</span>
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-sm font-medium text-foreground">Cliente acessa PortalCertidao.org</p>
                  <p className="text-xs text-muted-foreground">Solicitação de certidão iniciada</p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>

              <div className="flex items-start gap-4 relative">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center z-10">
                  <span className="text-white text-xs font-bold">2</span>
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-sm font-medium text-foreground">Pagamento confirmado</p>
                  <p className="text-xs text-muted-foreground">SendPulse envia email + ZapAPI envia WhatsApp</p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>

              <div className="flex items-start gap-4 relative">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center z-10">
                  <span className="text-white text-xs font-bold">3</span>
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-sm font-medium text-foreground">Ticket criado no sistema</p>
                  <p className="text-xs text-muted-foreground">Atendente recebe para processamento</p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>

              <div className="flex items-start gap-4 relative">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center z-10">
                  <span className="text-white text-xs font-bold">4</span>
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-sm font-medium text-foreground">Certidão concluída</p>
                  <p className="text-xs text-muted-foreground">Email e WhatsApp com documento enviados</p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Histórico de Últimas Emissões */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Histórico de Emissões
              </CardTitle>
              <CardDescription>Últimas certidões processadas e status do fluxo</CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowAllEmissions(!showAllEmissions)}
              className="gap-1"
            >
              {showAllEmissions ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Ver menos
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Ver mais (50)
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className={showAllEmissions ? "h-[500px]" : "h-auto"}>
            <div className="space-y-2">
              {tickets
                .filter(t => t.status === 'CONCLUIDO')
                .sort((a, b) => new Date(b.dataConclusao || 0).getTime() - new Date(a.dataConclusao || 0).getTime())
                .slice(0, showAllEmissions ? 50 : 10)
                .map((ticket) => {
                  // Verificar etapas do fluxo baseado no histórico
                  const temHistorico = ticket.historico.length > 0;
                  const foiAtribuido = ticket.operador !== null;
                  const foiConcluido = ticket.status === 'CONCLUIDO';
                  const enviouEmail = ticket.historico.some(h => h.enviouEmail);
                  const temAnexo = ticket.historico.some(h => h.anexo);
                  
                  return (
                    <div 
                      key={ticket.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border"
                    >
                      {/* Info do Ticket */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-medium text-foreground">{ticket.codigo}</span>
                          <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                            {ticket.nomeCompleto}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {ticket.dataConclusao && new Date(ticket.dataConclusao).toLocaleString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                            {ticket.tipoCertidao}
                          </span>
                        </div>
                      </div>

                      {/* Etapas do Fluxo */}
                      <div className="flex items-center gap-1">
                        {/* 1. Recebido */}
                        <div className="flex flex-col items-center" title="Ticket Recebido">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <span className="text-[10px] text-muted-foreground">Receb.</span>
                        </div>
                        
                        {/* 2. Atribuído */}
                        <div className="flex flex-col items-center" title="Atribuído ao Operador">
                          {foiAtribuido ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-destructive" />
                          )}
                          <span className="text-[10px] text-muted-foreground">Atrib.</span>
                        </div>
                        
                        {/* 3. Processado */}
                        <div className="flex flex-col items-center" title="Processado">
                          {temHistorico ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-destructive" />
                          )}
                          <span className="text-[10px] text-muted-foreground">Proc.</span>
                        </div>
                        
                        {/* 4. Email Enviado */}
                        <div className="flex flex-col items-center" title="Email Enviado">
                          {enviouEmail ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-yellow-500" />
                          )}
                          <span className="text-[10px] text-muted-foreground">Email</span>
                        </div>
                        
                        {/* 5. Anexo */}
                        <div className="flex flex-col items-center" title="Documento Anexado">
                          {temAnexo ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-yellow-500" />
                          )}
                          <span className="text-[10px] text-muted-foreground">Anexo</span>
                        </div>
                        
                        {/* 6. Concluído */}
                        <div className="flex flex-col items-center" title="Concluído">
                          {foiConcluido ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-destructive" />
                          )}
                          <span className="text-[10px] text-muted-foreground">Concl.</span>
                        </div>
                      </div>

                      {/* Operador */}
                      <div className="text-right min-w-[80px]">
                        <p className="text-xs font-medium text-foreground truncate">
                          {ticket.operador || '-'}
                        </p>
                      </div>
                    </div>
                  );
                })}

              {tickets.filter(t => t.status === 'CONCLUIDO').length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhuma emissão concluída</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// Exportar função para verificar status do sistema (para o indicador no menu)
export function useSystemStatus() {
  const [status, setStatus] = useState<'online' | 'warning' | 'offline'>('online');
  
  useEffect(() => {
    // Simular verificação inicial
    const checkStatus = () => {
      // Em produção, isso faria chamadas reais aos serviços
      const random = Math.random();
      if (random > 0.95) {
        setStatus('offline');
      } else if (random > 0.90) {
        setStatus('warning');
      } else {
        setStatus('online');
      }
    };
    
    checkStatus();
    const interval = setInterval(checkStatus, 60000); // Verificar a cada minuto
    
    return () => clearInterval(interval);
  }, []);
  
  return status;
}
