import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { certidoes } from "./ProductCard";

interface DynamicFormProps {
  certidaoId: string;
  onBack: () => void;
}

const DynamicForm = ({ certidaoId, onBack }: DynamicFormProps) => {
  const certidao = certidoes.find((c) => c.id === certidaoId);
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({ nome: "", cpf: "", dataNascimento: "", email: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const fields = [
    { key: "nome", label: "Nome Completo", placeholder: "Digite seu nome completo", type: "text" },
    { key: "cpf", label: "CPF", placeholder: "000.000.000-00", type: "text" },
    { key: "dataNascimento", label: "Data de Nascimento", placeholder: "DD/MM/AAAA", type: "text" },
    { key: "email", label: "E-mail para envio", placeholder: "seu@email.com", type: "email" },
  ];

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (value.length > 2 && step < fields.length - 1 && key === fields[step].key) {
      // Auto-advance handled by blur
    }
  };

  const handleNext = () => {
    if (step < fields.length - 1) setStep(step + 1);
  };

  const handleSubmit = () => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 2000);
  };

  if (!certidao) return null;
  const Icon = certidao.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-lg mx-auto"
    >
      {/* Header */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-mono">Voltar</span>
      </button>

      <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-8">
        {/* Title */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center glow-blue">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-foreground font-semibold text-xl">{certidao.title}</h2>
            <p className="text-muted-foreground text-sm">{certidao.subtitle}</p>
          </div>
        </div>

        {submitted ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8"
          >
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4 glow-green">
              <span className="text-accent text-2xl">✓</span>
            </div>
            <h3 className="text-foreground font-semibold text-lg mb-2">Solicitação Enviada</h3>
            <p className="text-muted-foreground text-sm">
              A IA está processando sua certidão. Você receberá no e-mail informado.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-5">
            {fields.map((field, i) => (
              <AnimatePresence key={field.key}>
                {i <= step && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.05 }}
                  >
                    <label className="block text-sm font-medium text-foreground mb-1.5 font-mono">
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      value={formData[field.key as keyof typeof formData]}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      onBlur={() => {
                        if (formData[field.key as keyof typeof formData].length > 0) handleNext();
                      }}
                      autoFocus={i === step}
                      className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-mono text-sm"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            ))}

            {step >= fields.length - 1 && formData.email.length > 0 && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full mt-4 bg-primary text-primary-foreground font-semibold py-3 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity glow-blue disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Solicitar Certidão
                  </>
                )}
              </motion.button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default DynamicForm;
