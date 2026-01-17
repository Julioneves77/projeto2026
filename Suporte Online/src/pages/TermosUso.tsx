import { ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function TermosUso() {
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
              Termos de Uso
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
                Não somos um órgão governamental ou entidade pública. Oferecemos serviços de consultoria e assistência 
                para verificação de informações de antecedentes criminais.
              </p>
            </div>

            {/* Section 1 */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                1. Aceitação dos Termos
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Ao acessar e utilizar os serviços do Suporte Online, você concorda em cumprir e estar vinculado 
                a estes Termos de Uso. Se você não concorda com qualquer parte destes termos, não deve utilizar nossos serviços.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Estes termos se aplicam a todos os usuários do serviço, incluindo visitantes, clientes e outros que 
                acessem ou utilizem o serviço.
              </p>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                2. Descrição do Serviço
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                O Suporte Online é uma plataforma privada que oferece serviços de consultoria e assistência 
                para verificação de informações relacionadas a antecedentes criminais. Nossos serviços incluem:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Assistência na consulta de informações de antecedentes criminais</li>
                <li>Organização e verificação de informações</li>
                <li>Atendimento humanizado e personalizado</li>
                <li>Retorno rápido de informações</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                <strong className="text-foreground">Importante:</strong> Nossos serviços são de natureza consultiva e 
                assistencial. Não emitimos documentos oficiais nem representamos qualquer órgão público ou governamental.
              </p>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                3. Uso do Serviço
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Ao utilizar nossos serviços, você concorda em:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Fornecer informações verdadeiras, precisas e completas</li>
                <li>Manter a segurança de suas credenciais de acesso</li>
                <li>Utilizar o serviço apenas para fins legais e legítimos</li>
                <li>Não utilizar o serviço de forma que possa danificar, desabilitar ou sobrecarregar nossos sistemas</li>
                <li>Não tentar acessar áreas restritas do serviço sem autorização</li>
                <li>Não utilizar o serviço para atividades fraudulentas ou ilegais</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                4. Pagamento e Reembolso
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Os serviços oferecidos são pagos e os valores são informados antes da contratação. O pagamento deve 
                ser realizado através dos métodos disponibilizados na plataforma.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Em caso de cancelamento antes do início do processamento da solicitação, poderá ser solicitado reembolso 
                conforme nossa política de cancelamento. Após o início do processamento, não será possível reembolso, 
                exceto em casos de erro comprovado de nossa parte.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Todos os valores são expressos em Reais (R$) e incluem os impostos aplicáveis.
              </p>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                5. Responsabilidades
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                <strong className="text-foreground">Responsabilidades do Usuário:</strong>
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mb-4">
                <li>Fornecer informações corretas e atualizadas</li>
                <li>Utilizar o serviço de forma responsável e ética</li>
                <li>Manter a confidencialidade de suas informações de acesso</li>
                <li>Arcar com as consequências do uso indevido do serviço</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mb-4">
                <strong className="text-foreground">Responsabilidades do Suporte Online:</strong>
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Prestar o serviço contratado com qualidade e profissionalismo</li>
                <li>Manter a confidencialidade das informações fornecidas</li>
                <li>Respeitar os prazos informados para retorno</li>
                <li>Fornecer suporte adequado aos clientes</li>
              </ul>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                6. Limitação de Responsabilidade
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                O Suporte Online não se responsabiliza por:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Danos diretos ou indiretos decorrentes do uso ou impossibilidade de uso do serviço</li>
                <li>Perda de dados ou informações</li>
                <li>Interrupções ou falhas no serviço devido a causas externas</li>
                <li>Uso indevido das informações fornecidas pelo usuário</li>
                <li>Decisões tomadas com base nas informações prestadas pelo serviço</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Nossa responsabilidade está limitada ao valor pago pelo serviço contratado.
              </p>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                7. Propriedade Intelectual
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Todo o conteúdo do serviço, incluindo textos, gráficos, logos, ícones, imagens e software, é propriedade 
                do Suporte Online ou de seus fornecedores de conteúdo e está protegido por leis de direitos autorais. 
                É proibida a reprodução, distribuição ou uso não autorizado de qualquer conteúdo do serviço.
              </p>
            </section>

            {/* Section 8 */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                8. Privacidade e Proteção de Dados
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                O tratamento de dados pessoais é realizado em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018). 
                Para mais informações sobre como tratamos seus dados pessoais, consulte nossa{" "}
                <button
                  onClick={() => navigate("/privacidade")}
                  className="text-primary hover:underline"
                >
                  Política de Privacidade
                </button>
                .
              </p>
            </section>

            {/* Section 9 */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                9. Modificações dos Termos
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Reservamos o direito de modificar estes Termos de Uso a qualquer momento. As alterações entrarão em vigor 
                imediatamente após sua publicação. É responsabilidade do usuário revisar periodicamente estes termos. 
                O uso continuado do serviço após as alterações constitui aceitação dos novos termos.
              </p>
            </section>

            {/* Section 10 */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                10. Cancelamento e Rescisão
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Você pode cancelar sua solicitação a qualquer momento antes do início do processamento. Após o início 
                do processamento, o cancelamento está sujeito às condições de reembolso mencionadas na seção 4.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Reservamos o direito de suspender ou encerrar seu acesso ao serviço, sem aviso prévio, em caso de violação 
                destes Termos de Uso ou de atividades fraudulentas ou ilegais.
              </p>
            </section>

            {/* Section 11 */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                11. Lei Aplicável e Foro
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Estes Termos de Uso são regidos pelas leis brasileiras. Qualquer disputa relacionada a estes termos será 
                resolvida no foro da comarca de São Paulo, SP, renunciando as partes a qualquer outro, por mais privilegiado que seja.
              </p>
            </section>

            {/* Section 12 */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                12. Contato
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Para questões relacionadas a estes Termos de Uso, entre em contato conosco através da{" "}
                <button
                  onClick={() => navigate("/contato")}
                  className="text-primary hover:underline"
                >
                  página de contato
                </button>
                .
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

