import { motion } from "framer-motion";
import { Shield, Fingerprint, Vote, Scale, Building, FileCheck, CreditCard } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface CertidaoCard {
  id: string;
  title: string;
  icon: LucideIcon;
  delay: number;
}

export const certidoes: CertidaoCard[] = [
  { id: "antecedentes-criminais", title: "Antecedentes Criminais", icon: Fingerprint, delay: 0 },
  { id: "certidao-eleitoral", title: "Certidão Eleitoral", icon: Vote, delay: 0.05 },
  { id: "criminal-federal", title: "Certidão Criminal Federal", icon: Shield, delay: 0.1 },
  { id: "criminal-estadual", title: "Certidão Criminal Estadual", icon: Scale, delay: 0.15 },
  { id: "negativa-debitos", title: "Certidão Negativa de Débitos", icon: FileCheck, delay: 0.2 },
  { id: "cpf-regular", title: "Certidão CPF Regular", icon: CreditCard, delay: 0.25 },
  { id: "civel-federal", title: "Certidão Cível Federal", icon: Building, delay: 0.3 },
  { id: "civel-estadual", title: "Certidão Cível Estadual", icon: Building, delay: 0.35 },
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
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: card.delay }}
      whileHover={{ y: -2 }}
      onClick={() => onClick(card.id)}
      className="relative group cursor-pointer rounded-xl bg-white border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300"
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-foreground font-semibold text-base">{card.title}</h3>
      </div>
    </motion.div>
  );
};

export default ProductCard;
