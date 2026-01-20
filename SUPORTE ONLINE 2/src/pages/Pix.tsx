import { Copy, CheckCircle, ArrowLeft, Clock, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
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

const BASE_PRICE = 39.97;

export default function Pix() {
  const navigate = useNavigate();
  const location = useLocation();
  const [copied, setCopied] = useState(false);
  const [isLoadingPix, setIsLoadingPix] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pixQrCode, setPixQrCode] = useState<string | null>(null);
  const [pixCode, setPixCode] = useState<string>("");
  const [pixExpirationDate, setPixExpirationDate] = useState<string | null>(null);
  const [pixTransaction, setPixTransaction] = useState<any>(null);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Obter dados do location.state
  const ticketId = location.state?.ticketId;
  const ticketCode = location.state?.ticketCode;
  const formData = location.state?.formData;

  // Debug: Log dos dados recebidos
  useEffect(() => {
    console.log('📋 [Suporte Online 2] Dados recebidos na página PIX:', {
      ticketId,
      ticketCode,
      hasFormData: !!formData
    });
  }, [ticketId, ticketCode, formData]);

  useEffect(() => {
    // Se não tiver dados do ticket, redirecionar para início
    if (!ticketId || !formData) {
      console.warn('⚠️ [Suporte Online 2] Dados do ticket não encontrados, redirecionando...');
      navigate("/iniciar");
      return;
    }

    const initializePayment = async () => {
      try {
        setIsLoadingPix(true);

        // Preparar dados do cliente
        const docNumber = formData.cpfCnpj.replace(/\D/g, '');
        const phone = parsePhoneNumber(formData.telefone);

        console.log('📦 [Suporte Online 2] Iniciando criação de transação PIX...', {
          amount: BASE_PRICE,
          customer: formData.nome,
          syncServerUrl: import.meta.env.VITE_SYNC_SERVER_URL || 'http://localhost:3001',
        });

        // Criar transação PIX via Pagar.me
        const transaction = await createPixTransaction({
          amount: formatAmountToCents(BASE_PRICE),
          customer: {
            name: formData.nome,
            email: formData.email,
            document_number: docNumber,
            ...(phone && { phone }),
          },
          metadata: {
            ticket_id: ticketId,
            ticket_code: ticketCode,
            certificate_type: 'Certidão Criminal Federal',
          },
        });

        console.log('✅ [Suporte Online 2] Transação PIX criada:', transaction.id);
        console.log('✅ [Suporte Online 2] Dados da transação:', {
          id: transaction.id,
          status: transaction.status,
          pix_qr_code: transaction.pix_qr_code ? `Presente (${transaction.pix_qr_code.length} chars)` : 'Ausente',
          pix_expiration_date: transaction.pix_expiration_date,
        });
        
        // Validar se temos QR Code (string completa)
        if (!transaction.pix_qr_code) {
          console.error('❌ [Suporte Online 2] ERRO CRÍTICO: QR Code não foi gerado!', transaction);
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
        console.log('🔍 [Suporte Online 2] Iniciando verificação de pagamento IMEDIATAMENTE...');
        console.log('🔍 [Suporte Online 2] Ticket ID para polling:', ticketId);
        startPolling(ticketId);
      } catch (error) {
        console.error('❌ [Suporte Online 2] Erro ao criar transação PIX:', error);
        
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
  }, [ticketId, ticketCode, formData, navigate]);

  // Função para iniciar polling do status do ticket
  const startPolling = (ticketId: string) => {
    // Limpar intervalo anterior se existir
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // IMPORTANTE: SEM DELAYS - iniciar polling IMEDIATAMENTE
    const POLLING_INTERVAL = 5000; // Verificar a cada 5 segundos
    
    console.log('🔍 [Suporte Online 2] Iniciando verificação de status do ticket IMEDIATAMENTE...');
    
    // Verificar status a cada 5 segundos - SEM DELAY INICIAL
    // Primeira verificação imediata
    (async () => {
      try {
        const currentTicket = await findTicket(ticketId);
        
        if (!currentTicket) {
          console.warn('⚠️ [Suporte Online 2] Ticket não encontrado na verificação inicial:', ticketId);
          return;
        }
        
        const ticketStatus = currentTicket.status?.toUpperCase() || '';
        console.log('🔍 [Suporte Online 2] Verificação inicial - Status do ticket:', {
          status: ticketStatus,
          statusOriginal: currentTicket.status,
          ticketId: ticketId,
          codigo: currentTicket.codigo
        });
        
        // Verificar se status é EM_OPERACAO (case-insensitive)
        if (ticketStatus === 'EM_OPERACAO' || ticketStatus === 'EM OPERACAO') {
          console.log('✅ [Suporte Online 2] Pagamento já confirmado! Redirecionando...');
          console.log('✅ [Suporte Online 2] Ticket:', currentTicket.codigo);
          
          setIsProcessing(false);
          
          setTimeout(() => {
            navigate("/obrigado", {
              state: {
                ticketCode: currentTicket.codigo,
                ticketId: ticketId,
              },
              replace: true
            });
          }, 100);
          
          return;
        }
      } catch (error) {
        console.error('❌ [Suporte Online 2] Erro na verificação inicial:', error);
      }
    })();

    // Verificar status a cada 5 segundos
    pollingIntervalRef.current = setInterval(async () => {
        try {
          // Verificar status do ticket (webhook atualiza para EM_OPERACAO quando pago)
          const currentTicket = await findTicket(ticketId);
          
          if (!currentTicket) {
            console.warn('⚠️ [Suporte Online 2] Ticket não encontrado durante polling:', ticketId);
            return;
          }
          
          const ticketStatus = currentTicket.status?.toUpperCase() || '';
          console.log('🔍 [Suporte Online 2] Verificando status do ticket:', {
            status: ticketStatus,
            statusOriginal: currentTicket.status,
            ticketId: ticketId,
            codigo: currentTicket.codigo
          });
          
          // Verificar se status é EM_OPERACAO (case-insensitive)
          if (ticketStatus === 'EM_OPERACAO' || ticketStatus === 'EM OPERACAO') {
            console.log('✅ [Suporte Online 2] Pagamento confirmado via webhook! Redirecionando...');
            console.log('✅ [Suporte Online 2] Ticket:', currentTicket.codigo);
            
            // Parar polling
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            
            setIsProcessing(false);
            
            // Pequeno delay para garantir que o estado foi atualizado
            setTimeout(() => {
              console.log('🔄 [Suporte Online 2] Navegando para página de confirmação...');
              navigate("/obrigado", {
                state: {
                  ticketCode: currentTicket.codigo,
                  ticketId: ticketId,
                },
                replace: true // Substituir histórico para evitar voltar para PIX
              });
            }, 100);
            
            return;
          }

          // Se status ainda for GERAL, continuar aguardando
          console.log('⏳ [Suporte Online 2] Status:', ticketStatus, '- Aguardando pagamento...');
        } catch (error) {
          console.error('❌ [Suporte Online 2] Erro ao verificar status do ticket:', error);
          // Não parar polling em caso de erro - pode ser temporário
        }
      }, POLLING_INTERVAL);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="min-h-screen gradient-hero">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">Suporte Online</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowExitDialog(true)}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Voltar
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-lg">
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} className="bg-card rounded-2xl shadow-elevated border border-border/50 p-6 md:p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Pagamento via PIX</h1>
            <p className="text-muted-foreground text-sm">Efetue o Pagamento e Receba sua Solicitação por Email</p>
          </div>

          {/* Protocol & Value */}
          {ticketCode && (
            <div className="bg-secondary/50 rounded-xl p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Protocolo</span>
                <span className="font-mono font-bold text-primary">{ticketCode}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Valor</span>
                <span className="text-xl font-bold text-foreground">
                  R$ {BASE_PRICE.toFixed(2).replace('.', ',')}
                </span>
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
              {/* QR Code - Gerado a partir da string usando QRCodeSVG */}
              <div className="bg-card border border-border rounded-xl p-6 mb-6">
                <div className="flex justify-center">
                  <div className="bg-white p-4 rounded-xl border border-border">
                    <QRCodeSVG 
                      value={pixQrCode}
                      size={220}
                      level="M"
                      includeMargin={false}
                      className="mx-auto w-48 h-48"
                    />
                  </div>
                </div>
              </div>

              {/* PIX Code */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Código PIX Copia e Cola
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-muted rounded-lg px-4 py-3 text-xs text-muted-foreground font-mono break-all max-h-20 overflow-y-auto">
                      {pixCode}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleCopy(pixCode)}
                      className="shrink-0"
                    >
                      {copied ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
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

              {/* Instructions */}
              <div className="p-4 bg-accent/5 rounded-lg border border-accent/20">
                <h3 className="font-medium text-foreground mb-2 text-sm">Como pagar:</h3>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Abra o app do seu banco</li>
                  <li>Escolha pagar via PIX</li>
                  <li>Escaneie o QR Code ou cole o código</li>
                  <li>Confirme o pagamento</li>
                </ol>
              </div>

              <p className="text-xs text-center text-muted-foreground mt-4">
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
        </motion.div>
      </div>

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
}
