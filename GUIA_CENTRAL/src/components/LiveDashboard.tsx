import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MESSAGES = [
  "Processando certidão...",
  "Verificando dados no tribunal...",
  "Certidão em processamento...",
  "Solicitação de certidão concluída",
  "Atualizando status do pedido...",
  "Consultando antecedentes criminais...",
  "Emitindo certidão negativa...",
  "Certidão CND em andamento...",
  "Processamento de certidão eleitoral...",
  "Antecedentes PF em consulta...",
  "Certidão criminal estadual processando...",
  "Certidão cível federal em emissão...",
  "Validando CPF para certidão...",
  "Pedido de CND finalizado",
  "Certidão eleitoral sendo emitida...",
  "Conectando ao sistema do TJ...",
  "Certidão negativa em andamento...",
  "Processamento de certidão criminal...",
  "Solicitação recebida e em análise...",
  "Gerando PDF da certidão...",
  "Consulta à Polícia Federal em andamento...",
  "Certidão de quitação eleitoral processando...",
  "Atualizando dados do pedido...",
  "Certidão pronta para envio",
];

const LiveDashboard = () => {
  const [message, setMessage] = useState(MESSAGES[0]);
  const [displayLen, setDisplayLen] = useState(0);

  useEffect(() => {
    setDisplayLen(0);
    const len = message.length;
    const typeInterval = setInterval(() => {
      setDisplayLen((d) => {
        if (d >= len) {
          clearInterval(typeInterval);
          return len;
        }
        return d + 1;
      });
    }, 50);
    return () => clearInterval(typeInterval);
  }, [message]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessage(MESSAGES[Math.floor(Math.random() * MESSAGES.length)]);
    }, 2500 + Math.random() * 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm"
    >
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-sm font-medium text-foreground">Sistema ativo</span>
      </div>
      <AnimatePresence mode="wait">
        <motion.p
          key={message}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="mt-1.5 text-foreground/80"
        >
          {message.slice(0, displayLen)}
          <span className="animate-pulse">|</span>
        </motion.p>
      </AnimatePresence>
    </motion.div>
  );
};

export default LiveDashboard;
