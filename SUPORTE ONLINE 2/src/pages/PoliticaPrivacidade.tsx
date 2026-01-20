import { motion } from 'framer-motion';
import { ArrowLeft, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function PoliticaPrivacidade() {
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
            Política de Privacidade
          </h1>

          <div className="bg-card rounded-2xl p-6 md:p-8 shadow-card border border-border/50 space-y-6 text-muted-foreground">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">1. Informações Coletadas</h2>
              <p>
                Coletamos informações que você nos fornece diretamente, incluindo: nome completo, CPF, estado (UF), número de WhatsApp e endereço de e-mail. Estas informações são necessárias para processar sua solicitação.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">2. Uso das Informações</h2>
              <p>
                As informações coletadas são utilizadas exclusivamente para:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Processar e acompanhar sua solicitação</li>
                <li>Enviar atualizações sobre o status do seu processo</li>
                <li>Entrar em contato quando necessário</li>
                <li>Gerar o documento de acompanhamento</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">3. Proteção de Dados</h2>
              <p>
                Implementamos medidas de segurança técnicas e organizacionais para proteger suas informações pessoais contra acesso não autorizado, alteração, divulgação ou destruição.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">4. Armazenamento</h2>
              <p>
                Suas informações são armazenadas de forma segura e mantidas apenas pelo tempo necessário para cumprir as finalidades para as quais foram coletadas, ou conforme exigido por lei.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">5. Compartilhamento</h2>
              <p>
                Não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros para fins de marketing. Podemos compartilhar informações apenas quando necessário para processar sua solicitação ou quando exigido por lei.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">6. Seus Direitos</h2>
              <p>
                Você tem direito a:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Acessar suas informações pessoais</li>
                <li>Solicitar correção de dados incorretos</li>
                <li>Solicitar exclusão de seus dados</li>
                <li>Revogar consentimento a qualquer momento</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">7. Cookies</h2>
              <p>
                Utilizamos cookies e tecnologias similares para melhorar a experiência do usuário e analisar o uso do site. Você pode configurar seu navegador para recusar cookies, mas isso pode afetar a funcionalidade do serviço.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">8. Alterações</h2>
              <p>
                Esta política pode ser atualizada periodicamente. Recomendamos que você revise esta página regularmente para se manter informado sobre nossas práticas de privacidade.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">9. Contato</h2>
              <p>
                Para exercer seus direitos ou esclarecer dúvidas sobre esta política, entre em contato através do suporte disponível no site.
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
