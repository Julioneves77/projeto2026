import { Send, Search, MessageCircle } from "lucide-react";

const steps = [
  {
    number: "1",
    icon: Send,
    title: "Envie seus dados",
    description: "Você envia seus dados básicos de forma segura através do nosso formulário."
  },
  {
    number: "2", 
    icon: Search,
    title: "Análise da solicitação",
    description: "Nossa equipe realiza a análise e organização da sua solicitação."
  },
  {
    number: "3",
    icon: MessageCircle,
    title: "Receba o retorno",
    description: "Você recebe o retorno por e-mail dentro do prazo informado."
  }
];

export function HowItWorksSection() {
  return (
    <section className="py-20 bg-background">
      <div className="container">
        <div className="text-center mb-14">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            Como funciona
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Processo simples e transparente em apenas 3 passos
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <div 
              key={step.number}
              className="relative text-center group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-6 left-[60%] w-[80%] h-0.5 bg-border" />
              )}

              {/* Step number */}
              <div className="step-number mx-auto mb-5 relative z-10 group-hover:scale-110 transition-transform">
                {step.number}
              </div>

              {/* Icon */}
              <div className="feature-icon mx-auto mb-4">
                <step.icon className="w-5 h-5" />
              </div>

              {/* Content */}
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {step.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
