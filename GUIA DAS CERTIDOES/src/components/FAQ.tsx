import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    q: "O que vocês fazem exatamente?",
    a: "Somos uma plataforma que automatiza o processamento de documentos de forma digital. Não somos órgão público, apenas facilitamos e agilizamos o acesso aos documentos através do nosso sistema.",
  },
  {
    q: "Quanto tempo leva para receber?",
    a: "Muitos documentos são processados automaticamente em minutos. Outros podem levar até 24 horas dependendo do tipo. Você acompanha o status em tempo real no painel.",
  },
  {
    q: "Como recebo o documento?",
    a: "Por e-mail assim que ficar pronto, e também fica disponível para download em sua conta na plataforma.",
  },
  {
    q: "Vocês emitem os documentos?",
    a: "Não. Os documentos são emitidos pelos órgãos oficiais. Nossa tecnologia apenas automatiza o processo de solicitação de forma digital e entrega o documento final para você.",
  },
  {
    q: "Posso buscar diretamente nos órgãos?",
    a: "Sim, é possível. Nosso serviço oferece automação, tecnologia e praticidade através do nosso sistema integrado, sem filas ou complicações digitais para você.",
  },
  {
    q: "O documento terá validade?",
    a: "Sim! É o documento original emitido pelo órgão oficial. Nossa plataforma apenas automatiza a solicitação e entrega.",
  },
  {
    q: "Qual a vantagem de usar a plataforma?",
    a: "Tecnologia e automação: processamento rápido e digital, interface simples e intuitiva, suporte e acompanhamento em tempo real, sem burocracia.",
  },
];

const FAQ = () => {
  return (
    <section className="py-16 bg-card">
      <div className="container">
        <h2 className="text-2xl font-bold text-foreground text-center mb-10">Dúvidas Frequentes</h2>
        <div className="max-w-2xl mx-auto">
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border rounded-lg px-5 bg-background">
                <AccordionTrigger className="text-sm font-semibold text-primary hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
