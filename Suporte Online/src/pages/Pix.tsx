import { Copy, CheckCircle, ArrowLeft, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { createPixTransaction, getTransactionStatus, formatAmountToCents, parsePhoneNumber } from "@/lib/pagarmeService";
import { findTicket } from "@/lib/ticketService";

const BASE_PRICE = 39.90;

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
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const transactionCreatedAtRef = useRef<number | null>(null); // Timestamp da criação da transação
  const initialStatusRef = useRef<string | null>(null); // Status inicial da transação (para detectar mudança real)

  // Obter dados do location.state
  const ticketId = location.state?.ticketId;
  const ticketCode = location.state?.ticketCode;
  const formData = location.state?.formData;

  useEffect(() => {
    // Se não tiver dados do ticket, redirecionar para início
    if (!ticketId || !formData) {
      console.warn('⚠️ [Pix] Dados do ticket não encontrados, redirecionando...');
      navigate("/");
      return;
    }

    const initializePayment = async () => {
      try {
        setIsLoadingPix(true);

        // Preparar dados do cliente
        const docNumber = formData.cpfCnpj.replace(/\D/g, '');
        const phone = parsePhoneNumber(formData.telefone);

        console.log('📦 [Pix] Iniciando criação de transação PIX...', {
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
            certificate_type: 'Antecedentes Criminais',
          },
        });

        console.log('✅ [Pix] Transação PIX criada:', transaction.id);
        console.log('✅ [Pix] Dados da transação:', {
          id: transaction.id,
          status: transaction.status,
          pix_qr_code: transaction.pix_qr_code ? `Presente (${transaction.pix_qr_code.length} chars)` : 'Ausente',
          pix_qr_code_preview: transaction.pix_qr_code ? transaction.pix_qr_code.substring(0, 50) + '...' : 'N/A',
          pix_expiration_date: transaction.pix_expiration_date,
        });
        
        // Validar se temos QR Code (string completa)
        if (!transaction.pix_qr_code) {
          console.error('❌ [Pix] ERRO CRÍTICO: QR Code não foi gerado!', transaction);
          throw new Error('QR Code não foi gerado pela API do Pagar.me. Tente novamente.');
        }
        
        setPixTransaction(transaction);
        // IMPORTANTE: Usar pix_qr_code (string) para gerar QR Code com QRCodeSVG
        setPixQrCode(transaction.pix_qr_code || null);
        setPixCode(transaction.pix_qr_code || "");
        setPixExpirationDate(transaction.pix_expiration_date || null);
        
        // IMPORTANTE: Registrar timestamp da criação da transação e status inicial
        transactionCreatedAtRef.current = Date.now();
        initialStatusRef.current = transaction.status; // CRÍTICO: Armazenar status inicial
        console.log('✅ [Pix] Transação criada em:', new Date(transactionCreatedAtRef.current).toLocaleTimeString('pt-BR'));
        console.log('📋 [Pix] Status inicial da transação:', transaction.status);
        
        // IMPORTANTE: Se status já for "paid" na criação, é sandbox/teste - NUNCA processar
        if (transaction.status === 'paid') {
          console.warn('⚠️ [Pix] ATENÇÃO CRÍTICA: Transação criada com status "paid" (sandbox/teste).');
          console.warn('⚠️ [Pix] Sistema NUNCA processará este status. Aguardando pagamento REAL via Pagar.me.');
        } else {
          console.log('✅ [Pix] Status inicial válido:', transaction.status, '- Sistema aguardará mudança para "paid"');
        }
        
        // Log final para debug
        console.log('✅ [Pix] Estados definidos:', {
          pixQrCode: transaction.pix_qr_code ? `OK (${transaction.pix_qr_code.length} chars)` : 'NULL',
          pixCode: transaction.pix_qr_code ? transaction.pix_qr_code.substring(0, 50) + '...' : 'VAZIO',
        });

        // IMPORTANTE: Parar loading após definir os valores
        // Isso garante que o QR Code seja sempre exibido antes de qualquer verificação
        setIsLoadingPix(false);

        // IMPORTANTE: Iniciar polling IMEDIATAMENTE - sem delays
        // O sistema só processará quando status mudar de não-paid para paid
        console.log('🔍 [Pix] Iniciando verificação de pagamento IMEDIATAMENTE...');
        startPolling(transaction.id, ticketId);
      } catch (error) {
        console.error('❌ [Pix] Erro ao criar transação PIX:', error);
        
        // Mensagem de erro mais detalhada
        let errorMessage = 'Erro ao gerar QR Code PIX.';
        
        if (error instanceof Error) {
          const errorMsg = error.message.toLowerCase();
          
          // Verificar se é erro de conexão (sync-server não está rodando)
          if (errorMsg.includes('failed to fetch') || 
              errorMsg.includes('networkerror') || 
              errorMsg.includes('network error') ||
              errorMsg.includes('err_connection_refused')) {
            errorMessage = 'Não foi possível conectar ao servidor. Verifique se o sync-server está rodando na porta 3001.';
          } else if (errorMsg.includes('404')) {
            errorMessage = 'Endpoint não encontrado. Verifique se o sync-server está configurado corretamente.';
          } else if (errorMsg.includes('401') || errorMsg.includes('403')) {
            errorMessage = 'Erro de autenticação. Verifique a configuração da API Key.';
          } else {
            errorMessage = `Erro: ${error.message}`;
          }
        }
        
        // Mostrar erro ao usuário
        alert(errorMessage);
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

  // Função para iniciar polling do status do pagamento
  const startPolling = (transactionId: string, ticketId: string) => {
    // Limpar intervalo anterior se existir
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // IMPORTANTE: SEM DELAYS - iniciar polling IMEDIATAMENTE
    // O sistema só processará quando status mudar de não-paid para paid
    const POLLING_INTERVAL = 5000; // Verificar a cada 5 segundos
    
    console.log('🔍 [Pix] Iniciando verificação de status do pagamento IMEDIATAMENTE...');
    console.log('🔍 [Pix] Status inicial:', initialStatusRef.current, '- Sistema aguardará mudança para "paid"');
    
    // Verificar status a cada 5 segundos - SEM DELAY INICIAL
    pollingIntervalRef.current = setInterval(async () => {
        try {
          // Webhook only: checar ticket atualizado pelo backend
          try {
            const currentTicket = await findTicket(ticketId);
            if (currentTicket?.status === 'EM_OPERACAO') {
              console.log('✅ [Pix] Webhook confirmou pagamento. Ticket:', currentTicket.codigo);
              setIsProcessing(false);
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
              }
              navigate("/obrigado", {
                state: {
                  ticketCode: currentTicket.codigo,
                  ticketId: ticketId,
                },
              });
              return;
            }
          } catch (ticketError) {
            console.warn('⚠️ [Pix] Erro ao consultar status do ticket:', ticketError);
          }

          const status = await getTransactionStatus(transactionId);
          const initialStatus = initialStatusRef.current;
          
          console.log('🔍 [Pix] Status do pagamento:', status.status, `(inicial: ${initialStatus || 'N/A'})`);

          // Verificar se PIX expirou
          if (status.pix_expiration_date) {
            const expirationDate = new Date(status.pix_expiration_date);
            const now = new Date();
            if (now > expirationDate) {
              console.warn('⚠️ [Pix] PIX expirado');
              
              // Parar polling
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
              }

              alert("O QR Code PIX expirou. Recarregue a página para gerar um novo código.");
              setIsLoadingPix(false);
              setPixQrCode(null);
              setPixTransaction(null);
              return;
            }
          }

          // Webhook only: nunca processar pagamento no frontend
          if (status.status === 'paid') {
            setIsProcessing(true);
            console.log('⏳ [Pix] Status pago detectado pela API, aguardando confirmação via webhook...');
            return;
          } else if (status.status === 'refused' || status.status === 'refunded') {
            // Pagamento recusado ou estornado
            console.warn('⚠️ [Pix] Pagamento recusado ou estornado:', status.status);
            
            // Parar polling
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }

            alert("O pagamento foi recusado ou estornado. Tente novamente.");
          } else {
            setIsProcessing(false);
          }
          // Se status for 'pending_payment' ou 'processing', continuar polling
        } catch (error) {
          console.error('❌ [Pix] Erro ao verificar status:', error);
          // Não parar polling em caso de erro - pode ser temporário
        }
      }, POLLING_INTERVAL);
  };

  // Pagamento confirmado apenas via webhook (backend)

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-4">
        <div className="container">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao início
          </button>
        </div>
      </header>

      <main className="container py-12 md:py-20">
        <div className="max-w-xl mx-auto">
          {/* Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 text-accent mb-4">
              <Clock className="w-8 h-8" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Pagamento via PIX
            </h1>
            <p className="text-muted-foreground">
              Efetue o Pagamento para Continuar
            </p>
          </div>

          {/* Payment Card */}
          <div className="bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm">
            {/* Value */}
            <div className="text-center mb-8 pb-6 border-b border-border">
              <p className="text-sm text-muted-foreground mb-1">Valor do serviço</p>
              <p className="text-4xl font-bold text-foreground">R$ {BASE_PRICE.toFixed(2).replace('.', ',')}</p>
            </div>

            {isLoadingPix ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Gerando QR Code PIX...</p>
              </div>
            ) : pixQrCode ? (
              <>
                {/* QR Code - Gerado a partir da string usando QRCodeSVG */}
                <div className="flex justify-center mb-6">
                  <div className="bg-white border-2 border-border rounded-xl p-4">
                    <QRCodeSVG 
                      value={pixQrCode}
                      size={220}
                      level="M"
                      includeMargin={false}
                      className="mx-auto w-48 h-48"
                    />
                  </div>
                </div>

                {/* PIX Code */}
                <div className="space-y-4">
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
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">
                      QR Code válido até: {new Date(pixExpirationDate).toLocaleString("pt-BR")}
                    </p>
                  </div>
                )}

                {/* Processing Status */}
                {isProcessing && (
                  <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <p className="text-sm font-medium">Aguardando confirmação via webhook...</p>
                    </div>
                  </div>
                )}
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

            {/* Instructions */}
            <div className="mt-6 p-4 bg-accent/5 rounded-lg border border-accent/20">
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
          </div>

          {/* Security Notice */}
          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              🔒 Pagamento seguro • Seus dados estão protegidos
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
