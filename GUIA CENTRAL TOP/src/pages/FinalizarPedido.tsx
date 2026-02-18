import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HiddenDisclaimer from "@/components/HiddenDisclaimer";
import HiddenCertidaoInfo from "@/components/HiddenCertidaoInfo";
import { useSearchParams } from "react-router-dom";
import { useState } from "react";
import { ChevronRight, ChevronLeft, Check } from "lucide-react";

const orgaosEmissores = ["SSP", "SDS", "SESP", "SEJUSP", "PC", "IFP", "DETRAN", "PM", "CBM", "CREA", "CRM", "OAB", "Outro"];
const ufs = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"];

const steps = ["Dados Pessoais", "Endereço", "Revisão e Pagamento"];

const FinalizarPedido = () => {
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type") || "Documento";
  const [step, setStep] = useState(0);

  const [form, setForm] = useState({
    nome: "", cpf: "", nascimento: "", nomeMae: "", nomePai: "",
    rg: "", orgaoEmissor: "", ufEmissor: "", email: "", celular: "",
    cep: "", logradouro: "", numero: "", complemento: "", bairro: "",
    cidade: "", uf: "",
  });

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const canNext = () => {
    if (step === 0) return form.nome && form.cpf && form.nascimento && form.nomeMae && form.rg && form.orgaoEmissor && form.ufEmissor && form.email && form.celular;
    if (step === 1) return form.cep && form.logradouro && form.numero && form.bairro && form.cidade && form.uf;
    return true;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <HiddenDisclaimer />
      <HiddenCertidaoInfo certidaoName={type} />
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground text-center mb-6">{type}</h1>

        {/* Step tabs */}
        <div className="grid grid-cols-3 gap-1 mb-8">
          {steps.map((s, i) => (
            <button
              key={s}
              onClick={() => i < step && setStep(i)}
              className={`py-3 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                i === step
                  ? "gradient-hero text-primary-foreground shadow-hero"
                  : i < step
                  ? "bg-primary/10 text-primary"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Step 0: Dados Pessoais */}
        {step === 0 && (
          <div className="space-y-4 animate-fade-in-up">
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">Dados Pessoais</h2>
            <Field label="Nome Completo *" value={form.nome} onChange={(v) => update("nome", v)} placeholder="Digite seu Nome Completo..." />
            <Field label="CPF *" value={form.cpf} onChange={(v) => update("cpf", formatCPF(v))} placeholder="000.000.000-00" maxLength={14} />
            <Field label="Data de Nascimento *" value={form.nascimento} onChange={(v) => update("nascimento", formatDate(v))} placeholder="00/00/0000" maxLength={10} />
            <Field label="Nome Completo da Mãe *" value={form.nomeMae} onChange={(v) => update("nomeMae", v)} placeholder="Digite o Nome Completo da Mãe..." />
            <Field label="Nome Completo do Pai" value={form.nomePai} onChange={(v) => update("nomePai", v)} placeholder="Digite o Nome Completo do Pai..." />
            <Field label="RG / Identidade *" value={form.rg} onChange={(v) => update("rg", v)} placeholder="Digite o Número do RG" />
            <div className="grid grid-cols-2 gap-4">
              <SelectField label="Órgão Emissor do RG *" value={form.orgaoEmissor} onChange={(v) => update("orgaoEmissor", v)} options={orgaosEmissores} placeholder="Selecione o órgão emissor..." />
              <SelectField label="UF Emissor *" value={form.ufEmissor} onChange={(v) => update("ufEmissor", v)} options={ufs} placeholder="Selecione a UF..." />
            </div>
            <Field label="E-mail *" value={form.email} onChange={(v) => update("email", v)} placeholder="seu@email.com" type="email" />
            <Field label="Celular *" value={form.celular} onChange={(v) => update("celular", formatPhone(v))} placeholder="(00) 00000-0000" maxLength={15} />
          </div>
        )}

        {/* Step 1: Endereço */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in-up">
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">Endereço</h2>
            <Field label="CEP *" value={form.cep} onChange={(v) => update("cep", formatCEP(v))} placeholder="00000-000" maxLength={9} />
            <Field label="Logradouro *" value={form.logradouro} onChange={(v) => update("logradouro", v)} placeholder="Rua, Avenida, etc." />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Número *" value={form.numero} onChange={(v) => update("numero", v)} placeholder="Nº" />
              <Field label="Complemento" value={form.complemento} onChange={(v) => update("complemento", v)} placeholder="Apto, Bloco, etc." />
            </div>
            <Field label="Bairro *" value={form.bairro} onChange={(v) => update("bairro", v)} placeholder="Bairro" />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Cidade *" value={form.cidade} onChange={(v) => update("cidade", v)} placeholder="Cidade" />
              <SelectField label="UF *" value={form.uf} onChange={(v) => update("uf", v)} options={ufs} placeholder="UF..." />
            </div>
          </div>
        )}

        {/* Step 2: Revisão */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in-up">
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">Revisão e Pagamento</h2>
            <div className="bg-card border border-border rounded-xl p-5 space-y-3">
              <p className="font-heading font-semibold text-primary text-sm">{type}</p>
              <div className="border-t border-border pt-3 space-y-2 text-sm">
                <ReviewRow label="Nome" value={form.nome} />
                <ReviewRow label="CPF" value={form.cpf} />
                <ReviewRow label="Nascimento" value={form.nascimento} />
                <ReviewRow label="Mãe" value={form.nomeMae} />
                {form.nomePai && <ReviewRow label="Pai" value={form.nomePai} />}
                <ReviewRow label="RG" value={`${form.rg} - ${form.orgaoEmissor}/${form.ufEmissor}`} />
                <ReviewRow label="E-mail" value={form.email} />
                <ReviewRow label="Celular" value={form.celular} />
              </div>
              <div className="border-t border-border pt-3 space-y-2 text-sm">
                <ReviewRow label="Endereço" value={`${form.logradouro}, ${form.numero}${form.complemento ? ` - ${form.complemento}` : ''}`} />
                <ReviewRow label="Bairro" value={form.bairro} />
                <ReviewRow label="Cidade/UF" value={`${form.cidade}/${form.uf}`} />
                <ReviewRow label="CEP" value={form.cep} />
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="font-heading font-semibold text-foreground">Total</span>
                <span className="font-heading font-bold text-primary text-xl">R$ 37,90</span>
              </div>
              <p className="text-xs text-muted-foreground mb-4">Pagamento via PIX com confirmação instantânea. Processamento digital automatizado.</p>
              <button className="w-full py-3 rounded-xl gradient-hero text-primary-foreground font-semibold hover:opacity-90 transition-opacity shadow-hero flex items-center justify-center gap-2">
                <Check size={18} /> Confirmar e Pagar via PIX
              </button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Ao confirmar, você concorda com nossos <a href="/termos-de-uso" className="text-primary underline">Termos de Uso</a> e <a href="/politica-privacidade" className="text-primary underline">Política de Privacidade</a>.
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8 gap-4">
          {step > 0 ? (
            <button onClick={() => setStep(step - 1)} className="px-6 py-3 rounded-xl border border-border bg-card text-foreground text-sm font-medium hover:bg-secondary transition-colors flex items-center gap-2">
              <ChevronLeft size={16} /> Voltar
            </button>
          ) : <div />}
          {step < 2 && (
            <button
              onClick={() => canNext() && setStep(step + 1)}
              disabled={!canNext()}
              className="px-6 py-3 rounded-xl gradient-hero text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity shadow-hero flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed ml-auto"
            >
              Próximo <ChevronRight size={16} />
            </button>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

// Reusable components
const Field = ({ label, value, onChange, placeholder, type = "text", maxLength }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string; maxLength?: number }) => (
  <div>
    <label className="block text-sm font-medium text-foreground mb-1">{label}</label>
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} maxLength={maxLength}
      className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm placeholder:text-muted-foreground" />
  </div>
);

const SelectField = ({ label, value, onChange, options, placeholder }: { label: string; value: string; onChange: (v: string) => void; options: string[]; placeholder: string }) => (
  <div>
    <label className="block text-sm font-medium text-foreground mb-1">{label}</label>
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm appearance-none">
      <option value="">{placeholder}</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const ReviewRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between">
    <span className="text-muted-foreground">{label}</span>
    <span className="text-foreground font-medium text-right">{value}</span>
  </div>
);

// Formatters
const formatCPF = (v: string) => v.replace(/\D/g, "").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2").slice(0, 14);
const formatPhone = (v: string) => v.replace(/\D/g, "").replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2").slice(0, 15);
const formatDate = (v: string) => v.replace(/\D/g, "").replace(/(\d{2})(\d)/, "$1/$2").replace(/(\d{2})(\d)/, "$1/$2").slice(0, 10);
const formatCEP = (v: string) => v.replace(/\D/g, "").replace(/(\d{5})(\d)/, "$1-$2").slice(0, 9);

export default FinalizarPedido;
