import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/SEOHead";
import StructuredData from "@/components/StructuredData";
import HeroAndServices from "@/components/HeroAndServices";
import HowItWorks from "@/components/HowItWorks";
import Disclaimer from "@/components/Disclaimer";
import FAQTemplate from "@/components/FAQTemplate";

const Index = () => {
  return (
    <Layout>
      <SEOHead
        title="Plataforma de Automação Documental | Guia Central"
        description="Guia Central - Todas as suas certidões direto no seu E-mail e WhatsApp. Processo rápido, seguro e 100% online."
      />
      <StructuredData />
      <HeroAndServices />
      <HowItWorks />
      <Disclaimer />
      <FAQTemplate />
    </Layout>
  );
};

export default Index;
