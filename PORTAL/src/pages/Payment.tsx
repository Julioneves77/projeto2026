import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Copy, Check, QrCode, Clock, Shield } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { createTicket, updateTicket, findTicket, sendPaymentConfirmation } from "@/lib/ticketService";

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
  const isTestMode = !locationState.formData;

  // Redirect if no formData or selectedPlan (unless in test mode which uses mock data)
  useEffect(() => {
    // Only redirect if we're not in test mode and missing required data
    if (!isTestMode && (!locationState.formData || !locationState.selectedPlan)) {
      navigate("/selecionar-servico", { replace: true });
    }
  }, [locationState.formData, locationState.selectedPlan, isTestMode, navigate]);

  // Criar ticket ao carregar Payment (quando PIX é gerado)
  useEffect(() => {
    const createTicketOnMount = async () => {
      // Criar identificador único baseado nos dados do formulário
      const doc = (formData.cpf || formData.cnpj || '').toString().replace(/\D/g, '');
      const sessionKey = `payment_${doc}_${certificateType}_${selectedPlan.id}`;
      
      // Verificar se já existe ticket para esta sessão
      const existingTicketId = sessionStorage.getItem(sessionKey);
      
      if (existingTicketId) {
        const existingTicket = await findTicket(existingTicketId);
        if (existingTicket && existingTicket.status === 'GERAL') {
          console.log('🔵 [PORTAL Payment] Ticket já existe:', existingTicket.codigo);
          setCurrentTicketId(existingTicketId);
          return;
        }
      }

      // Criar novo ticket com status GERAL
      console.log('🔵 [PORTAL Payment] Criando ticket ao gerar PIX...');
      const ticket = await createTicket(formData, certificateType, state, selectedPlan);
      
      if (ticket) {
        console.log('✅ [PORTAL Payment] Ticket criado ao gerar PIX:', ticket.codigo);
        setCurrentTicketId(ticket.id);
        sessionStorage.setItem(sessionKey, ticket.id);
        toast({
          title: "PIX gerado!",
          description: `Ticket ${ticket.codigo} criado. Complete o pagamento para processar.`,
        });
      } else {
        console.error('❌ [PORTAL Payment] Falha ao criar ticket ao gerar PIX');
      }
    };

    createTicketOnMount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Executar apenas uma vez ao montar

  // Mock PIX key (in real app, this would be generated dynamically)
  const pixKey = "00020126580014br.gov.bcb.pix0136a1b2c3d4-e5f6-7890-abcd-ef1234567890520400005303986540" + selectedPlan.price.toFixed(2).replace(".", "") + "5802BR5925PORTAL CERTIDOES LTDA6009SAO PAULO62070503***6304";
  const pixKeySimple = "certidoes@portalpix.com.br";

  const formatPrice = (price: number) => {
    return price.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const handleCopyPix = async () => {
    try {
      await navigator.clipboard.writeText(pixKeySimple);
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
    
    // Navigate to thank you page with all necessary data
    navigate("/obrigado", {
      state: {
        formData,
        certificateType,
        state,
        selectedPlan,
      },
      replace: false,
    });
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
                
                {/* Mock QR Code */}
                <div className="bg-card border-2 border-border rounded-xl p-3 inline-block mb-3">
                  <div className="w-40 h-40 bg-foreground/5 rounded-lg flex items-center justify-center">
                    <QrCode className="h-28 w-28 text-foreground/40" />
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mb-3">
                  Aponte a câmera do seu celular para o QR Code
                </p>

                {/* PIX Key */}
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-2">Ou copie a chave PIX:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-sm bg-background rounded px-3 py-2 font-mono truncate">
                      {pixKeySimple}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyPix}
                      className="flex-shrink-0"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-primary" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
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
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-accent/50 rounded-lg p-2">
                  <Clock className="h-3 w-3 flex-shrink-0" />
                  <span>O PIX expira em 30 minutos</span>
                </div>

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
