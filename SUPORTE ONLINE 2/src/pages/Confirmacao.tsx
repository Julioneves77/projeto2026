import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Mail, Clock, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getUserData, getMeta } from '@/lib/storage';
import { findTicket } from '@/lib/ticketService';

// Declaração de tipo para Google Tag Manager
declare global {
  interface Window {
    dataLayer: any[];
  }
}

export default function Confirmacao() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sending, setSending] = useState(true);
  const [loading, setLoading] = useState(true);
  const [ticketData, setTicketData] = useState<any>(null);
  const userData = getUserData();
  
  // Obter dados do location.state
  const ticketCode = location.state?.ticketCode;
  const ticketId = location.state?.ticketId;
  const formDataFromState = location.state?.formData;

  // Determinar email a ser exibido (prioridade: userData > formData > ticketData)
  const displayEmail = userData?.email || formDataFromState?.email || ticketData?.email || 'Não informado';

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
        ticket_code: ticketCode || '',
        ticket_id: ticketId || ''
      });
      
      // Evento de conversão para Google Ads
      window.dataLayer.push({
        event: 'conversion',
        send_to: 'AW-CONVERSION_ID/CONVERSION_LABEL', // Será configurado no GTM
        value: 39.97,
        currency: 'BRL',
        transaction_id: ticketId || ticketCode || '',
        page_path: '/obrigado'
      });
      
      console.log('📊 [GTM] Eventos disparados para página /obrigado:', {
        page_view: true,
        conversion: true,
        ticket_code: ticketCode || '',
        ticket_id: ticketId || ''
      });
    }

    console.log('🟢 [Confirmacao] Página carregada:', {
      ticketCode,
      ticketId,
      hasUserData: !!userData,
      hasFormData: !!formDataFromState,
      locationState: location.state
    });

    // Tentar buscar dados do localStorage se não tiver no state
    let finalTicketCode = ticketCode;
    let finalTicketId = ticketId;

    if (!finalTicketCode || !finalTicketId) {
      // Tentar buscar do localStorage
      const meta = getMeta();
      if (meta?.protocolo) {
        finalTicketCode = meta.protocolo;
        console.log('📋 [Confirmacao] Código encontrado no localStorage:', finalTicketCode);
      }

      // Tentar buscar tickets do localStorage
      try {
        const TICKETS_KEY = 'so2_tickets';
        const storedTickets = localStorage.getItem(TICKETS_KEY);
        if (storedTickets) {
          const allTickets = JSON.parse(storedTickets);
          if (Array.isArray(allTickets) && allTickets.length > 0) {
            // Pegar o ticket mais recente que está pago
            const paidTicket = allTickets.find((t: any) => t.status === 'EM_OPERACAO' || meta?.paid) || allTickets[allTickets.length - 1];
            if (paidTicket) {
              finalTicketId = paidTicket.id;
              if (!finalTicketCode) {
                finalTicketCode = paidTicket.codigo;
              }
              console.log('📋 [Confirmacao] Ticket encontrado no localStorage:', {
                id: finalTicketId,
                codigo: finalTicketCode
              });
            }
          }
        }
      } catch (error) {
        console.warn('⚠️ [Confirmacao] Erro ao buscar tickets do localStorage:', error);
      }
    }

    // Se ainda não tiver dados, não redirecionar - mostrar página mesmo assim
    // O GTM já foi disparado acima, então podemos mostrar a página
    if (!finalTicketCode || !finalTicketId) {
      console.warn('⚠️ [Confirmacao] TicketCode ou TicketId não encontrado, mas mostrando página para garantir disparo do GTM');
      setLoading(false);
      // Não redirecionar - deixar a página aparecer mesmo sem dados
      return;
    }

    // Tentar buscar dados do ticket se userData não estiver disponível
    const fetchTicketData = async () => {
      if (!userData && finalTicketId) {
        try {
          console.log('🔍 [Confirmacao] Buscando dados do ticket:', finalTicketId);
          const ticket = await findTicket(finalTicketId);
          if (ticket) {
            console.log('✅ [Confirmacao] Dados do ticket encontrados:', ticket);
            setTicketData(ticket);
          } else {
            console.warn('⚠️ [Confirmacao] Ticket não encontrado via API');
          }
        } catch (error) {
          console.error('❌ [Confirmacao] Erro ao buscar ticket:', error);
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
  }, [ticketCode, ticketId, navigate, userData, formDataFromState]);

  // Buscar dados do localStorage se não tiver no state
  const meta = getMeta();
  const displayTicketCode = ticketCode || meta?.protocolo || 'N/A';
  
  // SEMPRE mostrar a página, mesmo sem dados do ticket
  // Isso garante que o GTM sempre dispara

  // Se estiver carregando dados do ticket, mostrar loading
  if (loading && !userData && !formDataFromState) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando informações...</p>
        </div>
      </div>
    );
  }
  return <div className="min-h-screen gradient-hero">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <FileText className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-foreground">Suporte Online</span>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-lg">
        <motion.div initial={{
        opacity: 0,
        scale: 0.95
      }} animate={{
        opacity: 1,
        scale: 1
      }} className="bg-card rounded-2xl shadow-elevated border border-border/50 p-6 md:p-8 text-center">
          {/* Success Icon */}
          <motion.div initial={{
          scale: 0
        }} animate={{
          scale: 1
        }} transition={{
          type: 'spring',
          stiffness: 200,
          damping: 15,
          delay: 0.2
        }} className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-success" />
          </motion.div>

          <motion.h1 initial={{
          opacity: 0,
          y: 10
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.3
        }} className="text-2xl font-bold text-foreground mb-2">
            Obrigado!
          </motion.h1>

          {/* Status Badge */}
          <motion.div initial={{
          opacity: 0,
          y: 10
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.4
        }} className="inline-flex items-center gap-2 bg-success/10 text-success px-4 py-2 rounded-full text-sm font-medium mb-6">
            {sending ? <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Encaminhando para plataforma...
              </> : <>
                <CheckCircle2 className="w-4 h-4" />
                Encaminhado para Verificação
              </>}
          </motion.div>

          {/* Info Card */}
          <motion.div initial={{
          opacity: 0,
          y: 10
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.5
        }} className="bg-secondary/50 rounded-xl p-4 mb-6 text-left">
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
                  <p className="font-medium text-foreground">Até 30 minutos</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Info Text */}
          <motion.p initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} transition={{
        delay: 0.6
      }} className="text-sm text-muted-foreground mb-6">
            O documento será encaminhado para o e-mail informado assim que estiver pronto. Aguarde o recebimento.
          </motion.p>

          {/* Support Button */}
          <motion.div initial={{
        opacity: 0,
        y: 10
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.7
      }}>
            <Button variant="outline" className="w-full" onClick={() => navigate('/')}>
              Voltar ao início
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>;
}