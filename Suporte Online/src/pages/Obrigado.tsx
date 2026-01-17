import { CheckCircle, Mail, ArrowLeft, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useState } from "react";

export default function Obrigado() {
  const navigate = useNavigate();
  const location = useLocation();
  const [copied, setCopied] = useState(false);
  
  const ticketCode = location.state?.ticketCode;
  const ticketId = location.state?.ticketId;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-4">
        <div className="container">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Voltar ao início
          </button>
        </div>
      </header>

      <main className="container py-12 md:py-20">
        <div className="max-w-xl mx-auto text-center">
          {/* Success Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 text-green-600 mb-6">
            <CheckCircle className="w-10 h-10" />
          </div>

          {/* Title */}
          <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
            Solicitação Recebida!
          </h1>
          
          <p className="text-lg text-muted-foreground mb-8">
            Obrigado por confiar em nosso serviço. Sua solicitação foi registrada com sucesso.
          </p>

          {/* Ticket Code */}
          {ticketCode && (
            <div className="bg-card border border-border rounded-xl p-6 mb-8 shadow-sm">
              <p className="text-sm text-muted-foreground mb-2 text-center">
                Código do seu atendimento:
              </p>
              <div className="flex items-center justify-center gap-2">
                <div className="bg-muted rounded-lg px-4 py-2 text-lg font-bold text-foreground font-mono">
                  {ticketCode}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopy(ticketCode)}
                  className="shrink-0"
                >
                  {copied ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-3 text-center">
                Guarde este código para acompanhar seu atendimento
              </p>
            </div>
          )}

          {/* Info Card */}
          <div className="bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm text-left mb-8">
            <h2 className="font-semibold text-foreground mb-4 text-center">
              Próximos passos
            </h2>
            
            <div className="space-y-4">
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-semibold text-sm">
                  1
                </div>
                <div>
                  <p className="font-medium text-foreground">Confirmação do pagamento</p>
                  <p className="text-sm text-muted-foreground">
                    Estamos verificando seu pagamento. Isso pode levar alguns minutos.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-semibold text-sm">
                  2
                </div>
                <div>
                  <p className="font-medium text-foreground">Análise da solicitação</p>
                  <p className="text-sm text-muted-foreground">
                    Nossa equipe irá processar sua solicitação com prioridade.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-semibold text-sm">
                  3
                </div>
                <div>
                  <p className="font-medium text-foreground">Retorno em até 2 horas</p>
                  <p className="text-sm text-muted-foreground">
                    Você receberá o resultado por e-mail.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-muted/50 rounded-xl p-6 mb-8">
            <p className="text-sm text-muted-foreground mb-4">
              Precisa de ajuda? Entre em contato:
            </p>
            <div className="flex items-center justify-center">
              <Button asChild variant="outline">
                <Link to="/contato" className="inline-flex items-center justify-center gap-2 text-sm text-primary">
                  <Mail className="w-4 h-4" />
                  Página de Contato
                </Link>
              </Button>
            </div>
          </div>

          {/* Back Button */}
          <Button onClick={() => navigate("/")} variant="outline" className="px-8">
            Voltar ao início
          </Button>

          {/* Notice */}
          <p className="text-xs text-muted-foreground mt-8 max-w-md mx-auto">
            Este é um serviço privado de assistência. Guarde esta página como comprovante da sua solicitação.
          </p>
        </div>
      </main>
    </div>;
}