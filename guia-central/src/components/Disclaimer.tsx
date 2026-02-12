import { AlertTriangle } from "lucide-react";

const Disclaimer = () => {
  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
              <AlertTriangle className="text-accent" size={20} />
            </div>
            <h3 className="font-heading font-bold text-foreground text-lg">
              Importante: Somos Plataforma Privada
            </h3>
          </div>
          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              <strong className="text-foreground">Esta é uma plataforma privada e independente</strong> que utiliza tecnologia para processamento digital de solicitações de documentos.
            </p>
            <p>
              <strong className="text-foreground">Nosso sistema utiliza inteligência artificial</strong> para orientar o usuário e automatizar consultas de forma independente, sem vínculo com órgãos públicos.
            </p>
            <p>
              <strong className="text-foreground">NÃO somos órgão público</strong> nem possuímos vínculo direto com o Governo. Somos uma empresa de tecnologia que facilita o acesso a documentos.
            </p>
            <p>
              O processamento é feito de forma <strong className="text-foreground">automatizada e digital</strong>. Você contrata nosso serviço de processamento, não o órgão emissor.
            </p>
            <p className="border-t border-border pt-3 text-xs">
              <strong className="text-foreground">Aviso:</strong> Não somos site do governo. Os documentos são emitidos pelas fontes oficiais; nossa plataforma apenas automatiza a solicitação e o acompanhamento. Você pode solicitar diretamente nos órgãos públicos, mas oferecemos tecnologia, praticidade e economia de tempo.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Disclaimer;
