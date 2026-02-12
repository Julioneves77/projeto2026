import { Info } from "lucide-react";

const InfoBox = () => {
  return (
    <section className="py-12">
      <div className="container">
        <div className="max-w-3xl mx-auto bg-primary rounded-xl p-8 text-primary-foreground">
          <div className="flex items-start gap-3 mb-4">
            <Info className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <h3 className="font-bold text-lg">Importante: Somos Plataforma Privada</h3>
          </div>
          <div className="space-y-3 text-sm leading-relaxed opacity-90">
            <p>
              <strong>Esta é uma plataforma privada e independente que utiliza tecnologia para processamento digital de solicitações de documentos.</strong>
            </p>
            <p>
              <strong>Nosso sistema utiliza inteligência artificial</strong> para orientar o usuário e automatizar consultas de forma independente, sem vínculo com órgãos públicos.
            </p>
            <p>
              <strong>NÃO somos órgão público</strong> nem possuímos vínculo direto com o Governo. Somos uma empresa de tecnologia que facilita o acesso a documentos.
            </p>
            <p>
              O processamento é feito de forma <strong>automatizada e digital</strong>. Você contrata nosso serviço de processamento, não o órgão emissor.
            </p>
            <p>
              <strong>Aviso:</strong> Não somos site do governo. Os documentos são emitidos pelas fontes oficiais; nossa plataforma apenas automatiza a solicitação e o acompanhamento.
            </p>
            <p>
              Você pode solicitar diretamente nos órgãos públicos, mas oferecemos tecnologia, praticidade e economia de tempo com nosso sistema automatizado.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InfoBox;
