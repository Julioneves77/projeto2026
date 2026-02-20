import { motion } from "framer-motion";
import { Shield, Fingerprint, Vote, Scale, Building, FileCheck, CreditCard } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface CertidaoCard {
  id: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  delay: number;
}

export const certidoes: CertidaoCard[] = [
  { id: "criminal-federal", title: "Certidão Criminal Federal", subtitle: "Processamento Automático via IA", icon: Shield, delay: 0 },
  { id: "antecedentes-criminais", title: "Antecedentes Criminais", subtitle: "Consulta Digital Instantânea", icon: Fingerprint, delay: 0.05 },
  { id: "certidao-eleitoral", title: "Certidão Eleitoral", subtitle: "Automação RPA em Segundos", icon: Vote, delay: 0.1 },
  { id: "criminal-estadual", title: "Certidão Criminal Estadual", subtitle: "Análise Automatizada por IA", icon: Scale, delay: 0.15 },
  { id: "negativa-debitos", title: "Certidão Negativa de Débitos", subtitle: "Verificação Digital Rápida", icon: FileCheck, delay: 0.2 },
  { id: "cpf-regular", title: "Certidão CPF Regular", subtitle: "Resultado em Minutos", icon: CreditCard, delay: 0.25 },
  { id: "civel-federal", title: "Certidão Cível Federal", subtitle: "Tecnologia de Ponta Integrada", icon: Building, delay: 0.3 },
  { id: "civel-estadual", title: "Certidão Cível Estadual", subtitle: "Sistema Inteligente 24h", icon: Building, delay: 0.35 },
];

export const certidaoToRoute: Record<string, string> = {
  "criminal-federal": "/certidao/federais?type=criminal",
  "antecedentes-criminais": "/certidao/policia-federal",
  "certidao-eleitoral": "/certidao/federais?type=eleitoral",
  "criminal-estadual": "/certidao/estaduais",
  "negativa-debitos": "/certidao/cnd",
  "cpf-regular": "/certidao/cpf-regular",
  "civel-federal": "/certidao/federais?type=civel",
  "civel-estadual": "/certidao/estaduais?type=civel",
};

interface ProductCardProps {
  card: CertidaoCard;
  onClick: (id: string) => void;
}

const ProductCard = ({ card, onClick }: ProductCardProps) => {
  const Icon = card.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: card.delay }}
      whileHover={{ scale: 1.04, y: -4 }}
      onClick={() => onClick(card.id)}
      className="tech-card hex-corners relative group cursor-pointer rounded-xl bg-card border border-border/60 p-6 overflow-hidden shadow-sm hover:shadow-lg hover:shadow-primary/5 transition-shadow"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="scanner-line absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-80" />
      </div>
      <div className="absolute top-3 right-3 w-6 h-6 opacity-0 group-hover:opacity-70 transition-opacity duration-500">
        <div className="ring-spin w-full h-full rounded-full border border-primary border-t-transparent" />
      </div>
      <div className="absolute left-0 top-0 bottom-0 w-px overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="animate-data-flow w-full h-4 bg-gradient-to-b from-transparent via-primary to-transparent" />
      </div>
      <div className="relative mb-4">
        <div className="w-12 h-12 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-center group-hover:glow-blue transition-all duration-500 group-hover:border-primary/30">
          <Icon className="w-6 h-6 text-primary group-hover:text-glow-blue transition-all" />
        </div>
      </div>
      <h3 className="text-foreground font-semibold text-base mb-1.5 group-hover:text-primary transition-colors">{card.title}</h3>
      <p className="text-muted-foreground text-xs font-mono">{card.subtitle}</p>
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-80 transition-opacity duration-500" />
      <div className="absolute bottom-2 right-2 w-1.5 h-1.5 rounded-full bg-primary/30 group-hover:bg-accent group-hover:pulse-glow transition-colors" />
    </motion.div>
  );
};

export default ProductCard;
