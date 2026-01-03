import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { pushDL } from '@/lib/dataLayer';

// Whitelist de eventos permitidos
const ALLOWED_EVENTS = [
  'portal_started',
  'portal_form_progress_25',
  'portal_form_progress_50',
  'portal_form_progress_75',
  'portal_checkout_viewed',
  'payment_completed'
];

// Mapeamento de eventos para funnel_step
const EVENT_TO_STEP: Record<string, string> = {
  'portal_started': 'portal_start',
  'portal_form_progress_25': 'form_25',
  'portal_form_progress_50': 'form_50',
  'portal_form_progress_75': 'form_75',
  'portal_checkout_viewed': 'checkout_view',
  'payment_completed': 'payment_success'
};

const EventProxy = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  useEffect(() => {
    const eventType = searchParams.get('type');
    const sessionId = searchParams.get('sid') || '';
    const meta = searchParams.get('meta') || '';
    
    // Capturar parâmetros extras para payment_completed
    const codigo = searchParams.get('codigo') || '';
    const plano = searchParams.get('plano') || '';
    const planoId = searchParams.get('planoId') || '';
    const email = searchParams.get('email') || '';
    const tipo = searchParams.get('tipo') || '';
    
    // Validar evento
    if (!eventType || !ALLOWED_EVENTS.includes(eventType)) {
      // Redirecionar para home se evento inválido
      navigate('/', { replace: true });
      return;
    }
    
    // Verificar anti-duplicidade via sessionStorage
    const storageKey = `dl_sent_${eventType}_${sessionId}`;
    if (sessionStorage.getItem(storageKey)) {
      // Evento já disparado nesta sessão, apenas redirecionar
      handleRedirect(eventType, navigate, { codigo, plano, planoId, email, tipo });
      return;
    }
    
    // Marcar como enviado
    sessionStorage.setItem(storageKey, 'true');
    
    // Disparar evento com dados extras
    pushDL(eventType, {
      funnel_step: EVENT_TO_STEP[eventType] || eventType,
      source: 'portal_proxy',
      sid: sessionId,
      meta: meta || undefined,
      referrer: document.referrer || undefined,
      // Dados do ticket para payment_completed
      ticketCodigo: codigo || undefined,
      plano: planoId || undefined,
      tipoCertidao: tipo || undefined
    });
    
    // Redirecionar após disparar evento
    handleRedirect(eventType, navigate, { codigo, plano, planoId, email, tipo });
  }, [searchParams, navigate]);
  
  // Não renderizar nada (tela invisível)
  return null;
};

interface RedirectParams {
  codigo?: string;
  plano?: string;
  planoId?: string;
  email?: string;
  tipo?: string;
}

function handleRedirect(eventType: string, navigate: Function, params: RedirectParams = {}) {
  if (eventType === 'payment_completed') {
    // Construir URL com parâmetros para página Obrigado
    const queryParams = new URLSearchParams();
    if (params.codigo) queryParams.set('codigo', params.codigo);
    if (params.plano) queryParams.set('plano', params.plano);
    if (params.planoId) queryParams.set('planoId', params.planoId);
    if (params.email) queryParams.set('email', params.email);
    if (params.tipo) queryParams.set('tipo', params.tipo);
    
    const queryString = queryParams.toString();
    const obrigadoUrl = queryString ? `/obrigado?${queryString}` : '/obrigado';
    
    // Redirecionar para página Obrigado com parâmetros
    navigate(obrigadoUrl, { replace: true });
  } else {
    // Redirecionar para home (ou rota neutra)
    navigate('/', { replace: true });
  }
}

export default EventProxy;

