import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Contato() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    assunto: "",
    mensagem: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAssuntoChange = (value: string) => {
    setFormData((prev) => ({ ...prev, assunto: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // TODO: Implementar validação de reCAPTCHA aqui
    // Exemplo de onde adicionar:
    // const recaptchaToken = await executeRecaptcha();
    // if (!recaptchaToken) {
    //   // Mostrar erro de reCAPTCHA
    //   return;
    // }

    // Simular envio do formulário
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setIsSubmitted(true);

    // Limpar formulário após 3 segundos
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({
        nome: "",
        email: "",
        assunto: "",
        mensagem: "",
      });
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-4">
        <div className="container">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao início
          </button>
        </div>
      </header>

      <main className="container py-12 md:py-20">
        <div className="max-w-2xl mx-auto">
          {/* Title */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
              <Mail className="w-8 h-8" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Entre em Contato
            </h1>
            <p className="text-muted-foreground">
              Estamos aqui para ajudar. Envie sua mensagem e retornaremos o mais breve possível.
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm">
            {isSubmitted ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Mensagem Enviada!
                </h2>
                <p className="text-muted-foreground">
                  Recebemos sua mensagem e retornaremos em breve.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Nome */}
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome completo *</Label>
                  <Input
                    id="nome"
                    name="nome"
                    type="text"
                    placeholder="Digite seu nome completo"
                    value={formData.nome}
                    onChange={handleChange}
                    required
                    className="h-12"
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="h-12"
                  />
                </div>

                {/* Assunto */}
                <div className="space-y-2">
                  <Label htmlFor="assunto">Assunto *</Label>
                  <Select
                    value={formData.assunto}
                    onValueChange={handleAssuntoChange}
                    required
                  >
                    <SelectTrigger id="assunto" className="h-12">
                      <SelectValue placeholder="Selecione o assunto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="duvida">Dúvida sobre o serviço</SelectItem>
                      <SelectItem value="suporte">Suporte técnico</SelectItem>
                      <SelectItem value="pagamento">Questões sobre pagamento</SelectItem>
                      <SelectItem value="solicitacao">Acompanhamento de solicitação</SelectItem>
                      <SelectItem value="outro">Outro assunto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Mensagem */}
                <div className="space-y-2">
                  <Label htmlFor="mensagem">Mensagem *</Label>
                  <Textarea
                    id="mensagem"
                    name="mensagem"
                    placeholder="Descreva sua dúvida ou solicitação..."
                    value={formData.mensagem}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="resize-none"
                  />
                </div>

                {/* reCAPTCHA Placeholder */}
                <div className="py-4">
                  {/* TODO: Implementar Google reCAPTCHA v3 ou v2 aqui */}
                  {/* 
                    Exemplo de implementação futura:
                    <ReCAPTCHA
                      sitekey="SUA_CHAVE_PUBLICA_AQUI"
                      onChange={handleRecaptchaChange}
                    />
                  */}
                  <div className="bg-muted/50 rounded-lg p-4 border border-dashed border-border text-center">
                    <p className="text-sm text-muted-foreground">
                      Proteção contra spam será implementada em breve
                    </p>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full h-12 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-base"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar Mensagem"
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  * Campos obrigatórios. Seus dados são tratados com confidencialidade.
                </p>
              </form>
            )}
          </div>

          {/* Additional Info */}
          <div className="mt-8 bg-muted/50 rounded-xl p-6 border border-border">
            <h3 className="font-semibold text-foreground mb-3">
              Outras formas de contato
            </h3>
            <p className="text-sm text-muted-foreground">
              Nossa equipe está disponível para atendê-lo. Você também pode consultar nossos{" "}
              <button
                onClick={() => navigate("/termos")}
                className="text-primary hover:underline"
              >
                Termos de Uso
              </button>
              {" "}e{" "}
              <button
                onClick={() => navigate("/privacidade")}
                className="text-primary hover:underline"
              >
                Política de Privacidade
              </button>
              .
            </p>
          </div>

          {/* Back Button */}
          <div className="mt-8 text-center">
            <Button onClick={() => navigate("/")} variant="outline" className="px-8">
              Voltar ao início
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

