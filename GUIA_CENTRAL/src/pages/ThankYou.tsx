import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Mail, MessageCircle, Clock, Home, Volume2, VolumeX } from "lucide-react";
import { scrollToTop } from "@/lib/scrollUtils";

const THANKYOU_STATE_KEY = "guia_central_thankyou_state";

const formatCertificateName = (certificateType: string): string => {
  const typeMap: Record<string, string> = {
    "criminal-federal": "Certidão Negativa Criminal Federal",
    "criminal-estadual": "Certidão Negativa Criminal Estadual",
    "civel-federal": "Certidão Negativa Cível Federal",
    "civel-estadual": "Certidão Negativa Cível Estadual",
    "policia-federal": "Antecedentes Criminais de Polícia Federal",
    "eleitoral": "Certidão de Quitação Eleitoral",
    "cnd": "Certidão Negativa de Débito (CND)",
    "cpf-regular": "Certidão CPF Regular",
  };
  return typeMap[certificateType] || certificateType;
};

const MOCK_PREVIEW = {
  formData: { nome: "João Silva", email: "joao@exemplo.com", cpf: "123.456.789-00" },
  selectedPlan: { id: "prioridade", name: "Certidão Atendimento Prioritário", description: "Processamento prioritário com especialista dedicado.", price: 54.87 },
  certificateType: "criminal-federal",
};

