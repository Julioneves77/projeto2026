import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QRCodeSVG } from "qrcode.react";
import { ArrowLeft, Copy, Check, Clock, Shield } from "lucide-react";
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
import { getFormConfig } from "@/lib/formConfigs";
import { scrollToTop } from "@/lib/scrollUtils";

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

const PAYMENT_STATE_KEY = "guia_central_payment_state";

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const locationState = location.state || {};
  const [searchParams] = useSearchParams();

  // Restaurar state do sessionStorage quando location.state estiver vazio (evita perda ao navegar)
  const effectiveState = (() => {
    if (locationState.formData && locationState.selectedPlan) return locationState;
    try {
      const stored = sessionStorage.getItem(PAYMENT_STATE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.formData && parsed?.selectedPlan) return parsed;
      }
    } catch (e) {
      console.warn("[Payment] Falha ao restaurar state do sessionStorage:", e);
    }
    return locationState;
  })();
  
  // Detectar origem: parâmetro URL, hostname ou referrer
  const detectOrigin = (): 'portalcacesso' | 'solicite' | 'guia-central' => {
    // 1. Verificar parâmetro na URL
    const urlSource = searchParams.get('source');
    if (urlSource === 'portalcacesso') return 'portalcacesso';
    if (urlSource === 'guia-central') return 'guia-central';

    // 2. Verificar hostname atual (usuário está no guia-central)
    const hostname = window.location.hostname || '';
    if (hostname.includes('guia-central.online')) {
      return 'guia-central';
    }

    // 3. Verificar referrer como fallback
    const referrer = document.referrer || '';
    if (referrer.includes('portalcacesso.online') || referrer.includes('portalcacesso')) {
      return 'portalcacesso';
    }
    if (referrer.includes('guia-central.online') || referrer.includes('guia-central')) {
      return 'guia-central';
    }
    if (referrer.includes('solicite.link') || referrer.includes('solicite')) {
      return 'solicite';
    }

    // 4. Padrão: guia-central (este app é o guia-central)
    return 'guia-central';
  };
  
  const origem = detectOrigin();
  
  // Salvar origem no localStorage para uso posterior
  useEffect(() => {
    localStorage.setItem('payment_origin', origem);
  }, [origem]);
  
  // Use mock data if real data is not available (for testing)
  const formData = effectiveState.formData || mockFormData;
  const certificateType = effectiveState.certificateType || "criminal-estadual";
  const originalCategory = effectiveState.category || ""; // Categoria original do formulário
  const state = effectiveState.state || "SP";
  const selectedPlan = effectiveState.selectedPlan || mockPlan;
  
  // Verificar se a certidão tem entrega automática via Plexi
  const entregaAutomatica = (() => {
    if (!originalCategory) return false;
    const typeForConfig =
      originalCategory === "estaduais"
        ? (state || "").toLowerCase()
        : originalCategory === "federais"
        ? ((formData?.tipoCertidao as string) || "criminal").toLowerCase().replace("cível", "civel")
        : "";
    const config = getFormConfig(originalCategory, typeForConfig);
    return !!config?.entregaAutomatica;
  })();

  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [pixExpired, setPixExpired] = useState(false);
  const [currentTicketId, setCurrentTicketId] = useState<string | null>(null);
  const [pixTransaction, setPixTransaction] = useState<PagarmeTransaction | null>(null);
  const [pixQrCode, setPixQrCode] = useState<string | null>(null);
  const [isLoadingPix, setIsLoadingPix] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const certificateTitleRef = useRef<HTMLHeadingElement>(null);
  const isTestMode = !effectiveState.formData;

  // Timer regressivo: 5 minutos (sempre que houver PIX)
  const PIX_TIMER_SECONDS = 300; // 5 min
  useEffect(() => {
    if (!pixQrCode) return;

    const startCountdown = (initialSeconds: number) => {
      setTimeLeft(initialSeconds);
      const interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev === null || prev <= 1) {
            setPixExpired(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    };

    if (pixTransaction?.pix_expiration_date) {
      const exp = new Date(pixTransaction.pix_expiration_date).getTime();
      const now = Date.now();
      const diff = Math.max(0, Math.floor((exp - now) / 1000));
      const validDiff = Number.isFinite(diff) && diff > 0 && diff <= PIX_TIMER_SECONDS;
      return startCountdown(validDiff ? diff : PIX_TIMER_SECONDS);
    }
    return startCountdown(PIX_TIMER_SECONDS);
  }, [pixQrCode, pixTransaction?.pix_expiration_date]);

  useEffect(() => {
    if (timeLeft !== null && timeLeft <= 0) setPixExpired(true);
  }, [timeLeft]);

  useLayoutEffect(() => {
    scrollToTop();
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

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

  // Dados válidos para exibir a página de pagamento (evita tela em branco)
  const hasPaymentData = !!(effectiveState.formData && effectiveState.selectedPlan);

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
          // Obter funnel_id do effectiveState ou gerar novo
          const funnelId = effectiveState.funnel_id || getFunnelId();
          const result = await createTicket(formData, certificateType, state, selectedPlan, origem, funnelId);
          
          if (result) {
            const { ticket, serverSyncFailed } = result;
            console.log('✅ [PORTAL Payment] Ticket criado ao gerar PIX:', ticket.codigo);
            setCurrentTicketId(ticket.id);
            sessionStorage.setItem(sessionKey, ticket.id);
            ticketId = ticket.id;
            if (serverSyncFailed) {
              toast({
                title: "Aviso: sincronização",
                description: "O ticket foi criado, mas não chegou à plataforma. Verifique sua conexão ou entre em contato.",
                variant: "destructive",
              });
            } else {
              toast({
                title: "PIX sendo gerado!",
                description: `Ticket ${ticket.codigo} criado. Aguarde...`,
              });
            }
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

  // Função para redirecionar para página de obrigado
  const redirectToThankYou = async (ticket: any) => {
    try {
      sessionStorage.removeItem(PAYMENT_STATE_KEY);
    } catch {}

    const currentOrigin = origem || localStorage.getItem('payment_origin') || 'guia-central';
    const SOLICITE_LINK_URL = import.meta.env.VITE_SOLICITE_LINK_URL || 'http://localhost:8080';
    const PORTAL_ACESSO_URL = import.meta.env.VITE_PORTAL_ACESSO_URL || 'https://portalcacesso.online';

    const ticketCodigo = ticket?.codigo || '';
    const planoNome = selectedPlan.name || '';
    const planoId = selectedPlan.id || 'padrao';
    const email = formData.email || '';

    if (ticketCodigo) localStorage.setItem('ticketCodigo', ticketCodigo);
    if (planoNome) localStorage.setItem('planoNome', planoNome);
    if (planoId) localStorage.setItem('planoId', planoId);
    if (email) localStorage.setItem('ticketEmail', email);
    if (certificateType) localStorage.setItem('tipoCertidao', certificateType);
    if (currentOrigin) localStorage.setItem('payment_origin', currentOrigin);

    // Para guia-central: redirecionar diretamente para /obrigado (SPA, sem /event)
    if (currentOrigin === 'guia-central') {
      try {
        sessionStorage.setItem(THANKYOU_STATE_KEY, JSON.stringify({ formData, selectedPlan, certificateType }));
      } catch {
        // ignore
      }
      console.log('🚀 [guia-central Payment] Redirecionando para /obrigado');
      navigate('/obrigado', {
        state: { formData, selectedPlan, certificateType },
        replace: true,
      });
      return;
    }

    // Para portalcacesso e solicite: fluxo externo via /event
    const baseUrl = currentOrigin === 'portalcacesso' ? PORTAL_ACESSO_URL : SOLICITE_LINK_URL;
    let utmCampaign: string | null = null;
    try {
      utmCampaign = new URLSearchParams(window.location.search).get('utm_campaign') || localStorage.getItem('utm_campaign');
      if (utmCampaign) localStorage.setItem('utm_campaign', utmCampaign);
    } catch (e) {}

    const sessionId = `${ticketCodigo}_${Date.now()}`;
    const eventUrl = new URL(`${baseUrl}/event`);
    eventUrl.searchParams.set('type', 'payment_completed');
    eventUrl.searchParams.set('sid', sessionId);
    eventUrl.searchParams.set('codigo', ticketCodigo);
    eventUrl.searchParams.set('plano', planoNome);
    eventUrl.searchParams.set('planoId', planoId);
    eventUrl.searchParams.set('email', email);
    eventUrl.searchParams.set('tipo', certificateType);
    if (utmCampaign) eventUrl.searchParams.set('utm_campaign', utmCampaign);

    console.log(`🚀 [Payment] Origem: ${currentOrigin}, Redirecionando para ${baseUrl}/event`);
    window.location.href = eventUrl.toString();
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

  const handleCheckPaymentStatus = async () => {
    if (!pixTransaction?.id || !currentTicketId || pixExpired || isProcessing) return;
    setIsProcessing(true);
    try {
      const status = await getTransactionStatus(pixTransaction.id);
      if (status.status === "paid") {
        await handlePaymentConfirmed(currentTicketId);
      } else {
        toast({
          title: "Pagamento ainda não confirmado",
          description: "Aguarde alguns instantes e tente novamente. A confirmação pode levar até 1 minuto.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Erro ao verificar pagamento:", error);
      toast({
        title: "Erro ao verificar",
        description: "Não foi possível verificar o pagamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
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

  // Fallback: sessão expirada ou dados não encontrados (evita tela em branco)
  if (!hasPaymentData && !isTestMode) {
    return (
      <Layout>
        <SEOHead title="Pagamento - Guia Central" description="Complete o pagamento para finalizar sua solicitação." />
        <section className="py-16">
          <div className="container max-w-md mx-auto px-4 text-center">
            <Card className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="font-heading text-xl font-bold text-foreground mb-3">
                Sessão expirada
              </h2>
              <p className="text-muted-foreground mb-6">
                Os dados do pagamento não foram encontrados. Por favor, inicie o processo novamente.
              </p>
              <Button onClick={() => navigate("/", { replace: true })} size="lg" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao início
              </Button>
            </Card>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEOHead
        title="Pagamento - Guia Central"
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
      {/* Header: Voltar + Etapa 3 de 3 + barra progresso */}
      <section className="relative overflow-hidden min-h-[120px] py-6 bg-primary">
        <div className="container relative">
          <button
            onClick={handleChangePlan}
            className="inline-flex items-center gap-2 text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-primary-foreground">Etapa 3 de 3</span>
            <div className="flex-1 h-2 bg-white/30 rounded-full overflow-hidden">
              <div className="h-full w-full bg-white rounded-full" />
            </div>
            <span className="text-sm font-medium text-primary-foreground w-10 text-right">100%</span>
          </div>
        </div>
      </section>

      {/* Card único central */}
      <section className="py-8">
        <div className="container max-w-lg mx-auto px-4">
          {isTestMode && (
            <div className="mb-4 inline-block bg-yellow-500/20 text-yellow-700 dark:text-yellow-200 text-xs font-medium px-3 py-1 rounded-full">
              🧪 Modo de Teste
            </div>
          )}

          <Card className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
            {/* Detalhes do Serviço */}
            <div className="flex items-start gap-3 mb-5">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 ref={certificateTitleRef} className="text-lg font-bold text-foreground">
                  {formatCertificateName(certificateType)}
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {entregaAutomatica ? "no seu Email em Minutos" : "Processamento via IA"}
                </p>
                <p className="text-base font-bold text-primary mt-2">
                  R$ {(selectedPlan?.price ?? 47.97).toFixed(2).replace('.', ',')}
                </p>
              </div>
            </div>

            {/* Timer */}
            <div className="mb-5 pb-5 border-b border-border/50">
              {(timeLeft !== null || pixQrCode) && (
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {pixExpired ? (
                    <span className="font-medium text-destructive">Este código expirou</span>
                  ) : (
                    <span>Expira em <span className="font-semibold text-foreground">{formatTime(timeLeft ?? 300)}</span></span>
                  )}
                </div>
              )}
            </div>

            {/* COMO PAGAR */}
            <div className="mb-5">
              <p className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3">Como pagar</p>
              <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside">
                <li>Abra seu app do banco</li>
                <li>Escaneie o QR Code ou escolha PIX copia e cola</li>
                <li>Cole o código abaixo (se usar copia e cola)</li>
                <li>Confirme o pagamento</li>
              </ol>
            </div>

            {/* QR Code PIX + botões */}
            {isLoadingPix ? (
              <div className="rounded-lg bg-muted p-4 flex items-center justify-center gap-2">
                <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-muted-foreground">Gerando código PIX...</span>
              </div>
            ) : (
              <>
                {/* QR Code - visualização para o usuário */}
                {pixQrCode && (
                  <div className="flex justify-center mb-5">
                    <div className="bg-white border-2 border-border rounded-xl p-4 shadow-sm">
                      <QRCodeSVG
                        value={pixQrCode}
                        size={220}
                        level="M"
                        includeMargin={false}
                        className="mx-auto"
                      />
                    </div>
                  </div>
                )}
                {/* Código PIX copia e cola */}
                <div className="rounded-lg bg-muted p-3 mb-3">
                  <code className="block font-mono text-xs text-foreground truncate">
                    {pixQrCode || "Aguardando geração..."}
                  </code>
                </div>
                <Button
                  variant="default"
                  size="lg"
                  onClick={handleCopyPix}
                  className="w-full font-bold mb-3"
                  disabled={!pixQrCode || pixExpired}
                >
                  {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                  {copied ? "Copiado!" : "Copiar código PIX"}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleCheckPaymentStatus}
                  className="w-full border-emerald-500 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/30"
                  disabled={!pixQrCode || pixExpired || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <div className="h-4 w-4 mr-2 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    "Já realizei o pagamento"
                  )}
                </Button>
              </>
            )}
          </Card>
        </div>

        <div className="md:hidden pb-8" />
      </section>
    </Layout>
  );
};

export default Payment;

