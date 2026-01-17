import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const Terms = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="pt-8 pb-4">
        <div className="container mx-auto px-4">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
          Termos de Uso
        </h1>

        <div className="prose prose-gray max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              1. Aceitação dos Termos
            </h2>
            <p className="text-muted-foreground mb-4">
              Ao acessar e utilizar o Portal Acesso Online, você concorda em cumprir 
              e estar vinculado aos seguintes termos e condições de uso.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              2. Descrição do Serviço
            </h2>
            <p className="text-muted-foreground mb-4">
              O Portal Acesso Online é uma plataforma privada que facilita o acesso 
              a serviços digitais online. Atuamos como intermediário, direcionando 
              você para plataformas de solicitação de serviços.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              3. Uso Adequado
            </h2>
            <p className="text-muted-foreground mb-4">
              Você concorda em usar nossos serviços apenas para fins legais e de 
              acordo com estes Termos. É proibido usar nossos serviços de forma que 
              possa danificar, desabilitar ou sobrecarregar nossa plataforma.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              4. Responsabilidades
            </h2>
            <p className="text-muted-foreground mb-4">
              O Portal Acesso Online atua como intermediário. Não somos responsáveis 
              pelo processamento final das solicitações, que são realizadas pelas 
              plataformas parceiras para as quais direcionamos você.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              5. Limitação de Responsabilidade
            </h2>
            <p className="text-muted-foreground mb-4">
              Em nenhuma circunstância seremos responsáveis por danos diretos, 
              indiretos, incidentais ou consequenciais resultantes do uso ou 
              incapacidade de usar nossos serviços.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              6. Modificações dos Termos
            </h2>
            <p className="text-muted-foreground mb-4">
              Reservamos o direito de modificar estes Termos a qualquer momento. 
              Alterações significativas serão comunicadas através de nossa plataforma.
            </p>
          </section>

          <section className="mb-8">
            <p className="text-sm text-muted-foreground">
              Última atualização: Janeiro de 2026
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};


