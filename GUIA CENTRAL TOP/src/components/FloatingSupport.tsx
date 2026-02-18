import { MessageCircle } from "lucide-react";

const FloatingSupport = () => {
  return (
    <a
      href="https://wa.me/5500000000000"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full gradient-hero shadow-hero flex items-center justify-center hover:opacity-90 transition-opacity hover:scale-105 active:scale-95 transition-transform"
      aria-label="Suporte via WhatsApp"
    >
      <MessageCircle className="text-primary-foreground" size={24} />
    </a>
  );
};

export default FloatingSupport;
