import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Copy, Check, QrCode, Clock, Shield } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { createTicket, updateTicket, findTicket, sendPaymentConfirmation } from "@/lib/ticketService";
import { 
  createPixTransaction, 
  getTransactionStatus, 
  formatAmountToCents,
  parsePhoneNumber,
  type PagarmeTransaction 
} from "@/lib/pagarmeService";

// Mock data for testing
const mockPlan = {
  id: "prioridade",
  name: "Atendimento Prioritário",
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

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const locationState = location.state || {};
  
  // Use mock data if real data is not available (for testing)
  const formData = locationState.formData || mockFormData;
  const certificateType = locationState.certificateType || "criminal-estadual";
  const state = locationState.state || "SP";
  const selectedPlan = locationState.selectedPlan || mockPlan;
  
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTicketId, setCurrentTicketId] = useState<string | null>(null);
  const [pixTransaction, setPixTransaction] = useState<PagarmeTransaction | null>(null);
  const [pixQrCode, setPixQrCode] = useState<string | null>(null);
  const [isLoadingPix, setIsLoadingPix] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isTestMode = !locationState.formData;

  // Redirect if no formData or selectedPlan (unless in test mode which uses mock data)
  useEffect(() => {
    // Only redirect if we're not in test mode and missing required data
    if (!isTestMode && (!locationState.formData || !locationState.selectedPlan)) {
      navigate("/selecionar-servico", { replace: true });
    }
  }, [locationState.formData, locationState.selectedPlan, isTestMode, navigate]);

  // Criar ticket e transação PIX ao carregar Payment
  useEffect(() => {
    const initializePayment = async () => {
      try {
        // Criar identificador único baseado nos dados do formulário
        const doc = (formData.cpf || formData.cnpj || '').toString().replace(/\D/g, '');
        const sessionKey = `payment_${doc}_${certificateType}_${selectedPlan.id}`;
        
        // Verificar se já existe ticket para esta sessão
        const existingTicketId = sessionStorage.getItem(sessionKey);
        let ticketId = existingTicketId;
        
        if (existingTicketId) {
          const existingTicket = await findTicket(existingTicketId);
          if (existingTicket && existingTicket.status === 'GERAL') {
            console.log('🔵 [PORTAL Payment] Ticket já existe:', existingTicket.codigo);
            setCurrentTicketId(existingTicketId);
            ticketId = existingTicketId;
          }
        }

        // Criar novo ticket se não existir
        if (!ticketId) {
          console.log('🔵 [PORTAL Payment] Criando ticket ao gerar PIX...');
          const ticket = await createTicket(formData, certificateType, state, selectedPlan);
          
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
        if (ticketId && !isTestMode) {
          setIsLoadingPix(true);
          try {
            const docNumber = (formData.cpf || formData.cnpj || '').toString().replace(/\D/g, '');
            const phone = parsePhoneNumber(formData.telefone || '');
            
            const transaction = await createPixTransaction({
              amount: formatAmountToCents(selectedPlan.price),
              customer: {
                name: formData.nomeCompleto || formData.nome || 'Cliente',
                email: formData.email || '',
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
            
            // Iniciar polling para verificar status do pagamento
            startPolling(transaction.id, ticketId);
            
            toast({
              title: "QR Code PIX gerado!",
              description: "Escaneie o QR Code ou copie a chave PIX para pagar.",
            });
          } catch (error) {
            console.error('❌ [PORTAL Payment] Erro ao criar transação PIX:', error);
            toast({
              title: "Erro ao gerar PIX",
              description: error instanceof Error ? error.message : "Tente novamente ou use o botão de teste.",
              variant: "destructive",
            });
          } finally {
            setIsLoadingPix(false);
          }
        }
      } catch (error) {
        console.error('❌ [PORTAL Payment] Erro ao inicializar pagamento:', error);
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
      } catch (error) {
        console.error('❌ [PORTAL Payment] Erro ao verificar status:', error);
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
    const SOLICITE_LINK_URL = import.meta.env.VITE_SOLICITE_LINK_URL || 'http://localhost:8080';
    
    const ticketCodigo = ticket?.codigo || '';
    const planoNome = selectedPlan.name || '';
    const planoId = selectedPlan.id || 'padrao';
    const email = formData.email || '';
    
    const obrigadoUrl = new URL(`${SOLICITE_LINK_URL}/obrigado`);
    obrigadoUrl.searchParams.set('codigo', ticketCodigo);
    obrigadoUrl.searchParams.set('plano', planoNome);
    obrigadoUrl.searchParams.set('planoId', planoId);
    obrigadoUrl.searchParams.set('email', email);
    obrigadoUrl.searchParams.set('tipo', certificateType);
    
    // Salvar no localStorage como fallback
    if (ticketCodigo) localStorage.setItem('ticketCodigo', ticketCodigo);
    if (planoNome) localStorage.setItem('planoNome', planoNome);
    if (planoId) localStorage.setItem('planoId', planoId);
    if (email) localStorage.setItem('ticketEmail', email);
    if (certificateType) localStorage.setItem('tipoCertidao', certificateType);
    
    // Redirecionar para SOLICITE LINK
    window.location.href = obrigadoUrl.toString();
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
        title: "Chave PIX copiada!",
        description: "Cole no seu aplicativo de banco.",
      });
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast({
        title: "Erro ao copiar",
        description: "Tente copiar manualmente.",
        variant: "destructive",
      });
    }
  };

  const handleTestPayment = async () => {
    setIsProcessing(true);
    
    console.log('🔵 [PORTAL Payment] Iniciando pagamento...');
    console.log('🔵 [PORTAL Payment] Ticket atual:', currentTicketId);
    
    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    // Atualizar ticket existente para EM_OPERACAO
    if (currentTicketId) {
      try {
        console.log('🔵 [PORTAL Payment] Atualizando ticket para EM_OPERACAO...');
        // Buscar ticket atual para pegar histórico existente
        const currentTicket = await findTicket(currentTicketId);
        const existingHistorico = currentTicket?.historico || [];
        
        const newHistoricoItem = {
          id: `h-${Date.now()}`,
          dataHora: new Date().toISOString(),
          autor: 'Sistema',
          statusAnterior: 'GERAL' as const,
          statusNovo: 'EM_OPERACAO' as const,
          mensagem: 'Pagamento confirmado. Ticket em processamento.',
          enviouEmail: false
        };
        
        const success = await updateTicket(currentTicketId, {
          status: 'EM_OPERACAO',
          historico: [...existingHistorico, newHistoricoItem]
        });
        
        if (success) {
          const updatedTicket = await findTicket(currentTicketId);
          console.log('✅ [PORTAL Payment] Ticket atualizado para EM_OPERACAO:', updatedTicket?.codigo);
          
          // Enviar confirmação de pagamento (email e WhatsApp)
          try {
            console.log('📧 [PORTAL Payment] Enviando confirmação de pagamento...');
            const confirmationResult = await sendPaymentConfirmation(currentTicketId);
            
            // Log detalhado do resultado
            console.log('📧 [PORTAL Payment] Resultado completo da confirmação:', JSON.stringify(confirmationResult, null, 2));
            
            const emailSuccess = confirmationResult.email?.success || confirmationResult.email?.alreadySent;
            const whatsappSuccess = confirmationResult.whatsapp?.success || confirmationResult.whatsapp?.alreadySent;
            const emailError = confirmationResult.email?.error;
            const whatsappError = confirmationResult.whatsapp?.error;
            
            console.log(`📧 [PORTAL Payment] Status - Email: ${emailSuccess ? '✅' : '❌'} WhatsApp: ${whatsappSuccess ? '✅' : '❌'}`);
            if (emailError) console.error('❌ [PORTAL Payment] Erro no email:', emailError);
            if (whatsappError) console.error('❌ [PORTAL Payment] Erro no WhatsApp:', whatsappError);
            
            if (emailSuccess && whatsappSuccess) {
              toast({
                title: "Pagamento confirmado!",
                description: `Ticket ${updatedTicket?.codigo} está sendo processado. Confirmação enviada por email e WhatsApp.`,
              });
            } else if (emailSuccess || whatsappSuccess) {
              const channels = [];
              if (emailSuccess) channels.push('email');
              if (whatsappSuccess) channels.push('WhatsApp');
              const errors = [];
              if (emailError) errors.push(`Email: ${emailError}`);
              if (whatsappError) errors.push(`WhatsApp: ${whatsappError}`);
              
              toast({
                title: "Pagamento confirmado!",
                description: `Ticket ${updatedTicket?.codigo} está sendo processado. Confirmação enviada por ${channels.join(' e ')}. ${errors.length > 0 ? 'Erros: ' + errors.join(', ') : ''}`,
                variant: "default",
              });
            } else {
              const errors = [];
              if (emailError) errors.push(`Email: ${emailError}`);
              if (whatsappError) errors.push(`WhatsApp: ${whatsappError}`);
              const errorMsg = errors.length > 0 ? errors.join(', ') : (confirmationResult.error || 'Erro desconhecido');
              
              console.error('❌ [PORTAL Payment] Falha ao enviar confirmações:', errorMsg);
              toast({
                title: "Pagamento confirmado!",
                description: `Ticket ${updatedTicket?.codigo} está sendo processado. Aviso: Não foi possível enviar confirmações. ${errorMsg}`,
                variant: "destructive",
              });
            }
          } catch (confirmationError) {
            console.error('❌ [PORTAL Payment] Erro ao enviar confirmação:', confirmationError);
            // Não bloquear o fluxo se a confirmação falhar
            toast({
              title: "Pagamento confirmado!",
              description: `Ticket ${updatedTicket?.codigo} está sendo processado.`,
            });
          }
        } else {
          console.error('❌ [PORTAL Payment] Falha ao atualizar ticket');
          toast({
            title: "Aviso",
            description: "Ticket não foi atualizado. Verifique o console.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('❌ [PORTAL Payment] Erro ao atualizar ticket:', error);
        toast({
          title: "Erro",
          description: "Erro ao atualizar ticket. Verifique o console.",
          variant: "destructive",
        });
      }
    } else {
      // Se não há ticket, criar um novo (fallback)
      console.warn('⚠️ [PORTAL Payment] Nenhum ticket encontrado, criando novo...');
      const ticket = await createTicket(formData, certificateType, state, selectedPlan);
      if (ticket) {
        const newHistoricoItem = {
          id: `h-${Date.now()}`,
          dataHora: new Date().toISOString(),
          autor: 'Sistema',
          statusAnterior: 'GERAL' as const,
          statusNovo: 'EM_OPERACAO' as const,
          mensagem: 'Pagamento confirmado. Ticket em processamento.',
          enviouEmail: false
        };
        
        await updateTicket(ticket.id, {
          status: 'EM_OPERACAO',
          historico: [newHistoricoItem]
        });
        setCurrentTicketId(ticket.id);
        
        // Enviar confirmação de pagamento (email e WhatsApp)
        try {
          console.log('📧 [PORTAL Payment] Enviando confirmação de pagamento...');
          const confirmationResult = await sendPaymentConfirmation(ticket.id);
          
          if (confirmationResult.success) {
            const emailStatus = confirmationResult.email?.success ? '✅' : '❌';
            const whatsappStatus = confirmationResult.whatsapp?.success ? '✅' : '❌';
            console.log(`📧 [PORTAL Payment] Confirmação enviada - Email: ${emailStatus} WhatsApp: ${whatsappStatus}`);
            
            toast({
              title: "Pagamento confirmado!",
              description: `Ticket ${ticket.codigo} está sendo processado. Confirmação enviada por ${confirmationResult.email?.success ? 'email' : ''}${confirmationResult.email?.success && confirmationResult.whatsapp?.success ? ' e ' : ''}${confirmationResult.whatsapp?.success ? 'WhatsApp' : ''}.`,
            });
          } else {
            console.warn('⚠️ [PORTAL Payment] Erro ao enviar confirmação:', confirmationResult.error);
            toast({
              title: "Pagamento confirmado!",
              description: `Ticket ${ticket.codigo} está sendo processado. ${confirmationResult.error ? 'Aviso: ' + confirmationResult.error : ''}`,
            });
          }
        } catch (confirmationError) {
          console.error('❌ [PORTAL Payment] Erro ao enviar confirmação:', confirmationError);
          // Não bloquear o fluxo se a confirmação falhar
          toast({
            title: "Pagamento confirmado!",
            description: `Ticket ${ticket.codigo} está sendo processado.`,
          });
        }
      }
    }
    
    // Redirecionar para página de obrigado
    const ticket = currentTicketId ? await findTicket(currentTicketId) : null;
    if (ticket) {
      redirectToThankYou(ticket);
    }
  };

  const handleChangePlan = () => {
    navigate("/selecionar-servico", {
      state: {
        formData,
        certificateType,
        state,
      },
    });
  };

  return (
    <Layout>
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
            <h1 className="font-heading text-2xl font-bold text-primary-foreground">
              Pagamento via PIX
            </h1>
            <p className="mt-1 text-sm text-primary-foreground/80">
              Siga os passos abaixo para realizar o pagamento
            </p>
          </div>
        </div>
      </section>

      {/* Payment Content */}
      <section className="py-8">
        <div className="container max-w-5xl">
          {/* Step by Step Instructions */}
          <div className="mb-6 bg-accent/30 rounded-xl p-4 border border-border">
            <h3 className="font-heading font-bold text-foreground mb-3 text-center">
              Como pagar com PIX
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">Abra o app do seu banco</p>
                  <p className="text-xs text-muted-foreground">Acesse a área PIX</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">Escaneie ou cole a chave</p>
                  <p className="text-xs text-muted-foreground">Use o QR Code ou copie a chave</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">Confirme o pagamento</p>
                  <p className="text-xs text-muted-foreground">Valor: {formatPrice(selectedPlan.price)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* QR Code Section */}
            <Card className="p-5">
              <div className="text-center">
                <h2 className="font-heading text-base font-bold text-foreground mb-3">
                  QR Code PIX
                </h2>
                
                {/* QR Code PIX */}
                {isLoadingPix ? (
                  <div className="bg-card border-2 border-border rounded-xl p-3 inline-block mb-3">
                    <div className="w-40 h-40 bg-foreground/5 rounded-lg flex items-center justify-center">
                      <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  </div>
                ) : pixQrCode ? (
                  <>
                    <div className="bg-card border-2 border-border rounded-xl p-3 inline-block mb-3">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(pixQrCode)}`}
                        alt="QR Code PIX"
                        className="w-40 h-40 mx-auto"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      Aponte a câmera do seu celular para o QR Code
                    </p>
                  </>
                ) : (
                  <>
                    <div className="bg-card border-2 border-border rounded-xl p-3 inline-block mb-3">
                      <div className="w-40 h-40 bg-foreground/5 rounded-lg flex items-center justify-center">
                        <QrCode className="h-28 w-28 text-foreground/40" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      {isTestMode ? 'Modo de teste - Use o botão abaixo para simular pagamento' : 'Aguarde o QR Code ser gerado...'}
                    </p>
                  </>
                )}

                {/* PIX Key */}
                {(pixQrCode || isTestMode) && (
                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-2">Ou copie a chave PIX:</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-sm bg-background rounded px-3 py-2 font-mono truncate">
                        {pixQrCode || 'Aguardando geração...'}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyPix}
                        className="flex-shrink-0"
                        disabled={!pixQrCode}
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-primary" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Order Summary */}
            <Card className="p-5">
              <h2 className="font-heading text-base font-bold text-foreground mb-3">
                Resumo do Pedido
              </h2>

              <div className="space-y-3">
                {/* Plan Info */}
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-foreground text-sm">
                      {selectedPlan.name}
                    </span>
                    <span className="font-heading font-bold text-primary">
                      {formatPrice(selectedPlan.price)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {selectedPlan.description}
                  </p>
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
                {pixTransaction?.pix_expiration_date && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-accent/50 rounded-lg p-2">
                    <Clock className="h-3 w-3 flex-shrink-0" />
                    <span>
                      O PIX expira em {new Date(pixTransaction.pix_expiration_date).toLocaleString('pt-BR')}
                    </span>
                  </div>
                )}

                {/* Security Notice */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Shield className="h-3 w-3 flex-shrink-0" />
                  <span>Pagamento 100% seguro e criptografado</span>
                </div>

                {/* Test Button */}
                <div className="pt-3 border-t border-border">
                  <Button
                    onClick={handleTestPayment}
                    className="w-full"
                    size="sm"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                        Processando...
                      </>
                    ) : (
                      "🧪 Simular Pagamento (Teste)"
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Botão de teste para simular confirmação
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Payment;
