import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HiddenDisclaimer from "@/components/HiddenDisclaimer";

const TermosDeUso = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <HiddenDisclaimer />
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="font-heading text-3xl font-bold text-foreground mb-2">Termos de Uso</h1>
        <p className="text-primary font-medium text-sm mb-2">Condições gerais de uso da plataforma</p>
        <p className="text-muted-foreground text-sm mb-8"><strong className="text-foreground">Última atualização:</strong> Fevereiro de 2026</p>

        <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">1. Aceitação dos Termos</h2>
            <p>Ao acessar e usar o site guia-central.online, você concorda integralmente com estes Termos de Uso. Se não concordar com algum dos termos, por favor não utilize nossos serviços. O uso continuado da plataforma constitui aceitação tácita de todas as condições aqui descritas.</p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">2. Natureza do Serviço</h2>
            <div className="bg-accent/10 rounded-xl p-4 mb-3">
              <p className="font-semibold text-foreground text-sm mb-2">⚠️ Declaração Importante</p>
              <p>A Guia Central é uma <strong className="text-foreground">plataforma privada e independente</strong> de tecnologia que automatiza o processamento digital de solicitações de documentos e certidões.</p>
            </div>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong className="text-foreground">NÃO somos órgão público</strong> nem possuímos vínculo com o governo federal, estadual ou municipal.</li>
              <li>Os documentos são emitidos pelas <strong className="text-foreground">fontes oficiais competentes</strong>; nosso serviço consiste na automação e intermediação digital do processo de solicitação.</li>
              <li>Nosso sistema utiliza <strong className="text-foreground">inteligência artificial</strong> para orientar o usuário e automatizar consultas de forma independente.</li>
              <li>Você pode solicitar diretamente nos órgãos públicos. Nosso serviço oferece <strong className="text-foreground">automação, tecnologia e praticidade</strong>.</li>
              <li>O valor cobrado refere-se ao <strong className="text-foreground">serviço de processamento digital e automação</strong>, não ao documento em si.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">3. Cadastro e Conta de Usuário</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Para utilizar nossos serviços, pode ser necessário criar uma conta fornecendo informações verdadeiras, atuais e completas.</li>
              <li>Você é responsável por manter a confidencialidade de suas credenciais de acesso.</li>
              <li>Qualquer atividade realizada com suas credenciais será de sua responsabilidade.</li>
              <li>Em caso de uso não autorizado, notifique-nos imediatamente.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">4. Serviços Oferecidos</h2>
            <p className="mb-2">Nossa plataforma oferece processamento digital automatizado para os seguintes documentos:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Certidão de Quitação Eleitoral</li>
              <li>Antecedentes Criminais</li>
              <li>Certidão Negativa de Débitos (CND)</li>
              <li>Certidão de Débito Trabalhista</li>
              <li>Certidão Negativa Criminal</li>
              <li>Certidão Negativa Cível</li>
              <li>Certidão de CPF Regular</li>
              <li>CCIR - Cadastro de Imóvel Rural</li>
            </ul>
            <p className="mt-2">A disponibilidade dos serviços pode variar conforme a região e o órgão emissor.</p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">5. Pagamento e Valores</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong className="text-foreground">Método de pagamento:</strong> Exclusivamente via PIX com confirmação instantânea.</li>
              <li><strong className="text-foreground">Valor:</strong> O preço refere-se ao serviço de processamento digital e automação, incluindo suporte, tecnologia e acompanhamento.</li>
              <li><strong className="text-foreground">Confirmação:</strong> O processamento inicia imediatamente após a confirmação do pagamento.</li>
              <li><strong className="text-foreground">Transparência:</strong> Todos os valores são exibidos antes da confirmação do pagamento.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">6. Política de Reembolso</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Reembolso integral caso o documento não possa ser processado por responsabilidade da plataforma.</li>
              <li>Não há reembolso quando os dados fornecidos pelo usuário estiverem incorretos ou incompletos.</li>
              <li>O prazo para solicitação de reembolso é de até 7 dias úteis após a confirmação do pagamento.</li>
              <li>Reembolsos serão processados conforme o Código de Defesa do Consumidor (Lei 8.078/90).</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">7. Prazos de Entrega</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Muitos documentos são processados automaticamente em <strong className="text-foreground">minutos</strong>.</li>
              <li>Alguns documentos podem levar até <strong className="text-foreground">48 horas úteis</strong> dependendo do tipo e do órgão emissor.</li>
              <li>Você acompanha o status em tempo real no seu painel.</li>
              <li>Os prazos são estimativas e podem variar conforme a disponibilidade dos sistemas dos órgãos emissores.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">8. Responsabilidades do Usuário</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Fornecer dados corretos, verdadeiros e atualizados</li>
              <li>Não utilizar o serviço para fins ilícitos ou fraudulentos</li>
              <li>Manter seus dados de acesso em sigilo</li>
              <li>Respeitar a legislação brasileira vigente</li>
              <li>Não tentar acessar sistemas, dados ou funcionalidades não autorizadas</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">9. Limitação de Responsabilidade</h2>
            <p>A Guia Central não se responsabiliza por:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Informações incorretas ou incompletas fornecidas pelo usuário</li>
              <li>Indisponibilidade temporária dos sistemas dos órgãos emissores</li>
              <li>Atrasos causados por terceiros, incluindo órgãos públicos</li>
              <li>Decisões administrativas dos órgãos competentes</li>
              <li>Danos decorrentes de uso indevido da plataforma</li>
              <li>Interrupções causadas por caso fortuito ou força maior</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">10. Propriedade Intelectual</h2>
            <p>Todo o conteúdo, design, logotipos, marcas, tecnologia, código-fonte e materiais presentes neste site são de propriedade exclusiva da Guia Central e protegidos por leis de propriedade intelectual. É proibida a reprodução, distribuição ou uso sem autorização prévia.</p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">11. Proteção de Dados</h2>
            <p>O tratamento dos dados pessoais está descrito em nossa <a href="/politica-privacidade" className="text-primary underline hover:no-underline">Política de Privacidade</a>, que é parte integrante destes Termos de Uso. Ao utilizar nossos serviços, você declara ter lido e concordado com nossa Política de Privacidade.</p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">12. Alterações nos Termos</h2>
            <p>Reservamo-nos o direito de alterar estes termos a qualquer momento. As alterações entram em vigor imediatamente após publicação no site. O uso continuado da plataforma após alterações constitui aceitação dos novos termos.</p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">13. Legislação e Foro</h2>
            <p>Estes Termos de Uso são regidos pelas leis da República Federativa do Brasil. Qualquer controvérsia será dirimida no foro da comarca da sede da empresa, com exclusão de qualquer outro, por mais privilegiado que seja.</p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">14. Contato</h2>
            <div className="bg-secondary/50 rounded-xl p-4">
              <p>Dúvidas sobre estes termos podem ser esclarecidas através de:</p>
              <p className="mt-2"><strong className="text-foreground">E-mail:</strong> contato@guia-central.online</p>
              <p><strong className="text-foreground">Site:</strong> www.guia-central.online/fale-conosco</p>
            </div>
          </section>

        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TermosDeUso;
