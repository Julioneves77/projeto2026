import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Copy, Check, QrCode, Clock, Shield } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { createTicket, updateTicket, findTicket, sendPaymentConfirmation } from "@/lib/ticketService";
import { pushDLPortalcacesso } from "@/lib/portalcacessoDataLayer";
import { trackEvent, getFunnelId } from "@/lib/funnelTracker";
import {
  createPixTransaction, 
  getTransactionStatus, 
  formatAmountToCents,
  parsePhoneNumber,
  type PagarmeTransaction 
} from "@/lib/pagarmeService";
import { validateEmail } from "@/lib/validations";

// Mock data for testing
const mockPlan = {
  id: "prioridade",
  name: "Certidão Atendimento Prioritário",
  price: 54.87,
  description: "Processamento prioritário com especialista dedicado.",
  deliveryTime: "até 24 horas",
  features: [
    "Atendimento Prioridade (frente da fila Normal)",
    "Envio por E-mail em PDF",
  ],
};

const mockFormData = {
  nome: "Usuário Teste",
  cpf: "123.456.789-00",
  email: "teste@email.com",
};

// Função para formatar o nome da certidão
const formatCertificateName = (certificateType: string): string => {
  const typeMap: Record<string, string> = {
    'criminal-federal': 'Certidão Negativa Criminal Federal',
    'criminal-estadual': 'Certidão Negativa Criminal Estadual',
    'civel-federal': 'Certidão Negativa Cível Federal',
    'civel-estadual': 'Certidão Negativa Cível Estadual',
    'policia-federal': 'Antecedentes Criminais de Polícia Federal',
    'eleitoral': 'Certidão de Quitação Eleitoral',
    'cnd': 'Certidão Negativa de Débito (CND)',
    'cpf-regular': 'Certidão CPF Regular',
  };
  
  return typeMap[certificateType] || certificateType;
};

// Função para formatar o tipo de serviço
const formatServiceType = (planName: string): string => {
  if (planName.includes('Prioritário')) {
    return 'Atendimento Prioritário';
  }
  if (planName.includes('Padrão')) {
    return 'Atendimento Padrão';
  }
  return planName;
};

