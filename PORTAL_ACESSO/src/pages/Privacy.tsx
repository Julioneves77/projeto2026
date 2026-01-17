import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const Privacy = () => {
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
          Política de Privacidade
        </h1>

        <div className="prose prose-gray max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              1. Informações Gerais
            </h2>
            <p className="text-muted-foreground mb-4">
              Esta Política de Privacidade descreve como o Portal Acesso Online coleta, 
              usa e protege suas informações pessoais quando você utiliza nossos serviços.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              2. Coleta de Informações
            </h2>
            <p className="text-muted-foreground mb-4">
              Coletamos informações que você nos fornece diretamente ao utilizar nossos 
              serviços digitais, incluindo nome, e-mail e telefone quando necessário 
              para processar sua solicitação.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              3. Uso das Informações
            </h2>
            <p className="text-muted-foreground mb-4">
              Utilizamos suas informações para processar suas solicitações de serviços 
              digitais, comunicar-nos com você sobre seu uso dos serviços e melhorar 
              nossa plataforma.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              4. Proteção dos Dados
            </h2>
            <p className="text-muted-foreground mb-4">
              Implementamos medidas de segurança técnicas e organizacionais adequadas 
              para proteger suas informações pessoais contra acesso não autorizado, 
              alteração, divulgação ou destruição.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              5. Seus Direitos
            </h2>
            <p className="text-muted-foreground mb-4">
              Você tem o direito de acessar, corrigir ou excluir suas informações 
              pessoais a qualquer momento. Para exercer esses direitos, entre em 
              contato conosco através da página de contato.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              6. Alterações nesta Política
            </h2>
            <p className="text-muted-foreground mb-4">
              Podemos atualizar esta Política de Privacidade periodicamente. 
              Recomendamos que você revise esta página regularmente para se manter 
              informado sobre como protegemos suas informações.
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


