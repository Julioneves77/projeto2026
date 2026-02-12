import Header from "@/components/Header";
import Footer from "@/components/Footer";

const FaleConosco = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-xl">
        <h1 className="font-heading text-3xl font-bold text-foreground mb-6 text-center">Fale Conosco</h1>
        <p className="text-muted-foreground text-center mb-8">
          Tem alguma dúvida ou precisa de ajuda? Preencha o formulário abaixo e entraremos em contato.
        </p>
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Nome</label>
            <input type="text" className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm" placeholder="Seu nome completo" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">E-mail</label>
            <input type="email" className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm" placeholder="seu@email.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Mensagem</label>
            <textarea rows={4} className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm resize-none" placeholder="Descreva sua dúvida..." />
          </div>
          <button type="submit" className="w-full py-3 rounded-xl gradient-hero text-primary-foreground font-semibold hover:opacity-90 transition-opacity shadow-hero">
            Enviar Mensagem
          </button>
        </form>
      </main>
      <Footer />
    </div>
  );
};

export default FaleConosco;
