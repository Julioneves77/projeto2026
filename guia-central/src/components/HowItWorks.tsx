const steps = [
  { num: "0", title: "Assistente de IA ⚡", desc: "O sistema conversa com você, entende sua necessidade e indica automaticamente qual tipo de documento ou consulta é mais adequado." },
  { num: "1", title: "Escolha o documento", desc: "Selecione o tipo de documento que precisa processar." },
  { num: "2", title: "Preencha e pague", desc: "Sistema valida os dados automaticamente e confirma o Pix de forma instantânea." },
  { num: "3", title: "Processamento digital ⚡", desc: "Nossa tecnologia processa sua solicitação automaticamente de forma digital." },
  { num: "4", title: "Receba no painel e por e-mail", desc: "Receba por e-mail e painel em minutos após confirmação do pagamento." },
];

const HowItWorks = () => {
  return (
    <section className="bg-secondary/50 py-16 md:py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-heading text-2xl md:text-4xl font-bold text-foreground mb-3">
            Como Funciona Nosso Sistema
          </h2>
          <p className="text-muted-foreground text-base">
            Processo automatizado com IA em 5 etapas simples
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-4">
          {steps.map((step, i) => (
            <div key={i} className="relative text-center">
              <div className="w-12 h-12 mx-auto rounded-full gradient-hero flex items-center justify-center text-primary-foreground font-heading font-bold text-lg mb-3">
                {step.num}
              </div>
              <h3 className="font-heading font-semibold text-foreground text-sm mb-2">{step.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-6 left-[calc(50%+28px)] w-[calc(100%-56px)] h-0.5 bg-border" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
