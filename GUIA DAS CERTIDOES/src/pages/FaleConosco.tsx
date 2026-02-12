import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { MessageCircle, Mail, Clock, MapPin } from "lucide-react";

const cards = [
  {
    icon: Mail,
    title: "E-mail",
    lines: ["contato@centraldascertidoes.com", "Resposta em até 24 horas úteis"],
    highlight: 0,
  },
  {
    icon: Clock,
    title: "Horário",
    lines: ["Segunda a Sexta", "08h às 17h30", "Horário de Brasília"],
    highlight: -1,
  },
  {
    icon: MapPin,
    title: "Atendimento",
    lines: ["100% Digital", "Todo o Brasil", "Sem sair de casa"],
    highlight: -1,
  },
];

const FaleConosco = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Fale Conosco</h1>
            <p className="text-muted-foreground mb-12 max-w-md mx-auto text-base">
              Estamos aqui para ajudar. Entre em contato através dos nossos canais de atendimento.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
              {cards.map((card) => (
                <div key={card.title} className="bg-card border rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <card.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground mb-3 text-lg">{card.title}</h3>
                  <div className="space-y-1">
                    {card.lines.map((line, i) => (
                      <p
                        key={i}
                        className={`text-sm ${
                          i === card.highlight ? "text-primary font-medium" : "text-muted-foreground"
                        }`}
                      >
                        {i === card.highlight && card.title === "E-mail" ? (
                          <a href={`mailto:${line}`} className="hover:underline">
                            {line}
                          </a>
                        ) : (
                          line
                        )}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 bg-muted/50 rounded-xl p-6 text-left">
              <h2 className="font-semibold text-foreground mb-4 text-lg">Informações Importantes</h2>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Nossa equipe está disponível de segunda a sexta-feira, das 8h às 17h30 (horário de Brasília)</li>
                <li>• Respondemos todos os e-mails em até 24 horas úteis</li>
                <li>• Atendimento 100% digital, sem necessidade de sair de casa</li>
                <li>• Suporte para todo o território nacional</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FaleConosco;
