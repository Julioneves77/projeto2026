import { useState } from "react";
import { motion } from "framer-motion";
import { HelpCircle, ChevronDown } from "lucide-react";
import HiddenDisclaimer from "./HiddenDisclaimer";

const faqs = [
  { q: "O que vocês fazem exatamente?", a: "Somos uma plataforma privada de tecnologia que automatiza o processamento de documentos de forma digital. Não somos órgão público, apenas facilitamos o acesso aos documentos através do nosso sistema." },
  { q: "Quanto tempo leva para receber?", a: "Muitos documentos são processados automaticamente em minutos. Outros podem levar até 48 horas úteis dependendo do tipo. Você acompanha o status em tempo real no painel." },
  { q: "Como recebo o documento?", a: "Por e-mail assim que ficar pronto, e também fica disponível para download no seu painel de cliente no site." },
  { q: "Vocês emitem os documentos?", a: "Não. Os documentos são emitidos pelos órgãos oficiais. Nossa tecnologia apenas automatiza o processo de solicitação de forma digital e entrega o documento final para você." },
  { q: "Posso buscar diretamente nos órgãos?", a: "Sim, você pode. Nosso serviço oferece automação, tecnologia e praticidade através de um sistema integrado que faz todo o processo digital para você." },
  { q: "O documento tem validade?", a: "Sim! É o documento original emitido pela fonte oficial. Nossa plataforma apenas automatiza a solicitação e entrega." },
  { q: "Qual a vantagem de usar a plataforma?", a: "Rapidez, automação com IA, acompanhamento em tempo real, suporte dedicado e economia de tempo. Tudo em um só lugar, sem filas e sem burocracia." },
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => {
    setOpenIndex((prev) => (prev === i ? null : i));
  };

  return (
    <section className="container mx-auto px-6 py-24 relative">
      <div className="absolute inset-0 cyber-grid opacity-20 pointer-events-none" />
      <HiddenDisclaimer />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-14 relative"
      >
        <h2 className="font-orbitron text-2xl md:text-3xl font-bold text-foreground mb-3 tracking-wider">
          DÚVIDAS FREQUENTES
        </h2>
        <p className="text-muted-foreground text-sm font-mono tracking-wider">FAQ // PERGUNTAS E RESPOSTAS</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-3xl mx-auto relative space-y-3"
      >
        {faqs.map((faq, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className={`border rounded-lg bg-card shadow-sm px-5 transition-all border-border/50 ${openIndex === i ? "shadow-md border-primary/20" : ""}`}
          >
            <button
              type="button"
              onClick={() => toggle(i)}
              className="w-full flex items-center justify-between gap-3 py-4 text-left text-foreground text-sm font-medium hover:text-primary transition-colors"
              aria-expanded={openIndex === i}
              aria-controls={`faq-answer-${i}`}
              id={`faq-question-${i}`}
            >
              <div className="flex items-center gap-3">
                <HelpCircle className="w-4 h-4 text-primary/50 shrink-0" />
                {faq.q}
              </div>
              <ChevronDown
                className={`h-4 w-4 shrink-0 transition-transform duration-200 ${openIndex === i ? "rotate-180" : ""}`}
              />
            </button>
            <div
              id={`faq-answer-${i}`}
              role="region"
              aria-labelledby={`faq-question-${i}`}
              className={`overflow-hidden transition-all duration-200 ease-out ${openIndex === i ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
            >
              <p className="text-muted-foreground text-sm leading-relaxed pl-7 pb-4 font-mono">
                {faq.a}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
};

export default FAQ;
