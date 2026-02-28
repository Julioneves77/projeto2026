import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2, Shield, Volume2, VolumeX, Edit3 } from "lucide-react";
import { formatCPF, formatCNPJ, formatPhone, formatDate } from "@/lib/validations";
import { scrollToTop } from "@/lib/scrollUtils";

const formatFieldValue = (fieldName: string, value: string): string => {
  switch (fieldName) {
    case "cpf":
      return formatCPF(value);
    case "cnpj":
      return formatCNPJ(value);
    case "cpfOuCnpj":
    case "documento": {
      const clean = value.replace(/\D/g, "");
      return clean.length <= 11 ? formatCPF(value) : formatCNPJ(value);
    }
    case "telefone":
      return formatPhone(value);
    case "dataNascimento":
      return formatDate(value);
    default:
      return value;
  }
};

const PAYMENT_STATE_KEY = "guia_central_payment_state";

const PrePayment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const locationState = location.state || {};
  // Restaurar do sessionStorage quando location.state vazio (ex: refresh)
  const effectiveState = (() => {
    if (locationState.formData && locationState.selectedPlan) return locationState;
    try {
      const stored = sessionStorage.getItem(PAYMENT_STATE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.formData && parsed?.selectedPlan) return parsed;
      }
    } catch (e) {
      console.warn("[PrePayment] Falha ao restaurar state:", e);
    }
    return locationState;
  })();
  const { formData, certificateType, category, state, selectedPlan, formConfig, type, source } = effectiveState;

  const [audioPlaying, setAudioPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useLayoutEffect(() => {
    scrollToTop();
  }, []);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  if (!formData || !selectedPlan) {
    navigate("/", { replace: true });
    return null;
  }

  const playInstructionsAudio = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio("/audios/pix-1.mp3");
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

  const handleGoToPayment = () => {
    const searchParams = new URLSearchParams(location.search);
    const src = searchParams.get("source") || source;
    const pagamentoUrl = src ? `/pagamento?source=${src}` : "/pagamento";
    // Persistir state no sessionStorage para evitar perda ao navegar (SPA/refresh)
    try {
      sessionStorage.setItem(PAYMENT_STATE_KEY, JSON.stringify(effectiveState));
    } catch (e) {
      console.warn("[PrePayment] Falha ao persistir state:", e);
    }
    // Usar navegação completa (window.location) para garantir que sessionStorage
    // seja lido corretamente em todos os contextos (incl. automação/iframe)
    window.location.href = pagamentoUrl;
  };

  const handleBackToForm = () => {
    const cat = category || "federais";
    const typeParam = type || (formData.tipoCertidao ? String(formData.tipoCertidao).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "");
    const params = new URLSearchParams();
    if (typeParam) params.set("type", typeParam);
    if (source) params.set("source", source);
    const query = params.toString();
    const formUrl = query ? `/certidao/${cat}?${query}` : `/certidao/${cat}`;
    navigate(formUrl, {
      state: {
        formData,
        formConfig,
        state,
        selectedPlan,
        certificateType,
        type: typeParam,
        source,
      },
    });
  };

  const renderReviewRows = () => {
    const rows: { label: string; value: string }[] = [];
    if (formConfig?.steps) {
      for (const step of formConfig.steps) {
        for (const field of step.fields) {
          if (field.name === "termos") continue;
          if (field.showWhen) {
            const condVal = formData[field.showWhen.field];
            if (condVal !== field.showWhen.value) continue;
          }
          const value = formData[field.name];
          if (value === undefined || value === null || value === false) continue;
          const displayValue =
            typeof value === "string"
              ? formatFieldValue(field.name, value)
              : value
              ? "Sim"
              : "Não";
          if (displayValue) {
            rows.push({ label: field.label, value: displayValue });
          }
        }
      }
    } else {
      const labelMap: Record<string, string> = {
        nome: "Nome",
        cpf: "CPF",
        cnpj: "CNPJ",
        cpfOuCnpj: "CPF/CNPJ",
        documento: "Documento",
        email: "E-mail",
        telefone: "Telefone",
        dataNascimento: "Data de Nascimento",
        nomeMae: "Nome da Mãe",
        nomePai: "Nome do Pai",
        nacionalidade: "Nacionalidade",
        estadoCivil: "Estado Civil",
        sexo: "Sexo",
        tipoCertidao: "Tipo de Certidão",
        tipoDocumento: "Tipo de Documento",
        tipoPessoa: "Tipo de Pessoa",
        estadoEmissao: "Estado de Emissão",
        comarca: "Comarca",
        finalidade: "Finalidade",
        cidade: "Cidade",
        uf: "UF",
        paisNascimento: "País de Nascimento",
        ufNascimento: "UF de Nascimento",
        cidadeNascimento: "Cidade de Nascimento",
      };
      for (const [key, val] of Object.entries(formData)) {
        if (val === undefined || val === null || val === false) continue;
        const displayValue = typeof val === "string" ? formatFieldValue(key, val) : val ? "Sim" : "Não";
        if (displayValue) {
          rows.push({ label: labelMap[key] || key, value: displayValue });
        }
      }
    }
    return rows;
  };

  const reviewRows = renderReviewRows();

  return (
    <Layout>
      <SEOHead
        title="Confirme seus dados - Guia Central"
        description="Confira seus dados antes do pagamento. Processo rápido e seguro."
      />
      <section className="relative overflow-hidden bg-primary py-8 lg:py-12">
        <div className="container relative">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
          <div className="animate-slide-up text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
              <CheckCircle2 className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-primary-foreground sm:text-3xl">
              Confira seus dados
            </h1>
            <p className="mt-3 text-primary-foreground/90">
              Após o pagamento, sua solicitação entra em processamento.
            </p>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container max-w-md mx-auto space-y-4">
          {/* Ouvir instruções */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-slate-200">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-sm sm:text-base">
                {certificateType}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                no seu Email em Minutos
              </p>
              <button
                type="button"
                onClick={playInstructionsAudio}
                className={`inline-flex items-center justify-center gap-2 mt-2 text-sm font-semibold transition-colors ${audioPlaying ? "text-muted-foreground hover:text-foreground" : "text-[#E05A4D] hover:text-[#c94d42] animate-pulse-red-discrete"}`}
                title={audioPlaying ? "Pausar instruções" : "Ouvir instruções"}
                aria-label={audioPlaying ? "Pausar instruções" : "Ouvir instruções"}
              >
                {audioPlaying ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                {audioPlaying ? "Pausar instruções" : "Ouvir instruções"}
              </button>
            </div>
          </div>

          <Card className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="space-y-4 mb-6">
              {reviewRows.map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm gap-2">
                  <span className="text-muted-foreground shrink-0">{label}</span>
                  <span className="font-medium text-foreground text-right break-all">{value}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm gap-2 pt-3 border-t border-border/50">
                <span className="text-muted-foreground shrink-0">Valor total</span>
                <span className="font-bold text-foreground text-right">
                  R$ {(selectedPlan?.price ?? 47.97).toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>
            <Button
              onClick={handleGoToPayment}
              size="lg"
              className="w-full font-bold py-6 text-base"
            >
              Ir para pagamento
            </Button>
            <button
              type="button"
              onClick={handleBackToForm}
              className="w-full mt-3 inline-flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              <Edit3 className="h-4 w-4" />
              Voltar para corrigir dados
            </button>
          </Card>
        </div>
      </section>
    </Layout>
  );
};

export default PrePayment;
