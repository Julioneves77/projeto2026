import Header from "@/components/Header";
import HeroBanner from "@/components/HeroBanner";
import ServicesList from "@/components/ServicesList";
import HowItWorks from "@/components/HowItWorks";
import InfoBox from "@/components/InfoBox";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <HeroBanner />
      <main className="flex-1">
        <ServicesList />
        <HowItWorks />
        <InfoBox />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
