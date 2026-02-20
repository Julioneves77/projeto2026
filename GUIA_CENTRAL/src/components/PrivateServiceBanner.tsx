import { motion } from "framer-motion";
import { AlertTriangle, Shield } from "lucide-react";

const PrivateServiceBanner = () => {
  return (
    <section className="container mx-auto px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative rounded-xl border border-yellow-500/20 bg-card shadow-sm overflow-hidden"
      >
        {/* Top accent line */}
        <div className="h-[2px] bg-gradient-to-r from-transparent via-yellow-500/60 to-transparent" />

        <div className="p-8 md:p-10">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-orbitron font-bold text-foreground tracking-wider">
                AVISO: PLATAFORMA PRIVADA
              </h3>
              <p className="text-xs font-mono text-muted-foreground mt-1">Serviço independente de automação</p>
            </div>
          </div>

          <div className="space-y-4 text-muted-foreground text-sm leading-relaxed ml-14">
            <p>
              <strong className="text-foreground">Esta é uma plataforma privada e independente</strong> que utiliza
              tecnologia para processamento digital de solicitações de documentos.
            </p>
            <p>
              <strong className="text-foreground">Nosso sistema utiliza inteligência artificial</strong> para orientar
              o usuário e automatizar consultas de forma independente, sem vínculo com órgãos públicos.
            </p>
            <p>
              <strong className="text-foreground">NÃO somos órgão público</strong> nem possuímos vínculo direto com o
              Governo. Somos uma empresa de tecnologia que facilita o acesso a documentos.
            </p>
            <p>
              O processamento é feito de forma <strong className="text-foreground">automatizado e digital</strong>.
              Você contrata nosso serviço de processamento, não o órgão emissor.
            </p>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="flex items-start gap-3 mt-5 p-4 rounded-lg bg-muted/50 border border-border/50"
            >
              <Shield className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-xs font-mono leading-relaxed">
                <strong className="text-foreground">DISCLAIMER:</strong> Não somos site do governo. Os documentos são
                processados pelas fontes oficiais; nossa plataforma apenas automatiza a solicitação e o
                acompanhamento. Você pode solicitar diretamente nos órgãos públicos, mas oferecemos tecnologia,
                praticidade e economia de tempo com nosso sistema automatizado.
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default PrivateServiceBanner;
