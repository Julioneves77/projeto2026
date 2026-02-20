import Layout from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { Bot, FileText, CreditCard, Cpu, Mail } from "lucide-react";
import SEOHead from "@/components/SEOHead";

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
    color: "accent",
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
    <Layout>
      <SEOHead
        title="Como Funciona - Guia Central"
        description="Entenda como funciona o processo de solicitação de certidões no Guia Central. Processo automatizado com IA em 5 etapas simples."
      />
      <section className="container mx-auto px-6 py-24 relative">
        {/* Background decoration */}
        <div className="absolute inset-0 cyber-grid-dense opacity-30 pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16 relative"
        >
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: "80px" }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="h-[2px] bg-primary mx-auto mb-6"
          />
          <h2 className="font-orbitron text-2xl md:text-3xl font-bold text-foreground mb-3 tracking-wider">
            COMO FUNCIONA
          </h2>
          <p className="text-muted-foreground text-sm font-mono tracking-wider">
            PROCESSO AUTOMATIZADO EM 5 ETAPAS
          </p>
        </motion.div>

        {/* Steps - Desktop */}
        <div className="hidden md:block relative">
          {/* Connecting circuit line */}
          <svg className="absolute top-[60px] left-0 w-full h-8 pointer-events-none" preserveAspectRatio="none">
            <motion.line
              x1="10%"
              y1="50%"
              x2="90%"
              y2="50%"
              stroke="hsl(210 100% 55%)"
              strokeWidth="1"
              strokeDasharray="8 4"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 0.4 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5 }}
            />
          </svg>

          {/* Data flow dot */}
          <motion.div
            className="absolute top-[56px] w-3 h-3 rounded-full bg-primary glow-blue z-10 hidden md:block"
            animate={{ left: ["10%", "90%"] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          />

          <div className="grid grid-cols-5 gap-6 relative">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.6, type: "spring" }}
                  className="relative text-center group"
                >
                  {/* Pulsing ring */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[72px] h-[72px]">
                    <motion.div
                      animate={{ scale: [1, 1.6, 1], opacity: [0.3, 0, 0.3] }}
                      transition={{ duration: 3, repeat: Infinity, delay: i * 0.4 }}
                      className="absolute inset-0 rounded-full border border-primary/30"
                    />
                  </div>

                  {/* Icon container */}
                  <motion.div
                    whileHover={{ scale: 1.15 }}
                    className="relative w-[72px] h-[72px] rounded-2xl bg-card border border-border/60 shadow-sm flex items-center justify-center mx-auto mb-5 group-hover:shadow-md group-hover:shadow-primary/10 transition-all duration-500 group-hover:border-primary/30"
                  >
                    {/* Inner glow */}
                    <div className="absolute inset-0 rounded-2xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Icon className={`w-7 h-7 ${step.color === "accent" ? "text-accent" : "text-primary"} relative z-10`} />

                    {/* Corner decorations */}
                    <div className="absolute -top-px -left-px w-3 h-3 border-t-2 border-l-2 border-primary/40 rounded-tl-lg" />
                    <div className="absolute -bottom-px -right-px w-3 h-3 border-b-2 border-r-2 border-primary/40 rounded-br-lg" />
                  </motion.div>

                  {/* Step number */}
                  <div className="absolute top-0 right-[calc(50%-46px)] w-6 h-6 rounded-full bg-card border border-primary/20 shadow-sm text-primary text-[10px] font-orbitron font-bold flex items-center justify-center">
                    {step.number}
                  </div>

                  <h3 className="text-foreground font-semibold text-sm mb-2 group-hover:text-primary transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-xs leading-relaxed px-1">
                    {step.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Steps - Mobile (vertical) */}
        <div className="md:hidden space-y-0 relative">
          {/* Vertical connecting line */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-primary/20 via-primary/10 to-transparent" />

          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="relative flex gap-5 py-6 group"
              >
                {/* Icon */}
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-card border border-border/60 shadow-sm flex items-center justify-center group-hover:shadow-md transition-shadow">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-card border border-primary/20 shadow-sm text-primary text-[9px] font-orbitron font-bold flex items-center justify-center">
                    {step.number}
                  </div>
                </div>

                {/* Content */}
                <div>
                  <h3 className="text-foreground font-semibold text-sm mb-1">{step.title}</h3>
                  <p className="text-muted-foreground text-xs leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>
    </Layout>
  );
};

export default HowItWorks;
