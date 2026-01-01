import { useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, Mail, MessageCircle, Clock, ArrowRight, Home } from "lucide-react";

const ThankYou = () => {
  const location = useLocation();
  const { formData, selectedPlan, certificateType } = location.state || {};
  
  // URL do SOLICITE LINK - configurável via variável de ambiente
  const SOLICITE_LINK_URL = import.meta.env.VITE_SOLICITE_LINK_URL || 'http://localhost:8080';

  // Redirecionar automaticamente para SOLICITE LINK após 3 segundos
  useEffect(() => {
    if (formData && selectedPlan) {
      // Preparar dados para passar via URL params
      const planoNome = selectedPlan.name || '';
      const planoId = selectedPlan.id || 'padrao';
      const email = formData.email || '';
      
      // Construir URL do SOLICITE LINK com parâmetros
      const obrigadoUrl = new URL(`${SOLICITE_LINK_URL}/obrigado`);
      obrigadoUrl.searchParams.set('plano', planoNome);
      obrigadoUrl.searchParams.set('planoId', planoId);
      obrigadoUrl.searchParams.set('email', email);
      if (certificateType) obrigadoUrl.searchParams.set('tipo', certificateType);
      
      // Também salvar no localStorage como fallback
      if (planoNome) localStorage.setItem('planoNome', planoNome);
      if (planoId) localStorage.setItem('planoId', planoId);
      if (email) localStorage.setItem('ticketEmail', email);
      if (certificateType) localStorage.setItem('tipoCertidao', certificateType);
      
      // Redirecionar após 3 segundos
      const timer = setTimeout(() => {
        window.location.href = obrigadoUrl.toString();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [formData, selectedPlan, certificateType, SOLICITE_LINK_URL]);

  if (!formData || !selectedPlan) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Página não encontrada
          </h1>
          <Button asChild className="mt-6">
            <Link to="/">Voltar ao Início</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const getDeliveryInfo = () => {
    switch (selectedPlan.id) {
      case "padrao":
        return {
          time: "até 3 dias úteis",
          method: "E-mail",
          icon: <Mail className="h-6 w-6" />,
        };
      case "prioridade":
        return {
          time: "até 24 horas",
          method: "E-mail",
          icon: <Mail className="h-6 w-6" />,
        };
      case "premium":
        return {
          time: "até 4 horas",
          method: "E-mail e WhatsApp",
          icon: <MessageCircle className="h-6 w-6" />,
        };
      default:
        return {
          time: "em breve",
          method: "E-mail",
          icon: <Mail className="h-6 w-6" />,
        };
    }
  };

  const deliveryInfo = getDeliveryInfo();

  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden hero-gradient py-16 lg:py-20">
        <div className="container relative">
          <div className="animate-slide-up text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-foreground/20 rounded-full mb-6">
              <CheckCircle className="h-10 w-10 text-primary-foreground" />
            </div>
            <h1 className="font-heading text-3xl font-bold text-primary-foreground sm:text-4xl">
              Pagamento Confirmado!
            </h1>
            <p className="mt-4 text-lg text-primary-foreground/80">
              Sua solicitação foi recebida com sucesso
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="container max-w-2xl">
          <Card className="p-8">
            <div className="text-center mb-8">
              <h2 className="font-heading text-xl font-bold text-foreground mb-2">
                {selectedPlan.name}
              </h2>
              <p className="text-muted-foreground">
                {selectedPlan.description}
              </p>
            </div>

            {/* Delivery Info */}
            <div className="bg-muted rounded-xl p-6 mb-8">
              <h3 className="font-heading font-semibold text-foreground mb-4 text-center">
                Informações de Entrega
              </h3>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3 bg-background rounded-lg p-4">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Prazo de Entrega</p>
                    <p className="font-medium text-foreground">{deliveryInfo.time}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-background rounded-lg p-4">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    {deliveryInfo.icon}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Forma de Envio</p>
                    <p className="font-medium text-foreground">{deliveryInfo.method}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Email Info */}
            <div className="text-center mb-8 p-4 bg-accent/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">
                A certidão será enviada para:
              </p>
              <p className="font-medium text-foreground">
                {formData.email}
              </p>
            </div>

            {/* Next Steps */}
            <div className="space-y-4 mb-8">
              <h3 className="font-heading font-semibold text-foreground">
                Próximos Passos
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-bold text-primary">
                    1
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Você receberá um e-mail de confirmação com os detalhes do pedido.
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-bold text-primary">
                    2
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Nossa equipe iniciará o processamento da sua certidão.
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-bold text-primary">
                    3
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Assim que pronta, a certidão será enviada {deliveryInfo.method.toLowerCase() === "e-mail" ? "para seu e-mail" : "por e-mail e WhatsApp"} em formato PDF.
                  </p>
                </li>
              </ul>
            </div>

            {/* Mensagem de Redirecionamento */}
            <div className="text-center mb-6 p-4 bg-primary/10 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Você será redirecionado automaticamente em alguns instantes...
              </p>
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                size="lg"
                onClick={() => {
                  const planoNome = selectedPlan.name || '';
                  const planoId = selectedPlan.id || 'padrao';
                  const email = formData.email || '';
                  
                  const obrigadoUrl = new URL(`${SOLICITE_LINK_URL}/obrigado`);
                  obrigadoUrl.searchParams.set('plano', planoNome);
                  obrigadoUrl.searchParams.set('planoId', planoId);
                  obrigadoUrl.searchParams.set('email', email);
                  if (certificateType) obrigadoUrl.searchParams.set('tipo', certificateType);
                  
                  window.location.href = obrigadoUrl.toString();
                }}
              >
                Continuar
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/contato">
                  Precisa de Ajuda?
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      </section>
    </Layout>
  );
};

export default ThankYou;
