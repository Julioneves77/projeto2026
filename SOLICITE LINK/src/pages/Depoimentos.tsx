import { Link } from "react-router-dom";
import Footer from "@/components/Footer";
import { ArrowLeft, Quote, Star } from "lucide-react";

const testimonials = [
  {
    name: "Maria S.",
    role: "Usuária",
    content: "Muito prático e direto ao ponto. Encontrei o que precisava rapidamente.",
    rating: 5,
  },
  {
    name: "João P.",
    role: "Usuário",
    content: "Interface simples e fácil de usar. Recomendo para quem busca praticidade.",
    rating: 5,
  },
  {
    name: "Ana L.",
    role: "Usuária",
    content: "Finalmente um site que vai direto ao assunto, sem complicação.",
    rating: 5,
  },
];

const Depoimentos = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="page-header">
        <Link to="/" className="back-link">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-lg font-semibold text-gradient">Solicite Link</span>
        </Link>
      </div>

      <main className="page-content">
        <div className="page-container">
          <div className="text-center mb-12 animate-fade-in-up">
            <span className="badge">O que dizem sobre nós</span>
            <h1 className="section-title mt-2 mb-4">Depoimentos</h1>
            <p className="section-subtitle max-w-xl mx-auto">
              Veja o que nossos usuários têm a dizer sobre a experiência com o Solicite Link.
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index} 
                className="card-main relative animate-fade-in-up"
                style={{ animationDelay: `${0.1 * (index + 1)}s` }}
              >
                <Quote className="w-8 h-8 text-primary/20 absolute top-6 right-6" />
                
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
                
                <p className="text-foreground mb-6 relative z-10">
                  "{testimonial.content}"
                </p>
                
                <div className="border-t border-border pt-4">
                  <p className="font-semibold text-foreground">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <Link to="/" className="btn-secondary">
              Voltar para a página principal
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Depoimentos;
