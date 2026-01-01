import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import FormField from "@/components/forms/FormField";
import { validateEmail, validatePhone, formatPhone } from "@/lib/validations";
import { toast } from "@/hooks/use-toast";
import { Mail, Phone, Clock, Send, Loader2 } from "lucide-react";

interface ContactForm {
  nome: string;
  email: string;
  telefone: string;
  mensagem: string;
  captcha: boolean;
}

interface FormErrors {
  nome?: string;
  email?: string;
  telefone?: string;
  mensagem?: string;
  captcha?: string;
}

const Contact = () => {
  const [form, setForm] = useState<ContactForm>({
    nome: "",
    email: "",
    telefone: "",
    mensagem: "",
    captcha: false,
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
    if (!form.captcha) newErrors.captcha = "Confirme que você não é um robô";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast({ title: "Mensagem enviada!", description: "Entraremos em contato em breve." });
    setForm({ nome: "", email: "", telefone: "", mensagem: "", captcha: false });
    setIsSubmitting(false);
  };

  return (
    <Layout>
      <section className="relative overflow-hidden hero-gradient py-16 lg:py-24">
        <div className="container relative">
          <div className="mx-auto max-w-2xl text-center animate-slide-up">
            <h1 className="font-heading text-4xl font-bold text-primary-foreground sm:text-5xl">Fale Conosco</h1>
            <p className="mt-4 text-lg text-primary-foreground/80">Estamos aqui para ajudar você</p>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-12 lg:grid-cols-3">
              <div className="space-y-6">
                <div className="rounded-2xl border border-border bg-card p-6 card-shadow">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><Mail className="h-6 w-6" /></div>
                    <div><h3 className="font-heading font-semibold text-foreground">E-mail</h3><p className="mt-1 text-sm text-muted-foreground">contato@portalcertidao.org</p></div>
                  </div>
                </div>
                <div className="rounded-2xl border border-border bg-card p-6 card-shadow">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><Clock className="h-6 w-6" /></div>
                    <div><h3 className="font-heading font-semibold text-foreground">Horário</h3><p className="mt-1 text-sm text-muted-foreground">Segunda a Sexta<br/>09h às 18h</p></div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2">
                <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-8 card-shadow">
                  <h2 className="font-heading text-2xl font-bold text-foreground mb-6">Envie sua mensagem</h2>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <FormField label="Nome" required error={errors.nome}><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Seu nome completo" /></FormField>
                    <FormField label="E-mail" required error={errors.email}><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="seu@email.com" /></FormField>
                  </div>
                  <div className="mt-6"><FormField label="Telefone" required error={errors.telefone}><Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: formatPhone(e.target.value) })} placeholder="(00) 00000-0000" /></FormField></div>
                  <div className="mt-6"><FormField label="Mensagem" required error={errors.mensagem}><Textarea value={form.mensagem} onChange={(e) => setForm({ ...form, mensagem: e.target.value })} placeholder="Como podemos ajudar você?" rows={5} /></FormField></div>
                  <div className="mt-6">
                    <div className="flex items-center gap-3"><Checkbox id="captcha" checked={form.captcha} onCheckedChange={(checked) => setForm({ ...form, captcha: checked as boolean })} /><label htmlFor="captcha" className="text-sm text-muted-foreground cursor-pointer">Não sou um robô</label></div>
                    {errors.captcha && <p className="mt-1 text-xs text-destructive">{errors.captcha}</p>}
                  </div>
                  <div className="mt-8"><Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-auto">{isSubmitting ? (<><Loader2 className="h-4 w-4 animate-spin" />Enviando...</>) : (<><Send className="h-4 w-4" />Enviar Mensagem</>)}</Button></div>
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
