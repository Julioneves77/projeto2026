import Layout from "@/components/layout/Layout";
import { CheckCircle, FileText, CreditCard, Mail, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const steps = [
  {
    number: 1,
    icon: FileText,
    title: "Escolha a Certidão",
    description: "Selecione o tipo de certidão que você precisa entre as diversas opções disponíveis: estaduais, federais, CND, entre outras.",
  },
  {
    number: 2,
    icon: CheckCircle,
    title: "Preencha o Formulário",
    description: "Complete os campos obrigatórios com seus dados pessoais. Todos os formulários são validados em tempo real para garantir a precisão.",
  },
  {
    number: 3,
    icon: CreditCard,
    title: "Efetue o Pagamento",
    description: "Realize o pagamento de forma segura através de PIX, cartão de crédito ou boleto bancário.",
  },
  {
    number: 4,
    icon: Mail,
    title: "Receba sua Certidão",
    description: "Após a confirmação do pagamento, sua certidão será processada e enviada diretamente para seu e-mail.",
  },
];

const HowItWorks = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden hero-gradient py-16 lg:py-24">
        <div className="container relative">
          <div className="mx-auto max-w-2xl text-center animate-slide-up">
            <h1 className="font-heading text-4xl font-bold text-primary-foreground sm:text-5xl">
              Como Funciona
            </h1>
            <p className="mt-4 text-lg text-primary-foreground/80">
              Processo simples e transparente para obter suas certidões
            </p>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-20">
        <div className="container">
          <div className="mx-auto max-w-4xl">
            <div className="space-y-12">
              {steps.map((step, index) => (
                <div 
                  key={step.number}
                  className="relative flex gap-6 animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Timeline */}
                  <div className="flex flex-col items-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
                      <step.icon className="h-7 w-7" />
                    </div>
                    {index < steps.length - 1 && (
                      <div className="mt-4 h-full w-0.5 bg-border" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-12">
                    <div className="rounded-2xl border border-border bg-card p-6 card-shadow">
                      <div className="mb-2 text-sm font-medium text-secondary">
                        Passo {step.number}
                      </div>
                      <h3 className="font-heading text-xl font-bold text-foreground">
                        {step.title}
                      </h3>
                      <p className="mt-2 text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-muted/50">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-heading text-3xl font-bold text-foreground">
              Pronto para Começar?
            </h2>
            <p className="mt-4 text-muted-foreground">
              Escolha a certidão que você precisa e inicie sua solicitação agora mesmo.
            </p>
            <div className="mt-8">
              <Button size="xl" asChild>
                <Link to="/#certidoes">
                  Ver Certidões Disponíveis
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default HowItWorks;
