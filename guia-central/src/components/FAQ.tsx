import { useState } from "react";
import { ChevronDown } from "lucide-react";

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
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="bg-secondary/50 py-16 md:py-20">
      <div className="container mx-auto px-4 max-w-3xl">
        <h2 className="font-heading text-2xl md:text-4xl font-bold text-foreground text-center mb-10">
          Dúvidas Frequentes
        </h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-card border border-border rounded-xl overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <span className="font-heading font-semibold text-foreground text-sm pr-4">{faq.q}</span>
                <ChevronDown className={`text-muted-foreground shrink-0 transition-transform duration-200 ${open === i ? 'rotate-180' : ''}`} size={18} />
              </button>
              {open === i && (
                <div className="px-5 pb-5 -mt-1">
                  <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
