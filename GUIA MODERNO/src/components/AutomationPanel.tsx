import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, Cpu, Zap, Clock, Wifi, Database } from "lucide-react";

const logMessages = [
  { text: "→ IA_CORE :: Status Online", type: "success" as const },
  { text: "→ RPA_NODES :: 12/12 Ativos", type: "success" as const },
  { text: "→ PROCESSING :: Tempo médio 45s", type: "info" as const },
  { text: "→ VALIDATOR :: Dados verificados", type: "success" as const },
  { text: "→ PIPELINE :: Processando...", type: "info" as const },
  { text: "→ SSL_TUNNEL :: Conexão segura", type: "success" as const },
  { text: "→ RPA_NODE_03 :: Documento OK", type: "success" as const },
  { text: "→ NEURAL_CACHE :: Atualizado", type: "info" as const },
  { text: "→ LATENCY :: 12ms", type: "info" as const },
  { text: "→ FIREWALL :: Sem ameaças", type: "success" as const },
  { text: "→ AI_VALIDATOR :: Checagem OK", type: "success" as const },
  { text: "→ QUEUE :: 0 pendentes", type: "info" as const },
];

const AutomationPanel = () => {
  const [visibleLogs, setVisibleLogs] = useState<{ text: string; type: "success" | "info"; id: number }[]>([]);
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCounter((prev) => {
        const next = prev + 1;
        const msg = logMessages[next % logMessages.length];
        setVisibleLogs((logs) => [{ ...msg, id: next }, ...logs].slice(0, 6));
        return next;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden scanlines relative"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/60 bg-muted/40">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-primary pulse-glow" />
          <span className="font-orbitron text-[10px] font-bold text-primary tracking-[0.15em]">
            REDE DE AUTOMAÇÃO
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-accent pulse-glow" />
          <span className="text-[9px] font-mono text-accent">LIVE</span>
        </div>
      </div>

      <div className="p-5">
        {/* Status grid */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[
            { icon: Activity, label: "IA Core", status: "Online", active: true },
            { icon: Wifi, label: "RPA Nodes", status: "12/12", active: true },
            { icon: Database, label: "Uptime", status: "99.9%", active: false },
            { icon: Clock, label: "Avg Time", status: "~45s", active: false },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2 bg-muted/50 border border-border/40 rounded-lg px-3 py-2"
            >
              {item.active ? (
                <div className="w-1.5 h-1.5 rounded-full bg-accent pulse-glow" />
              ) : (
                <item.icon className="w-3 h-3 text-primary/60" />
              )}
              <div className="flex flex-col">
                <span className="text-[9px] font-mono text-muted-foreground uppercase">{item.label}</span>
                <span className="text-[10px] font-mono text-foreground font-medium">{item.status}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Live logs */}
        <div className="border-t border-border/50 pt-3">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-3 h-3 text-accent" />
            <span className="text-[9px] font-orbitron text-muted-foreground tracking-[0.15em]">LIVE LOG</span>
          </div>
          <div className="space-y-1 min-h-[130px] bg-muted/30 rounded-lg p-3 border border-border/30">
            {visibleLogs.map((log) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="font-mono text-[10px] leading-relaxed"
              >
                <span className={log.type === "success" ? "text-accent" : "text-primary"}>
                  {log.text}
                </span>
              </motion.div>
            ))}
            <span className="inline-block w-2 h-3 border-r-2 border-primary animate-typing-cursor" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AutomationPanel;
