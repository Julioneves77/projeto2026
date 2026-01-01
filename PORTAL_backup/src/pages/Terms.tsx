import Layout from "@/components/layout/Layout";

const Terms = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden hero-gradient py-16 lg:py-24">
        <div className="container relative">
          <div className="mx-auto max-w-2xl text-center animate-slide-up">
            <h1 className="font-heading text-4xl font-bold text-primary-foreground sm:text-5xl">
              Termos de Uso
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
                    1. Aceitação dos Termos
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Ao utilizar os serviços da CertidõesBR, você declara ter lido, compreendido e concordado com estes Termos de Uso. Se você não concordar com qualquer parte destes termos, não deverá utilizar nossos serviços.
                  </p>
                </section>

                <section>
                  <h2 className="font-heading text-2xl font-bold text-foreground mb-4">
                    2. Descrição dos Serviços
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    A CertidõesBR oferece serviços de intermediação para obtenção de certidões junto a órgãos públicos. Atuamos como facilitadores do processo, realizando as solicitações em nome do cliente junto aos órgãos competentes.
                  </p>
                </section>

                <section>
                  <h2 className="font-heading text-2xl font-bold text-foreground mb-4">
                    3. Responsabilidades do Usuário
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    O usuário se compromete a:
                  </p>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                    <li>Fornecer informações verdadeiras, precisas e completas</li>
                    <li>Não utilizar os serviços para fins ilegais ou fraudulentos</li>
                    <li>Manter a confidencialidade de suas credenciais de acesso</li>
                    <li>Solicitar certidões apenas em seu nome ou com autorização legal</li>
                  </ul>
                </section>

                <section>
                  <h2 className="font-heading text-2xl font-bold text-foreground mb-4">
                    4. Pagamento e Taxas
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Os valores cobrados incluem as taxas oficiais dos órgãos emissores e a taxa de serviço da CertidõesBR. Todos os valores são informados antes da confirmação do pedido. O pagamento deve ser realizado antecipadamente para processamento da solicitação.
                  </p>
                </section>

                <section>
                  <h2 className="font-heading text-2xl font-bold text-foreground mb-4">
                    5. Prazos de Entrega
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Os prazos de entrega são estimados e dependem dos órgãos emissores. A CertidõesBR não se responsabiliza por atrasos causados por indisponibilidade de sistemas governamentais ou circunstâncias fora de nosso controle.
                  </p>
                </section>

                <section>
                  <h2 className="font-heading text-2xl font-bold text-foreground mb-4">
                    6. Política de Reembolso
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    O reembolso será concedido integralmente caso a certidão não possa ser emitida por motivos atribuíveis à CertidõesBR. Não há reembolso quando a certidão for emitida corretamente ou quando o conteúdo não atender às expectativas do cliente (como certidões com apontamentos).
                  </p>
                </section>

                <section>
                  <h2 className="font-heading text-2xl font-bold text-foreground mb-4">
                    7. Limitação de Responsabilidade
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    A CertidõesBR não se responsabiliza pelo conteúdo das certidões emitidas pelos órgãos oficiais, sendo estas de responsabilidade exclusiva dos órgãos emissores. Nossa responsabilidade se limita ao valor pago pelo serviço.
                  </p>
                </section>

                <section>
                  <h2 className="font-heading text-2xl font-bold text-foreground mb-4">
                    8. Propriedade Intelectual
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Todo o conteúdo do site, incluindo textos, imagens, logotipos e design, é de propriedade da CertidõesBR e protegido por leis de propriedade intelectual. É proibida a reprodução sem autorização expressa.
                  </p>
                </section>

                <section>
                  <h2 className="font-heading text-2xl font-bold text-foreground mb-4">
                    9. Modificações dos Termos
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Reservamo-nos o direito de modificar estes termos a qualquer momento. As alterações entram em vigor imediatamente após a publicação. O uso continuado dos serviços após modificações implica aceitação dos novos termos.
                  </p>
                </section>

                <section>
                  <h2 className="font-heading text-2xl font-bold text-foreground mb-4">
                    10. Foro
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Estes termos são regidos pelas leis brasileiras. Qualquer disputa será resolvida no foro da comarca de São Paulo, SP, com exclusão de qualquer outro.
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

export default Terms;