const ThankYou = () => {
  const location = useLocation();
  const [stateFromStorage, setStateFromStorage] = useState<{ formData?: any; selectedPlan?: any; certificateType?: string } | null>(null);
  const { formData: stateFormData, selectedPlan: stateSelectedPlan, certificateType: stateCertificateType } = location.state || {};
  const [progress, setProgress] = useState(30);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Persistir state no sessionStorage quando vindo de location.state (para suportar refresh)
  useEffect(() => {
    if (stateFormData && stateSelectedPlan) {
      try {
        sessionStorage.setItem(THANKYOU_STATE_KEY, JSON.stringify({
          formData: stateFormData,
          selectedPlan: stateSelectedPlan,
          certificateType: stateCertificateType,
        }));
      } catch {
        // ignore
      }
      return;
    }
    try {
      const stored = sessionStorage.getItem(THANKYOU_STATE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setStateFromStorage(parsed);
        sessionStorage.removeItem(THANKYOU_STATE_KEY);
      } else {
        setStateFromStorage({});
      }
    } catch {
      setStateFromStorage({});
    }
  }, [stateFormData, stateSelectedPlan, stateCertificateType]);

  // Em localhost/dev: usar mock para verificação (com ou sem ?preview=1)
  const isPreview = import.meta.env.DEV && typeof window !== "undefined";
  const formData = stateFormData || stateFromStorage?.formData || (isPreview ? MOCK_PREVIEW.formData : undefined);
  const selectedPlan = stateSelectedPlan || stateFromStorage?.selectedPlan || (isPreview ? MOCK_PREVIEW.selectedPlan : undefined);
  const certificateType = stateCertificateType || stateFromStorage?.certificateType || (isPreview ? MOCK_PREVIEW.certificateType : undefined);

  useLayoutEffect(() => {
    scrollToTop();
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setProgress((p) => Math.min(p + Math.random() * 8 + 2, 95));
    }, 1500);
    return () => clearInterval(t);
  }, []);

  const playThankYouAudio = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio("/audios/obrigado-1.mp3");
    }
    const audio = audioRef.current;
    if (audioPlaying) {
      audio.pause();
      audio.currentTime = 0;
      setAudioPlaying(false);
      return;
    }
    audio.onended = () => setAudioPlaying(false);
    audio.onerror = () => setAudioPlaying(false);
    audio.play().then(() => setAudioPlaying(true)).catch(() => setAudioPlaying(false));
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  if (!formData || !selectedPlan) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Página não encontrada
          </h1>
          <Button asChild className="mt-6">
            <Link to="/">Voltar ao Início</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const PRAZO_VARIAVEL = "O prazo pode variar conforme o tipo de certidão e a região. Em muitos casos, a entrega ocorre rapidamente, mas pode levar mais tempo em situações específicas.";

  const getDeliveryInfo = () => {
    switch (selectedPlan.id) {
      case "padrao":
        return {
          time: PRAZO_VARIAVEL,
          method: "E-mail",
          icon: <Mail className="h-6 w-6" />,
        };
      case "prioridade":
        return {
          time: PRAZO_VARIAVEL,
          method: "E-mail",
          icon: <Mail className="h-6 w-6" />,
        };
      case "premium":
        return {
          time: PRAZO_VARIAVEL,
          method: "E-mail e WhatsApp",
          icon: <MessageCircle className="h-6 w-6" />,
        };
      default:
        return {
          time: PRAZO_VARIAVEL,
          method: "E-mail",
          icon: <Mail className="h-6 w-6" />,
        };
    }
  };

  const deliveryInfo = getDeliveryInfo();

  return (
    <Layout>
      <SEOHead
        title="Pagamento Confirmado - Guia Central"
        description="Sua solicitação foi recebida com sucesso. Você receberá sua certidão em breve."
      />
      {/* Hero */}
      <section className="relative overflow-hidden bg-primary py-12 lg:py-16">
        <div className="container relative">
          <div className="animate-slide-up text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-6">
              <CheckCircle className="h-10 w-10 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-primary-foreground sm:text-4xl">
              Pagamento Confirmado!
            </h1>
            <p className="mt-4 text-lg text-primary-foreground/90">
              Sua solicitação foi recebida com sucesso
            </p>
            <div className="mt-6 inline-block px-4 py-2 rounded-lg bg-white/20">
              <span className="text-sm font-semibold text-primary-foreground">Em processamento</span>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-8 sm:py-12">
        <div className="container max-w-2xl px-4 sm:px-6">
          <Card className="rounded-xl border border-slate-200 bg-white p-4 sm:p-8 shadow-sm">
            <div className="mb-6">
              <p className="text-sm text-muted-foreground mb-2">Status da solicitação</p>
              <Progress value={progress} className="h-2" />
            </div>
            <p className="text-center text-muted-foreground mb-6 font-medium">
              Você receberá as informações no seu e-mail
            </p>
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-foreground mb-2">
                {certificateType ? formatCertificateName(certificateType) : selectedPlan.name}
              </h2>
              <button
                type="button"
                onClick={playThankYouAudio}
                className={`inline-flex items-center justify-center gap-2 min-h-[44px] min-w-[44px] mt-2 px-3 py-2 text-sm font-semibold transition-colors ${audioPlaying ? "text-muted-foreground hover:text-foreground" : "text-[#E05A4D] hover:text-[#c94d42] animate-pulse-red-discrete"}`}
                title={audioPlaying ? "Pausar instruções" : "Ouvir instruções"}
                aria-label={audioPlaying ? "Pausar instruções" : "Ouvir instruções"}
              >
                {audioPlaying ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                {audioPlaying ? "Pausar instruções" : "Ouvir instruções"}
              </button>
            </div>

            {/* Delivery Info */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-8">
              <h3 className="font-semibold text-foreground mb-4 text-center">
                Informações de Entrega
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3 bg-white rounded-lg p-4 border border-slate-200">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary flex-shrink-0">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Prazo de Entrega</p>
                    <p className="text-sm font-medium text-foreground">{deliveryInfo.time}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-white rounded-lg p-4 border border-slate-200">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    {deliveryInfo.icon}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Forma de Envio</p>
                    <p className="font-medium text-foreground">{deliveryInfo.method}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Email Info */}
            <div className="text-center mb-8 p-4 bg-primary/5 border border-slate-200 rounded-xl">
              <p className="text-sm text-muted-foreground mb-1">
                A certidão será enviada para:
              </p>
              <p className="font-medium text-foreground">
                {formData.email}
              </p>
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" className="font-bold">
                <Link to="/">
                  Voltar ao início
                  <Home className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground text-center mt-4">
              Dúvidas? <Link to="/contato" className="text-primary hover:underline font-medium">Fale Conosco</Link>
            </p>
          </Card>
        </div>
      </section>
    </Layout>
  );
};

export default ThankYou;
