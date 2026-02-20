import { useState } from "react";
import { ArrowLeft, Send, Mail, MessageSquare, Zap, Shield, Bot } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Footer from "@/components/Footer";
import ParticleBackground from "@/components/ParticleBackground";

const Contato = () => {
  const [formData, setFormData] = useState({ nome: "", email: "", assunto: "", mensagem: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <ParticleBackground />

      {/* Lens flares */}
      <div className="lens-flare" style={{ top: "20%", left: "10%" }} />
      <div className="lens-flare" style={{ top: "70%", right: "5%", background: "radial-gradient(circle, hsl(145 100% 50% / 0.1), transparent 70%)" }} />

      <div className="relative z-10">
        <div className="container mx-auto px-6 py-12 max-w-2xl">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Voltar</span>
          </Link>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            {/* Header with animated icons */}
            <div className="flex items-center gap-3 mb-2">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <MessageSquare className="w-6 h-6 text-primary" />
              </motion.div>
              <h1 className="text-3xl font-bold text-foreground">Fale Conosco</h1>
            </div>
            <p className="text-muted-foreground text-sm mb-10">
              Tem alguma dúvida ou precisa de ajuda? Entre em contato com nossa equipe.
            </p>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-4 mb-8"
            >
              {[
                { icon: Zap, text: "Resposta rápida" },
                { icon: Shield, text: "Dados protegidos" },
                { icon: Bot, text: "Suporte com IA" },
              ].map((item, i) => (
                <motion.div
                  key={item.text}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 border border-border rounded-full px-3 py-1.5"
                >
                  <item.icon className="w-3 h-3 text-primary" />
                  <span>{item.text}</span>
                </motion.div>
              ))}
            </motion.div>

            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring" }}
                className="text-center py-16 rounded-xl border border-border bg-card/80 backdrop-blur-sm relative overflow-hidden"
              >
                {/* Scanner effect */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="scanner-line absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent opacity-40" />
                </div>

                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4 glow-green"
                >
                  <Mail className="w-7 h-7 text-accent" />
                </motion.div>
                <h3 className="text-foreground font-semibold text-lg mb-2">Mensagem Enviada!</h3>
                <p className="text-muted-foreground text-sm">Retornaremos em breve.</p>
              </motion.div>
            ) : (
              <motion.form
                onSubmit={handleSubmit}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-5 rounded-xl border border-border bg-card/80 backdrop-blur-sm p-8 relative overflow-hidden"
              >
                {/* Subtle scanner */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="scanner-line absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-20" />
                </div>

                {/* Spinning ring top right */}
                <div className="absolute top-3 right-3 w-6 h-6 opacity-30">
                  <div className="ring-spin w-full h-full rounded-full border border-primary border-t-transparent" />
                </div>

                {[
                  { label: "Nome", key: "nome", type: "text", placeholder: "Seu nome" },
                  { label: "E-mail", key: "email", type: "email", placeholder: "seu@email.com" },
                  { label: "Assunto", key: "assunto", type: "text", placeholder: "Assunto da mensagem" },
                ].map((field, i) => (
                  <motion.div
                    key={field.key}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                  >
                    <label className="block text-sm font-medium text-foreground mb-1.5">{field.label}</label>
                    <input
                      required
                      type={field.type}
                      value={formData[field.key as keyof typeof formData]}
                      onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                      className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm transition-all duration-300 focus:glow-blue"
                      placeholder={field.placeholder}
                    />
                  </motion.div>
                ))}

                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <label className="block text-sm font-medium text-foreground mb-1.5">Mensagem</label>
                  <textarea
                    required
                    rows={5}
                    value={formData.mensagem}
                    onChange={(e) => setFormData({ ...formData, mensagem: e.target.value })}
                    className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm resize-none transition-all duration-300 focus:glow-blue"
                    placeholder="Escreva sua mensagem..."
                  />
                </motion.div>

                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity glow-blue"
                >
                  <Send className="w-4 h-4" />
                  Enviar Mensagem
                </motion.button>
              </motion.form>
            )}
          </motion.div>
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default Contato;
