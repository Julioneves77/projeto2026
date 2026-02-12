import { Link } from "react-router-dom";
import { Search, ChevronRight } from "lucide-react";
import { useState } from "react";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/SEOHead";
import StructuredData from "@/components/StructuredData";

const certificates = [
  { id: "federais", type: "criminal" as const, title: "Certidão Negativa Criminal Federal" },
  { id: "estaduais", type: null, title: "Certidão Negativa Criminal Estadual" },
  { id: "policia-federal", type: null, title: "Antecedentes Criminais de Polícia Federal" },
  { id: "federais", type: "eleitoral" as const, title: "Certidão de Quitação Eleitoral" },
  { id: "federais", type: "civel" as const, title: "Certidão Negativa Cível Federal" },
  { id: "estaduais", type: "civel" as const, title: "Certidão Negativa Cível Estadual" },
  { id: "cnd", type: null, title: "Certidão Negativa de Débitos (CND)" },
  { id: "cpf-regular", type: null, title: "Certidão CPF Regular" },
];

const Index = () => {
  const [search, setSearch] = useState("");
  const filtered = certificates.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const getLink = (cert: typeof certificates[0]) => {
    if (cert.type) return `/certidao/${cert.id}?type=${cert.type}`;
    return `/certidao/${cert.id}`;
  };

  return (
    <Layout>
      <SEOHead
        title="Plataforma de Automação Documental | Portal Certidão"
        description="Portal Certidão - Todas as suas certidões direto no seu E-mail e WhatsApp. Processo rápido, seguro e 100% online."
      />
      <StructuredData />
      <section className="py-12 lg:py-16 bg-muted/20">
        <div className="container">
          <div className="text-center mb-10">
            <h1 className="font-heading text-xl md:text-2xl lg:text-3xl font-bold text-primary uppercase tracking-wide">
              Automação com IA
            </h1>
            <p className="mt-3 text-muted-foreground">
              Processo rápido, seguro e 100% online.
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Qual certidão você precisa?"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-lg border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
              />
            </div>

            <div className="space-y-2">
              {filtered.map((cert, index) => (
                <Link
                  key={index}
                  to={getLink(cert)}
                  className="block w-full flex items-center justify-between px-5 py-4 rounded-lg border bg-card hover:border-primary/40 hover:shadow-sm transition-all text-left group"
                >
                  <span className="text-sm font-medium text-foreground">{cert.title}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

        {/* Como Funciona */}
        <section className="py-12 lg:py-20 bg-background">
          <div className="container">
            <div className="mx-auto max-w-5xl">
              {/* Título */}
              <div className="text-center mb-12">
                <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
                  Como Funciona Nosso Sistema
                </h2>
                <p className="text-lg md:text-xl text-muted-foreground">
                  Processo automatizado com IA em 5 etapas simples
                </p>
              </div>

              {/* Primeira linha: Passos 0, 1, 2, 3 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-gray-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
                    <span className="text-white text-xl font-bold">0</span>
                  </div>
                  <h3 className="font-semibold text-foreground mb-2 text-sm md:text-base">
                    Assistente de IA
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Nosso assistente ajuda você a escolher a certidão correta.
                  </p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
                    <span className="text-white text-xl font-bold">1</span>
                  </div>
                  <h3 className="font-semibold text-foreground mb-2 text-sm md:text-base">
                    Escolha o documento
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Selecione a certidão que precisa e preencha seus dados.
                  </p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
                    <span className="text-white text-xl font-bold">2</span>
                  </div>
                  <h3 className="font-semibold text-foreground mb-2 text-sm md:text-base">
                    Preencha e pague
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Complete automaticamente e realize o pagamento via PIX.
                  </p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
                    <span className="text-white text-xl font-bold">3</span>
                  </div>
                  <h3 className="font-semibold text-foreground mb-2 text-sm md:text-base">
                    Processamento digital
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Nossa tecnologia processa sua solicitação de forma digital.
                  </p>
                </div>
              </div>

              {/* Segunda linha: Passo 4 centralizado */}
              <div className="flex justify-center">
                <div className="flex flex-col items-center text-center max-w-xs">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
                    <span className="text-white text-xl font-bold">4</span>
                  </div>
                  <h3 className="font-semibold text-foreground mb-2 text-sm md:text-base">
                    Receba no painel e e-mail
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Resultado pronto no painel e enviado ao seu e-mail.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bloco de Informação Importante */}
        <section className="py-12 bg-background">
          <div className="container">
            <div className="mx-auto max-w-4xl">
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 md:p-8 shadow-sm">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold">i</span>
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-blue-900 dark:text-blue-100">
                    Importante: Somos Plataforma Privada
                  </h3>
                </div>
                <div className="space-y-3 text-sm md:text-base text-foreground ml-9">
                  <p>
                    Esta é uma plataforma privada e independente que utiliza tecnologia para processamento digital de solicitações de documentos.
                  </p>
                  <p>
                    Nosso sistema utiliza <strong>inteligência artificial</strong> para orientar o usuário e automatizar consultas de forma independente, sem vínculo com órgãos públicos.
                  </p>
                  <p>
                    <strong>NÃO somos órgão público</strong> nem possuímos vínculo direto com o Governo. Somos uma empresa de tecnologia que facilita o acesso a documentos.
                  </p>
                  <p>
                    O processamento é feito de forma <strong>automatizada e digital</strong>. Você contrata nosso serviço de processamento, não o órgão emissor.
                  </p>
                  <p className="font-semibold text-blue-900 dark:text-blue-100">
                    Aviso: Não somos site do governo. Os documentos são emitidos pelas fontes oficiais; nossa plataforma apenas automatiza a solicitação e o acompanhamento.
                  </p>
                  <p>
                    Você pode solicitar diretamente nos órgãos públicos, mas oferecemos tecnologia, praticidade e economia de tempo com nosso sistema automatizado.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ - Dúvidas Frequentes */}
        <section className="py-12 lg:py-20 bg-muted/20">
          <div className="container">
            <div className="mx-auto max-w-4xl">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-12">
                Dúvidas Frequentes
              </h2>
              <div className="space-y-4">
                {/* FAQ 1 */}
                <div className="bg-card border border-border/50 rounded-lg p-6 shadow-sm">
                  <h3 className="font-semibold text-primary mb-2 text-lg">
                    O que vocês fazem exatamente?
                  </h3>
                  <p className="text-muted-foreground">
                    Somos uma plataforma privada de tecnologia que automatiza o processamento de documentos de forma digital. Não somos órgão público, apenas facilitamos o acesso aos documentos através do nosso sistema.
                  </p>
                </div>

                {/* FAQ 2 */}
                <div className="bg-card border border-border/50 rounded-lg p-6 shadow-sm">
                  <h3 className="font-semibold text-primary mb-2 text-lg">
                    Quanto tempo leva para receber?
                  </h3>
                  <p className="text-muted-foreground">
                    Muitos documentos são processados automaticamente em minutos. Outros podem levar até 48 horas úteis dependendo do tipo. Você acompanha o status em tempo real no painel.
                  </p>
                </div>

                {/* FAQ 3 */}
                <div className="bg-card border border-border/50 rounded-lg p-6 shadow-sm">
                  <h3 className="font-semibold text-primary mb-2 text-lg">
                    Como recebo o documento?
                  </h3>
                  <p className="text-muted-foreground">
                    Por e-mail assim que ficar pronto, e também fica disponível para download no seu painel de cliente no site.
                  </p>
                </div>

                {/* FAQ 4 */}
                <div className="bg-card border border-border/50 rounded-lg p-6 shadow-sm">
                  <h3 className="font-semibold text-primary mb-2 text-lg">
                    Vocês emitem os documentos?
                  </h3>
                  <p className="text-muted-foreground">
                    Não. Os documentos são emitidos pelos órgãos oficiais. Nossa tecnologia apenas automatiza o processo de solicitação de forma digital e entrega o documento final para você.
                  </p>
                </div>

                {/* FAQ 5 */}
                <div className="bg-card border border-border/50 rounded-lg p-6 shadow-sm">
                  <h3 className="font-semibold text-primary mb-2 text-lg">
                    Posso buscar diretamente nos órgãos?
                  </h3>
                  <p className="text-muted-foreground">
                    Sim, você pode. Nosso serviço oferece automação, tecnologia e praticidade através de um sistema integrado que faz todo o processo digital para você.
                  </p>
                </div>

                {/* FAQ 6 */}
                <div className="bg-card border border-border/50 rounded-lg p-6 shadow-sm">
                  <h3 className="font-semibold text-primary mb-2 text-lg">
                    O documento tem validade?
                  </h3>
                  <p className="text-muted-foreground">
                    Sim! É o documento original emitido pela fonte oficial. Nossa plataforma apenas automatiza a solicitação e entrega.
                  </p>
                </div>

                {/* FAQ 7 */}
                <div className="bg-card border border-border/50 rounded-lg p-6 shadow-sm">
                  <h3 className="font-semibold text-primary mb-2 text-lg">
                    Qual a vantagem de usar a plataforma?
                  </h3>
                  <p className="text-muted-foreground">
                    Tecnologia e automação: processamento rápido e digital, interface simples e responsiva, entrega ágil, tudo em um único lugar, acompanhamento em tempo real e suporte digital.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
    </Layout>
  );
};

export default Index;
