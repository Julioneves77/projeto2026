import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/SEOHead";

const ETAPAS = [
  "Consultando base nacional de registros...",
  "Verificando dados informados...",
  "Localizando certidão nos sistemas oficiais...",
  "Documento encontrado com sucesso",
];

const EMISSOES_NOMES = [
  { nome: "Carla B.", uf: "RO" },
  { nome: "Lucas M.", uf: "MG" },
  { nome: "André S.", uf: "SP" },
];

function getEmissoesRecentes() {
  const now = new Date();
  return EMISSOES_NOMES.map((e, i) => {
    const d = new Date(now);
    d.setMinutes(d.getMinutes() - (i + 2)); // 2, 3 e 4 min atrás
    const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", hour12: false });
    return { hora, nome: e.nome, uf: e.uf };
  });
}

function maskCpf(cpf: string): string {
  const digits = (cpf || "").replace(/\D/g, "");
  if (digits.length < 2) return "***.***.***-**";
  const lastTwo = digits.slice(-2);
  return `***.***.***-${lastTwo}`;
}

const Processamento = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as {
    formData?: Record<string, unknown>;
    certificateType?: string;
    category?: string;
    state?: string;
    selectedPlan?: { id: string; name: string; price: number };
    formConfig?: unknown;
    type?: string;
    source?: string;
    funnel_id?: string;
  } | null;

  const [etapaAtual, setEtapaAtual] = useState(0);
  const [etapasConcluidas, setEtapasConcluidas] = useState<Set<number>>(new Set());
  const [mostrarResultado, setMostrarResultado] = useState(false);
  const [mostrarBotao, setMostrarBotao] = useState(false);
  const emissoesRecentes = useMemo(() => getEmissoesRecentes(), []);

  // Redirecionar se não tiver state (acesso direto)
  useEffect(() => {
    if (!state?.formData) {
      const stored = sessionStorage.getItem("guia_central_payment_state");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          navigate("/processamento", { state: parsed, replace: true });
          return;
        } catch {
          navigate("/");
          return;
        }
      }
      navigate("/");
    }
  }, [state, navigate]);

  // Animação das etapas: 1.5s entre cada
  useEffect(() => {
    if (!state?.formData) return;

    const interval = setInterval(() => {
      setEtapaAtual((prev) => {
        if (prev >= ETAPAS.length - 1) {
          clearInterval(interval);
          setEtapasConcluidas((s) => new Set([...s, prev]));
          setMostrarResultado(true);
          setTimeout(() => setMostrarBotao(true), 400);
          return prev;
        }
        setEtapasConcluidas((s) => new Set([...s, prev]));
        return prev + 1;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [state?.formData]);

  const handleLiberar = () => {
    const source = state?.source ? `?source=${state.source}` : "";
    navigate(`/pagamento${source}`, { state });
  };

  if (!state?.formData) {
    return null;
  }

  const cpf = (
    state.formData.cpf ||
    state.formData.cpfSolicitante ||
    state.formData.cpfOuCnpj ||
    state.formData.documento ||
    ""
  ).toString();
  const nomeUsuario = (state.formData.nomeCompleto || state.formData.nome || "").toString().trim();

  return (
    <Layout>
      <SEOHead
        title="Localizando sua certidão - Guia Central"
        description="Consultando bases de dados para localizar seu documento."
      />
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md mx-auto text-center">
          {/* Título */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl sm:text-3xl font-bold text-foreground mb-2"
          >
            Localizando sua certidão...
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-sm sm:text-base mb-8"
          >
            Estamos consultando as bases de dados para localizar seu documento.
          </motion.p>

          {/* Bloco de etapas */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm mb-8">
            <div className="space-y-4">
              {ETAPAS.map((texto, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{
                    opacity: etapaAtual >= i ? 1 : 0.4,
                    x: 0,
                  }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                    {etapasConcluidas.has(i) ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-green-600"
                      >
                        <CheckCircle2 className="w-8 h-8" />
                      </motion.div>
                    ) : etapaAtual === i ? (
                      <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    ) : (
                      <div className="w-8 h-8 rounded-full border-2 border-muted" />
                    )}
                  </div>
                  <span
                    className={`text-sm sm:text-base ${
                      etapasConcluidas.has(i) ? "text-green-600 font-medium" : "text-foreground"
                    }`}
                  >
                    {texto}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Resultado */}
          <AnimatePresence>
            {mostrarResultado && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="rounded-xl border-2 border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800 p-6 mb-6"
              >
                <div className="text-left space-y-1 text-sm text-muted-foreground">
                  {nomeUsuario && (
                    <p className="font-medium text-green-800 dark:text-green-400">{nomeUsuario}</p>
                  )}
                  <p>CPF: {maskCpf(cpf)}</p>
                  <p>Status: {state.certificateType || "Certidão"} <span className="font-bold text-green-700 dark:text-green-300">disponível</span></p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Botão */}
          <AnimatePresence>
            {mostrarBotao && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mb-10"
              >
                <Button
                  size="xl"
                  variant="default"
                  className="w-full sm:w-auto min-w-[280px] text-base py-6"
                  onClick={handleLiberar}
                >
                  Liberar minha certidão agora
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Prova social */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="rounded-lg border border-border bg-muted/50 px-4 py-3"
          >
            <p className="text-xs font-medium text-muted-foreground mb-3">Emissões recentes</p>
            <ul className="space-y-1.5 text-sm text-foreground">
              {emissoesRecentes.map((e, i) => (
                <li key={i} className="flex justify-between">
                  <span className="text-muted-foreground">{e.hora}</span>
                  <span>
                    Certidão enviada para {e.nome} ({e.uf})
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default Processamento;
