import { motion } from "framer-motion";
import { Bot, Terminal, Braces, ChevronDown } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import ParticleBackground from "@/components/ParticleBackground";
import ProductCard, { certidoes, certidaoToRoute } from "@/components/ProductCard";
import AutomationPanel from "@/components/AutomationPanel";
import HowItWorks from "@/components/HowItWorks";
import PrivateServiceBanner from "@/components/PrivateServiceBanner";
import FAQ from "@/components/FAQ";
import Footer from "@/components/layout/Footer";
import SEOHead from "@/components/SEOHead";
import StructuredData from "@/components/StructuredData";
import HiddenDisclaimer from "@/components/HiddenDisclaimer";

const Index = () => {
  const navigate = useNavigate();

  const handleProductClick = (id: string) => {
    const route = certidaoToRoute[id];
    if (route) navigate(route);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden overflow-y-auto cyber-grid noise-bg w-full max-w-[100vw]">
      <SEOHead
        title="Plataforma Privada de Automação por IA"
        description="Plataforma PRIVADA e INDEPENDENTE de processamento digital de certidões e documentos. NÃO somos órgão público. Utilizamos tecnologia e IA para automatizar solicitações. Antecedentes criminais, CND, quitação eleitoral e mais."
      />
      <StructuredData />
      <ParticleBackground />

      <div className="lens-flare" style={{ top: "10%", left: "20%" }} />
      <div className="lens-flare" style={{ top: "60%", right: "10%", background: "radial-gradient(circle, hsl(160 85% 40% / 0.04), transparent 70%)" }} />
      <div className="lens-flare" style={{ top: "30%", right: "30%", background: "radial-gradient(circle, hsl(185 80% 45% / 0.04), transparent 70%)" }} />

      <div className="relative z-10 w-full max-w-[100vw] overflow-x-hidden">
        <header className="border-b border-border/40 backdrop-blur-md bg-card/80 sticky top-0 z-50 shadow-sm">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center glow-blue group-hover:glow-blue-intense transition-shadow">
                <Bot className="w-5 h-5 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="font-orbitron font-bold text-foreground text-sm tracking-widest">
                  GUIA<span className="text-primary"> CENTRAL</span>
                </span>
                <span className="text-[9px] font-mono text-muted-foreground tracking-[0.2em] uppercase">
                  Automação por IA
                </span>
              </div>
            </Link>
            <nav className="flex items-center gap-4">
              <Link
                to="/contato"
                className="text-sm text-muted-foreground hover:text-primary transition-colors hidden sm:flex items-center gap-1.5 font-mono"
              >
                <Terminal className="w-3.5 h-3.5" />
                Fale Conosco
              </Link>
            </nav>
          </div>
        </header>

        <div className="bg-primary/5 border-b border-primary/10 py-2 text-center scanlines relative overflow-hidden">
          <motion.div
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute inset-y-0 w-32 bg-gradient-to-r from-transparent via-primary/10 to-transparent"
          />
          <span className="text-xs font-mono text-primary tracking-[0.3em] relative z-10">
            ◆ PLATAFORMA PRIVADA • AUTOMAÇÃO COM IA • SISTEMA ATIVO ◆
          </span>
        </div>

        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <section className="container mx-auto px-6 pt-24 pb-20 relative">
            <HiddenDisclaimer />
            <div className="absolute top-10 right-10 w-40 h-40 opacity-10 hidden lg:block">
              <svg viewBox="0 0 100 100" className="w-full h-full animate-hex-rotate">
                <polygon points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5" fill="none" stroke="hsl(210 100% 55%)" strokeWidth="0.5" />
                <polygon points="50,15 85,32.5 85,67.5 50,85 15,67.5 15,32.5" fill="none" stroke="hsl(210 100% 55%)" strokeWidth="0.3" />
                <polygon points="50,25 75,37.5 75,62.5 50,75 25,62.5 25,37.5" fill="none" stroke="hsl(145 100% 50%)" strokeWidth="0.3" />
              </svg>
            </div>

            <div className="max-w-3xl">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="flex items-center gap-3 mb-8"
              >
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-card border border-border/60 shadow-sm">
                  <div className="w-2 h-2 rounded-full bg-accent pulse-glow" />
                  <span className="text-xs font-mono text-accent tracking-wider">SISTEMA ONLINE</span>
                </div>
                <div className="h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent max-w-[120px]" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex items-center gap-2 mb-6"
              >
                <Braces className="w-4 h-4 text-primary" />
                <span className="text-sm font-mono text-primary tracking-wider uppercase">
                  Automação de Última Geração
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-4xl md:text-6xl font-bold text-foreground leading-tight mb-6"
              >
                Plataforma de{" "}
                <span className="text-primary text-glow-blue animate-hologram inline-block">
                  Inteligência Artificial
                </span>
                {" "}
                <span className="text-accent text-glow-green font-semibold">
                  para Solicitações
                </span>
              </motion.h1>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="flex flex-col items-start gap-1"
              >
                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <ChevronDown className="w-5 h-5 text-primary/50" />
                </motion.div>
              </motion.div>
            </div>
          </section>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="container mx-auto px-6 text-center text-muted-foreground font-mono text-sm md:text-base tracking-wider py-6"
          >
            Entrega Digital no Email Automático
          </motion.p>

          <section className="container mx-auto px-6 pb-16">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="flex items-center gap-3 mb-8"
            >
              <Terminal className="w-5 h-5 text-primary" />
              <h2 className="font-orbitron text-xl font-bold text-foreground tracking-wider">
                SELECIONE O DOCUMENTO
              </h2>
              <div className="h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent" />
            </motion.div>

            <div className="grid lg:grid-cols-[1fr_320px] gap-8">
              <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {certidoes.map((card) => (
                  <ProductCard
                    key={card.id}
                    card={card}
                    onClick={handleProductClick}
                  />
                ))}
              </div>
              <div className="hidden lg:block">
                <div className="sticky top-24">
                  <AutomationPanel />
                </div>
              </div>
            </div>
            <div className="lg:hidden mt-8">
              <AutomationPanel />
            </div>
          </section>

          <HowItWorks />
          <PrivateServiceBanner />
          <FAQ />
          <Footer />
        </motion.main>
      </div>
    </div>
  );
};

export default Index;
