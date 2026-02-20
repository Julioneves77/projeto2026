import { ArrowLeft, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Footer from "@/components/Footer";
import ParticleBackground from "@/components/ParticleBackground";

const sections = [
  {
    title: "1. Sobre a Plataforma",
    text: "A Guia Central é uma plataforma privada de tecnologia que utiliza inteligência artificial e automação RPA para processar solicitações de documentos de forma digital. NÃO somos órgão público nem possuímos vínculo direto com o Governo. Somos uma empresa de tecnologia que facilita o acesso a documentos através de sistemas automatizados.",
  },
  {
    title: "2. Serviço Prestado",
    text: "Nosso serviço consiste em automatizar o processamento de documentos junto aos órgãos competentes utilizando tecnologia de ponta, incluindo inteligência artificial e robotic process automation (RPA). Você contrata nosso serviço de automação e tecnologia, e não o órgão emissor do documento. Os documentos são emitidos pelas fontes oficiais; nossa plataforma apenas automatiza a solicitação e o acompanhamento.",
  },
  {
    title: "3. Disponibilidade Gratuita",
    text: "Informamos que os documentos solicitados através da nossa plataforma podem ser obtidos gratuitamente diretamente nos sites dos órgãos oficiais competentes. Nosso serviço cobra pela automação, praticidade, tecnologia, suporte técnico e economia de tempo oferecidos pela plataforma. Você pode solicitar diretamente nos órgãos públicos, mas oferecemos tecnologia, praticidade e economia de tempo com nosso sistema automatizado.",
  },
  {
    title: "4. Responsabilidades do Usuário",
    text: "O usuário é integralmente responsável pela veracidade e exatidão das informações fornecidas durante o processo de solicitação. Dados incorretos, incompletos ou inverídicos podem resultar em documentos inválidos, atrasos no processamento ou impossibilidade de conclusão do serviço. A plataforma não se responsabiliza por erros decorrentes de informações incorretas fornecidas pelo usuário.",
  },
  {
    title: "5. Prazos de Processamento",
    text: "Os prazos informados são estimativas baseadas no tempo médio de processamento observado em condições normais. Muitos documentos são processados automaticamente em minutos. Outros podem levar até 48 horas úteis dependendo do tipo e complexidade. Documentos podem sofrer atrasos por indisponibilidade dos sistemas oficiais, manutenção programada, instabilidade de rede ou outros fatores externos fora do nosso controle.",
  },
  {
    title: "6. Pagamentos e Valores",
    text: "Os valores cobrados referem-se exclusivamente ao serviço de automação, tecnologia, infraestrutura e suporte da plataforma. Pagamentos são processados de forma segura via Pix com confirmação instantânea. Os preços podem ser alterados sem aviso prévio, prevalecendo sempre o valor exibido no momento da contratação do serviço.",
  },
  {
    title: "7. Cancelamento e Reembolso",
    text: "Solicitações de cancelamento devem ser feitas antes do início do processamento automatizado. Após o início do processamento, o reembolso será analisado caso a caso pela nossa equipe de suporte, considerando o estágio em que se encontra a solicitação. Para solicitar cancelamento, entre em contato através da nossa página de contato.",
  },
  {
    title: "8. Propriedade Intelectual",
    text: "Todo o conteúdo da plataforma, incluindo textos, imagens, logotipos, design, código-fonte e tecnologia de automação, é de propriedade exclusiva da Guia Central ou de seus licenciadores e está protegido por leis de propriedade intelectual. É proibida a reprodução, distribuição ou uso não autorizado de qualquer conteúdo da plataforma.",
  },
  {
    title: "9. Limitação de Responsabilidade",
    text: "A Guia Central não se responsabiliza por: indisponibilidade temporária dos sistemas oficiais dos órgãos emissores; atrasos causados por fatores externos; uso indevido da plataforma pelo usuário; danos indiretos ou consequentes decorrentes do uso do serviço. Nossa responsabilidade limita-se ao valor pago pelo serviço contratado.",
  },
  {
    title: "10. Alterações nos Termos",
    text: "Reservamo-nos o direito de alterar estes Termos de Uso a qualquer momento, sem aviso prévio. As alterações entram em vigor imediatamente após publicação nesta página. O uso continuado da plataforma após alterações implica na aceitação dos novos termos. Recomendamos a leitura periódica deste documento.",
  },
];

const TermosDeUso = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <ParticleBackground />
      <div className="lens-flare" style={{ top: "10%", left: "20%" }} />

      <div className="relative z-10">
        <div className="container mx-auto px-6 py-12 max-w-3xl">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Voltar</span>
          </Link>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="flex items-center gap-3 mb-8">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-10 h-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center glow-blue"
              >
                <FileText className="w-5 h-5 text-primary" />
              </motion.div>
              <h1 className="text-3xl font-bold text-foreground">Termos de Uso</h1>
            </div>
          </motion.div>

          <div className="space-y-6">
            {sections.map((section, i) => (
              <motion.section
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl border border-border bg-card/60 backdrop-blur-sm p-6 relative overflow-hidden group"
              >
                <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-40 transition-opacity duration-300" />
                <h2 className="text-foreground text-lg font-semibold mb-3">{section.title}</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">{section.text}</p>
              </motion.section>
            ))}
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default TermosDeUso;
