import { motion } from "framer-motion";
import { HelpCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "O que vocês fazem exatamente?",
    answer:
      "Somos uma plataforma privada de tecnologia que automatiza o processamento de documentos de forma digital. Não somos órgão público, apenas facilitamos o acesso aos documentos através do nosso sistema.",
  },
  {
    question: "Quanto tempo leva para receber?",
    answer:
      "Muitos documentos são processados automaticamente em minutos. Outros podem levar até 48 horas úteis dependendo do tipo. Você acompanha o status em tempo real no painel.",
  },
  {
    question: "Como recebo o documento?",
    answer:
      "Por e-mail assim que ficar pronto, e também fica disponível para download no seu painel de cliente no site.",
  },
  {
    question: "Vocês emitem os documentos?",
    answer:
      "Não. Os documentos são processados pelos órgãos oficiais. Nossa tecnologia apenas automatiza o processo de solicitação de forma digital e entrega o documento final para você.",
  },
  {
    question: "Posso buscar diretamente nos órgãos?",
    answer:
      "Sim, você pode. Nosso serviço oferece automação, tecnologia e praticidade através de um sistema integrado que faz todo o processo digital para você.",
  },
  {
    question: "O documento tem validade?",
    answer:
      "Sim! É o documento original processado pela fonte oficial. Nossa plataforma apenas automatiza a solicitação e entrega.",
  },
  {
    question: "Qual a vantagem de usar a plataforma?",
    answer:
      "Economia de tempo, praticidade e automação. Nossa IA e tecnologia RPA fazem todo o trabalho burocrático por você, sem filas e sem complicações.",
  },
];

const FAQ = () => {
  return (
    <section className="container mx-auto px-6 py-24 relative">
      <div className="absolute inset-0 cyber-grid opacity-20 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-14 relative"
      >
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: "80px" }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="h-[2px] bg-primary mx-auto mb-6"
        />
        <h2 className="font-orbitron text-2xl md:text-3xl font-bold text-foreground mb-3 tracking-wider">
          DÚVIDAS FREQUENTES
        </h2>
        <p className="text-muted-foreground text-sm font-mono tracking-wider">FAQ // PERGUNTAS E RESPOSTAS</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-3xl mx-auto relative"
      >
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <AccordionItem
                value={`item-${i}`}
                className="border border-border/50 rounded-lg bg-card shadow-sm px-5 data-[state=open]:shadow-md data-[state=open]:border-primary/20 transition-all"
              >
                <AccordionTrigger className="text-foreground text-left text-sm font-medium hover:no-underline hover:text-primary transition-colors gap-3">
                  <div className="flex items-center gap-3">
                    <HelpCircle className="w-4 h-4 text-primary/50 shrink-0" />
                    {faq.question}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm leading-relaxed pl-7 font-mono">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            </motion.div>
          ))}
        </Accordion>
      </motion.div>
    </section>
  );
};

export default FAQ;
