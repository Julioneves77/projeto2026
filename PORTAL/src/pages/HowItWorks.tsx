import Layout from "@/components/layout/Layout";
import { Bot, FileText, CreditCard, Zap, Mail } from "lucide-react";
import SEOHead from "@/components/SEOHead";

const steps = [
  {
    number: 0,
    title: "Assistente de IA",
    description: "Nosso assistente ajuda você a escolher a certidão correta.",
    color: "bg-gray-500",
  },
  {
    number: 1,
    title: "Escolha o documento",
    description: "Selecione a certidão que precisa e preencha seus dados.",
    color: "bg-blue-500",
  },
  {
    number: 2,
    title: "Preencha e pague",
    description: "Complete automaticamente e realize o pagamento via PIX.",
    color: "bg-blue-500",
  },
  {
    number: 3,
    title: "Processamento digital",
    description: "Nossa tecnologia processa sua solicitação de forma digital.",
    color: "bg-green-500",
  },
  {
    number: 4,
    title: "Receba no painel e e-mail",
    description: "Resultado pronto no painel e enviado ao seu e-mail.",
    color: "bg-green-500",
  },
];

const HowItWorks = () => {
  return (
    <Layout>
      <SEOHead
        title="Como Funciona - Portal Certidão"
        description="Entenda como funciona o processo de solicitação de certidões no Portal Certidão. Processo automatizado com IA em 5 etapas simples."
      />
      {/* Hero */}
      <section className="relative overflow-hidden py-16 lg:py-24 bg-background">
        <div className="container relative">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Como Funciona Nosso Sistema
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              Processo automatizado com IA em 5 etapas simples
            </p>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-12 lg:py-20 bg-background">
        <div className="container">
          <div className="mx-auto max-w-5xl">
            {/* Primeira linha: Passos 0, 1, 2, 3 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {steps.slice(0, 4).map((step) => (
                <div 
                  key={step.number}
                  className="flex flex-col items-center text-center"
                >
                  <div className={`w-16 h-16 ${step.color} rounded-full flex items-center justify-center mb-4 shadow-lg`}>
                    <span className="text-white text-xl font-bold">{step.number}</span>
                  </div>
                  <h3 className="font-semibold text-foreground mb-2 text-sm md:text-base">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Segunda linha: Passo 4 centralizado */}
            <div className="flex justify-center">
              <div className="flex flex-col items-center text-center max-w-xs">
                <div className={`w-16 h-16 ${steps[4].color} rounded-full flex items-center justify-center mb-4 shadow-lg`}>
                  <span className="text-white text-xl font-bold">{steps[4].number}</span>
                </div>
                <h3 className="font-semibold text-foreground mb-2 text-sm md:text-base">
                  {steps[4].title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {steps[4].description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default HowItWorks;
