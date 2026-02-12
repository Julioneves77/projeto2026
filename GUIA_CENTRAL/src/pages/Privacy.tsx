import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/SEOHead";
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Mail, 
  User, 
  FileText, 
  Smartphone, 
  Shield, 
  Scale, 
  Target, 
  Building2, 
  Coins, 
  Cloud, 
  Eye, 
  Pencil, 
  Trash2, 
  Package, 
  Ban, 
  Lock, 
  X, 
  Calendar, 
  DollarSign, 
  Zap, 
  Globe, 
  Cookie,
  Phone
} from "lucide-react";

const Privacy = () => {
  return (
    <Layout>
      <SEOHead
        title="Política de Privacidade - Guia Central"
        description="Conheça nossa política de privacidade e como protegemos seus dados pessoais."
      />
      <main className="flex-1 py-12">
        <div className="container max-w-4xl mx-auto px-4">
          {/* Título */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">Política de Privacidade</h1>
            <p className="text-lg text-muted-foreground mb-1">Em conformidade com a Lei Geral de Proteção de Dados (LGPD)</p>
            <p className="text-sm text-muted-foreground">Última atualização: 24 de janeiro de 2025</p>
          </div>

          {/* Seção 1 - Identificação do Controlador */}
          <section className="mb-10 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 font-bold">1</span>
              </div>
              <h2 className="text-2xl font-bold text-foreground">Identificação do Controlador</h2>
            </div>
            <div className="space-y-3 text-foreground">
              <p><strong>Razão Social:</strong> Guia Central LTDA</p>
              <p><strong>Controlador de Dados:</strong> Responsável pelo tratamento dos dados pessoais</p>
              <p><strong>E-mail para questões de privacidade:</strong> contato@guia-central.online</p>
              <p><strong>Atividade:</strong> Plataforma de automação documental com inteligência artificial</p>
              <p className="mt-4 text-sm">
                Somos uma plataforma privada de tecnologia que utiliza IA para orientar usuários e automatizar o processamento de documentos digitais. Após o pagamento, nosso sistema automatiza todo o processo e realiza a entrega por email e painel do cliente.
              </p>
            </div>
          </section>

          {/* Seção 2 - Dados Pessoais Coletados */}
          <section className="mb-10 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 font-bold">2</span>
              </div>
              <h2 className="text-2xl font-bold text-foreground">Dados Pessoais Coletados</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Dados Fornecidos Diretamente */}
              <div className="bg-card border rounded-lg p-5">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Dados Fornecidos Diretamente</h3>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><strong>Dados de identificação:</strong> Nome completo, CPF, RG, órgão emissor</li>
                  <li><strong>Dados de contato:</strong> E-mail, telefone, WhatsApp</li>
                  <li><strong>Dados de localização:</strong> Endereço residencial completo</li>
                  <li><strong>Dados de filiação:</strong> Nome do pai e da mãe</li>
                  <li><strong>Dados de nascimento:</strong> Data e local de nascimento</li>
                  <li><strong>Dados específicos:</strong> Conforme o tipo de certidão solicitada</li>
                </ul>
              </div>
              {/* Dados Coletados Automaticamente */}
              <div className="bg-card border rounded-lg p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Smartphone className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Dados Coletados Automaticamente</h3>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><strong>Dados técnicos:</strong> Endereço IP, navegador, dispositivo</li>
                  <li><strong>Dados de navegação:</strong> Páginas visitadas, tempo de acesso</li>
                  <li><strong>Dados de localização:</strong> Geolocalização aproximada (quando autorizada)</li>
                  <li><strong>Cookies e rastreadores:</strong> Para análise e melhoria da experiência</li>
                  <li><strong>Dados de transação:</strong> Informações sobre pagamentos (tokenizadas)</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Seção 3 - Base Legal e Finalidades */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 font-bold">3</span>
              </div>
              <h2 className="text-2xl font-bold text-foreground">Base Legal e Finalidades do Tratamento</h2>
            </div>
            <div className="space-y-4">
              {/* Execução de Contrato */}
              <div className="bg-green-50 dark:bg-green-950/20 border-l-4 border-green-500 rounded-lg p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Scale className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <h3 className="font-bold text-green-900 dark:text-green-100">Execução de Contrato (Art. 7°, V da LGPD)</h3>
                </div>
                <ul className="space-y-2 text-green-800 dark:text-green-200 text-sm ml-7">
                  <li>• Processar automaticamente documentos digitais via sistema de IA</li>
                  <li>• Verificar dados para processamento automatizado</li>
                  <li>• Executar a venda de serviços de automação documental</li>
                  <li>• Processar pagamentos PIX e emitir recibos</li>
                  <li>• Prestar suporte técnico sobre o sistema e processamento</li>
                  <li>• Entregar automaticamente documentos após confirmação de pagamento</li>
                </ul>
              </div>
              {/* Cumprimento de Obrigação Legal */}
              <div className="bg-orange-50 dark:bg-orange-950/20 border-l-4 border-orange-500 rounded-lg p-5">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  <h3 className="font-bold text-orange-900 dark:text-orange-100">Cumprimento de Obrigação Legal (Art. 7º, II da LGPD)</h3>
                </div>
                <ul className="space-y-2 text-orange-800 dark:text-orange-200 text-sm ml-7">
                  <li>• Manter registros de transações para auditoria fiscal</li>
                  <li>• Cumprir obrigações fiscais e trabalhistas</li>
                  <li>• Atender determinações judiciais</li>
                  <li>• Atender exigências de proteção ao consumidor</li>
                </ul>
              </div>
              {/* Legítimo Interesse */}
              <div className="bg-blue-50 dark:bg-blue-950/20 border-l-4 border-blue-500 rounded-lg p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-bold text-blue-900 dark:text-blue-100">Legítimo Interesse (Art. 7°, IX da LGPD)</h3>
                </div>
                <ul className="space-y-2 text-blue-800 dark:text-blue-200 text-sm ml-7">
                  <li>• Prevenção de fraudes e segurança de transações</li>
                  <li>• Melhoria da plataforma e experiência do usuário</li>
                  <li>• Comunicação sobre atualizações de processamento</li>
                  <li>• Análise de dados para otimização do sistema de IA</li>
                  <li>• Suporte técnico personalizado</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Seção 4 - Compartilhamento e Transferência */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 font-bold">4</span>
              </div>
              <h2 className="text-2xl font-bold text-foreground">Compartilhamento e Transferência de Dados</h2>
            </div>
            {/* Política de Não Venda */}
            <div className="bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 rounded-lg p-5 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Ban className="w-5 h-5 text-red-600 dark:text-red-400" />
                <h3 className="font-bold text-red-900 dark:text-red-100">Política de Não Venda</h3>
              </div>
              <p className="text-red-800 dark:text-red-200 text-sm">
                Nunca vendemos, alugamos ou comercializamos seus dados pessoais para terceiros para fins de marketing, publicidade ou qualquer finalidade comercial externa.
              </p>
            </div>
            {/* Compartilhamento Necessário */}
            <div className="mb-4">
              <h3 className="font-semibold text-foreground mb-4">Compartilhamento Necessário e Autorizado:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-card border rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-5 h-5 text-primary" />
                    <h4 className="font-semibold text-foreground">Órgãos Públicos</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">Tribunais, Receita Federal, Polícia Federal, TSE e outros órgãos emissores das certidões solicitadas.</p>
                </div>
                <div className="bg-card border rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Coins className="w-5 h-5 text-primary" />
                    <h4 className="font-semibold text-foreground">Processadores de Pagamento</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">Empresas como PagSeguro, Mercado Pago, para processamento seguro de transações financeiras.</p>
                </div>
                <div className="bg-card border rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Cloud className="w-5 h-5 text-primary" />
                    <h4 className="font-semibold text-foreground">Prestadores de Serviço</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">Serviços de e-mail, hospedagem em nuvem (todos com contratos de proteção de dados).</p>
                </div>
                <div className="bg-card border rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Scale className="w-5 h-5 text-primary" />
                    <h4 className="font-semibold text-foreground">Determinação Legal</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">Quando exigido por lei, ordem judicial ou para proteção de direitos legítimos.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Seção 5 - Medidas de Segurança */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 font-bold">5</span>
              </div>
              <h2 className="text-2xl font-bold text-foreground">Medidas de Segurança e Proteção</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Proteção Técnica */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-foreground">Proteção Técnica</h3>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></span>
                    <span>Criptografia SSL/TLS 256-bits em toda comunicação</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></span>
                    <span>Armazenamento em servidores seguros com certificação ISO</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></span>
                    <span>Backups automáticos criptografados diários</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></span>
                    <span>Monitoramento 24/7 de segurança e intrusões</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></span>
                    <span>Firewall avançado e proteção DDoS</span>
                  </li>
                </ul>
              </div>
              {/* Proteção Organizacional */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-foreground">Proteção Organizacional</h3>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></span>
                    <span>Acesso restrito por função e necessidade</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></span>
                    <span>Treinamento regular em proteção de dados</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></span>
                    <span>Contratos de confidencialidade rigorosos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></span>
                    <span>Auditoria interna periódica de processos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></span>
                    <span>Política de senhas forte e autenticação dupla</span>
                  </li>
                </ul>
              </div>
            </div>
            {/* Aviso Importante */}
            <div className="bg-yellow-50 dark:bg-yellow-950/20 border-l-4 border-yellow-500 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Importante:</strong> Apesar de todas as medidas de segurança, nenhum sistema é 100% seguro. Em caso de incidente de segurança, notificaremos imediatamente as autoridades e os titulares afetados conforme exigido pela LGPD.
                </p>
              </div>
            </div>
          </section>

          {/* Seção 6 - Direitos do Titular */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 font-bold">6</span>
              </div>
              <h2 className="text-2xl font-bold text-foreground">Seus Direitos como Titular dos Dados</h2>
            </div>
            <div className="bg-purple-50 dark:bg-purple-950/20 border-l-4 border-purple-500 rounded-lg p-4 mb-4">
              <p className="text-purple-900 dark:text-purple-100 text-sm">
                A LGPD garante diversos direitos fundamentais sobre seus dados pessoais:
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <h4 className="font-semibold text-foreground text-sm">Confirmação de Tratamento</h4>
                </div>
                <p className="text-xs text-muted-foreground">Saber se tratamos seus dados e quais são</p>
              </div>
              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-5 h-5 text-primary" />
                  <h4 className="font-semibold text-foreground text-sm">Acesso aos Dados</h4>
                </div>
                <p className="text-xs text-muted-foreground">Visualizar todos os seus dados que possuímos</p>
              </div>
              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Pencil className="w-5 h-5 text-primary" />
                  <h4 className="font-semibold text-foreground text-sm">Correção</h4>
                </div>
                <p className="text-xs text-muted-foreground">Corrigir dados incompletos, inexatos ou desatualizados</p>
              </div>
              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Trash2 className="w-5 h-5 text-primary" />
                  <h4 className="font-semibold text-foreground text-sm">Eliminação</h4>
                </div>
                <p className="text-xs text-muted-foreground">Excluir dados desnecessários ou tratados inadequadamente</p>
              </div>
              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-5 h-5 text-primary" />
                  <h4 className="font-semibold text-foreground text-sm">Portabilidade</h4>
                </div>
                <p className="text-xs text-muted-foreground">Receber seus dados em formato estruturado e interoperável</p>
              </div>
              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Ban className="w-5 h-5 text-primary" />
                  <h4 className="font-semibold text-foreground text-sm">Oposição</h4>
                </div>
                <p className="text-xs text-muted-foreground">Se opor ao tratamento realizado com base em legítimo interesse</p>
              </div>
              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="w-5 h-5 text-primary" />
                  <h4 className="font-semibold text-foreground text-sm">Anonimização</h4>
                </div>
                <p className="text-xs text-muted-foreground">Solicitar anonimização de dados desnecessários</p>
              </div>
              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <X className="w-5 h-5 text-primary" />
                  <h4 className="font-semibold text-foreground text-sm">Revogação</h4>
                </div>
                <p className="text-xs text-muted-foreground">Retirar consentimento quando aplicável</p>
              </div>
            </div>
            {/* Como Exercer Seus Direitos */}
            <div className="bg-green-50 dark:bg-green-950/20 border-l-4 border-green-500 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                <Phone className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h3 className="font-bold text-green-900 dark:text-green-100">Como Exercer Seus Direitos</h3>
              </div>
              <p className="text-green-800 dark:text-green-200 text-sm mb-2">
                Para exercer qualquer um destes direitos, entre em contato conosco através de:
              </p>
              <p className="text-green-800 dark:text-green-200 text-sm mb-1">
                <strong>E-mail:</strong> contato@guia-central.online
              </p>
              <p className="text-green-800 dark:text-green-200 text-sm mb-1">
                <strong>Prazo de resposta:</strong> Até 15 dias úteis
              </p>
              <p className="text-green-800 dark:text-green-200 text-sm">
                <strong>Sem custo:</strong> O exercício dos direitos é gratuito
              </p>
            </div>
          </section>

          {/* Seção 7 - Tempo de Retenção */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 font-bold">7</span>
              </div>
              <h2 className="text-2xl font-bold text-foreground">Tempo de Retenção dos Dados</h2>
            </div>
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Política de Retenção</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Mantemos seus dados apenas pelo tempo necessário para cumprir as finalidades específicas ou conforme exigido por lei.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-card border rounded-lg p-5">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <h4 className="font-semibold text-foreground text-sm">Dados de Pedidos Ativos</h4>
                </div>
                <p className="text-xs text-muted-foreground">Mantidos durante a execução do serviço e até 90 dias após conclusão para suporte.</p>
              </div>
              <div className="bg-card border rounded-lg p-5">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <h4 className="font-semibold text-foreground text-sm">Registros de Certidões</h4>
                </div>
                <p className="text-xs text-muted-foreground">Mantidos por 5 anos conforme regulamentação de despachantes documentalistas.</p>
              </div>
              <div className="bg-card border rounded-lg p-5">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  <h4 className="font-semibold text-foreground text-sm">Dados Fiscais</h4>
                </div>
                <p className="text-xs text-muted-foreground">Mantidos por 10 anos conforme legislação tributária brasileira.</p>
              </div>
            </div>
          </section>

          {/* Seção 8 - Processo de Entrega e Pagamento */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 font-bold">8</span>
              </div>
              <h2 className="text-2xl font-bold text-foreground">Processo de Entrega e Pagamento</h2>
            </div>
            {/* Entrega das Certidões */}
            <div className="bg-green-50 dark:bg-green-950/20 border-l-4 border-green-500 rounded-lg p-5 mb-4">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h3 className="font-bold text-green-900 dark:text-green-100">Entrega das Certidões</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="w-4 h-4 text-green-600" />
                    <h4 className="font-semibold text-green-900 dark:text-green-100 text-sm">Por E-mail</h4>
                  </div>
                  <ul className="space-y-1 text-green-800 dark:text-green-200 text-xs ml-6">
                    <li>• Envio automático após emissão</li>
                    <li>• Arquivo em formato PDF original</li>
                    <li>• E-mail de confirmação de entrega</li>
                    <li>• Backup automático na sua conta</li>
                  </ul>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-green-600" />
                    <h4 className="font-semibold text-green-900 dark:text-green-100 text-sm">Área do Cliente</h4>
                  </div>
                  <ul className="space-y-1 text-green-800 dark:text-green-200 text-xs ml-6">
                    <li>• Acesso permanente às suas certidões</li>
                    <li>• Histórico completo de pedidos</li>
                    <li>• Download ilimitado</li>
                    <li>• Área segura e criptografada</li>
                  </ul>
                </div>
              </div>
            </div>
            {/* Processo de Pagamento */}
            <div className="bg-card border rounded-lg p-5 mb-4">
              <h3 className="font-semibold text-foreground mb-4">Processo de Pagamento</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className="w-4 h-4 text-primary" />
                    <h4 className="font-semibold text-foreground text-sm">Método Aceito: PIX</h4>
                  </div>
                  <ul className="space-y-1 text-muted-foreground text-xs ml-6">
                    <li>• Único meio de pagamento: Aceitamos exclusivamente PIX</li>
                    <li>• Processamento instantâneo: 24 horas por dia, 7 dias por semana</li>
                    <li>• Segurança máxima: Sistema do Banco Central do Brasil</li>
                    <li>• Sem taxas adicionais: Valor transparente e fixo</li>
                  </ul>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-primary" />
                    <h4 className="font-semibold text-foreground text-sm">Reconhecimento Automático</h4>
                  </div>
                  <ul className="space-y-1 text-muted-foreground text-xs ml-6">
                    <li>• Confirmação instantânea: Pagamento reconhecido automaticamente</li>
                    <li>• Processamento imediato: Pedido entra na fila de processamento</li>
                    <li>• Notificação automática: E-mail de confirmação</li>
                    <li>• Transparência total: Status atualizado em tempo real</li>
                  </ul>
                </div>
              </div>
            </div>
            {/* Proteção dos Dados de Pagamento */}
            <div className="bg-purple-50 dark:bg-purple-950/20 border-l-4 border-purple-500 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="font-bold text-purple-900 dark:text-purple-100">Proteção dos Dados de Pagamento</h3>
              </div>
              <p className="text-purple-800 dark:text-purple-200 text-sm">
                Não armazenamos dados bancários: Utilizamos provedores de pagamento certificados que seguem os mais altos padrões de segurança. Suas informações de pagamento são criptografadas e processadas exclusivamente pelos sistemas do PIX.
              </p>
            </div>
          </section>

          {/* Seção 9 - Dados de Crianças e Adolescentes */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 font-bold">9</span>
              </div>
              <h2 className="text-2xl font-bold text-foreground">Dados de Crianças e Adolescentes</h2>
            </div>
            <div className="bg-orange-50 dark:bg-orange-950/20 border-l-4 border-orange-500 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                <h3 className="font-bold text-orange-900 dark:text-orange-100">Proteção Especial</h3>
              </div>
              <ul className="space-y-2 text-orange-800 dark:text-orange-200 text-sm ml-7">
                <li><strong>Menores de 18 anos:</strong> Necessário consentimento dos pais ou responsáveis legais</li>
                <li><strong>Finalidade limitada:</strong> Apenas para emissão das certidões solicitadas pelos responsáveis</li>
                <li><strong>Segurança reforçada:</strong> Medidas adicionais de proteção para dados de menores</li>
                <li><strong>Direitos ampliados:</strong> Pais podem exercer todos os direitos em nome dos filhos</li>
              </ul>
            </div>
          </section>

          {/* Seção 10 - Cookies */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 font-bold">10</span>
              </div>
              <h2 className="text-2xl font-bold text-foreground">Cookies e Tecnologias Similares</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-green-50 dark:bg-green-950/20 border-l-4 border-green-500 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <h4 className="font-semibold text-green-900 dark:text-green-100 text-sm">Cookies Essenciais</h4>
                </div>
                <p className="text-xs text-green-800 dark:text-green-200">Necessários para funcionamento básico do site (segurança, navegação).</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950/20 border-l-4 border-blue-500 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-sm">Cookies Analíticos</h4>
                </div>
                <p className="text-xs text-blue-800 dark:text-blue-200">Para entender como você usa nosso site e melhorar a experiência.</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-950/20 border-l-4 border-purple-500 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Cookie className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <h4 className="font-semibold text-purple-900 dark:text-purple-100 text-sm">Cookies Funcionais</h4>
                </div>
                <p className="text-xs text-purple-800 dark:text-purple-200">Para lembrar suas preferências e personalizar sua experiência.</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Você pode gerenciar cookies através das configurações do seu navegador ou do nosso banner de cookies.
            </p>
          </section>

          {/* Seção 11 - Transferência Internacional */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 font-bold">11</span>
              </div>
              <h2 className="text-2xl font-bold text-foreground">Transferência Internacional de Dados</h2>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/20 border-l-4 border-blue-500 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-bold text-blue-900 dark:text-blue-100">Dados Armazenados no Brasil</h3>
              </div>
              <p className="text-blue-800 dark:text-blue-200 text-sm mb-4">
                Seus dados são prioritariamente armazenados em servidores localizados no Brasil.
              </p>
              <div className="mb-2">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Exceções com Proteção</h4>
                <p className="text-blue-800 dark:text-blue-200 text-sm mb-2">
                  Alguns serviços técnicos podem usar provedores internacionais com adequado nível de proteção:
                </p>
                <ul className="space-y-1 text-blue-800 dark:text-blue-200 text-sm ml-4">
                  <li>• Serviços de e-mail e comunicação (com criptografia end-to-end)</li>
                  <li>• Backup e recuperação de desastres (dados criptografados)</li>
                  <li>• Apenas com empresas certificadas e contratos específicos de proteção</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Seção 12 - Alterações */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 font-bold">12</span>
              </div>
              <h2 className="text-2xl font-bold text-foreground">Alterações nesta Política</h2>
            </div>
            <p className="text-foreground mb-4">
              Esta Política de Privacidade pode ser atualizada periodicamente para refletir mudanças em nossas práticas, serviços ou requisitos legais.
            </p>
            <div className="bg-yellow-50 dark:bg-yellow-950/20 border-l-4 border-yellow-500 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                <h3 className="font-bold text-yellow-900 dark:text-yellow-100">Como você será notificado:</h3>
              </div>
              <ul className="space-y-2 text-yellow-800 dark:text-yellow-200 text-sm ml-7">
                <li><strong>Mudanças menores:</strong> Atualização da data e publicação no site</li>
                <li><strong>Mudanças significativas:</strong> Notificação por e-mail com 30 dias de antecedência</li>
                <li><strong>Mudanças que afetam direitos:</strong> Solicitação de novo consentimento quando necessário</li>
              </ul>
            </div>
          </section>

          {/* Seção 13 - Contato */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 font-bold">13</span>
              </div>
              <h2 className="text-2xl font-bold text-foreground">Contato e Encarregado de Dados (DPO)</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 dark:bg-blue-950/20 border-l-4 border-blue-500 rounded-lg p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-bold text-blue-900 dark:text-blue-100 text-sm">Contato para Privacidade</h3>
                </div>
                <div className="space-y-1 text-blue-800 dark:text-blue-200 text-xs">
                  <p><strong>E-mail:</strong> privacidade@guia-central.online</p>
                  <p><strong>Assunto:</strong> [LGPD] - Sua solicitação</p>
                  <p><strong>Prazo de resposta:</strong> Até 15 dias úteis</p>
                  <p><strong>Horário:</strong> Segunda a sexta, 8h às 17h30</p>
                </div>
              </div>
              <div className="bg-green-50 dark:bg-green-950/20 border-l-4 border-green-500 rounded-lg p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Mail className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <h3 className="font-bold text-green-900 dark:text-green-100 text-sm">Contato Geral</h3>
                </div>
                <div className="space-y-1 text-green-800 dark:text-green-200 text-xs">
                  <p><strong>E-mail:</strong> contato@guia-central.online</p>
                  <p><strong>Site:</strong> www.guia-central.online</p>
                  <p><strong>Suporte:</strong> Dúvidas gerais sobre serviços</p>
                  <p><strong>Disponível:</strong> 7 dias por semana</p>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900/50 border-l-4 border-gray-500 rounded-lg p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Phone className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">Suporte Técnico</h3>
                </div>
                <p className="text-gray-800 dark:text-gray-200 text-xs mb-2">
                  Para questões técnicas sobre o site ou problemas de acesso:
                </p>
                <div className="space-y-1 text-gray-800 dark:text-gray-200 text-xs">
                  <p><strong>E-mail:</strong> suporte@guia-central.online</p>
                  <p><strong>Horário:</strong> Segunda a sexta, 8h às 17h30</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </Layout>
  );
};

export default Privacy;
