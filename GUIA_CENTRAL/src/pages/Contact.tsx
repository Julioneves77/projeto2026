import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { getRecaptchaToken } from "@/lib/recaptcha";
import { RECAPTCHA_CONFIG } from "@/config/recaptcha";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import FormField from "@/components/forms/FormField";
import { validateEmail, validatePhone, formatPhone } from "@/lib/validations";
import { toast } from "@/hooks/use-toast";
import { Clock, Send, Loader2 } from "lucide-react";

interface ContactForm {
  nome: string;
  email: string;
  telefone: string;
  mensagem: string;
}

interface FormErrors {
  nome?: string;
  email?: string;
  telefone?: string;
  mensagem?: string;
}

const Contact = () => {
  const [form, setForm] = useState<ContactForm>({
    nome: "",
    email: "",
    telefone: "",
    mensagem: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.nome.trim()) newErrors.nome = "Nome é obrigatório";
    if (!form.email.trim()) newErrors.email = "E-mail é obrigatório";
    else if (!validateEmail(form.email)) newErrors.email = "E-mail inválido";
    if (!form.telefone.trim()) newErrors.telefone = "Telefone é obrigatório";
    else if (!validatePhone(form.telefone)) newErrors.telefone = "Telefone inválido";
    if (!form.mensagem.trim()) newErrors.mensagem = "Mensagem é obrigatória";
    else if (form.mensagem.length < 10) newErrors.mensagem = "Mensagem deve ter pelo menos 10 caracteres";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (!RECAPTCHA_CONFIG.siteKey) {
      toast({
        title: "Erro de configuração",
        description: "reCAPTCHA não configurado. Entre em contato com o suporte.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const recaptchaToken = await getRecaptchaToken(RECAPTCHA_CONFIG.siteKey);
      const SYNC_SERVER_URL = import.meta.env.VITE_SYNC_SERVER_URL || "http://localhost:3001";
      const mensagemCompleta = form.telefone
        ? `Telefone: ${form.telefone}\n\n${form.mensagem}`
        : form.mensagem;

      const response = await fetch(`${SYNC_SERVER_URL}/api/contato`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: form.nome,
          email: form.email,
          mensagem: mensagemCompleta,
          recaptchaToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao enviar mensagem");
      }

      toast({
        title: "Mensagem enviada!",
        description: "Entraremos em contato em breve.",
      });
      setForm({ nome: "", email: "", telefone: "", mensagem: "" });
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      const isRecaptchaError =
        error instanceof Error &&
        (error.message.includes("site key") ||
          error.message.includes("api.js") ||
          error.message.includes("recaptcha"));
      const userMessage = isRecaptchaError
        ? "Verificação de segurança não concluída. Recarregue a página e tente novamente."
        : "Não foi possível enviar sua mensagem. Tente novamente mais tarde.";
      toast({
        title: "Erro ao enviar",
        description: userMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <SEOHead
        title="Contato - Guia Central"
        description="Entre em contato conosco. Estamos prontos para ajudar com suas dúvidas sobre certidões."
      />
      <section className="relative overflow-hidden bg-primary py-12 lg:py-16">
        <div className="container relative">
          <div className="mx-auto max-w-2xl text-center animate-slide-up">
            <h1 className="text-3xl font-bold text-primary-foreground sm:text-4xl">Fale Conosco</h1>
            <p className="mt-4 text-lg text-primary-foreground/90">Estamos aqui para ajudar você</p>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-12 lg:grid-cols-3">
              <div className="space-y-6">
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Clock className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Horário</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Segundas às sexta-feiras
                        <br />
                        das 08:00h às 17:00h
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2">
                <form
                  onSubmit={handleSubmit}
                  className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm"
                >
                  <h2 className="text-xl font-bold text-foreground mb-6">Envie sua mensagem</h2>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <FormField label="Nome" required error={errors.nome}>
                      <Input
                        value={form.nome}
                        onChange={(e) => setForm({ ...form, nome: e.target.value })}
                        placeholder="Seu nome completo"
                      />
                    </FormField>
                    <FormField label="E-mail" required error={errors.email}>
                      <Input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="seu@email.com"
                      />
                    </FormField>
                  </div>
                  <div className="mt-6">
                    <FormField label="Telefone" required error={errors.telefone}>
                      <Input
                        value={form.telefone}
                        onChange={(e) => setForm({ ...form, telefone: formatPhone(e.target.value) })}
                        placeholder="(00) 00000-0000"
                      />
                    </FormField>
                  </div>
                  <div className="mt-6">
                    <FormField label="Mensagem" required error={errors.mensagem}>
                      <Textarea
                        value={form.mensagem}
                        onChange={(e) => setForm({ ...form, mensagem: e.target.value })}
                        placeholder="Como podemos ajudar você?"
                        rows={5}
                      />
                    </FormField>
                  </div>
                  <div className="mt-8">
                    <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-auto">
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Enviar Mensagem
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;
