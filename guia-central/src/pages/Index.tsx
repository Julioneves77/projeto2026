import Header from "@/components/Header";
import HeroAndServices from "@/components/HeroAndServices";
import HowItWorks from "@/components/HowItWorks";
import Disclaimer from "@/components/Disclaimer";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";
import FloatingSupport from "@/components/FloatingSupport";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <HeroAndServices />
        <HowItWorks />
        <Disclaimer />
        <FAQ />
      </main>
      <Footer />
      <FloatingSupport />
      <CookieBanner />
    </div>
  );
};

export default Index;
