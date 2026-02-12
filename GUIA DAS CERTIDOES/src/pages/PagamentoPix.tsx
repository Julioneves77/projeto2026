import { Copy, CheckCircle, ArrowLeft, Clock, Loader2, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import Header from "@/components/Header";
import { createPixTransaction, formatAmountToCents, parsePhoneNumber } from "@/lib/pagarmeService";
import { findTicket } from "@/lib/ticketService";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const BASE_PRICE = 59.37;

const PagamentoPix = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const service = (location.state as any)?.service || "Certidão";
  const formData = (location.state as any)?.formData || {};
  const ticketId = location.state?.ticketId;
  const ticketCode = location.state?.ticketCode;
  
  const [copied, setCopied] = useState(false);
  const [isLoadingPix, setIsLoadingPix] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pixQrCode, setPixQrCode] = useState<string | null>(null);
  const [pixCode, setPixCode] = useState<string>("");
  const [pixExpirationDate, setPixExpirationDate] = useState<string | null>(null);
  const [pixTransaction, setPixTransaction] = useState<any>(null);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Debug: Log dos dados recebidos
  useEffect(() => {
    console.log('📋 [Guia das Certidões] Dados recebidos na página PIX:', {
      ticketId,
      ticketCode,
      service,
      hasFormData: !!formData
    });
  }, [ticketId, ticketCode, service, formData]);

  useEffect(() => {
    // Se não tiver dados do ticket, redirecionar para início
    if (!ticketId || !formData || !formData.email) {
      console.warn('⚠️ [Guia das Certidões] Dados do ticket não encontrados, redirecionando...');
      navigate("/");
      return;
    }

    const initializePayment = async () => {
      try {
        setIsLoadingPix(true);

        // Extrair documento do formData
        let docNumber = '';
        if (formData.cpf) {
          docNumber = formData.cpf.replace(/\D/g, '');
        } else if (formData.cnpj) {
          docNumber = formData.cnpj.replace(/\D/g, '');
        } else if (formData.documento) {
          docNumber = formData.documento.replace(/\D/g, '');
        } else if (formData.cpfOuCnpj) {
          docNumber = formData.cpfOuCnpj.replace(/\D/g, '');
        }

        // Extrair nome completo
        const nomeCompleto = formData.nomeCompleto || formData.nome || formData.nomeCompletoOuRazao || formData.razaoSocial || 'Cliente';
        
        // Extrair telefone
        const telefone = formData.celular || '';
        const phone = parsePhoneNumber(telefone);

        console.log('📦 [Guia das Certidões] Iniciando criação de transação PIX...', {
          amount: BASE_PRICE,
          customer: nomeCompleto,
          syncServerUrl: import.meta.env.VITE_SYNC_SERVER_URL || 'http://localhost:3001',
        });

        // Criar transação PIX via Pagar.me
        const transaction = await createPixTransaction({
          amount: formatAmountToCents(BASE_PRICE),
          customer: {
            name: nomeCompleto,
            email: formData.email,
            document_number: docNumber || '00000000000', // Fallback se não tiver documento
            ...(phone && { phone }),
          },
          metadata: {
            ticket_id: ticketId,
            ticket_code: ticketCode,
            certificate_type: service,
          },
        });

        console.log('✅ [Guia das Certidões] Transação PIX criada:', transaction.id);
        console.log('✅ [Guia das Certidões] Dados da transação:', {
          id: transaction.id,
          status: transaction.status,
          pix_qr_code: transaction.pix_qr_code ? `Presente (${transaction.pix_qr_code.length} chars)` : 'Ausente',
          pix_expiration_date: transaction.pix_expiration_date,
        });
        
        // Validar se temos QR Code (string completa)
        if (!transaction.pix_qr_code) {
          console.error('❌ [Guia das Certidões] ERRO CRÍTICO: QR Code não foi gerado!', transaction);
          throw new Error('QR Code não foi gerado pela API do Pagar.me. Tente novamente.');
        }
        
        setPixTransaction(transaction);
        // IMPORTANTE: Usar pix_qr_code (string) para gerar QR Code com QRCodeSVG
        setPixQrCode(transaction.pix_qr_code || null);
        setPixCode(transaction.pix_qr_code || "");
        setPixExpirationDate(transaction.pix_expiration_date || null);
        
        // IMPORTANTE: Parar loading após definir os valores
        setIsLoadingPix(false);
        setIsProcessing(true); // Marcar como processando para mostrar status

        // IMPORTANTE: Iniciar polling IMEDIATAMENTE
        console.log('🔍 [Guia das Certidões] Iniciando verificação de pagamento IMEDIATAMENTE...');
        console.log('🔍 [Guia das Certidões] Ticket ID para polling:', ticketId);
        startPolling(ticketId);
      } catch (error) {
        console.error('❌ [Guia das Certidões] Erro ao criar transação PIX:', error);
        
        // Mensagem de erro mais detalhada
        let errorMessage = 'Erro ao gerar QR Code PIX.';
        
        if (error instanceof Error) {
          const errorMsg = error.message.toLowerCase();
          
          // Verificar se é erro de conexão (sync-server não está rodando)
          if (errorMsg.includes('failed to fetch') || 
              errorMsg.includes('networkerror') || 
              errorMsg.includes('network error') ||
              errorMsg.includes('err_connection_refused')) {
            errorMessage = 'Não foi possível conectar ao servidor. Verifique se o sync-server está rodando.';
          } else if (errorMsg.includes('404')) {
            errorMessage = 'Endpoint não encontrado. Verifique se o sync-server está configurado corretamente.';
          } else if (errorMsg.includes('401') || errorMsg.includes('403')) {
            errorMessage = 'Erro de autenticação. Verifique a configuração da API Key.';
          } else {
            errorMessage = `Erro: ${error.message}`;
          }
        }
        
        // Mostrar erro ao usuário
        toast.error(errorMessage);
        setIsLoadingPix(false);
      }
    };

    initializePayment();

    // Limpar polling ao desmontar
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [ticketId, ticketCode, formData, service, navigate]);

  // Função para iniciar polling do status do ticket
  const startPolling = (ticketId: string) => {
    // Limpar intervalo anterior se existir
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // IMPORTANTE: SEM DELAYS - iniciar polling IMEDIATAMENTE
    const POLLING_INTERVAL = 5000; // Verificar a cada 5 segundos
    
    console.log('🔍 [Guia das Certidões] Iniciando verificação de status do ticket IMEDIATAMENTE...');
    
    // Verificar status a cada 5 segundos - SEM DELAY INICIAL
    // Primeira verificação imediata
    (async () => {
      try {
        const currentTicket = await findTicket(ticketId);
        
        if (!currentTicket) {
          console.warn('⚠️ [Guia das Certidões] Ticket não encontrado na verificação inicial:', ticketId);
          return;
        }
        
        const ticketStatus = currentTicket.status?.toUpperCase() || '';
        console.log('🔍 [Guia das Certidões] Verificação inicial - Status do ticket:', {
          status: ticketStatus,
          statusOriginal: currentTicket.status,
          ticketId: ticketId,
          codigo: currentTicket.codigo
        });
        
        // Verificar se status é EM_OPERACAO (case-insensitive)
        if (ticketStatus === 'EM_OPERACAO' || ticketStatus === 'EM OPERACAO') {
          console.log('✅ [Guia das Certidões] Pagamento já confirmado! Redirecionando...');
          console.log('✅ [Guia das Certidões] Ticket:', currentTicket.codigo);
          
          setIsProcessing(false);
          
          setTimeout(() => {
            navigate("/obrigado", {
              state: {
                ticketCode: currentTicket.codigo,
                ticketId: ticketId,
                formData: formData,
                service: service,
              },
              replace: true
            });
          }, 100);
          
          return;
        }
      } catch (error) {
        console.error('❌ [Guia das Certidões] Erro na verificação inicial:', error);
      }
    })();

    // Verificar status a cada 5 segundos
    pollingIntervalRef.current = setInterval(async () => {
        try {
          // Verificar status do ticket (webhook atualiza para EM_OPERACAO quando pago)
          const currentTicket = await findTicket(ticketId);
          
          if (!currentTicket) {
            console.warn('⚠️ [Guia das Certidões] Ticket não encontrado durante polling:', ticketId);
            return;
          }
          
          const ticketStatus = currentTicket.status?.toUpperCase() || '';
          console.log('🔍 [Guia das Certidões] Verificando status do ticket:', {
            status: ticketStatus,
            statusOriginal: currentTicket.status,
            ticketId: ticketId,
            codigo: currentTicket.codigo
          });
          
          // Verificar se status é EM_OPERACAO (case-insensitive)
          if (ticketStatus === 'EM_OPERACAO' || ticketStatus === 'EM OPERACAO') {
            console.log('✅ [Guia das Certidões] Pagamento confirmado via webhook! Redirecionando...');
            console.log('✅ [Guia das Certidões] Ticket:', currentTicket.codigo);
            
            // Parar polling
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            
            setIsProcessing(false);
            
            // Pequeno delay para garantir que o estado foi atualizado
            setTimeout(() => {
              console.log('🔄 [Guia das Certidões] Navegando para página de confirmação...');
              navigate("/obrigado", {
                state: {
                  ticketCode: currentTicket.codigo,
                  ticketId: ticketId,
                  formData: formData,
                  service: service,
                },
                replace: true // Substituir histórico para evitar voltar para PIX
              });
            }, 100);
            
            return;
          }

          // Se status ainda for GERAL, continuar aguardando
          console.log('⏳ [Guia das Certidões] Status:', ticketStatus, '- Aguardando pagamento...');
        } catch (error) {
          console.error('❌ [Guia das Certidões] Erro ao verificar status do ticket:', error);
          // Não parar polling em caso de erro - pode ser temporário
        }
      }, POLLING_INTERVAL);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Código PIX copiado!");
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 py-8">
        <div className="container max-w-lg">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl border p-6 md:p-10"
          >
            {/* Title */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <QrCode className="w-8 h-8 text-accent" />
              </div>
              <h1 className="text-xl font-bold text-foreground mb-1">Pagamento via PIX</h1>
              <p className="text-sm text-muted-foreground mb-6">Escaneie o QR Code ou copie o código</p>
            </div>

            {/* Document info */}
            <div className="bg-primary rounded-xl p-4 mb-6 flex items-center justify-between">
              <div className="text-left">
                <p className="text-xs text-primary-foreground/70">Documento</p>
                <p className="text-primary-foreground font-semibold text-sm">{service}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-primary-foreground/70">VALOR</p>
                <p className="text-2xl font-extrabold text-accent-foreground bg-accent rounded-lg px-3 py-1">
                  R$ {BASE_PRICE.toFixed(2).replace('.', ',')}
                </p>
              </div>
            </div>

            {/* Protocol */}
            {ticketCode && (
              <div className="bg-secondary/50 rounded-xl p-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Protocolo</span>
                  <span className="font-mono font-bold text-primary">{ticketCode}</span>
                </div>
              </div>
            )}

            {isLoadingPix ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Gerando QR Code PIX...</p>
              </div>
            ) : pixQrCode ? (
              <>
                {/* QR Code */}
                <div className="bg-card border-2 border-dashed border-border rounded-xl p-8 mb-6 flex flex-col items-center">
                  <div className="bg-white p-4 rounded-lg border border-border mb-4">
                    <QRCodeSVG 
                      value={pixQrCode}
                      size={220}
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Escaneie com o app do seu banco</p>
                </div>

                {/* Copy code */}
                <div className="mb-6">
                  <p className="text-sm font-medium text-foreground mb-2">Ou copie o código PIX:</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted rounded-lg px-4 py-3 text-xs text-muted-foreground truncate font-mono text-left max-h-20 overflow-y-auto">
                      {pixCode}
                    </div>
                    <Button onClick={() => handleCopy(pixCode)} variant="outline" size="sm" className="flex-shrink-0">
                      {copied ? <CheckCircle className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                {/* Expiration Info */}
                {pixExpirationDate && (
                  <div className="mb-4 p-3 bg-muted/50 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">
                      QR Code válido até: {new Date(pixExpirationDate).toLocaleString("pt-BR")}
                    </p>
                  </div>
                )}

                {/* Processing Status - Oculto em produção */}
                {isProcessing && import.meta.env.MODE !== 'production' && (
                  <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <p className="text-sm font-medium">Aguardando confirmação via webhook...</p>
                    </div>
                  </div>
                )}

                {/* Timer */}
                <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 mb-6 flex items-center gap-3">
                  <Clock className="w-5 h-5 text-accent flex-shrink-0" />
                  <div className="text-left">
                    <p className="text-sm font-semibold text-foreground">Aguardando pagamento</p>
                    <p className="text-xs text-muted-foreground">O QR Code expira em 24 horas. Após o pagamento, seu documento será processado automaticamente.</p>
                  </div>
                </div>

                {/* Steps */}
                <div className="space-y-3 mb-6 text-left">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                    <p className="text-sm text-foreground">Abra o app do seu banco e acesse a área <strong>PIX</strong></p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                    <p className="text-sm text-foreground">Escaneie o <strong>QR Code</strong> ou cole o código copiado</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                    <p className="text-sm text-foreground">Confirme o pagamento e <strong>aguarde a aprovação instantânea</strong></p>
                  </div>
                </div>

                <p className="text-xs text-center text-muted-foreground mb-4">
                  O pagamento será confirmado automaticamente. Você será redirecionado após a confirmação.
                </p>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Erro ao gerar QR Code PIX. Tente novamente.</p>
                <Button
                  onClick={() => window.location.reload()}
                  className="mt-4"
                  variant="outline"
                >
                  Recarregar página
                </Button>
              </div>
            )}

            <Button variant="outline" onClick={() => setShowExitDialog(true)} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para o início
            </Button>
          </motion.div>
        </div>
      </main>

      {/* AlertDialog para confirmação de saída */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent className="bg-card border-border/50 max-w-[90vw] mx-4 sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground text-lg">Certeza que quer voltar?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-sm mt-2">
              Seu documento está pronto para liberação. <strong className="font-semibold text-foreground">Atenção: Este documento só poderá ser solicitado novamente após 24 horas nos órgãos responsáveis.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col mt-4">
            <AlertDialogAction 
              onClick={() => {
                // Limpar polling se estiver ativo
                if (pollingIntervalRef.current) {
                  clearInterval(pollingIntervalRef.current);
                  pollingIntervalRef.current = null;
                }
                navigate("/");
              }}
              className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Descartar Documento e Voltar
            </AlertDialogAction>
            <AlertDialogCancel className="w-full text-muted-foreground hover:text-foreground">
              Continuar aqui
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PagamentoPix;
