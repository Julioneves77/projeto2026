import { Check } from "lucide-react";

const services = [
  "Organização da solicitação",
  "Conferência das informações enviadas",
  "Verificação da situação",
  "Suporte durante o atendimento",
  "Retorno estruturado ao solicitante"
];

export function ServicesSection() {
  return (
    <section className="py-20 bg-muted">
      <div className="container">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              O que este serviço inclui
            </h2>
            <p className="text-muted-foreground">
              Assistência completa para sua solicitação
            </p>
          </div>

          <div className="bg-card rounded-xl p-8 shadow-sm border border-border">
            <ul className="space-y-4">
              {services.map((service, index) => (
                <li 
                  key={index}
                  className="flex items-start gap-4"
                >
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center mt-0.5">
                    <Check className="w-4 h-4 text-accent" />
                  </div>
                  <span className="text-foreground">{service}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
