import { Headphones } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function SupportSection() {
  return <section className="py-16 bg-muted">
      <div className="container">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Headphones className="w-7 h-7 text-primary" />
          </div>
          
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            Suporte humanizado
          </h2>
          
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Nossa equipe está disponível para esclarecer dúvidas e auxiliar durante todo o processo.
          </p>

          <div className="flex items-center justify-center">
            <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Link to="/contato">
                Entre em Contato
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>;
}