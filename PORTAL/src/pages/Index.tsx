import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// All certificate types configuration
const certificates = [
  {
    id: "federais",
    type: "criminal",
    title: "Certidão Negativa Criminal Federal",
    description: "Envio Digital Email / WhatsApp",
    price: "R$ 39,97",
  },
  {
    id: "estaduais",
    type: null,
    title: "Certidão Negativa Criminal Estadual",
    description: "Envio Digital Email / WhatsApp",
    price: "R$ 39,97",
  },
  {
    id: "policia-federal",
    type: null,
    title: "Antecedentes Criminais de Polícia Federal",
    description: "Envio Digital Email / WhatsApp",
    price: "R$ 39,97",
  },
  {
    id: "federais",
    type: "eleitoral",
    title: "Certidão de Quitação Eleitoral",
    description: "Envio Digital Email / WhatsApp",
    price: "R$ 39,97",
  },
  {
    id: "federais",
    type: "civel",
    title: "Certidão Negativa Cível Federal",
    description: "Envio Digital Email / WhatsApp",
    price: "R$ 39,97",
  },
  {
    id: "estaduais",
    type: "civel",
    title: "Certidão Negativa Cível Estadual",
    description: "Envio Digital Email / WhatsApp",
    price: "R$ 39,97",
  },
  {
    id: "cnd",
    type: null,
    title: "Certidão Negativa de Débitos (CND)",
    description: "Envio Digital Email / WhatsApp",
    price: "R$ 39,97",
  },
  {
    id: "cpf-regular",
    type: null,
    title: "Certidão CPF Regular",
    description: "Envio Digital Email / WhatsApp",
    price: "R$ 39,97",
  },
];

const Index = () => {
  const getLink = (cert: typeof certificates[0]) => {
    if (cert.type) {
      return `/certidao/${cert.id}?type=${cert.type}`;
    }
    return `/certidao/${cert.id}`;
  };

  return (
    <Layout>
      <main className="flex-1">
        {/* Main Content */}
        <section className="py-12 lg:py-16 bg-muted/20">
          <div className="container">
            {/* Header */}
            <div className="text-center mb-10">
              <h1 className="font-heading text-xl md:text-2xl lg:text-3xl font-bold text-primary uppercase tracking-wide">
                Serviços para Você
              </h1>
              <p className="mt-3 text-muted-foreground">
                Processo rápido, seguro e 100% online.
              </p>
            </div>

            {/* Certificate Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {certificates.map((cert, index) => (
                <Card 
                  key={index}
                  className="bg-card border border-border/50 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300"
                >
                  <CardContent className="p-6 flex flex-col items-center text-center h-full">
                    <h3 className="font-heading text-base font-bold text-primary leading-tight min-h-[3rem] flex items-center justify-center">
                      {cert.title}
                    </h3>
                    
                    <p className="mt-4 text-sm text-muted-foreground">
                      {cert.description}
                    </p>
                    
                    <p className="mt-2 text-sm text-muted-foreground">
                      Taxa de Serviço : <span className="font-semibold text-foreground">{cert.price}</span>
                    </p>
                    
                    <div className="mt-auto pt-6 w-full">
                      <Button 
                        asChild 
                        className="w-full rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                      >
                        <Link to={getLink(cert)}>
                          Solicitar Certidão
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default Index;
