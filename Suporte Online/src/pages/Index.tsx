import { HeroSection } from "@/components/HeroSection";
import { HowItWorksSection } from "@/components/HowItWorksSection";
import { ServicesSection } from "@/components/ServicesSection";
import { TransparencySection } from "@/components/TransparencySection";
import { ContactForm } from "@/components/ContactForm";
import { DeadlineSection } from "@/components/DeadlineSection";
import { SupportSection } from "@/components/SupportSection";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <HowItWorksSection />
      <ServicesSection />
      <TransparencySection />
      <ContactForm />
      <DeadlineSection />
      <SupportSection />
      <Footer />
    </div>
  );
};

export default Index;
