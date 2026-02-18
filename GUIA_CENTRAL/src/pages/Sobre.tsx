import { useEffect } from "react";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/SEOHead";

const BASE_URL = "https://www.guia-central.online";

const Sobre = () => {
  useEffect(() => {
    const existingScripts = document.querySelectorAll('script[id^="sobre-schema-"]');
    existingScripts.forEach((script) => script.remove());

    const organizationSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Guia Central",
      "url": BASE_URL,
      "description": "Plataforma privada e independente voltada à organização e análise de informações, sem vínculo com órgãos governamentais.",
    };

    const websiteSchema = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Guia Central",
      "url": BASE_URL,
      "description": "Plataforma privada e independente voltada à organização e análise de informações.",
    };

    const injectSchema = (schema: object, id: string) => {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.id = id;
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    };

    injectSchema(organizationSchema, "sobre-schema-organization");
    injectSchema(websiteSchema, "sobre-schema-website");

    return () => {
      document.querySelectorAll('script[id^="sobre-schema-"]').forEach((s) => s.remove());
    };
  }, []);

  return (
    <Layout>
      <SEOHead
        title="Sobre a Guia Central | Plataforma Privada de Informações"
        description="Conheça a Guia Central, uma plataforma privada e independente voltada à organização e análise de informações, sem vínculo com órgãos governamentais."
        canonical={`${BASE_URL}/sobre`}
      />
      <main className="flex-1 py-12">
        <div className="container max-w-4xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-10">
            Sobre a Plataforma Guia Central
          </h1>

          <section className="mb-8">
            <h2 className="text-xl font-heading font-semibold text-foreground mb-4">Quem somos</h2>
            <p className="text-muted-foreground leading-relaxed">
              A Guia Central é uma plataforma privada de natureza comercial, dedicada à organização, análise e apresentação de informações de interesse público e privado. Atuamos de forma independente, sem qualquer vínculo institucional com órgãos governamentais, autarquias, tribunais, forças policiais ou entidades públicas.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-heading font-semibold text-foreground mb-4">Natureza do serviço</h2>
            <p className="text-muted-foreground leading-relaxed">
              Os serviços disponibilizados nesta plataforma possuem caráter informativo e operacional, com foco em facilitar o acesso organizado a informações provenientes de bases públicas e privadas, respeitando a legislação vigente. A Guia Central não realiza emissão oficial de documentos, não substitui canais governamentais e não atua como concessionária autorizada.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-heading font-semibold text-foreground mb-4">Transparência e responsabilidade</h2>
            <p className="text-muted-foreground leading-relaxed">
              Todas as informações apresentadas são organizadas de forma automatizada para fins de consulta, análise e conveniência do usuário. A utilização da plataforma é opcional e complementar aos canais oficiais. O usuário é responsável pelo uso das informações obtidas.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-heading font-semibold text-foreground mb-4">Identificação da empresa</h2>
            <dl className="space-y-3 text-muted-foreground">
              <div>
                <dt className="font-medium text-foreground">Razão social</dt>
                <dd>Guia Central</dd>
              </div>
              <div>
                <dt className="font-medium text-foreground">Natureza</dt>
                <dd>Empresa privada de atuação comercial</dd>
              </div>
              <div>
                <dt className="font-medium text-foreground">Atuação</dt>
                <dd>Serviços privados de organização, análise e intermediação informativa</dd>
              </div>
              <div>
                <dt className="font-medium text-foreground">País de operação</dt>
                <dd>Brasil</dd>
              </div>
            </dl>
          </section>

          <section className="mb-8 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground leading-relaxed">
              A Guia Central é uma plataforma privada e independente. Não somos um órgão público e não realizamos serviços governamentais oficiais.
            </p>
          </section>
        </div>
      </main>
    </Layout>
  );
};

export default Sobre;
