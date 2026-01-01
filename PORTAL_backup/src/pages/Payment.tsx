import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Copy, Check, QrCode, Clock, Shield } from "lucide-react";
import { toast } from "@/hooks/use-toast";

// Mock data for testing
const mockPlan = {
  id: "prioridade",
  name: "Atendimento Prioritário",
  price: 54.87,
  description: "Processamento prioritário com especialista dedicado.",
  deliveryTime: "até 24 horas",
  features: [
    "Atendimento Prioridade (frente da fila Normal)",
    "Envio por E-mail em PDF",
  ],
};

const mockFormData = {
  nome: "Usuário Teste",
  cpf: "123.456.789-00",
  email: "teste@email.com",
};

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const locationState = location.state || {};
  
  // Use mock data if real data is not available (for testing)
  const formData = locationState.formData || mockFormData;
  const certificateType = locationState.certificateType || "criminal-estadual";
  const state = locationState.state || "SP";
  const selectedPlan = locationState.selectedPlan || mockPlan;
  
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const isTestMode = !locationState.formData;

  // Mock PIX key (in real app, this would be generated dynamically)
  const pixKey = "00020126580014br.gov.bcb.pix0136a1b2c3d4-e5f6-7890-abcd-ef1234567890520400005303986540" + selectedPlan.price.toFixed(2).replace(".", "") + "5802BR5925PORTAL CERTIDOES LTDA6009SAO PAULO62070503***6304";
  const pixKeySimple = "certidoes@portalpix.com.br";

  const formatPrice = (price: number) => {
    return price.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const handleCopyPix = async () => {
    try {
      await navigator.clipboard.writeText(pixKeySimple);
      setCopied(true);
      toast({
        title: "Chave PIX copiada!",
        description: "Cole no seu aplicativo de banco.",
      });
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast({
        title: "Erro ao copiar",
        description: "Tente copiar manualmente.",
        variant: "destructive",
      });
    }
  };

  const handleTestPayment = async () => {
    setIsProcessing(true);
    
    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    navigate("/obrigado", {
      state: {
        formData,
        certificateType,
        state,
        selectedPlan,
      },
    });
  };

  const handleChangePlan = () => {
    navigate("/selecionar-servico", {
      state: {
        formData,
        certificateType,
        state,
      },
    });
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden hero-gradient py-8">
        <div className="container relative">
          <button
            onClick={handleChangePlan}
            className="inline-flex items-center gap-2 text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground mb-3 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Alterar Tipo de Serviço
          </button>

          <div className="animate-slide-up text-center">
            {isTestMode && (
              <div className="mb-3 inline-block bg-yellow-500/20 text-yellow-200 text-xs font-medium px-3 py-1 rounded-full">
                🧪 Modo de Teste
              </div>
            )}
            <h1 className="font-heading text-2xl font-bold text-primary-foreground">
              Pagamento via PIX
            </h1>
            <p className="mt-1 text-sm text-primary-foreground/80">
              Siga os passos abaixo para realizar o pagamento
            </p>
          </div>
        </div>
      </section>

      {/* Payment Content */}
      <section className="py-8">
        <div className="container max-w-5xl">
          {/* Step by Step Instructions */}
          <div className="mb-6 bg-accent/30 rounded-xl p-4 border border-border">
            <h3 className="font-heading font-bold text-foreground mb-3 text-center">
              Como pagar com PIX
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">Abra o app do seu banco</p>
                  <p className="text-xs text-muted-foreground">Acesse a área PIX</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">Escaneie ou cole a chave</p>
                  <p className="text-xs text-muted-foreground">Use o QR Code ou copie a chave</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">Confirme o pagamento</p>
                  <p className="text-xs text-muted-foreground">Valor: {formatPrice(selectedPlan.price)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* QR Code Section */}
            <Card className="p-5">
              <div className="text-center">
                <h2 className="font-heading text-base font-bold text-foreground mb-3">
                  QR Code PIX
                </h2>
                
                {/* Mock QR Code */}
                <div className="bg-card border-2 border-border rounded-xl p-3 inline-block mb-3">
                  <div className="w-40 h-40 bg-foreground/5 rounded-lg flex items-center justify-center">
                    <QrCode className="h-28 w-28 text-foreground/40" />
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mb-3">
                  Aponte a câmera do seu celular para o QR Code
                </p>

                {/* PIX Key */}
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-2">Ou copie a chave PIX:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-sm bg-background rounded px-3 py-2 font-mono truncate">
                      {pixKeySimple}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyPix}
                      className="flex-shrink-0"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-primary" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Order Summary */}
            <Card className="p-5">
              <h2 className="font-heading text-base font-bold text-foreground mb-3">
                Resumo do Pedido
              </h2>

              <div className="space-y-3">
                {/* Plan Info */}
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-foreground text-sm">
                      {selectedPlan.name}
                    </span>
                    <span className="font-heading font-bold text-primary">
                      {formatPrice(selectedPlan.price)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {selectedPlan.description}
                  </p>
                </div>

                {/* Features */}
                <div className="space-y-1">
                  {selectedPlan.features.map((feature: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <Check className="h-3 w-3 text-primary flex-shrink-0" />
                      <span className="text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Timer Notice */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-accent/50 rounded-lg p-2">
                  <Clock className="h-3 w-3 flex-shrink-0" />
                  <span>O PIX expira em 30 minutos</span>
                </div>

                {/* Security Notice */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Shield className="h-3 w-3 flex-shrink-0" />
                  <span>Pagamento 100% seguro e criptografado</span>
                </div>

                {/* Test Button */}
                <div className="pt-3 border-t border-border">
                  <Button
                    onClick={handleTestPayment}
                    className="w-full"
                    size="sm"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                        Processando...
                      </>
                    ) : (
                      "🧪 Simular Pagamento (Teste)"
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Botão de teste para simular confirmação
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Payment;
