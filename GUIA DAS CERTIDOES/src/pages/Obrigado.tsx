import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Mail, Clock, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import { findTicket } from '@/lib/ticketService';

// Declaração de tipo para Google Tag Manager
declare global {
  interface Window {
    dataLayer: any[];
  }
}

const BASE_PRICE = 59.37;

export default function Obrigado() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sending, setSending] = useState(true);
  const [loading, setLoading] = useState(true);
  const [ticketData, setTicketData] = useState<any>(null);
  
  // Obter dados do location.state
  const ticketCode = location.state?.ticketCode;
  const ticketId = location.state?.ticketId;
  const formDataFromState = location.state?.formData;
  const service = location.state?.service || 'Certidão';

  // Determinar email a ser exibido
  const displayEmail = formDataFromState?.email || ticketData?.email || 'Não informado';
  const displayTicketCode = ticketCode || ticketData?.codigo || 'N/A';

  useEffect(() => {
    // SEMPRE disparar evento GTM primeiro, independente de ter dados ou não
    if (typeof window !== 'undefined') {
      // Garantir que dataLayer existe
      if (!window.dataLayer) {
        window.dataLayer = [];
      }
      
      // Evento de page_view para GTM
      window.dataLayer.push({
        event: 'page_view',
        page_path: '/obrigado',
        page_title: 'Obrigado - Confirmação de Pagamento',
        ticket_code: displayTicketCode,
        ticket_id: ticketId || ''
      });
      
      // Evento de conversão para Google Ads
      window.dataLayer.push({
        event: 'conversion',
        send_to: 'AW-CONVERSION_ID/CONVERSION_LABEL', // Será configurado no GTM
        value: BASE_PRICE,
        currency: 'BRL',
        transaction_id: ticketId || ticketCode || '',
        page_path: '/obrigado'
      });
      
      console.log('📊 [GTM] Eventos disparados para página /obrigado:', {
        page_view: true,
        conversion: true,
        ticket_code: displayTicketCode,
        ticket_id: ticketId || ''
      });
    }

    console.log('🟢 [Guia das Certidões] Página Obrigado carregada:', {
      ticketCode,
      ticketId,
      hasFormData: !!formDataFromState,
      service
    });

    // Tentar buscar dados do localStorage se não tiver no state
    let finalTicketCode = ticketCode;
    let finalTicketId = ticketId;

    if (!finalTicketCode || !finalTicketId) {
      // Tentar buscar tickets do localStorage
      try {
        const TICKETS_KEY = 'gdc_tickets';
        const storedTickets = localStorage.getItem(TICKETS_KEY);
        if (storedTickets) {
          const allTickets = JSON.parse(storedTickets);
          if (Array.isArray(allTickets) && allTickets.length > 0) {
            // Pegar o ticket mais recente que está pago
            const paidTicket = allTickets.find((t: any) => t.status === 'EM_OPERACAO') || allTickets[allTickets.length - 1];
            if (paidTicket) {
              finalTicketId = paidTicket.id;
              if (!finalTicketCode) {
                finalTicketCode = paidTicket.codigo;
              }
              console.log('📋 [Guia das Certidões] Ticket encontrado no localStorage:', {
                id: finalTicketId,
                codigo: finalTicketCode
              });
            }
          }
        }
      } catch (error) {
        console.warn('⚠️ [Guia das Certidões] Erro ao buscar tickets do localStorage:', error);
      }
    }

    // Se ainda não tiver dados, não redirecionar - mostrar página mesmo assim
    // O GTM já foi disparado acima, então podemos mostrar a página
    if (!finalTicketCode || !finalTicketId) {
      console.warn('⚠️ [Guia das Certidões] TicketCode ou TicketId não encontrado, mas mostrando página para garantir disparo do GTM');
      setLoading(false);
      return;
    }

    // Tentar buscar dados do ticket se formData não estiver disponível
    const fetchTicketData = async () => {
      if (!formDataFromState && finalTicketId) {
        try {
          console.log('🔍 [Guia das Certidões] Buscando dados do ticket:', finalTicketId);
          const ticket = await findTicket(finalTicketId);
          if (ticket) {
            console.log('✅ [Guia das Certidões] Dados do ticket encontrados:', ticket);
            setTicketData(ticket);
          } else {
            console.warn('⚠️ [Guia das Certidões] Ticket não encontrado via API');
          }
        } catch (error) {
          console.error('❌ [Guia das Certidões] Erro ao buscar ticket:', error);
        }
      }
      setLoading(false);
    };

    fetchTicketData();

    // Simular envio para plataforma (já foi enviado pelo webhook)
    const timer = setTimeout(() => {
      setSending(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [ticketCode, ticketId, formDataFromState, service, displayTicketCode]);

  // Se estiver carregando dados do ticket, mostrar loading
  if (loading && !formDataFromState) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Carregando informações...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 py-8">
        <div className="container max-w-lg">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-xl border p-6 md:p-10 text-center"
          >
            {/* Success Icon */}
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: 'spring',
                stiffness: 200,
                damping: 15,
                delay: 0.2
              }}
              className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-foreground mb-2"
            >
              Obrigado!
            </motion.h1>

            {/* Status Badge */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-4 py-2 rounded-full text-sm font-medium mb-6"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Encaminhando para plataforma...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Encaminhado para Verificação
                </>
              )}
            </motion.div>

            {/* Info Card */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-secondary/50 rounded-xl p-4 mb-6 text-left"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Protocolo</p>
                    <p className="font-mono font-bold text-primary">{displayTicketCode}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Documento</p>
                    <p className="font-medium text-foreground">{service}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">E-mail de envio</p>
                    <p className="font-medium text-foreground">{displayEmail}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Prazo estimado</p>
                    <p className="font-medium text-foreground">Depende da Comarca mas maioria até 2 horas</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Info Text */}
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-sm text-muted-foreground mb-6"
            >
              O documento será encaminhado para o e-mail informado assim que estiver pronto. Aguarde o recebimento.
            </motion.p>

            {/* Support Button */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Button variant="outline" className="w-full" onClick={() => navigate('/')}>
                Voltar ao início
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
