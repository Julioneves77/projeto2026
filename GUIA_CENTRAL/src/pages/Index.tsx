import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/SEOHead";
import StructuredData from "@/components/StructuredData";
import HeroAndServices from "@/components/HeroAndServices";
import HowItWorks from "@/components/HowItWorks";
import Disclaimer from "@/components/Disclaimer";
import FAQ from "@/components/FAQ";

const Index = () => {
  return (
    <Layout>
      <SEOHead
        title="Guia Central - Plataforma Privada de Processamento Digital de Certidões"
        description="Plataforma PRIVADA e INDEPENDENTE de processamento digital de certidões e documentos. NÃO somos órgão público. Utilizamos tecnologia e IA para automatizar solicitações. Antecedentes criminais, CND, quitação eleitoral e mais."
      />
      <StructuredData />
      <HeroAndServices />
      <HowItWorks />
      <Disclaimer />
      <FAQ />
    </Layout>
  );
};

export default Index;
