import { ArrowLeft, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Footer from "@/components/Footer";
import ParticleBackground from "@/components/ParticleBackground";

const sections = [
  {
    title: "1. Informações Gerais",
    text: "A Guia Central é uma plataforma privada de tecnologia que automatiza o processamento de documentos. Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos suas informações pessoais de acordo com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018). Não somos órgão público nem possuímos vínculo com o Governo. Somos uma empresa de tecnologia que facilita o acesso a documentos por meio de automação e inteligência artificial.",
  },
  {
    title: "2. Dados Coletados",
    text: "Coletamos os seguintes dados pessoais quando você utiliza nossa plataforma: nome completo, CPF, data de nascimento, e-mail, telefone, dados de navegação (cookies, endereço IP, tipo de dispositivo e navegador), e demais informações necessárias para o processamento dos documentos solicitados. Esses dados são coletados diretamente de você no momento do cadastro ou da solicitação do serviço.",
  },
  {
    title: "3. Finalidade do Tratamento",
    text: "Seus dados são utilizados exclusivamente para: processar suas solicitações de documentos de forma automatizada; manter comunicação sobre o andamento dos pedidos; melhorar nossos serviços de automação com IA; cumprir obrigações legais e regulatórias; prevenir fraudes e garantir a segurança da plataforma; e enviar comunicações sobre atualizações do serviço, quando autorizado.",
  },
  {
    title: "4. Compartilhamento de Dados",
    text: "Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros para fins comerciais. Podemos compartilhá-los apenas com: órgãos oficiais necessários ao processamento das certidões solicitadas; prestadores de serviços essenciais ao funcionamento da plataforma (como processadores de pagamento); e autoridades competentes, quando exigido por lei ou ordem judicial.",
  },
  {
    title: "5. Armazenamento e Segurança",
    text: "Utilizamos criptografia de ponta a ponta, controles de acesso rigorosos, monitoramento contínuo e backups regulares para proteger seus dados. Nossa infraestrutura segue padrões de segurança reconhecidos pelo mercado. Os dados são armazenados em servidores seguros pelo tempo necessário ao cumprimento das finalidades descritas nesta política ou conforme exigido por lei.",
  },
  {
    title: "6. Seus Direitos (LGPD)",
    text: "De acordo com a LGPD, você tem direito a: confirmação da existência de tratamento de dados; acesso aos dados pessoais coletados; correção de dados incompletos, inexatos ou desatualizados; anonimização, bloqueio ou eliminação de dados desnecessários; portabilidade dos dados a outro fornecedor; eliminação dos dados tratados com consentimento; informação sobre compartilhamento de dados; e revogação do consentimento. Para exercer seus direitos, entre em contato através da nossa página de contato.",
  },
  {
    title: "7. Cookies",
    text: "Utilizamos cookies essenciais para o funcionamento do site, cookies de desempenho para análise de uso, e cookies de funcionalidade para personalização da experiência. Cookies essenciais são necessários para o funcionamento básico do site e não podem ser desativados. Você pode gerenciar suas preferências de cookies a qualquer momento através das configurações do seu navegador.",
  },
  {
    title: "8. Alterações nesta Política",
    text: "Reservamo-nos o direito de alterar esta Política de Privacidade a qualquer momento. Quaisquer alterações serão publicadas nesta página com a data de atualização. Recomendamos que você revise periodicamente esta política para se manter informado sobre como protegemos seus dados.",
  },
  {
    title: "9. Contato",
    text: "Para dúvidas, solicitações ou reclamações relacionadas a esta Política de Privacidade ou ao tratamento dos seus dados pessoais, entre em contato através da nossa página de contato ou pelo e-mail disponível no rodapé do site.",
  },
];

const PoliticaPrivacidade = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <ParticleBackground />
      <div className="lens-flare" style={{ top: "15%", right: "15%" }} />

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
                <Shield className="w-5 h-5 text-primary" />
              </motion.div>
              <h1 className="text-3xl font-bold text-foreground">Política de Privacidade</h1>
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

export default PoliticaPrivacidade;
