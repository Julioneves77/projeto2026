import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CheckCircle2, XCircle, AlertCircle, Mail, User, RefreshCw, FileText, Smartphone, Clock, DollarSign, Shield, Ban, Copyright, Scale, FileEdit, Lightbulb } from "lucide-react";

const TermosUso = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 py-12">
        <div className="container max-w-4xl mx-auto px-4">
          {/* Título */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">Termos de Uso</h1>
            <p className="text-lg text-muted-foreground mb-1">Condições Gerais de Uso dos Serviços</p>
            <p className="text-sm text-muted-foreground">Última atualização: 07/02/2026</p>
          </div>

          {/* Caixa de Atenção */}
          <div className="bg-blue-50 dark:bg-blue-950/20 border-l-4 border-blue-500 rounded-lg p-6 mb-8">
            <p className="font-bold text-blue-900 dark:text-blue-100 mb-2">
              POR FAVOR, LEIA ESTES TERMOS DE USO COM ATENÇÃO
            </p>
            <p className="text-blue-800 dark:text-blue-200 text-sm">
              O uso do site centraldascertidoes.com e a contratação dos nossos serviços demonstra a sua concordância integral com estes Termos de Uso.
            </p>
          </div>

          {/* Seção 1 - Apresentação */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 font-bold">1</span>
              </div>
              <h2 className="text-2xl font-bold text-foreground">Apresentação</h2>
            </div>
            <p className="text-foreground mb-6">
              O site Guia das Certidões Brasil (centraldascertidoes.com) é uma <strong>plataforma privada de automação documental</strong> que utiliza inteligência artificial para orientar o usuário e automatizar o processamento de documentos digitais.
            </p>

            {/* O que somos */}
            <div className="bg-green-50 dark:bg-green-950/20 border-l-4 border-green-500 rounded-lg p-5 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h3 className="font-bold text-green-900 dark:text-green-100">O que somos:</h3>
              </div>
              <ul className="space-y-2 text-green-800 dark:text-green-200 text-sm ml-7">
                <li>• Plataforma tecnológica privada com IA para automação documental</li>
                <li>• Sistema que automatiza consultas e processamento digital</li>
                <li>• Assistente de IA que orienta e indica documentos</li>
              </ul>
            </div>

            {/* O que NÃO somos */}
            <div className="bg-yellow-50 dark:bg-yellow-950/20 border-l-4 border-orange-500 rounded-lg p-5 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                <h3 className="font-bold text-orange-900 dark:text-orange-100">O que NÃO somos:</h3>
              </div>
              <ul className="space-y-2 text-orange-800 dark:text-orange-200 text-sm ml-7">
                <li>• <strong>NÃO</strong> somos cartório ou serventia</li>
                <li>• <strong>NÃO</strong> emitimos certidões</li>
                <li>• <strong>NÃO</strong> temos vínculo com fontes emissoras</li>
                <li>• <strong>NÃO</strong> prestamos serviços jurídicos</li>
              </ul>
            </div>

            <p className="text-foreground">
              Nossa função é automatizar todo o processo de consulta e processamento de documentos digitais.
            </p>
          </section>

          {/* Seção 2 - Definições */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 font-bold">2</span>
              </div>
              <h2 className="text-2xl font-bold text-foreground">Definições</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-card border rounded-lg p-5">
                <div className="flex items-center gap-3 mb-2">
                  <Smartphone className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">"Site" ou "Plataforma"</h3>
                </div>
                <p className="text-sm text-muted-foreground">O site centraldascertidoes.com e seus serviços.</p>
              </div>
              <div className="bg-card border rounded-lg p-5">
                <div className="flex items-center gap-3 mb-2">
                  <User className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">"Cliente" ou "Você"</h3>
                </div>
                <p className="text-sm text-muted-foreground">Pessoa física ou jurídica que contrata nossos serviços.</p>
              </div>
              <div className="bg-card border rounded-lg p-5">
                <div className="flex items-center gap-3 mb-2">
                  <RefreshCw className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">"Serviços"</h3>
                </div>
                <p className="text-sm text-muted-foreground">Serviço de busca e entrega de certidões.</p>
              </div>
              <div className="bg-card border rounded-lg p-5">
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">"Certidões"</h3>
                </div>
                <p className="text-sm text-muted-foreground">Documentos emitidos pelas fontes emissoras.</p>
              </div>
            </div>
          </section>

          {/* Seção 3 - Como Funciona */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 font-bold">3</span>
              </div>
              <h2 className="text-2xl font-bold text-foreground">Como Funciona Nosso Serviço</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-card border-l-4 border-blue-500 rounded-lg p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">1</span>
                  </div>
                  <h3 className="font-semibold text-foreground">Você Solicita</h3>
                </div>
                <p className="text-sm text-muted-foreground">Escolhe a certidão e preenche o formulário</p>
              </div>
              <div className="bg-card border-l-4 border-green-500 rounded-lg p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <span className="text-green-600 dark:text-green-400 font-bold text-sm">2</span>
                  </div>
                  <h3 className="font-semibold text-foreground">Pagamento</h3>
                </div>
                <p className="text-sm text-muted-foreground">Via PIX com confirmação instantânea</p>
              </div>
              <div className="bg-card border-l-4 border-orange-500 rounded-lg p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <span className="text-orange-600 dark:text-orange-400 font-bold text-sm">3</span>
                  </div>
                  <h3 className="font-semibold text-foreground">Nós Buscamos</h3>
                </div>
                <p className="text-sm text-muted-foreground">Fazemos a busca por você</p>
              </div>
              <div className="bg-card border-l-4 border-purple-500 rounded-lg p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <span className="text-purple-600 dark:text-purple-400 font-bold text-sm">4</span>
                  </div>
                  <h3 className="font-semibold text-foreground">Você Recebe</h3>
                </div>
                <p className="text-sm text-muted-foreground">Certidão pronta por e-mail</p>
              </div>
            </div>
          </section>

          {/* Certidões Disponíveis */}
          <div className="mb-10">
            <h3 className="font-semibold text-foreground mb-4">Certidões Disponíveis:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>Certidão de Quitação Eleitoral</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>Certidão de Antecedentes Criminais</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>Certidão Negativa de Débitos Federais</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>Certidão Negativa de Débitos Trabalhistas</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>Certidão Negativa Criminal</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>Certidão Negativa Cível</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>Certidão de CPF Regularidade</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>Certidões de Registro Civil (Nascimento, Casamento, Óbito)</span>
              </div>
            </div>
            <div className="mt-4 bg-yellow-50 dark:bg-yellow-950/20 border-l-4 border-yellow-500 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Importante:</strong> As fontes emissoras emitem as certidões. Nosso trabalho é buscar e entregar o documento pronto para você.
                </p>
              </div>
            </div>
          </div>

          {/* Seção 4 - Nossas Responsabilidades */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 font-bold">4</span>
              </div>
              <h2 className="text-2xl font-bold text-foreground">Nossas Responsabilidades e Limitações</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-green-50 dark:bg-green-950/20 border-l-4 border-green-500 rounded-lg p-5">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <h3 className="font-bold text-green-900 dark:text-green-100">Pelo que somos responsáveis:</h3>
                </div>
                <ul className="space-y-2 text-green-800 dark:text-green-200 text-sm ml-7">
                  <li>• Buscar as certidões solicitadas</li>
                  <li>• Acompanhar o processo até a obtenção</li>
                  <li>• Entregar o documento pronto por e-mail</li>
                  <li>• Manter você informado sobre o andamento</li>
                </ul>
              </div>
              <div className="bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 rounded-lg p-5">
                <div className="flex items-center gap-2 mb-3">
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <h3 className="font-bold text-red-900 dark:text-red-100">Pelo que NÃO somos responsáveis:</h3>
                </div>
                <ul className="space-y-2 text-red-800 dark:text-red-200 text-sm ml-7">
                  <li>• Conteúdo das certidões (emitidas pelas fontes emissoras)</li>
                  <li>• Prazo de emissão</li>
                  <li>• Indisponibilidade de sistemas</li>
                  <li>• Erros ou inconsistências nas certidões</li>
                  <li>• Taxas cobradas pelas fontes emissoras</li>
                  <li>• Impossibilidade de emissão por pendências</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Seção 5 - Cadastro e Seus Dados */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 font-bold">5</span>
              </div>
              <h2 className="text-2xl font-bold text-foreground">Cadastro e Seus Dados</h2>
            </div>
            <p className="text-foreground mb-4">
              Ao fazer um pedido, você é cadastrado automaticamente. Enviamos por e-mail o acesso ao seu painel onde pode acompanhar os pedidos e fazer download das certidões.
            </p>
            <div className="bg-yellow-50 dark:bg-yellow-950/20 border-l-4 border-yellow-500 rounded-lg p-5 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                <h3 className="font-bold text-yellow-900 dark:text-yellow-100">Suas Responsabilidades:</h3>
              </div>
              <ul className="space-y-2 text-yellow-800 dark:text-yellow-200 text-sm ml-7">
                <li>• Fornecer dados <strong>verdadeiros e corretos</strong></li>
                <li>• Manter e-mail atualizado</li>
                <li>• Verificar a caixa de spam</li>
                <li>• Não compartilhar suas credenciais</li>
              </ul>
            </div>
            <p className="text-foreground text-sm">
              Dados incorretos podem causar erros nas certidões ou impossibilidade de obtenção. Você é responsável pelas informações fornecidas.
            </p>
          </section>

          {/* Seção 6 - Pagamentos e Valores */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 font-bold">6</span>
              </div>
              <h2 className="text-2xl font-bold text-foreground">Pagamentos e Valores</h2>
            </div>
            <div className="bg-green-50 dark:bg-green-950/20 border-l-4 border-green-500 rounded-lg p-5 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h3 className="font-bold text-green-900 dark:text-green-100">Como Pagar</h3>
              </div>
              <p className="text-green-800 dark:text-green-200 text-sm">
                Aceitamos apenas PIX. Confirmação automática e instantânea. Começamos o processo assim que o pagamento é confirmado.
              </p>
            </div>
            <div className="mb-4">
              <h3 className="font-semibold text-foreground mb-2">O que está incluso no valor:</h3>
              <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                <li>• Nosso serviço de busca</li>
                <li>• Processo de solicitação</li>
                <li>• Acompanhamento</li>
                <li>• Entrega por e-mail e no painel</li>
              </ul>
            </div>
            <div className="mb-4">
              <h3 className="font-semibold text-foreground mb-2">O que pode ter custo extra:</h3>
              <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                <li>• Taxas das fontes emissoras (quando aplicável)</li>
                <li>• Autenticações (se necessário)</li>
                <li>• Envio postal (se solicitado)</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-2 ml-4">
                Você será informado antes se houver custos adicionais.
              </p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/20 border-l-4 border-blue-500 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-bold text-blue-900 dark:text-blue-100">Política de Reembolso</h3>
              </div>
              <div className="mb-3">
                <p className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Reembolso APENAS em caso de erro técnico na emissão:</p>
                <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200 ml-4">
                  <li>• Falha técnica do nosso sistema</li>
                  <li>• Erro comprovado no processamento</li>
                  <li>• Impossibilidade técnica de emissão</li>
                </ul>
              </div>
              <div className="mb-3">
                <p className="font-semibold text-blue-900 dark:text-blue-100 mb-2">NÃO há reembolso quando:</p>
                <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200 ml-4">
                  <li>• O documento já foi emitido pelo sistema</li>
                  <li>• O processamento já foi concluído</li>
                  <li>• Mudança de ideia após emissão</li>
                  <li>• Dados incorretos fornecidos pelo cliente</li>
                </ul>
              </div>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Prazo para solicitar:</strong> até 7 dias via e-mail contato@centraldascertidoes.com
              </p>
            </div>
          </section>

          {/* Seção 7 - Como Você Recebe */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 font-bold">7</span>
              </div>
              <h2 className="text-2xl font-bold text-foreground">Como Você Recebe</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 dark:bg-blue-950/20 border-l-4 border-blue-500 rounded-lg p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">Por E-mail</h3>
                </div>
                <p className="text-sm text-blue-800 dark:text-blue-200">Enviamos assim que a certidão ficar pronta</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-950/20 border-l-4 border-purple-500 rounded-lg p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <h3 className="font-semibold text-purple-900 dark:text-purple-100">No Painel</h3>
                </div>
                <p className="text-sm text-purple-800 dark:text-purple-200">Acesse e baixe quando quiser</p>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-950/20 border-l-4 border-yellow-500 rounded-lg p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">Prazo</h3>
                </div>
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Depende do tipo de certidão. Trabalhamos para ser o mais rápido possível, mas não controlamos o prazo das fontes emissoras. Acompanhe o status no seu painel.
                </p>
              </div>
            </div>
          </section>

          {/* Seção 8 - Uso Adequado */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 font-bold">8</span>
              </div>
              <h2 className="text-2xl font-bold text-foreground">Uso Adequado dos Serviços</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 dark:bg-green-950/20 border-l-4 border-green-500 rounded-lg p-5">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <h3 className="font-bold text-green-900 dark:text-green-100">Permitido:</h3>
                </div>
                <ul className="space-y-2 text-green-800 dark:text-green-200 text-sm ml-7">
                  <li>• Solicitar certidões para uso legal</li>
                  <li>• Fornecer dados verdadeiros</li>
                  <li>• Usar para fins pessoais ou profissionais</li>
                </ul>
              </div>
              <div className="bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 rounded-lg p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Ban className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <h3 className="font-bold text-red-900 dark:text-red-100">Proibido:</h3>
                </div>
                <ul className="space-y-2 text-red-800 dark:text-red-200 text-sm ml-7">
                  <li>• Fornecer dados falsos</li>
                  <li>• Usar identidade de terceiros</li>
                  <li>• Atividades ilegais ou fraudulentas</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Seção 9 - Propriedade Intelectual */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 font-bold">9</span>
              </div>
              <h2 className="text-2xl font-bold text-foreground">Propriedade Intelectual</h2>
            </div>
            <p className="text-foreground">
              Todo o conteúdo do site (textos, imagens, logotipos, etc.) é de propriedade do Guia das Certidões Brasil e está protegido por direitos autorais.
            </p>
          </section>

          <hr className="border-border my-8" />

          {/* Seção 10 - Lei e Foro */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 font-bold">10</span>
              </div>
              <h2 className="text-2xl font-bold text-foreground">Lei e Foro</h2>
            </div>
            <p className="text-foreground">
              Estes termos seguem as leis brasileiras. Fica eleito o foro da comarca de São Paulo/SP para resolver questões relacionadas.
            </p>
          </section>

          <hr className="border-border my-8" />

          {/* Seção 11 - Alterações */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 font-bold">11</span>
              </div>
              <h2 className="text-2xl font-bold text-foreground">Alterações</h2>
            </div>
            <p className="text-foreground">
              Podemos atualizar estes termos a qualquer momento. A data da última atualização fica no topo desta página. Recomendamos que você revise periodicamente.
            </p>
          </section>

          <hr className="border-border my-8" />

          {/* Seção 12 - Contato */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 font-bold">12</span>
              </div>
              <h2 className="text-2xl font-bold text-foreground">Contato</h2>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/20 border-l-4 border-blue-500 rounded-lg p-5">
              <p className="text-blue-900 dark:text-blue-100 mb-2">Dúvidas sobre estes termos? Entre em contato:</p>
              <p className="text-blue-800 dark:text-blue-200 mb-1"><strong>E-mail:</strong> contato@centraldascertidoes.com</p>
              <p className="text-blue-800 dark:text-blue-200"><strong>Atendimento:</strong> Segunda a Sexta, 08h às 17h30</p>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TermosUso;
