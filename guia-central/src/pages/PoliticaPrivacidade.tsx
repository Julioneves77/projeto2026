import Header from "@/components/Header";
import Footer from "@/components/Footer";

const PoliticaPrivacidade = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="font-heading text-3xl font-bold text-foreground mb-2">Política de Privacidade</h1>
        <p className="text-primary font-medium text-sm mb-2">Em conformidade com a Lei Geral de Proteção de Dados (LGPD)</p>
        <p className="text-muted-foreground text-sm mb-8"><strong className="text-foreground">Última atualização:</strong> Fevereiro de 2026</p>

        <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">1. Identificação do Controlador</h2>
            <p><strong className="text-foreground">Razão Social:</strong> Guia Central Ltda.</p>
            <p><strong className="text-foreground">Controlador de Dados:</strong> Responsável pelo tratamento dos dados pessoais</p>
            <p><strong className="text-foreground">E-mail para questões de privacidade:</strong> contato@guia-central.online</p>
            <p><strong className="text-foreground">Atividade:</strong> Plataforma de automação documental com inteligência artificial</p>
            <p className="mt-2">Somos uma plataforma privada de tecnologia que utiliza IA para orientar usuários e automatizar o processamento de documentos digitais. Após o pagamento, nosso sistema automatiza todo o processo e realiza a entrega por email e painel do cliente.</p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">2. Dados Pessoais Coletados</h2>
            <h3 className="font-semibold text-foreground mt-4 mb-2">📋 Dados Fornecidos Diretamente</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-foreground">Dados de identificação:</strong> Nome completo, CPF, RG, órgão emissor</li>
              <li><strong className="text-foreground">Dados de contato:</strong> E-mail, telefone, WhatsApp</li>
              <li><strong className="text-foreground">Dados de localização:</strong> Endereço residencial completo</li>
              <li><strong className="text-foreground">Dados de filiação:</strong> Nome do pai e da mãe</li>
              <li><strong className="text-foreground">Dados de nascimento:</strong> Data e local de nascimento</li>
              <li><strong className="text-foreground">Dados específicos:</strong> Conforme o tipo de certidão solicitada</li>
            </ul>
            <h3 className="font-semibold text-foreground mt-4 mb-2">🔍 Dados Coletados Automaticamente</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-foreground">Dados técnicos:</strong> Endereço IP, navegador, dispositivo</li>
              <li><strong className="text-foreground">Dados de navegação:</strong> Páginas visitadas, tempo de acesso</li>
              <li><strong className="text-foreground">Dados de localização:</strong> Geolocalização aproximada (quando autorizada)</li>
              <li><strong className="text-foreground">Cookies e rastreadores:</strong> Para análise e melhoria da experiência</li>
              <li><strong className="text-foreground">Dados de transação:</strong> Informações sobre pagamentos (tokenizadas)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">3. Base Legal e Finalidades do Tratamento</h2>
            <h3 className="font-semibold text-foreground mt-4 mb-2">⚖️ Execução de Contrato (Art. 7º, V da LGPD)</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Processar automaticamente documentos digitais via sistema com IA</li>
              <li>Verificar dados para processamento automatizado</li>
              <li>Executar a venda de serviços de automação documental</li>
              <li>Processar pagamentos PIX e emitir comprovantes</li>
              <li>Fornecer suporte técnico sobre o sistema e processamento</li>
              <li>Entregar automaticamente os documentos após confirmação de pagamento</li>
            </ul>
            <h3 className="font-semibold text-foreground mt-4 mb-2">📜 Cumprimento de Obrigação Legal (Art. 7º, II da LGPD)</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Manter registros de transações para auditoria fiscal</li>
              <li>Cumprir obrigações fiscais e trabalhistas</li>
              <li>Responder a determinações judiciais</li>
              <li>Atender requisitos de proteção ao consumidor</li>
            </ul>
            <h3 className="font-semibold text-foreground mt-4 mb-2">🎯 Legítimo Interesse (Art. 7º, IX da LGPD)</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Prevenção à fraude e segurança de transações</li>
              <li>Melhoria da plataforma e experiência do usuário</li>
              <li>Comunicação sobre atualizações de processamento</li>
              <li>Análise de dados para otimização do sistema de IA</li>
              <li>Suporte técnico personalizado</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">4. Compartilhamento e Transferência de Dados</h2>
            <div className="bg-secondary/50 rounded-xl p-4 mb-4">
              <p className="font-semibold text-foreground">🚫 Política de Não Venda</p>
              <p className="mt-1"><strong className="text-foreground">Jamais vendemos, alugamos ou comercializamos seus dados pessoais</strong> para terceiros para fins de marketing, publicidade ou qualquer finalidade comercial externa.</p>
            </div>
            <h3 className="font-semibold text-foreground mb-2">Compartilhamento Necessário e Autorizado:</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong className="text-foreground">🏛️ Órgãos Públicos:</strong> Tribunais, Receita Federal, Polícia Federal, TSE, e demais órgãos emissores das certidões solicitadas.</li>
              <li><strong className="text-foreground">💳 Processadores de Pagamento:</strong> Empresas para processamento seguro de transações financeiras via PIX.</li>
              <li><strong className="text-foreground">📧 Prestadores de Serviço:</strong> Serviços de e-mail, hospedagem em nuvem (todos com contratos de proteção de dados).</li>
              <li><strong className="text-foreground">⚖️ Determinação Legal:</strong> Quando exigido por lei, ordem judicial ou para proteção de direitos legítimos.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">5. Medidas de Segurança e Proteção</h2>
            <h3 className="font-semibold text-foreground mt-4 mb-2">🔒 Proteção Técnica</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Criptografia SSL/TLS 256-bits em toda comunicação</li>
              <li>Armazenamento em servidores seguros com certificação</li>
              <li>Backups automáticos criptografados diários</li>
              <li>Monitoramento 24/7 de segurança e intrusões</li>
              <li>Firewall avançado e proteção DDoS</li>
            </ul>
            <h3 className="font-semibold text-foreground mt-4 mb-2">👥 Proteção Organizacional</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Acesso restrito por função e necessidade</li>
              <li>Treinamento regular em proteção de dados</li>
              <li>Contratos de confidencialidade rigorosos</li>
              <li>Auditoria interna periódica de processos</li>
              <li>Política de senhas forte e autenticação dupla</li>
            </ul>
            <p className="mt-3 text-xs bg-accent/10 rounded-lg p-3"><strong className="text-foreground">⚠️ Importante:</strong> Apesar de todas as medidas de segurança, nenhum sistema é 100% seguro. Em caso de incidente de segurança, notificaremos imediatamente as autoridades e os titulares afetados conforme exigido pela LGPD.</p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">6. Seus Direitos como Titular dos Dados</h2>
            <p className="mb-3">A LGPD garante diversos direitos fundamentais sobre seus dados pessoais:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { icon: "📋", title: "Confirmação de Tratamento", desc: "Saber se tratamos seus dados e quais são" },
                { icon: "👁️", title: "Acesso aos Dados", desc: "Visualizar todos os seus dados que possuímos" },
                { icon: "✏️", title: "Correção", desc: "Corrigir dados incompletos, inexatos ou desatualizados" },
                { icon: "🗑️", title: "Eliminação", desc: "Excluir dados desnecessários ou tratados inadequadamente" },
                { icon: "📦", title: "Portabilidade", desc: "Receber seus dados em formato estruturado e interoperável" },
                { icon: "🚫", title: "Oposição", desc: "Se opor ao tratamento realizado com base em legítimo interesse" },
                { icon: "🔒", title: "Anonimização", desc: "Solicitar anonimização de dados desnecessários" },
                { icon: "❌", title: "Revogação", desc: "Retirar consentimento quando aplicável" },
              ].map((item) => (
                <div key={item.title} className="bg-card border border-border rounded-lg p-3">
                  <p className="font-semibold text-foreground text-xs">{item.icon} {item.title}</p>
                  <p className="text-xs mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 bg-secondary/50 rounded-xl p-4">
              <p className="font-semibold text-foreground text-sm mb-2">📞 Como Exercer Seus Direitos</p>
              <p><strong className="text-foreground">E-mail:</strong> contato@guia-central.online</p>
              <p><strong className="text-foreground">Prazo de resposta:</strong> Até 15 dias úteis</p>
              <p><strong className="text-foreground">Sem custo:</strong> O exercício dos direitos é gratuito</p>
            </div>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">7. Tempo de Retenção dos Dados</h2>
            <p className="mb-3">Mantemos seus dados apenas pelo tempo necessário para cumprir as finalidades específicas ou conforme exigido por lei.</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong className="text-foreground">Dados de Pedidos Ativos:</strong> Mantidos durante a execução do serviço e até 90 dias após conclusão para suporte.</li>
              <li><strong className="text-foreground">Registros de Certidões:</strong> Mantidos por 5 anos conforme regulamentação.</li>
              <li><strong className="text-foreground">Dados Fiscais:</strong> Mantidos por 10 anos conforme legislação tributária brasileira.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">8. Processo de Entrega e Pagamento</h2>
            <h3 className="font-semibold text-foreground mt-4 mb-2">📧 Entrega das Certidões</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-card border border-border rounded-lg p-3">
                <p className="font-semibold text-foreground text-xs mb-2">📨 Por E-mail</p>
                <ul className="list-disc pl-4 space-y-1 text-xs">
                  <li>Envio automático após emissão</li>
                  <li>Arquivo em formato PDF original</li>
                  <li>E-mail de confirmação de entrega</li>
                  <li>Backup automático na sua conta</li>
                </ul>
              </div>
              <div className="bg-card border border-border rounded-lg p-3">
                <p className="font-semibold text-foreground text-xs mb-2">👤 Área do Cliente</p>
                <ul className="list-disc pl-4 space-y-1 text-xs">
                  <li>Acesso permanente às suas certidões</li>
                  <li>Histórico completo de pedidos</li>
                  <li>Download ilimitado</li>
                  <li>Área segura e criptografada</li>
                </ul>
              </div>
            </div>
            <h3 className="font-semibold text-foreground mt-4 mb-2">💳 Processo de Pagamento</h3>
            <div className="bg-secondary/50 rounded-xl p-4">
              <p className="font-semibold text-foreground text-sm mb-2">🔒 Método Aceito: PIX</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong className="text-foreground">Único meio de pagamento:</strong> Aceitamos exclusivamente PIX</li>
                <li><strong className="text-foreground">Processamento instantâneo:</strong> 24 horas por dia, 7 dias por semana</li>
                <li><strong className="text-foreground">Segurança máxima:</strong> Sistema do Banco Central do Brasil</li>
                <li><strong className="text-foreground">Sem taxas adicionais:</strong> Valor transparente e fixo</li>
              </ul>
              <p className="mt-3 text-xs"><strong className="text-foreground">🔐 Proteção dos Dados de Pagamento:</strong> Não armazenamos dados bancários. Utilizamos provedores de pagamento certificados que seguem os mais altos padrões de segurança.</p>
            </div>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">9. Dados de Crianças e Adolescentes</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-foreground">Menores de 18 anos:</strong> Necessário consentimento dos pais ou responsáveis legais</li>
              <li><strong className="text-foreground">Finalidade limitada:</strong> Apenas para emissão das certidões solicitadas pelos responsáveis</li>
              <li><strong className="text-foreground">Segurança reforçada:</strong> Medidas adicionais de proteção para dados de menores</li>
              <li><strong className="text-foreground">Direitos ampliados:</strong> Pais podem exercer todos os direitos em nome dos filhos</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">10. Cookies e Tecnologias Similares</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-card border border-border rounded-lg p-3">
                <p className="font-semibold text-foreground text-xs">✅ Cookies Essenciais</p>
                <p className="text-xs mt-1">Necessários para funcionamento básico do site (segurança, navegação).</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-3">
                <p className="font-semibold text-foreground text-xs">📊 Cookies Analíticos</p>
                <p className="text-xs mt-1">Para entender como você usa nosso site e melhorar a experiência.</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-3">
                <p className="font-semibold text-foreground text-xs">🎯 Cookies Funcionais</p>
                <p className="text-xs mt-1">Para lembrar suas preferências e personalizar sua experiência.</p>
              </div>
            </div>
            <p className="mt-3">Você pode gerenciar cookies através das configurações do seu navegador ou do nosso banner de cookies.</p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">11. Transferência Internacional de Dados</h2>
            <p><strong className="text-foreground">🌍 Dados Armazenados no Brasil:</strong> Seus dados são prioritariamente armazenados em servidores localizados no Brasil.</p>
            <p className="mt-2"><strong className="text-foreground">Exceções com Proteção:</strong> Alguns serviços técnicos podem usar provedores internacionais com adequado nível de proteção:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Serviços de e-mail e comunicação (com criptografia end-to-end)</li>
              <li>Backup e recuperação de desastres (dados criptografados)</li>
              <li>Apenas com empresas certificadas e contratos específicos de proteção</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">12. Alterações nesta Política</h2>
            <p>Esta Política de Privacidade pode ser atualizada periodicamente para refletir mudanças em nossas práticas, serviços ou requisitos legais.</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong className="text-foreground">Mudanças menores:</strong> Atualização da data e publicação no site</li>
              <li><strong className="text-foreground">Mudanças significativas:</strong> Notificação por e-mail com 30 dias de antecedência</li>
              <li><strong className="text-foreground">Mudanças que afetam direitos:</strong> Solicitação de novo consentimento quando necessário</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">13. Contato e Encarregado de Dados (DPO)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-secondary/50 rounded-xl p-4">
                <p className="font-semibold text-foreground text-sm mb-2">📧 Contato para Privacidade</p>
                <p><strong className="text-foreground">E-mail:</strong> privacidade@guia-central.online</p>
                <p><strong className="text-foreground">Assunto:</strong> [LGPD] - Sua solicitação</p>
                <p><strong className="text-foreground">Prazo:</strong> Até 15 dias úteis</p>
              </div>
              <div className="bg-secondary/50 rounded-xl p-4">
                <p className="font-semibold text-foreground text-sm mb-2">🛡️ Contato Geral</p>
                <p><strong className="text-foreground">E-mail:</strong> contato@guia-central.online</p>
                <p><strong className="text-foreground">Site:</strong> www.guia-central.online</p>
                <p><strong className="text-foreground">Disponível:</strong> 7 dias por semana</p>
              </div>
            </div>
          </section>

        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PoliticaPrivacidade;
