const steps = [
  { number: 0, label: "Assistente de IA", desc: "Nosso assistente ajuda você a escolher a certidão correta.", color: "bg-muted-foreground" },
  { number: 1, label: "Escolha o documento", desc: "Selecione a certidão que precisa e preencha seus dados.", color: "bg-primary" },
  { number: 2, label: "Preencha e pague", desc: "Complete automaticamente e realize o pagamento via PIX.", color: "bg-primary" },
  { number: 3, label: "Processamento digital", desc: "Nossa tecnologia processa sua solicitação de forma digital.", color: "bg-accent" },
  { number: 4, label: "Receba no painel e e-mail", desc: "Resultado pronto no painel e enviado ao seu e-mail.", color: "bg-accent" },
];

const HowItWorks = () => {
  return (
    <section className="py-16 bg-card">
      <div className="container text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Como Funciona Nosso Sistema</h2>
        <p className="text-muted-foreground mb-10">Processo automatizado com IA em 5 etapas simples</p>

        <div className="flex flex-wrap justify-center gap-8 max-w-4xl mx-auto">
          {steps.map((step) => (
            <div key={step.number} className="flex flex-col items-center max-w-[160px]">
              <div className={`w-12 h-12 rounded-full ${step.color} flex items-center justify-center text-lg font-bold text-primary-foreground mb-3`}>
                {step.number}
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">{step.label}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
