import { motion } from "framer-motion";
import { FileCheck, Phone } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import ProductCard, { certidoes, certidaoToRoute } from "@/components/ProductCard";
import HowItWorks from "@/components/HowItWorks";
import PrivateServiceBanner from "@/components/PrivateServiceBanner";
import FAQ from "@/components/FAQ";
import Footer from "@/components/layout/Footer";
import SEOHead from "@/components/SEOHead";
import StructuredData from "@/components/StructuredData";
import HiddenDisclaimer from "@/components/HiddenDisclaimer";
import LiveDashboard from "@/components/LiveDashboard";
import AnimatedHeader from "@/components/AnimatedHeader";

const Index = () => {
  const navigate = useNavigate();

  const handleProductClick = (id: string) => {
    const route = certidaoToRoute[id];
    if (route) navigate(route);
  };

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-x-hidden overflow-y-auto w-full max-w-[100vw]">
      <SEOHead
        title="Plataforma Privada de Automação por IA"
        description="Plataforma PRIVADA e INDEPENDENTE de processamento digital de certidões e documentos. NÃO somos órgão público. Utilizamos tecnologia e IA para automatizar solicitações. Antecedentes criminais, CND, quitação eleitoral e mais."
      />
      <StructuredData />

      <div className="relative z-10 w-full max-w-[100vw] overflow-x-hidden">
        <header className="border-b border-slate-200 bg-white sticky top-0 z-50 shadow-sm">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileCheck className="w-5 h-5 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-foreground text-base">
                  Guia <span className="text-primary">Central</span>
                </span>
                <span className="text-xs text-muted-foreground">
                  Certidões e Documentos
                </span>
              </div>
            </Link>
            <nav className="flex items-center gap-6">
              <Link
                to="/contato"
                className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
              >
                <Phone className="w-4 h-4" />
                Fale Conosco
              </Link>
            </nav>
          </div>
        </header>

        <div className="bg-primary py-3 text-center">
          <span className="text-xs text-primary-foreground font-medium tracking-wide">
            Plataforma privada • Automação com IA • Processamento digital
          </span>
        </div>

        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-slate-50"
        >
          <section className="container mx-auto px-6 pt-8 pb-10 relative">
            <HiddenDisclaimer />
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6 relative z-20"
            >
              <h1 className="sr-only">Certidão no Email - Processamento por IA</h1>
              <AnimatedHeader />
            </motion.div>
          </section>

          <section className="container mx-auto px-6 pb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-px flex-1 bg-slate-200" />
              <h2 className="text-xl font-semibold text-foreground">
                Selecione o documento
              </h2>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

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
                  <LiveDashboard />
                </div>
              </div>
            </div>
            <div className="lg:hidden mt-8">
              <LiveDashboard />
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
