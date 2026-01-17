import { Clock } from "lucide-react";
export function DeadlineSection() {
  return <section className="py-16 bg-background">
      <div className="container">
        <div className="max-w-xl mx-auto">
          <div className="bg-primary/5 border border-primary/10 rounded-xl p-6 md:p-8 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Prazo de retorno
            </h3>
            <p className="text-muted-foreground">
              Prazo médio de retorno: <strong className="text-foreground">até 30 minutos
            </strong> após o envio das informações.
            </p>
          </div>
        </div>
      </div>
    </section>;
}