import { Shield, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
export function HeroSection() {
  const scrollToForm = () => {
    document.getElementById("formulario")?.scrollIntoView({
      behavior: "smooth"
    });
  };
  return <section className="hero-section min-h-[85vh] flex items-center relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
      </div>

      <div className="container relative z-10 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center">
          {/* Trust badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/90 text-sm font-medium mb-8 backdrop-blur-sm">
            <Shield className="w-4 h-4" />
            <span>Serviço privado de assistência</span>
          </div>

          {/* Main heading */}
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6 text-balance">
            Solicitação Criminal com Acompanhamento Privado
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto text-balance">
            Serviço pago de Organização, Conferência e Envio por E-mail.
          </p>

          {/* CTA Button */}
          <Button onClick={scrollToForm} size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-8 py-6 h-auto font-semibold shadow-lg hover:shadow-xl transition-all">
            Solicitar Agora
            <ArrowDown className="ml-2 w-5 h-5" />
          </Button>

          {/* Quick info */}
          <p className="text-white/60 text-sm mt-6">Atendimento de segunda a sexta • Resposta em até 30 min</p>
        </div>
      </div>
    </section>;
}