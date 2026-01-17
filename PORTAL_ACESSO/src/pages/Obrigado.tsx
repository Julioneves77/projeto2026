import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Footer } from "@/components/Footer";
import { ArrowLeft, CheckCircle, Mail, MessageCircle, Clock, Home } from "lucide-react";
import { pushDL } from "@/lib/dataLayer";

const Obrigado = () => {
  const [searchParams] = useSearchParams();
  
  // Obter dados da URL ou localStorage
  const ticketCodigo = searchParams.get("codigo") || localStorage.getItem("ticketCodigo") || "";
  const planoNome = searchParams.get("plano") || localStorage.getItem("planoNome") || "Padrão";
  const planoId = searchParams.get("planoId") || localStorage.getItem("planoId") || "padrao";
  const email = searchParams.get("email") || localStorage.getItem("ticketEmail") || "";
  const tipoCertidao = searchParams.get("tipo") || localStorage.getItem("tipoCertidao") || "";

  // Limpar localStorage após ler
  useEffect(() => {
    localStorage.removeItem("ticketCodigo");
    localStorage.removeItem("planoNome");
    localStorage.removeItem("planoId");
    localStorage.removeItem("ticketEmail");
    localStorage.removeItem("tipoCertidao");
  }, []);

  // Disparar evento GTM de conversão
  useEffect(() => {
    if (ticketCodigo || planoId || tipoCertidao) {
      pushDL('payment_completed', {
        funnel_step: 'payment_success',
        source: 'portalcacesso',
        ticketCodigo: ticketCodigo,
        plano: planoId,
        tipoCertidao: tipoCertidao || "Solicitação",
        // Campos adicionais para compatibilidade
        eventCategory: "Pagamento",
        eventAction: "Confirmado",
        eventLabel: tipoCertidao || "Solicitação",
        value: planoId === "premium" ? "premium" : planoId === "prioridade" ? "prioridade" : "padrao",
      });
    }
  }, [ticketCodigo, planoId, tipoCertidao]);

  const getDeliveryInfo = () => {
    switch (planoId) {
      case "padrao":
        return {
          time: "Depende da Comarca mas maioria até 2 horas",
          method: "E-mail",
          icon: <Mail className="h-6 w-6" />,
        };
      case "prioridade":
        return {
          time: "Depende da Comarca mas maioria até 2 horas",
          method: "E-mail e WhatsApp",
          icon: <MessageCircle className="h-6 w-6" />,
        };
      case "premium":
        return {
          time: "Depende da Comarca mas maioria até 2 horas",
          method: "E-mail e WhatsApp",
          icon: <MessageCircle className="h-6 w-6" />,
        };
      default:
        return {
          time: "Depende da Comarca mas maioria até 2 horas",
          method: "E-mail",
          icon: <Mail className="h-6 w-6" />,
        };
    }
  };

  const deliveryInfo = getDeliveryInfo();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="pt-8 pb-4">
        <div className="container mx-auto px-4">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-lg font-semibold">Portal Acesso Online</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6 mx-auto">
            <CheckCircle className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Pagamento Confirmado!
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Sua solicitação foi recebida com sucesso
          </p>
        </section>

        {/* Card de Confirmação */}
        <div className="bg-white rounded-xl p-8 border border-border shadow-sm max-w-2xl mx-auto">
          {/* Informações do Plano */}
          <section className="text-center mb-8">
            <h2 className="text-xl font-bold text-foreground mb-2">
              {planoNome}
            </h2>
            {ticketCodigo && (
              <p className="text-sm text-muted-foreground">
                Código do pedido: <span className="font-semibold text-foreground">{ticketCodigo}</span>
              </p>
            )}
          </section>

          {/* Informações de Entrega */}
          <section className="bg-muted rounded-xl p-6 mb-8">
            <h3 className="font-semibold text-foreground mb-4 text-center">
              Informações de Entrega
            </h3>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 bg-background rounded-lg p-4">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Prazo de Entrega</p>
                  <p className="font-medium text-foreground text-sm">{deliveryInfo.time}</p>
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
          </section>

          {/* Email Info */}
          {email && (
            <section className="text-center mb-8 p-4 bg-accent/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">
                A solicitação será enviada para:
              </p>
              <p className="font-medium text-foreground">
                {email}
              </p>
            </section>
          )}

          {/* Próximos Passos */}
          <section className="space-y-4 mb-8">
            <h3 className="font-semibold text-foreground">
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
                  Nossa equipe iniciará o processamento da sua solicitação.
                </p>
              </li>
              <li className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-bold text-primary">
                  3
                </div>
                <p className="text-sm text-muted-foreground">
                  Você receberá sua Solicitação por Email/WhatsApp assim que estiver Pronta.
                </p>
              </li>
            </ul>
          </section>

          {/* CTA */}
          <nav className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/"
              className="btn-primary flex items-center justify-center gap-2"
            >
              <Home className="h-4 w-4" />
              Voltar ao Início
            </Link>
            <Link
              to="/contato"
              className="btn-secondary flex items-center justify-center gap-2"
            >
              Precisa de Ajuda?
            </Link>
          </nav>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Obrigado;


