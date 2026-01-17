import { ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function PoliticaPrivacidade() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-4">
        <div className="container">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao início
          </button>
        </div>
      </header>

      <main className="container py-12 md:py-20">
        <div className="max-w-4xl mx-auto">
          {/* Title */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Política de Privacidade
            </h1>
            <p className="text-muted-foreground">
              Última atualização: {new Date().toLocaleDateString("pt-BR")}
            </p>
          </div>

          {/* Content */}
          <div className="bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm space-y-8">
            {/* Disclaimer */}
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Importante:</strong> Este é um serviço privado de assistência. 
                Não somos um órgão governamental ou entidade pública. Esta política descreve como coletamos, usamos e 
                protegemos suas informações pessoais em conformidade com a Lei Geral de Proteção de Dados (LGPD).
              </p>
            </div>

            {/* Section 1 */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                1. Introdução
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                O Suporte Online está comprometido com a proteção da privacidade e dos dados pessoais de nossos 
                usuários. Esta Política de Privacidade explica como coletamos, usamos, armazenamos e protegemos suas 
                informações pessoais quando você utiliza nossos serviços.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Ao utilizar nossos serviços, você concorda com as práticas descritas nesta política. Recomendamos que 
                leia atentamente este documento.
              </p>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                2. Informações que Coletamos
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Coletamos as seguintes categorias de informações pessoais:
              </p>
              
              <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">
                2.1. Informações Fornecidas por Você
              </h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li><strong className="text-foreground">Dados de Identificação:</strong> Nome completo, CPF ou CNPJ, data de nascimento</li>
                <li><strong className="text-foreground">Dados de Contato:</strong> E-mail, telefone, endereço</li>
                <li><strong className="text-foreground">Informações da Solicitação:</strong> Dados relacionados à consulta de antecedentes criminais</li>
                <li><strong className="text-foreground">Dados de Pagamento:</strong> Informações necessárias para processamento de pagamentos</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">
                2.2. Informações Coletadas Automaticamente
              </h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Endereço IP</li>
                <li>Informações do navegador e dispositivo</li>
                <li>Dados de navegação e interação com o serviço</li>
                <li>Cookies e tecnologias similares</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                3. Como Utilizamos suas Informações
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Utilizamos suas informações pessoais para as seguintes finalidades:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Prestar os serviços solicitados, incluindo assistência na consulta de informações</li>
                <li>Processar pagamentos e gerenciar transações</li>
                <li>Comunicar-nos com você sobre seu pedido, atualizações e suporte</li>
                <li>Melhorar nossos serviços e experiência do usuário</li>
                <li>Cumprir obrigações legais e regulatórias</li>
                <li>Prevenir fraudes e garantir a segurança do serviço</li>
                <li>Enviar comunicações de marketing (apenas com seu consentimento)</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                4. Base Legal para o Tratamento
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Tratamos seus dados pessoais com base nas seguintes bases legais previstas na LGPD:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li><strong className="text-foreground">Execução de contrato:</strong> Para prestar os serviços solicitados</li>
                <li><strong className="text-foreground">Consentimento:</strong> Quando você nos dá permissão explícita</li>
                <li><strong className="text-foreground">Cumprimento de obrigação legal:</strong> Para atender requisitos legais</li>
                <li><strong className="text-foreground">Legítimo interesse:</strong> Para melhorar nossos serviços e segurança</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                5. Compartilhamento de Informações
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Não vendemos suas informações pessoais. Podemos compartilhar suas informações apenas nas seguintes situações:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li><strong className="text-foreground">Prestadores de Serviços:</strong> Com empresas que nos auxiliam na operação do serviço (processamento de pagamentos, hospedagem, etc.), sempre sob contratos que garantem a proteção dos dados</li>
                <li><strong className="text-foreground">Obrigações Legais:</strong> Quando exigido por lei, ordem judicial ou autoridades competentes</li>
                <li><strong className="text-foreground">Com seu Consentimento:</strong> Quando você autorizar explicitamente o compartilhamento</li>
                <li><strong className="text-foreground">Proteção de Direitos:</strong> Para proteger nossos direitos, propriedade ou segurança, ou de nossos usuários</li>
              </ul>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                6. Segurança dos Dados
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Implementamos medidas técnicas e organizacionais adequadas para proteger suas informações pessoais contra 
                acesso não autorizado, alteração, divulgação ou destruição:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Criptografia de dados em trânsito e em repouso</li>
                <li>Controles de acesso restritos e autenticação</li>
                <li>Monitoramento regular de segurança</li>
                <li>Backups regulares dos dados</li>
                <li>Treinamento de equipe em proteção de dados</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Embora adotemos medidas de segurança, nenhum método de transmissão ou armazenamento é 100% seguro. 
                Não podemos garantir segurança absoluta, mas nos comprometemos a proteger suas informações da melhor forma possível.
              </p>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                7. Retenção de Dados
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Mantemos suas informações pessoais pelo tempo necessário para:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Prestar os serviços solicitados</li>
                <li>Cumprir obrigações legais e regulatórias</li>
                <li>Resolver disputas e fazer cumprir nossos acordos</li>
                <li>Manter registros para fins contábeis e fiscais</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Após o período de retenção, excluímos ou anonimizamos suas informações pessoais de forma segura, 
                exceto quando a retenção for exigida ou permitida por lei.
              </p>
            </section>

            {/* Section 8 */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                8. Seus Direitos (LGPD)
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem os seguintes direitos:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li><strong className="text-foreground">Confirmação e Acesso:</strong> Saber se tratamos seus dados e acessá-los</li>
                <li><strong className="text-foreground">Correção:</strong> Solicitar correção de dados incompletos, inexatos ou desatualizados</li>
                <li><strong className="text-foreground">Anonimização, Bloqueio ou Eliminação:</strong> Solicitar a eliminação ou anonimização de dados desnecessários ou excessivos</li>
                <li><strong className="text-foreground">Portabilidade:</strong> Receber seus dados em formato estruturado e interoperável</li>
                <li><strong className="text-foreground">Eliminação:</strong> Solicitar a eliminação de dados tratados com base em consentimento</li>
                <li><strong className="text-foreground">Informação:</strong> Obter informações sobre compartilhamento de dados</li>
                <li><strong className="text-foreground">Revogação do Consentimento:</strong> Revogar seu consentimento a qualquer momento</li>
                <li><strong className="text-foreground">Revisão de Decisões:</strong> Solicitar revisão de decisões tomadas unicamente com base em tratamento automatizado</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Para exercer seus direitos, entre em contato conosco através da{" "}
                <button
                  onClick={() => navigate("/contato")}
                  className="text-primary hover:underline"
                >
                  página de contato
                </button>
                . Responderemos sua solicitação no prazo de 15 dias, conforme previsto na LGPD.
              </p>
            </section>

            {/* Section 9 */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                9. Cookies e Tecnologias Similares
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Utilizamos cookies e tecnologias similares para melhorar sua experiência, analisar o uso do serviço e 
                personalizar conteúdo. Os tipos de cookies que utilizamos incluem:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li><strong className="text-foreground">Cookies Essenciais:</strong> Necessários para o funcionamento do serviço</li>
                <li><strong className="text-foreground">Cookies de Desempenho:</strong> Para entender como os usuários interagem com o serviço</li>
                <li><strong className="text-foreground">Cookies de Funcionalidade:</strong> Para lembrar suas preferências</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Você pode gerenciar suas preferências de cookies através das configurações do seu navegador.
              </p>
            </section>

            {/* Section 10 */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                10. Transferência Internacional de Dados
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Seus dados pessoais são armazenados e processados principalmente no Brasil. Caso seja necessário transferir 
                dados para outros países, garantiremos que medidas adequadas de proteção sejam implementadas, em conformidade 
                com a LGPD e outras leis aplicáveis.
              </p>
            </section>

            {/* Section 11 */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                11. Menores de Idade
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Nossos serviços são destinados a pessoas maiores de 18 anos. Não coletamos intencionalmente informações 
                pessoais de menores de idade. Se tomarmos conhecimento de que coletamos dados de um menor sem o consentimento 
                adequado, tomaremos medidas para excluir essas informações imediatamente.
              </p>
            </section>

            {/* Section 12 */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                12. Alterações nesta Política
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Podemos atualizar esta Política de Privacidade periodicamente para refletir mudanças em nossas práticas ou 
                por outros motivos operacionais, legais ou regulatórios. Notificaremos você sobre mudanças significativas 
                publicando a nova política em nosso site e atualizando a data de "Última atualização". Recomendamos que você 
                revise esta política periodicamente.
              </p>
            </section>

            {/* Section 13 */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                13. Contato e Encarregado de Dados (DPO)
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Para questões relacionadas a esta Política de Privacidade, exercício de seus direitos ou qualquer dúvida 
                sobre o tratamento de seus dados pessoais, entre em contato conosco através da{" "}
                <button
                  onClick={() => navigate("/contato")}
                  className="text-primary hover:underline"
                >
                  página de contato
                </button>
                .
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Você também tem o direito de apresentar uma reclamação à Autoridade Nacional de Proteção de Dados (ANPD) 
                caso considere que o tratamento de seus dados pessoais viola a legislação aplicável.
              </p>
            </section>
          </div>

          {/* Back Button */}
          <div className="mt-8 text-center">
            <Button onClick={() => navigate("/")} variant="outline" className="px-8">
              Voltar ao início
            </Button>
          </div>

          {/* Footer Notice */}
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>© {currentYear} Suporte Online. Todos os direitos reservados.</p>
            <p className="mt-2">
              Serviço privado de assistência - Não vinculado a órgãos governamentais
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

