import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Footer from "@/components/Footer";
import { ArrowLeft, CheckCircle, Mail, MessageCircle, Clock, Home } from "lucide-react";

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
    if (typeof window !== "undefined") {
      // Criar dataLayer se não existir
      if (!(window as any).dataLayer) {
        (window as any).dataLayer = [];
      }
      
      // Disparar evento de conversão
      (window as any).dataLayer.push({
        event: "conversion",
        eventCategory: "Pagamento",
        eventAction: "Confirmado",
        eventLabel: tipoCertidao || "Certidão",
        ticketCodigo: ticketCodigo,
        plano: planoId,
        value: planoId === "premium" ? "premium" : planoId === "prioridade" ? "prioridade" : "padrao",
      });
      
      console.log('✅ [SOLICITE LINK] Evento GTM de conversão disparado:', {
        ticketCodigo,
        planoId,
        tipoCertidao
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
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="page-header">
        <Link to="/" className="back-link">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-lg font-semibold text-gradient">Solicite Link</span>
        </Link>
      </div>

      {/* Main Content */}
      <main className="page-content">
        <div className="page-container">
          {/* Hero Section */}
          <div className="text-center mb-12 animate-fade-in-up">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6 mx-auto">
              <CheckCircle className="h-10 w-10 text-primary" />
            </div>
            <h1 className="section-title mb-4">
              Pagamento Confirmado!
            </h1>
            <p className="section-subtitle max-w-xl mx-auto">
              Sua solicitação foi recebida com sucesso
            </p>
          </div>

          {/* Card de Confirmação */}
          <div className="card-main max-w-2xl mx-auto">
            {/* Informações do Plano */}
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-foreground mb-2">
                {planoNome}
              </h2>
              {ticketCodigo && (
                <p className="text-sm text-muted-foreground">
                  Código do pedido: <span className="font-semibold text-foreground">{ticketCodigo}</span>
                </p>
              )}
            </div>

            {/* Informações de Entrega */}
            <div className="bg-muted rounded-xl p-6 mb-8">
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
            </div>

            {/* Email Info */}
            {email && (
              <div className="text-center mb-8 p-4 bg-accent/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">
                  A certidão será enviada para:
                </p>
                <p className="font-medium text-foreground">
                  {email}
                </p>
              </div>
            )}

            {/* Próximos Passos */}
            <div className="space-y-4 mb-8">
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
                    Nossa equipe iniciará o processamento da sua certidão.
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
            </div>

            {/* Informações Adicionais */}
            <div className="text-center p-4 bg-primary/5 rounded-lg mb-8">
              <p className="text-sm text-muted-foreground">
                Dúvidas? Acesse: <a href="https://www.portalcertidao.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">www.portalcertidao.org</a>
              </p>
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/"
                className="btn-action flex items-center justify-center gap-2"
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
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Obrigado;

