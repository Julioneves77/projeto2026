import { AlertTriangle } from "lucide-react";

export function TransparencySection() {
  return (
    <section className="py-16 bg-background">
      <div className="container">
        <div className="max-w-2xl mx-auto">
          <div className="warning-box rounded-xl p-6 md:p-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-3">
                  Aviso importante
                </h3>
                <div className="space-y-2 text-sm leading-relaxed">
                  <p>
                    <strong>Este é um serviço privado de assistência.</strong>
                  </p>
                  <p>
                    O usuário pode realizar procedimentos diretamente pelos canais públicos oficiais, se preferir.
                  </p>
                  <p>
                    <strong>Não somos um órgão governamental.</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