// Função para formatar descrição do tipo de serviço
const formatServiceDescription = (selectedPlan: any): string => {
  const planId = selectedPlan.id || '';
  
  if (planId === 'padrao') {
    return 'no email + certidão em Pdf';
  }
  if (planId === 'prioridade') {
    return 'envio prioridade + receba no email e whatsapp em Pdf';
  }
  if (planId === 'premium') {
    return 'envio urgente + receba no email e whatsapp em Pdf';
  }
  
  // Fallback: verificar features se id não estiver disponível
  const features = selectedPlan.features || [];
  const hasWhatsApp = features.some((f: string) => f.toLowerCase().includes('whatsapp'));
  
  if (hasWhatsApp) {
    if (selectedPlan.name?.includes('Prioritário')) {
      return 'envio prioridade + receba no email e whatsapp em Pdf';
    }
    if (selectedPlan.name?.includes('Premium') || selectedPlan.name?.includes('Urgente')) {
      return 'envio urgente + receba no email e whatsapp em Pdf';
    }
  }
  
  return 'no email + certidão em Pdf';
};

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const locationState = location.state || {};
  const [searchParams] = useSearchParams();
  
  // Detectar origem: parâmetro URL ou referrer
  const detectOrigin = (): 'portalcacesso' | 'solicite' => {
    // 1. Verificar parâmetro na URL
    const urlSource = searchParams.get('source');
    if (urlSource === 'portalcacesso') {
      return 'portalcacesso';
    }
    
    // 2. Verificar referrer como fallback
    const referrer = document.referrer || '';
    if (referrer.includes('portalcacesso.online') || referrer.includes('portalcacesso')) {
      return 'portalcacesso';
    }
    if (referrer.includes('solicite.link') || referrer.includes('solicite')) {
      return 'solicite';
    }
    
    // 3. Padrão: solicite
    return 'solicite';
  };
  
  const origem = detectOrigin();
  
  // Salvar origem no localStorage para uso posterior
  useEffect(() => {
    localStorage.setItem('payment_origin', origem);
  }, [origem]);
  
  // Use mock data if real data is not available (for testing)
  const formData = locationState.formData || mockFormData;
  const certificateType = locationState.certificateType || "criminal-estadual";
  const originalCategory = locationState.category || ""; // Categoria original do formulário
  const state = locationState.state || "SP";
  const selectedPlan = locationState.selectedPlan || mockPlan;
  
  const [copied, setCopied] = useState(false);
  const [currentTicketId, setCurrentTicketId] = useState<string | null>(null);
  const [pixTransaction, setPixTransaction] = useState<PagarmeTransaction | null>(null);
  const [pixQrCode, setPixQrCode] = useState<string | null>(null);
  const [isLoadingPix, setIsLoadingPix] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const certificateTitleRef = useRef<HTMLHeadingElement>(null);
  const isTestMode = !locationState.formData;

  // Garantir que a página sempre comece no topo ao carregar (mobile/desktop)
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    const forceScrollToTop = () => {
      // Múltiplas tentativas para garantir scroll no topo
      try {
        window.scrollTo(0, 0);
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      } catch {
        window.scrollTo(0, 0);
      }
      
      if (document.documentElement) {
        document.documentElement.scrollTop = 0;
        document.documentElement.scrollLeft = 0;
      }
      if (document.body) {
        document.body.scrollTop = 0;
        document.body.scrollLeft = 0;
      }
      
      // Forçar em todos os elementos scrolláveis
      const scrollableElements = document.querySelectorAll('main, section, div[class*="container"], div[class*="scroll"]');
      scrollableElements.forEach(el => {
        if (el instanceof HTMLElement) {
          el.scrollTop = 0;
        }
      });
    };

    // Executar imediatamente
    forceScrollToTop();
    
    // Executar em múltiplos frames para garantir
    requestAnimationFrame(() => {
      forceScrollToTop();
      requestAnimationFrame(forceScrollToTop);
    });
    
    // Múltiplos timeouts para dispositivos móveis lentos
    const timeouts = [
      setTimeout(forceScrollToTop, 0),
      setTimeout(forceScrollToTop, 50),
      setTimeout(forceScrollToTop, 100),
      setTimeout(forceScrollToTop, 200),
      setTimeout(forceScrollToTop, 300),
      setTimeout(forceScrollToTop, 500),
      setTimeout(forceScrollToTop, 1000),
    ];

    // Remover hash que possa causar scroll automático
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      setTimeout(forceScrollToTop, 50);
    }

    // Observer para detectar quando o conteúdo muda e reforçar scroll
    const observer = new MutationObserver(() => {
      forceScrollToTop();
    });
    
    observer.observe(document.body, { 
      childList: true, 
      subtree: true,
      attributes: false 
    });
    
    // Desconectar observer após 2 segundos para não impactar performance
    const observerTimeout = setTimeout(() => {
      observer.disconnect();
    }, 2000);

    return () => {
      timeouts.forEach(t => clearTimeout(t));
      clearTimeout(observerTimeout);
      observer.disconnect();
    };
  }, []);

  // Reforço: ao gerar/atualizar o QRCode, garantir topo
  useEffect(() => {
    const scrollToTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      if (document.documentElement) {
        document.documentElement.scrollTop = 0;
        document.documentElement.scrollLeft = 0;
      }
      if (document.body) {
        document.body.scrollTop = 0;
        document.body.scrollLeft = 0;
      }
    };
    scrollToTop();
  }, [pixQrCode]);

  // Redirect if no formData or selectedPlan (unless in test mode which uses mock data)
  useEffect(() => {
    // Only redirect if we're not in test mode and missing required data
    if (!isTestMode && (!locationState.formData || !locationState.selectedPlan)) {
      navigate("/", { replace: true });
    }
  }, [locationState.formData, locationState.selectedPlan, isTestMode, navigate]);

  // Ajustar tamanho da fonte do nome da certidão para caber em uma linha
  useEffect(() => {
    const adjustFontSize = () => {
      const element = certificateTitleRef.current;
      if (!element) return;

      // Reset para tamanho original
      element.style.fontSize = '';
      element.style.lineHeight = '';

      // Verificar se o texto está quebrando
      const isOverflowing = element.scrollWidth > element.clientWidth;

      if (isOverflowing) {
        // Começar com tamanho menor e ir ajustando
        let fontSize = 24; // text-2xl = 1.5rem = 24px
        element.style.fontSize = `${fontSize}px`;
        element.style.lineHeight = '1.2';

        // Reduzir até caber
        while (element.scrollWidth > element.clientWidth && fontSize > 14) {
          fontSize -= 1;
          element.style.fontSize = `${fontSize}px`;
        }
      }
    };

    adjustFontSize();
    window.addEventListener('resize', adjustFontSize);
    return () => window.removeEventListener('resize', adjustFontSize);
  }, [certificateType]);

  // Disparar evento quando página de checkout carrega (se origem = portalcacesso)
  useEffect(() => {
    if (formData && selectedPlan) {
      // Evento: pix_view - ao carregar página de pagamento
      trackEvent('pix_view', {
        certificate_type: certificateType,
        plan_id: selectedPlan.id,
        plan_name: selectedPlan.name,
        price: selectedPlan.price
      });

      pushDLPortalcacesso('portalcacesso_checkout_viewed', {
        funnel_step: 'checkout_view',
        certificateType: certificateType,
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        price: selectedPlan.price,
      });
    }
  }, [formData, selectedPlan, certificateType]);

  // Criar ticket e transação PIX ao carregar Payment
  useEffect(() => {
    const initializePayment = async () => {
      try {
        // Criar identificador único baseado nos dados do formulário
        const doc = (formData.cpf || formData.cnpj || '').toString().replace(/\D/g, '');
        const sessionKey = `payment_${doc}_${certificateType}_${selectedPlan.id}`;
        
        // Verificar se já existe ticket para esta sessão
        const existingTicketId = sessionStorage.getItem(sessionKey);
        let ticketId: string | null = null; // Inicializar como null - só atribuir se ticket existir no servidor
        
        if (existingTicketId) {
          const existingTicket = await findTicket(existingTicketId);
          if (existingTicket && existingTicket.status === 'GERAL') {
            console.log('🔵 [PORTAL Payment] Ticket já existe:', existingTicket.codigo);
            setCurrentTicketId(existingTicketId);
            ticketId = existingTicketId;
          } else {
            // Ticket não existe mais no servidor ou não está em GERAL - limpar cache
            console.log('⚠️ [PORTAL Payment] Ticket não encontrado ou não está em GERAL, criando novo...');
            sessionStorage.removeItem(sessionKey);
          }
        }

        // Criar novo ticket se não existir
        if (!ticketId) {
          console.log('🔵 [PORTAL Payment] Criando ticket ao gerar PIX...');
          // Obter funnel_id do locationState ou gerar novo
          const funnelId = locationState.funnel_id || getFunnelId();
          const ticket = await createTicket(formData, certificateType, state, selectedPlan, origem, funnelId);
          
          if (ticket) {
            console.log('✅ [PORTAL Payment] Ticket criado ao gerar PIX:', ticket.codigo);
            setCurrentTicketId(ticket.id);
            sessionStorage.setItem(sessionKey, ticket.id);
            ticketId = ticket.id;
            toast({
              title: "PIX sendo gerado!",
              description: `Ticket ${ticket.codigo} criado. Aguarde...`,
            });
          } else {
            console.error('❌ [PORTAL Payment] Falha ao criar ticket ao gerar PIX');
            return;
          }
        }

        // Criar transação PIX via Pagar.me
        console.log('🔵 [PORTAL Payment] Verificando condições para criar PIX:');
        console.log('  - ticketId:', ticketId ? `SIM (${ticketId})` : 'NÃO');
        console.log('  - isTestMode:', isTestMode);
        console.log('  - formData existe:', !!formData);
        console.log('  - selectedPlan existe:', !!selectedPlan);
        console.log('  - Condição ticketId && !isTestMode:', ticketId && !isTestMode);
        
        if (ticketId && !isTestMode) {
          console.log('✅ [PORTAL Payment] Condições atendidas, criando PIX...');
          setIsLoadingPix(true);
          try {
            const docNumber = (formData.cpf || formData.cnpj || '').toString().replace(/\D/g, '');
            const phone = parsePhoneNumber(formData.telefone || '');
            const customerName = formData.nomeCompleto || formData.nome || 'Cliente';
            
            // Email informado
            const customerEmail = (formData.email || '').toString().trim();
            
            // Validar dados antes de enviar
            if (!docNumber || docNumber.length < 11) {
              throw new Error('CPF/CNPJ inválido ou não informado');
            }
            
            if (!customerEmail) {
              throw new Error('Email não informado');
            }
            
            // Validar formato do email (bloquear caracteres especiais inválidos)
            if (!validateEmail(customerEmail)) {
              throw new Error('Email inválido. Remova caracteres especiais e verifique o formato (use apenas letras, números, ., _, -).');
            }
            
            if (!customerName || customerName.trim().length < 3) {
              throw new Error('Nome inválido ou não informado');
            }
            
            console.log('📦 [PORTAL Payment] Dados do cliente para PIX:', {
              name: customerName,
              email: customerEmail,
              document: docNumber.substring(0, 3) + '***' + docNumber.substring(docNumber.length - 2),
              hasPhone: !!phone
            });
            
            const transaction = await createPixTransaction({
              amount: formatAmountToCents(selectedPlan.price),
              customer: {
                name: customerName,
                email: customerEmail,
                document_number: docNumber,
                ...(phone && { phone }),
              },
              metadata: {
                ticket_id: ticketId,
                certificate_type: certificateType,
                plan_id: selectedPlan.id,
              },
            });

            console.log('✅ [PORTAL Payment] Transação PIX criada:', transaction.id);
            setPixTransaction(transaction);
            setPixQrCode(transaction.pix_qr_code || null);
            
            // Disparar evento quando PIX é gerado (se origem = portalcacesso)
            const ticket = await findTicket(ticketId);
            if (ticket) {
              // Evento: pix_initiated - ao gerar QR Code PIX
              trackEvent('pix_initiated', {
                ticket_id: ticketId,
                ticket_codigo: ticket.codigo,
                plan_id: selectedPlan.id,
                plan_name: selectedPlan.name,
                price: selectedPlan.price,
                certificate_type: certificateType
              });

              pushDLPortalcacesso('portalcacesso_payment_initiated', {
                funnel_step: 'payment_initiated',
                ticketCodigo: ticket.codigo,
                planId: selectedPlan.id,
                price: selectedPlan.price,
                certificateType: certificateType,
              });
            }
            
            // Iniciar polling para verificar status do pagamento
            startPolling(transaction.id, ticketId);
            
            toast({
              title: "QR Code PIX gerado!",
              description: "Escaneie o QR Code ou copie a chave PIX para pagar.",
            });
          } catch (error) {
            console.error('❌ [PORTAL Payment] Erro ao criar transação PIX:', error);
            
            // Mensagem de erro mais amigável
            let errorMessage = "Erro ao gerar PIX. Tente novamente.";
            if (error instanceof Error) {
              const errorMsg = error.message.toLowerCase();
              if (errorMsg.includes('invalid') || errorMsg.includes('inválido') || errorMsg.includes('the request is invalid')) {
                errorMessage = "Dados inválidos. Verifique se preencheu corretamente CPF/CNPJ, nome e email.";
              } else if (errorMsg.includes('incompletos') || errorMsg.includes('incomplete')) {
                errorMessage = "Dados incompletos. Verifique se preencheu todos os campos obrigatórios.";
              } else if (errorMsg.includes('document')) {
                errorMessage = "CPF/CNPJ inválido ou não informado. Verifique os dados.";
              } else {
                errorMessage = error.message;
              }
            }
            
            toast({
              title: "Erro ao gerar PIX",
              description: errorMessage,
              variant: "destructive",
            });
          } finally {
            setIsLoadingPix(false);
          }
        }
      } catch (error) {
        console.error('❌ [PORTAL Payment] Erro ao inicializar pagamento:', error);
        
        // Mostrar erro apenas se não for erro de validação já tratado
        if (error instanceof Error && !error.message.includes('inválido') && !error.message.includes('incompletos')) {
          toast({
            title: "Erro",
            description: "Erro ao processar pagamento. Tente novamente.",
            variant: "destructive",
          });
        }
      }
    };

    initializePayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Executar apenas uma vez ao montar

  // Limpar polling ao desmontar
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Função para iniciar polling do status do pagamento
  const startPolling = (transactionId: string, ticketId: string) => {
    // Limpar intervalo anterior se existir
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Verificar status a cada 5 segundos
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const status = await getTransactionStatus(transactionId);
        console.log('🔍 [PORTAL Payment] Status do pagamento:', status.status);

        // Verificar se PIX expirou
        if (status.pix_expiration_date) {
          const expirationDate = new Date(status.pix_expiration_date);
          const now = new Date();
          if (now > expirationDate) {
            console.warn('⚠️ [PORTAL Payment] PIX expirado');
            
            // Parar polling
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }

            toast({
              title: "PIX expirado",
              description: "O QR Code PIX expirou. Gere um novo código para continuar.",
              variant: "destructive",
            });
            
            setIsLoadingPix(false);
            setPixQrCode(null);
            setPixTransaction(null);
            return;
          }
        }

        if (status.status === 'paid') {
          // Pagamento confirmado!
          console.log('✅ [PORTAL Payment] Pagamento confirmado!');
          
          // Parar polling
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }

          // Atualizar ticket e redirecionar
          await handlePaymentConfirmed(ticketId);
        } else if (status.status === 'refused' || status.status === 'refunded') {
          // Pagamento recusado ou estornado
          console.warn('⚠️ [PORTAL Payment] Pagamento recusado ou estornado:', status.status);
          
          // Parar polling
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }

          toast({
            title: "Pagamento não confirmado",
            description: "O pagamento foi recusado ou estornado. Tente novamente.",
            variant: "destructive",
          });
        }
        // Se status for 'pending_payment' ou 'processing', continuar polling (não fazer nada)
      } catch (error) {
        console.error('❌ [PORTAL Payment] Erro ao verificar status:', error);
        // Não parar polling em caso de erro - pode ser temporário
      }
    }, 5000); // Verificar a cada 5 segundos
  };

  // Função para processar pagamento confirmado
  const handlePaymentConfirmed = async (ticketId: string) => {
    setIsProcessing(true);
    
    try {
      // Buscar ticket atual
      const currentTicket = await findTicket(ticketId);
      const existingHistorico = currentTicket?.historico || [];
      
      const newHistoricoItem = {
        id: `h-${Date.now()}`,
        dataHora: new Date().toISOString(),
        autor: 'Sistema',
        statusAnterior: 'GERAL' as const,
        statusNovo: 'EM_OPERACAO' as const,
        mensagem: 'Pagamento confirmado via Pagar.me. Ticket em processamento.',
        enviouEmail: false
      };
      
      const success = await updateTicket(ticketId, {
        status: 'EM_OPERACAO',
        historico: [...existingHistorico, newHistoricoItem]
      });
      
      if (success) {
        const updatedTicket = await findTicket(ticketId);
        console.log('✅ [PORTAL Payment] Ticket atualizado para EM_OPERACAO:', updatedTicket?.codigo);
        
        // Enviar confirmação de pagamento (email e WhatsApp)
        try {
          const confirmationResult = await sendPaymentConfirmation(ticketId);
          
          const emailSuccess = confirmationResult.email?.success || confirmationResult.email?.alreadySent;
          const whatsappSuccess = confirmationResult.whatsapp?.success || confirmationResult.whatsapp?.alreadySent;
          
          if (emailSuccess && whatsappSuccess) {
            toast({
              title: "Pagamento confirmado!",
              description: `Ticket ${updatedTicket?.codigo} está sendo processado. Confirmação enviada por email e WhatsApp.`,
            });
          } else {
            toast({
              title: "Pagamento confirmado!",
              description: `Ticket ${updatedTicket?.codigo} está sendo processado.`,
            });
          }
        } catch (confirmationError) {
          console.error('❌ [PORTAL Payment] Erro ao enviar confirmação:', confirmationError);
        }

        // Redirecionar para página de obrigado
        redirectToThankYou(updatedTicket);
      }
    } catch (error) {
      console.error('❌ [PORTAL Payment] Erro ao processar pagamento confirmado:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar pagamento. Verifique o console.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Função para redirecionar para página de obrigado via /event (dispara evento GTM)
  const redirectToThankYou = async (ticket: any) => {
    // Determinar URL base baseado na origem
    const currentOrigin = origem || localStorage.getItem('payment_origin') || 'solicite';
    const SOLICITE_LINK_URL = import.meta.env.VITE_SOLICITE_LINK_URL || 'http://localhost:8080';
    const PORTAL_ACESSO_URL = import.meta.env.VITE_PORTAL_ACESSO_URL || 'https://portalcacesso.online';
    
    const baseUrl = currentOrigin === 'portalcacesso' ? PORTAL_ACESSO_URL : SOLICITE_LINK_URL;
    
    const ticketCodigo = ticket?.codigo || '';
    const planoNome = selectedPlan.name || '';
    const planoId = selectedPlan.id || 'padrao';
    const email = formData.email || '';
    
    // Recuperar utm_campaign do localStorage ou URL
    let utmCampaign: string | null = null;
    try {
      // Tentar da URL primeiro
      const urlParams = new URLSearchParams(window.location.search);
      utmCampaign = urlParams.get('utm_campaign');
      
      // Se não encontrou na URL, tentar do localStorage
      if (!utmCampaign) {
        utmCampaign = localStorage.getItem('utm_campaign');
      }
      
      // Se encontrou, salvar no localStorage para preservar
      if (utmCampaign) {
        localStorage.setItem('utm_campaign', utmCampaign);
      }
    } catch (e) {
      // Ignorar erro
    }
    
    // Salvar no localStorage como fallback (será lido pela página /obrigado)
    if (ticketCodigo) localStorage.setItem('ticketCodigo', ticketCodigo);
    if (planoNome) localStorage.setItem('planoNome', planoNome);
    if (planoId) localStorage.setItem('planoId', planoId);
    if (email) localStorage.setItem('ticketEmail', email);
    if (certificateType) localStorage.setItem('tipoCertidao', certificateType);
    if (currentOrigin) localStorage.setItem('payment_origin', currentOrigin);
    
    // Gerar session ID único para anti-duplicidade
    const sessionId = `${ticketCodigo}_${Date.now()}`;
    
    // Redirecionar para /event primeiro (dispara evento GTM) e depois vai para /obrigado
    const eventUrl = new URL(`${baseUrl}/event`);
    eventUrl.searchParams.set('type', 'payment_completed');
    eventUrl.searchParams.set('sid', sessionId);
    eventUrl.searchParams.set('codigo', ticketCodigo);
    eventUrl.searchParams.set('plano', planoNome);
    eventUrl.searchParams.set('planoId', planoId);
    eventUrl.searchParams.set('email', email);
    eventUrl.searchParams.set('tipo', certificateType);
    
    // Incluir utm_campaign na URL se disponível
    if (utmCampaign) {
      eventUrl.searchParams.set('utm_campaign', utmCampaign);
    }
    
    console.log(`🚀 [PORTAL Payment] Origem: ${currentOrigin}, Redirecionando para ${baseUrl}/event:`, eventUrl.toString());
    
    // Redirecionar para o domínio correto baseado na origem
    window.location.href = eventUrl.toString();
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const handleCopyPix = async () => {
    const pixKeyToCopy = pixQrCode || pixTransaction?.pix_qr_code || '';
    
    if (!pixKeyToCopy) {
      toast({
        title: "QR Code não disponível",
        description: "Aguarde o QR Code ser gerado.",
        variant: "destructive",
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(pixKeyToCopy);
      setCopied(true);
      toast({
        title: "Código PIX copiado!",
        description: "Abra o app do seu banco e cole na área PIX.",
      });
      setTimeout(() => setCopied(false), 5000);
    } catch {
      toast({
        title: "Erro ao copiar",
        description: "Tente copiar manualmente.",
        variant: "destructive",
      });
    }
  };

  const handleChangePlan = () => {
    // Voltar para o formulário da certidão (não há mais tela de seleção de serviço)
    // Usar categoria original se disponível, senão inferir do certificateType
    let category = originalCategory;
    
    // Se não temos categoria original, tentar inferir do certificateType
    if (!category) {
      const certTypeLower = certificateType.toLowerCase();
      
      if (certTypeLower.includes('criminal federal') || certTypeLower.includes('cível federal') || certTypeLower.includes('eleitoral')) {
        category = 'federais';
      } else if (certTypeLower.includes('criminal estadual') || certTypeLower.includes('cível estadual')) {
        category = 'estaduais';
      } else if (certTypeLower.includes('polícia federal') || certTypeLower.includes('policia federal') || certTypeLower.includes('antecedentes')) {
        category = 'policia-federal';
      } else if (certTypeLower.includes('cnd') || certTypeLower.includes('débito')) {
        category = 'cnd';
      } else if (certTypeLower.includes('cpf') || certTypeLower.includes('cadastral')) {
        category = 'cpf-regular';
      } else {
        // Fallback: tentar determinar pela URL ou formData
        category = 'cpf-regular';
      }
    }
    
    navigate(`/certidao/${category}`, {
      state: {
        formData,
        certificateType,
        category, // Passar categoria de volta também
        state,
      },
      replace: true,
    });
  };

  return (
    <Layout>
      <SEOHead
        title="Pagamento - Portal Certidão"
        description="Complete o pagamento para finalizar sua solicitação de certidão. Processo seguro e rápido."
      />
      {/* Estilo inline para garantir scroll no topo */}
      <style dangerouslySetInnerHTML={{
        __html: `
          html, body {
            scroll-behavior: auto !important;
            overflow-x: hidden;
          }
          html {
            scroll-padding-top: 0 !important;
          }
          @media (max-width: 768px) {
            html, body {
              scroll-behavior: auto !important;
            }
          }
        `
      }} />
      {/* Hero */}
      <section className="relative overflow-hidden hero-gradient py-8">
        <div className="container relative">
          <button
            onClick={handleChangePlan}
            className="inline-flex items-center gap-2 text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground mb-3 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Alterar Tipo de Serviço
          </button>

          <div className="animate-slide-up text-center">
            {isTestMode && (
              <div className="mb-3 inline-block bg-yellow-500/20 text-yellow-200 text-xs font-medium px-3 py-1 rounded-full">
                🧪 Modo de Teste
              </div>
            )}
            <h2 
              ref={certificateTitleRef}
              className="font-heading text-2xl font-bold text-primary-foreground whitespace-nowrap"
            >
              {certificateType}
            </h2>
          </div>
        </div>
      </section>

      {/* Payment Content */}
      <section className="py-8">
        <div className="container max-w-5xl">
          {/* Resumo Curto Mobile - Aparece antes do QR no mobile */}
          <div className="md:hidden mb-4">
            <Card className="p-4">
              <h2 className="font-heading text-lg font-bold text-foreground mb-3">
                Resumo
              </h2>
              <div className="mb-2 pb-2 border-b border-border/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-foreground text-sm">
                    {formatCertificateName(certificateType)} ({formatServiceType(selectedPlan.name)})
                  </span>
                  <span className="font-heading font-bold text-primary text-base">
                    {formatPrice(selectedPlan.price)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatServiceDescription(selectedPlan)}
                </p>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="font-heading font-bold text-foreground">
                  Total
                </span>
                <span className="font-heading font-bold text-primary text-lg">
                  {formatPrice(selectedPlan.price)}
                </span>
              </div>
            </Card>
          </div>

          {/* Seção Pagamento Mobile - Título e Botão PIX */}
          <div className="md:hidden mb-4">
            <Card className="p-4">
              <h2 className="font-heading text-lg font-bold text-foreground mb-4">
                Pagamento
              </h2>
              <Button
                variant="default"
                size="lg"
                className="w-full bg-primary text-primary-foreground font-bold text-base py-3"
                disabled
              >
                PIX
              </Button>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Order Summary - Desktop */}
            <Card className="hidden md:block p-5 order-2 md:order-2">
              <h2 className="font-heading text-xl font-bold text-foreground mb-4">
                Resumo
              </h2>

              <div className="space-y-3">
                {/* Plan Info */}
                <div className="pb-3 border-b border-border/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-foreground text-sm">
                      {selectedPlan.name}
                    </span>
                    <span className="font-heading font-bold text-primary text-base">
                      {formatPrice(selectedPlan.price)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatServiceDescription(selectedPlan)}
                  </p>
                </div>
                
                {/* Total */}
                <div className="flex items-center justify-between pt-2">
                  <span className="font-heading font-bold text-foreground">
                    Total
                  </span>
                  <span className="font-heading font-bold text-primary text-lg">
                    {formatPrice(selectedPlan.price)}
                  </span>
                </div>

                {/* Features */}
                <div className="space-y-1">
                  {selectedPlan.features.map((feature: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <Check className="h-3 w-3 text-primary flex-shrink-0" />
                      <span className="text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Timer Notice */}
                {pixTransaction?.pix_expiration_date ? (
                  <div className="flex items-start gap-2 text-xs text-foreground bg-accent/50 rounded-lg p-3 border border-border/50">
                    <Clock className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium mb-1">
                        ⏳ Este PIX expira automaticamente.
                      </p>
                      <p className="text-muted-foreground">
                        O processamento só inicia após a confirmação do pagamento.
                      </p>
                      <p className="text-muted-foreground mt-1.5 text-[10px]">
                        Expira em: {new Date(pixTransaction.pix_expiration_date).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 text-xs text-foreground bg-accent/50 rounded-lg p-3 border border-border/50">
                    <Clock className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium mb-1">
                        ⏳ Este PIX expira automaticamente.
                      </p>
                      <p className="text-muted-foreground">
                        O processamento só inicia após a confirmação do pagamento.
                      </p>
                    </div>
                  </div>
                )}

                {/* Security Notice */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Shield className="h-3 w-3 flex-shrink-0" />
                  <span>Pagamento seguro e criptografado</span>
                </div>
              </div>
            </Card>

            {/* QR Code Section */}
            <Card className="p-4 sm:p-5 overflow-hidden order-1 md:order-1">
              <div className="text-center overflow-hidden">
                <h2 className="font-heading text-xl font-bold text-foreground mb-4 hidden md:block">
                  Pagamento
                </h2>
                
                {/* Botão PIX Destacado - Desktop */}
                <div className="mb-4 hidden md:block">
                  <Button
                    variant="default"
                    size="lg"
                    className="w-full bg-primary text-primary-foreground font-bold text-base py-3"
                    disabled
                  >
                    PIX
                  </Button>
                </div>
                
                {/* QR Code PIX */}
                {isLoadingPix ? (
                  <div className="bg-card border-2 border-border rounded-xl p-4 inline-block mb-3">
                    <div className="w-40 h-40 sm:w-56 sm:h-56 bg-foreground/5 rounded-lg flex items-center justify-center">
                      <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  </div>
                ) : pixQrCode ? (
                  <>
                    <div className="bg-white border-2 border-border rounded-xl p-4 inline-block mb-3 max-w-full overflow-hidden">
                      <QRCodeSVG 
                        value={pixQrCode}
                        size={220}
                        level="M"
                        includeMargin={false}
                        className="mx-auto w-40 h-40 sm:w-56 sm:h-56"
                        style={{ maxWidth: '100%', height: 'auto' }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      Aponte a câmera do seu celular para o QR Code
                    </p>
                    
                    {/* Bloco de Confiança - Desktop */}
                    <div className="hidden md:block mt-4 mb-3 bg-accent/40 border border-border/50 rounded-lg p-3 text-left">
                      <p className="text-sm font-medium text-foreground mb-2">
                        🔒 Pagamento seguro via PIX
                      </p>
                      <div className="space-y-1.5 text-xs text-foreground/90">
                        <p className="flex items-start gap-1.5">
                          <span className="flex-shrink-0">✔️</span>
                          <span>Solicitação monitorada automaticamente</span>
                        </p>
                        <p className="flex items-start gap-1.5">
                          <span className="flex-shrink-0">❗</span>
                          <span>Em caso de qualquer problema, o pagamento é verificado e reembolsado</span>
                        </p>
                        <p className="flex items-start gap-1.5 pt-1 border-t border-border/30">
                          <span className="flex-shrink-0">✔️</span>
                          <span>Solicitações processadas diariamente</span>
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-card border-2 border-border rounded-xl p-4 inline-block mb-3">
                      <div className="w-40 h-40 sm:w-56 sm:h-56 bg-foreground/5 rounded-lg flex items-center justify-center">
                        <QrCode className="h-32 w-32 sm:h-36 sm:w-36 text-foreground/40" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      {isTestMode ? 'Modo de teste - Use o botão abaixo para simular pagamento' : 'Aguarde o QR Code ser gerado...'}
                    </p>
                    
                    {/* Bloco de Confiança - Desktop (quando não há QR Code ainda) */}
                    {isTestMode && (
                      <div className="hidden md:block mt-4 mb-3 bg-accent/40 border border-border/50 rounded-lg p-3 text-left">
                        <p className="text-sm font-medium text-foreground mb-2">
                          🔒 Pagamento seguro via PIX
                        </p>
                        <div className="space-y-1.5 text-xs text-foreground/90">
                          <p className="flex items-start gap-1.5">
                            <span className="flex-shrink-0">✔️</span>
                            <span>Solicitação monitorada automaticamente</span>
                          </p>
                          <p className="flex items-start gap-1.5">
                            <span className="flex-shrink-0">❗</span>
                            <span>Em caso de qualquer problema, o pagamento é verificado e reembolsado</span>
                          </p>
                          <p className="flex items-start gap-1.5 pt-1 border-t border-border/30">
                            <span className="flex-shrink-0">✔️</span>
                            <span>Solicitações processadas diariamente</span>
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* PIX Key */}
                {(pixQrCode || isTestMode) && (
                  <div className="bg-muted rounded-lg p-3 md:p-3">
                    <p className="text-xs text-muted-foreground mb-2">Ou copie a chave PIX:</p>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <code className={`flex-1 bg-background rounded px-3 py-2 font-mono truncate text-xs sm:text-sm ${
                        pixQrCode 
                          ? '' 
                          : 'font-semibold text-primary border-2 border-primary/30'
                      }`}>
                        {pixQrCode || 'Aguardando geração...'}
                      </code>
                      <Button
                        variant="default"
                        size="default"
                        onClick={handleCopyPix}
                        className="w-full sm:w-auto sm:flex-shrink-0 font-medium"
                        disabled={!pixQrCode}
                      >
                        {copied ? (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-2" />
                            Copiar código PIX
                          </>
                        )}
                      </Button>
                    </div>
                    {copied && (
                      <p className="text-xs text-primary mt-2 font-medium">
                        Código PIX copiado. Abra o app do seu banco e cole na área PIX.
                      </p>
                    )}
                    
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
        
        {/* Espaçamento adicional no mobile para garantir que o rodapé seja visível */}
        <div className="md:hidden pb-8"></div>
      </section>
    </Layout>
  );
};

export default Payment;

