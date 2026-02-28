import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User } from "lucide-react";

const NOMES = [
  "Carlos M.", "Ana R.", "João P.", "Maria S.", "Pedro L.", "Fernanda C.", "Ricardo A.", "Juliana T.",
  "Roberto N.", "Patricia F.", "Marcos V.", "Carla B.", "André G.", "Luciana H.", "Felipe D.", "Renata K.",
  "Bruno W.", "Camila O.", "Diego S.", "Amanda T.", "Rafael C.", "Letícia M.", "Gustavo P.", "Mariana L.",
];
const ESTADOS = [
  "São Paulo", "Minas Gerais", "Rio de Janeiro", "Bahia", "Paraná", "Rio Grande do Sul", "Pernambuco", "Ceará",
  "Santa Catarina", "Goiás", "Maranhão", "Paraíba", "Pará", "Espírito Santo", "Amazonas", "Rio Grande do Norte",
  "Alagoas", "Piauí", "Mato Grosso", "Mato Grosso do Sul", "Distrito Federal", "Sergipe", "Rondônia", "Tocantins",
  "Acre", "Amapá", "Roraima",
];
// Tipos de certidão do site + ação (Estado já aparece na linha acima)
const ACOES = [
  "Cert. Antecedentes - entregue em 1 min",
  "Cert. Antecedentes - entregue em 2 min",
  "Cert. Antecedentes - entregue em 2 min",
  "Cert. Criminal Estadual - entregue em 2 min",
  "Cert. Criminal Federal - entregue em 1 min",
  "Cert. Cível Estadual - entregue em 2 min",
  "Cert. Cível Federal - entregue em 2 min",
  "Cert. Eleitoral - entregue em 1 min",
  "CND - entregue em 2 min",
  "CPF Regular - entregue em 1 min",
  "Cert. Antecedentes - finalizou o pagamento",
  "Cert. Criminal Estadual - concluiu agora",
  "Cert. Cível Federal - está em processamento",
];

const SocialProofToasts = () => {
  const [toasts, setToasts] = useState<{ id: number; nome: string; estado: string; acao: string }[]>([]);
  const [nextId, setNextId] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const nome = NOMES[Math.floor(Math.random() * NOMES.length)];
      const estado = ESTADOS[Math.floor(Math.random() * ESTADOS.length)];
      const acao = ACOES[Math.floor(Math.random() * ACOES.length)];
      const id = nextId;
      setNextId((p) => p + 1);
      setToasts((prev) => [...prev.slice(-2), { id, nome, estado, acao }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    }, 6000 + Math.random() * 4000);
    return () => clearInterval(interval);
  }, [nextId]);

  return (
    <div className="fixed bottom-4 left-4 sm:max-w-[280px] z-40 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: -80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="mb-3 flex items-center gap-3 rounded-xl border border-border/50 bg-card/98 backdrop-blur-md px-4 py-3 shadow-lg"
          >
            <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-foreground font-semibold text-sm truncate">
                {t.nome} de {t.estado}
              </p>
              <p className="text-muted-foreground text-xs mt-0.5">
                {t.acao}
              </p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default SocialProofToasts;
