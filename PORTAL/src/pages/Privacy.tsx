import Layout from "@/components/layout/Layout";

const Privacy = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden hero-gradient py-16 lg:py-24">
        <div className="container relative">
          <div className="mx-auto max-w-2xl text-center animate-slide-up">
            <h1 className="font-heading text-4xl font-bold text-primary-foreground sm:text-5xl">
              Política de Privacidade
            </h1>
            <p className="mt-4 text-lg text-primary-foreground/80">
              Última atualização: Janeiro de 2025
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <div className="prose prose-lg max-w-none">
              <div className="rounded-2xl border border-border bg-card p-8 card-shadow space-y-8">
                <section>
                  <h2 className="font-heading text-2xl font-bold text-foreground mb-4">
                    1. Informações que Coletamos
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Coletamos informações que você nos fornece diretamente ao utilizar nossos serviços, incluindo: nome completo, CPF, data de nascimento, endereço de e-mail, telefone, e outros dados necessários para a emissão das certidões solicitadas.
                  </p>
                </section>

                <section>
                  <h2 className="font-heading text-2xl font-bold text-foreground mb-4">
                    2. Como Utilizamos suas Informações
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Utilizamos suas informações pessoais para:
                  </p>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                    <li>Processar suas solicitações de certidões junto aos órgãos competentes</li>
                    <li>Enviar as certidões e comunicações relacionadas ao seu pedido</li>
                    <li>Fornecer suporte ao cliente</li>
                    <li>Cumprir obrigações legais e regulatórias</li>
                    <li>Melhorar nossos serviços e experiência do usuário</li>
                  </ul>
                </section>

                <section>
                  <h2 className="font-heading text-2xl font-bold text-foreground mb-4">
                    3. Proteção de Dados (LGPD)
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), implementamos medidas técnicas e organizacionais apropriadas para proteger seus dados pessoais contra acesso não autorizado, perda, destruição ou alteração.
                  </p>
                </section>

                <section>
                  <h2 className="font-heading text-2xl font-bold text-foreground mb-4">
                    4. Compartilhamento de Dados
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Seus dados são compartilhados apenas com os órgãos oficiais necessários para a emissão das certidões solicitadas (Tribunais de Justiça, TRFs, Polícia Federal, Receita Federal). Não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros para fins comerciais.
                  </p>
                </section>

                <section>
                  <h2 className="font-heading text-2xl font-bold text-foreground mb-4">
                    5. Seus Direitos
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Você tem o direito de:
                  </p>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                    <li>Acessar seus dados pessoais</li>
                    <li>Corrigir dados incompletos ou desatualizados</li>
                    <li>Solicitar a exclusão de seus dados</li>
                    <li>Revogar seu consentimento a qualquer momento</li>
                    <li>Obter informações sobre o uso de seus dados</li>
                  </ul>
                </section>

                <section>
                  <h2 className="font-heading text-2xl font-bold text-foreground mb-4">
                    6. Retenção de Dados
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Mantemos seus dados pessoais pelo tempo necessário para cumprir as finalidades para as quais foram coletados, incluindo obrigações legais, contratuais ou requisitos regulatórios.
                  </p>
                </section>

                <section>
                  <h2 className="font-heading text-2xl font-bold text-foreground mb-4">
                    7. Contato
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Para exercer seus direitos ou esclarecer dúvidas sobre esta política, entre em contato conosco através da nossa página de contato ou pelo e-mail: privacidade@certidoesbr.com.br
                  </p>
                </section>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Privacy;
