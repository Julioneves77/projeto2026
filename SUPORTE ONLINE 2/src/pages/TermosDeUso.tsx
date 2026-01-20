import { motion } from 'framer-motion';
import { ArrowLeft, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function TermosDeUso() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen gradient-hero">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">Suporte Online</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-8">
            Termos de Uso
          </h1>

          <div className="bg-card rounded-2xl p-6 md:p-8 shadow-card border border-border/50 space-y-6 text-muted-foreground">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">1. Aceitação dos Termos</h2>
              <p>
                Ao acessar e utilizar este serviço, você concorda em cumprir e estar vinculado aos seguintes termos e condições de uso. Se você não concordar com qualquer parte destes termos, não deverá utilizar nosso serviço.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">2. Descrição do Serviço</h2>
              <p>
                Este é um serviço privado de assistência para acompanhamento de solicitações. Oferecemos organização, conferência e encaminhamento de documentos com retorno por e-mail.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">3. Uso do Serviço</h2>
              <p>
                Você concorda em fornecer informações verdadeiras, precisas e completas durante o processo de solicitação. O uso indevido do serviço ou o fornecimento de informações falsas pode resultar na suspensão ou cancelamento do acesso.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">4. Pagamentos</h2>
              <p>
                Os pagamentos são processados de forma segura através de PIX. Uma vez confirmado o pagamento, o serviço será iniciado imediatamente. Não oferecemos reembolsos após a confirmação do pagamento e início do processamento.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">5. Responsabilidades</h2>
              <p>
                Nosso serviço atua como intermediário na organização e encaminhamento de solicitações. Não nos responsabilizamos por decisões tomadas por órgãos públicos ou terceiros em relação às solicitações encaminhadas.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">6. Propriedade Intelectual</h2>
              <p>
                Todo o conteúdo deste site, incluindo textos, gráficos, logos e software, é propriedade do serviço e está protegido pelas leis de propriedade intelectual.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">7. Modificações</h2>
              <p>
                Reservamo-nos o direito de modificar estes termos a qualquer momento. As alterações entrarão em vigor imediatamente após a publicação no site.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">8. Contato</h2>
              <p>
                Para dúvidas sobre estes termos, entre em contato através do suporte disponível no site.
              </p>
            </section>

            <p className="text-sm text-muted-foreground pt-4 border-t border-border">
              Última atualização: Janeiro de 2025
            </p>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/30 mt-12">
        <div className="container mx-auto px-4 py-8">
          <p className="text-sm text-muted-foreground text-center">
            Serviço privado de assistência
          </p>
        </div>
      </footer>
    </div>
  );
}
