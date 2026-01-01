import { useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Check, Zap, Clock, Star } from "lucide-react";

interface ServicePlan {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  icon: React.ReactNode;
  recommended?: boolean;
  badgeText?: string;
  deliveryTime: string;
}

const servicePlans: ServicePlan[] = [
  {
    id: "padrao",
    name: "Atendimento Padrão",
    price: 39.97,
    description: "Processamento em fila única conforme demanda. Certidão enviada por e-mail em formato PDF.",
    deliveryTime: "até 3 dias úteis",
    features: [
      "Atendimento Fila Normal",
      "Envio por E-mail em PDF",
    ],
    icon: <Clock className="h-6 w-6" />,
  },
  {
    id: "prioridade",
    name: "Atendimento Prioritário",
    price: 54.87,
    description: "Processamento prioritário com especialista dedicado. Certidão enviada em prioridade na fila.",
    deliveryTime: "até 24 horas",
    features: [
      "Atendimento Prioridade (frente da fila Normal)",
      "Envio por E-mail em PDF",
    ],
    icon: <Zap className="h-6 w-6" />,
    badgeText: "Mais usado",
  },
  {
    id: "premium",
    name: "Premium WhatsApp",
    price: 79.97,
    description: "Atendimento urgente com máxima prioridade. Envio por e-mail e WhatsApp.",
    deliveryTime: "até 4 horas",
    features: [
      "Atendimento Urgente (à frente de todos)",
      "Envio por E-mail e WhatsApp",
    ],
    icon: <Star className="h-6 w-6" />,
    recommended: true,
    badgeText: "Recomendado",
  },
];

const ServiceSelection = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { formData, certificateType, state } = location.state || {};

  useEffect(() => {
    if (!formData) {
      navigate("/", { replace: true });
    }
  }, [formData, navigate]);

  if (!formData) {
    return null;
  }

  const handleSelectPlan = (plan: ServicePlan) => {
    // Remove icon (React element) before passing to navigate state
    // React elements cannot be serialized/cloned in history state
    const { icon, ...planWithoutIcon } = plan;
    
    navigate("/pagamento", {
      state: {
        formData,
        certificateType,
        state,
        selectedPlan: planWithoutIcon,
      },
    });
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden hero-gradient py-10 lg:py-12">
        <div className="container relative">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Formulário
          </button>

          <div className="animate-slide-up text-center">
            <h1 className="font-heading text-2xl font-bold text-primary-foreground sm:text-3xl">
              Escolha o Tipo de Atendimento
            </h1>
            <p className="mt-2 text-primary-foreground/80">
              Selecione a opção que melhor atende suas necessidades
            </p>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="py-12">
        <div className="container">
          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            {servicePlans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative flex flex-col p-6 transition-all duration-300 hover:shadow-lg ${
                  plan.recommended
                    ? "border-2 border-primary ring-2 ring-primary/20"
                    : "border-border hover:border-primary/50"
                }`}
              >
                {plan.badgeText && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide">
                      {plan.badgeText}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg ${plan.recommended ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {plan.icon}
                  </div>
                  <h3 className="font-heading text-lg font-bold text-foreground">
                    {plan.name}
                  </h3>
                </div>

                <div className="mb-4">
                  <span className="font-heading text-3xl font-bold text-foreground">
                    {formatPrice(plan.price)}
                  </span>
                </div>

                <p className="text-sm text-muted-foreground mb-6">
                  {plan.description}
                </p>

                <ul className="space-y-3 mb-6 flex-1">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSelectPlan(plan)}
                  variant={plan.recommended ? "default" : "outline"}
                  className="w-full"
                >
                  Escolher
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default ServiceSelection;
