import { motion } from "framer-motion";
import { Bot, FileText, CreditCard, Cpu, Mail } from "lucide-react";
import HiddenDisclaimer from "./HiddenDisclaimer";

const steps = [
  {
    number: 0,
    title: "Assistente IA",
    description: "O sistema conversa com você, entende sua necessidade e indica automaticamente qual documento é mais adequado.",
    icon: Bot,
    color: "primary",
  },
  {
    number: 1,
    title: "Seleção do Documento",
    description: "Selecione o tipo de documento que precisa processar no painel.",
    icon: FileText,
    color: "primary",
  },
  {
    number: 2,
    title: "Validação & Pagamento",
    description: "Sistema valida os dados automaticamente e confirma o Pix de forma instantânea.",
    icon: CreditCard,
    color: "primary",
  },
  {
    number: 3,
    title: "Processamento Digital",
    description: "Nossa tecnologia processa sua solicitação automaticamente via IA + RPA.",
    icon: Cpu,
    color: "primary",
  },
  {
    number: 4,
    title: "Entrega Automática",
    description: "Receba por e-mail e painel em minutos após confirmação do pagamento.",
    icon: Mail,
    color: "primary",
  },
];

const HowItWorks = () => {
  return (
    <section className="container mx-auto px-6 py-20 bg-white">
      <HiddenDisclaimer />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-14"
      >
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Como funciona
        </h2>
        <p className="text-muted-foreground text-sm">
          Processo automatizado em 5 etapas
        </p>
      </motion.div>

      {/* Steps - Desktop */}
      <div className="hidden md:block">
        <div className="grid grid-cols-5 gap-8">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="relative text-center"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 border border-slate-200 flex items-center justify-center mx-auto mb-4">
                  <Icon className={`w-7 h-7 ${step.color === "accent" ? "text-accent" : "text-primary"}`} />
                </div>
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center mx-auto mb-3">
                  {step.number}
                </div>
                <h3 className="text-foreground font-semibold text-sm mb-2">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Steps - Mobile (vertical) */}
      <div className="md:hidden space-y-0">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="flex gap-4 py-5 border-b border-slate-100 last:border-0"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-foreground font-semibold text-sm mb-1">{step.title}</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

export default HowItWorks;
