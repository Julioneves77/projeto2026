/**
 * Serviço de Envio de Email via SendPulse API
 * Usa a biblioteca oficial sendpulse-api
 */

const sendpulse = require('sendpulse-api');
const path = require('path');
const fs = require('fs');

// Diretório temporário para armazenar tokens
const TOKEN_STORAGE = path.join(__dirname, '../tmp');
if (!fs.existsSync(TOKEN_STORAGE)) {
  fs.mkdirSync(TOKEN_STORAGE, { recursive: true });
}

let isInitialized = false;
let initPromise = null;

/**
 * Inicializa a biblioteca SendPulse
 */
function initializeSendPulse() {
  if (isInitialized) {
    return Promise.resolve();
  }

  if (initPromise) {
    return initPromise;
  }

  const clientId = process.env.SENDPULSE_CLIENT_ID;
  const clientSecret = process.env.SENDPULSE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    const error = new Error('SendPulse credentials não configuradas. Verifique SENDPULSE_CLIENT_ID e SENDPULSE_CLIENT_SECRET no .env');
    initPromise = Promise.reject(error);
    return initPromise;
  }

  initPromise = new Promise((resolve, reject) => {
    console.log('🔐 [SendPulse] Inicializando biblioteca oficial...');
    sendpulse.init(clientId, clientSecret, TOKEN_STORAGE, (token) => {
      if (token && token.is_error) {
        console.error('❌ [SendPulse] Erro na inicialização:', token);
        isInitialized = false;
        initPromise = null;
        reject(new Error(`Falha na inicialização SendPulse: ${token.message || 'Erro desconhecido'}`));
        return;
      }
      console.log('✅ [SendPulse] Biblioteca inicializada com sucesso');
      isInitialized = true;
      resolve();
    });
  });

  return initPromise;
}

/**
 * Obtém remetente (email e nome) baseado no domínio de origem do ticket
 */
function getSenderByDomain(dominio) {
  // Normalizar domínio (remover www. se presente e converter para lowercase)
  const normalizedDomain = dominio?.replace(/^www\./, '').toLowerCase();
  
  const domainMap = {
    'suporteonline.digital': {
      // IMPORTANTE: Usar email verificado do SendPulse (fallback seguro)
      // Se SUPORTE_SENDER_EMAIL não estiver configurado ou não verificado, usar SENDPULSE_SENDER_EMAIL
      email: process.env.SUPORTE_SENDER_EMAIL || process.env.SENDPULSE_SENDER_EMAIL || 'contato@suporteonline.digital',
      name: process.env.SUPORTE_SENDER_NAME || 'Suporte Online',
      website: 'www.suporteonline.digital',
      websiteUrl: 'https://www.suporteonline.digital'
    },
    'portalcertidao.org': {
      email: process.env.SENDPULSE_SENDER_EMAIL || 'contato@portalcertidao.org',
      name: process.env.SENDPULSE_SENDER_NAME || 'Portal Certidão',
      website: 'www.portalcertidao.org',
      websiteUrl: 'https://www.portalcertidao.org'
    },
    // Compatibilidade: tickets antigos do PORTAL usavam portalcertidao.com.br
    'portalcertidao.com.br': {
      email: process.env.SENDPULSE_SENDER_EMAIL || 'contato@portalcertidao.org',
      name: process.env.SENDPULSE_SENDER_NAME || 'Portal Certidão',
      website: 'www.portalcertidao.org',
      websiteUrl: 'https://www.portalcertidao.org'
    },
    'centraldascertidoes.com': {
      email: process.env.GUIA_SENDER_EMAIL || process.env.SENDPULSE_SENDER_EMAIL || 'contato@centraldascertidoes.com',
      name: process.env.GUIA_SENDER_NAME || 'Guia das Certidões',
      website: 'www.centraldascertidoes.com',
      websiteUrl: 'https://www.centraldascertidoes.com'
    },
    'guia-central.online': {
      email: process.env.GUIA_CENTRAL_SENDER_EMAIL || process.env.SENDPULSE_SENDER_EMAIL || 'contato@guia-central.online',
      name: process.env.GUIA_CENTRAL_SENDER_NAME || 'Guia Central',
      website: 'www.guia-central.online',
      websiteUrl: 'https://www.guia-central.online'
    }
  };
  
  return domainMap[normalizedDomain] || {
    email: process.env.SUPORTE_SENDER_EMAIL || process.env.SENDPULSE_SENDER_EMAIL || 'contato@suporteonline.digital',
    name: process.env.SUPORTE_SENDER_NAME || 'Suporte Online',
    website: 'www.suporteonline.digital',
    websiteUrl: 'https://www.suporteonline.digital'
  };
}

// Cores e estilo Guia Central (hsl 215 90% 50% = #2563eb, hsl 185 80% 45% = #0d9488)
const GUIA_CENTRAL_STYLE = {
  primary: '#2563eb',
  primaryLight: '#3b82f6',
  cyan: '#0d9488',
  bg: '#f8fafc',
  cardBg: '#ffffff',
  text: '#1e293b',
  textMuted: '#64748b',
  border: '#e2e8f0'
};

function isGuiaCentral(domainInfo) {
  const d = (domainInfo?.website || '').toLowerCase();
  return d.includes('guia-central');
}

/**
 * Cria template HTML para email de confirmação de pagamento
 * Usa formatação Guia Central quando domínio for guia-central.online
 */
function createEmailTemplate(ticketData, domainInfo) {
  const { nomeCompleto, codigo, tipoCertidao } = ticketData;
  const isGC = isGuiaCentral(domainInfo);
  const s = isGC ? GUIA_CENTRAL_STYLE : { primary: '#28a745', primaryLight: '#28a745', cyan: '#007bff', bg: '#f8f9fa', cardBg: '#fff', text: '#333', textMuted: '#666', border: '#ddd' };

  const prazoEntrega = 'Depende da Comarca mas maioria até 2 horas';
  const tipoCertidaoNome = {
    'criminal-federal': 'Certidão Criminal Federal',
    'criminal-estadual': 'Certidão Criminal Estadual',
    'antecedentes-pf': 'Antecedentes Criminais',
    'eleitoral': 'Certidão de Quitação Eleitoral',
    'civil-federal': 'Certidão Cível Federal',
    'civil-estadual': 'Certidão Cível Estadual',
    'cnd': 'Certidão Negativa de Débitos (CND)',
    'cpf-regular': 'Certidão de CPF Regular',
    'Certidão de Quitação Eleitoral': 'Certidão de Quitação Eleitoral',
    'Antecedentes Criminais (Polícia Federal)': 'Antecedentes Criminais',
    'Antecedentes Criminais': 'Antecedentes Criminais',
    'Certidão Criminal Federal': 'Certidão Criminal Federal',
    'Certidão Criminal Estadual': 'Certidão Criminal Estadual',
    'Certidão Cível Federal': 'Certidão Cível Federal',
    'Certidão Cível Estadual': 'Certidão Cível Estadual',
    'Certidão Negativa de Débitos (CND)': 'Certidão Negativa de Débitos (CND)',
    'Certidão de CPF Regular': 'Certidão de CPF Regular',
    'Certidão de Débito Trabalhista': 'Certidão de Débito Trabalhista',
    'CCIR - Cadastro de Imóvel Rural': 'CCIR - Cadastro de Imóvel Rural'
  }[tipoCertidao] || tipoCertidao;

  const headerHtml = isGC ? `
    <div style="background: linear-gradient(135deg, ${s.primary} 0%, ${s.cyan} 100%); padding: 24px 20px; border-radius: 12px 12px 0 0; text-align: center;">
      <span style="font-family: 'Segoe UI', system-ui, sans-serif; font-weight: 700; font-size: 18px; letter-spacing: 0.1em; color: #fff;">GUIA <span style="color: rgba(255,255,255,0.95);">CENTRAL</span></span>
      <p style="margin: 8px 0 0 0; font-size: 11px; color: rgba(255,255,255,0.85); letter-spacing: 0.15em; text-transform: uppercase;">Automação por IA</p>
    </div>
  ` : '';

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmação de Pagamento</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: ${s.text}; max-width: 600px; margin: 0 auto; padding: 20px; background: ${s.bg};">
  <div style="background: ${s.cardBg}; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">
    ${headerHtml}
    <div style="padding: 24px 20px;">
      <h1 style="color: ${s.primary}; margin: 0 0 16px 0; font-size: 22px; font-weight: 700;">Pagamento Confirmado!</h1>
      <p style="margin: 0 0 16px 0;">Olá <strong>${nomeCompleto}</strong>,</p>
      <p style="margin: 0 0 20px 0;">Seu pagamento foi confirmado com sucesso. Seu pedido está sendo processado.</p>
      <div style="background: ${s.bg}; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${s.primary};">
        <h2 style="margin: 0 0 12px 0; color: ${s.text}; font-size: 16px; font-weight: 600;">Detalhes do Pedido</h2>
        <p style="margin: 6px 0;"><strong>Código:</strong> ${codigo}</p>
        <p style="margin: 6px 0;"><strong>Tipo de Certidão:</strong> ${tipoCertidaoNome}</p>
        <p style="margin: 6px 0;"><strong>Prazo de Entrega:</strong> ${prazoEntrega}</p>
        <p style="margin: 6px 0;"><strong>Status:</strong> Em Processamento</p>
      </div>
      <p style="margin: 20px 0;">Você receberá sua certidão por e-mail assim que estiver pronta.</p>
      <p style="margin: 0;">Dúvidas: <a href="${domainInfo.websiteUrl}" style="color: ${s.primary}; text-decoration: none; font-weight: 500;">${domainInfo.website}</a></p>
    </div>
    <div style="padding: 16px 20px; background: ${s.bg}; border-top: 1px solid ${s.border};">
      <p style="font-size: 12px; color: ${s.textMuted}; margin: 0;">
        Este é um e-mail automático. Por favor não responda.<br>
        ${domainInfo.name} — Todos os direitos reservados.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Envia email de confirmação de pagamento via SendPulse
 * Usa a biblioteca oficial sendpulse-api
 */
async function sendConfirmationEmail(ticketData) {
  try {
    console.log('📧 [SendPulse] Iniciando envio de email de confirmação...');
    console.log('📧 [SendPulse] Dados do ticket:', {
      codigo: ticketData.codigo,
      email: ticketData.email,
      dominio: ticketData.dominio,
      dadosFormulario: ticketData.dadosFormulario
    });

    // Inicializar biblioteca se necessário
    await initializeSendPulse();

    const { email, nomeCompleto, codigo } = ticketData;

    if (!email) {
      console.error('❌ [SendPulse] Email do cliente não fornecido');
      throw new Error('Email do cliente não fornecido');
    }

    // Obter domínio de origem do ticket
    // Normalizar domínio: remover www. se presente e garantir formato correto
    let dominio = ticketData.dominio || ticketData.dadosFormulario?.origem || 'suporteonline.digital';
    
    // Normalizar: remover www. e converter para lowercase
    dominio = dominio.replace(/^www\./i, '').toLowerCase();
    
    // Se não for um domínio conhecido, usar fallback
    if (dominio !== 'suporteonline.digital' && dominio !== 'portalcertidao.org' && dominio !== 'portalcertidao.com.br' && dominio !== 'centraldascertidoes.com' && dominio !== 'guia-central.online') {
      console.warn(`⚠️ [SendPulse] Domínio desconhecido: ${dominio}, usando fallback suporteonline.digital`);
      dominio = 'suporteonline.digital';
    }
    
    console.log('📧 [SendPulse] Domínio detectado:', dominio);
    
    const domainInfo = getSenderByDomain(dominio);
    
    console.log('📧 [SendPulse] Informações do domínio:', {
      email: domainInfo.email,
      name: domainInfo.name,
      website: domainInfo.website,
      websiteUrl: domainInfo.websiteUrl
    });
    
    // Usar remetente dinâmico baseado no domínio
    const senderEmail = domainInfo.email;
    const senderName = domainInfo.name;

    // Criar template HTML com informações do domínio
    const htmlContent = createEmailTemplate(ticketData, domainInfo);
    const textContent = `
Pagamento Confirmado!

Olá ${nomeCompleto},

Seu pagamento foi confirmado com sucesso. Seu pedido está sendo processado.

Código do Ticket: ${codigo}
Prazo de Entrega: Depende da Comarca mas maioria até 2 horas
Status: Em Processamento

Você vai receber sua Solicitação por Email assim que estiver Pronta.

Dúvidas acesse: ${domainInfo.website}

${domainInfo.name}
    `.trim();

    console.log(`📧 [SendPulse] Preparando envio de email:`);
    console.log(`   Destinatário: ${email}`);
    console.log(`   Ticket: ${codigo}`);
    console.log(`   Remetente: ${senderEmail} (${senderName})`);
    console.log(`   Website no email: ${domainInfo.website}`);
    console.log(`   URL no email: ${domainInfo.websiteUrl}`);

    // Estrutura do email conforme documentação oficial do SendPulse
    // SendPulse requer: subject, html, text, from {name, email}, to [{email}]
    const emailData = {
      subject: `Confirmação de Pagamento - Ticket ${codigo}`,
      html: htmlContent,
      text: textContent, // OBRIGATÓRIO - SendPulse requer texto plano
      from: {
        name: senderName,
        email: senderEmail // DEVE estar verificado no SendPulse
      },
      to: [
        {
          email: email // Simplificado - apenas email, sem name
        }
      ]
    };

    // Log detalhado do payload antes de enviar
    console.log(`📧 [SendPulse] Payload do email:`, JSON.stringify({
      subject: emailData.subject,
      from: emailData.from,
      to: emailData.to,
      htmlLength: emailData.html?.length || 0,
      textLength: emailData.text?.length || 0
    }, null, 2));

    // Enviar usando a biblioteca oficial
    return new Promise((resolve, reject) => {
      sendpulse.smtpSendMail((response) => {
        // Log completo da resposta para debug
        console.log(`📧 [SendPulse] Resposta completa:`, JSON.stringify(response, null, 2));
        
        // Verificar diferentes formatos de erro do SendPulse
        const hasError = response?.is_error || 
                        response?.error_code || 
                        (response?.error_code && response.error_code !== 200 && response.error_code !== 0) ||
                        (response?.message && (
                          response.message.toLowerCase().includes('not valid') ||
                          response.message.toLowerCase().includes('error') ||
                          response.message.toLowerCase().includes('invalid') ||
                          response.message.toLowerCase().includes('unauthorized') ||
                          response.message.toLowerCase().includes('forbidden') ||
                          response.message.toLowerCase().includes('sender')
                        ));
        
        if (hasError) {
          const errorMessage = response.message || response.error || 'Erro desconhecido ao enviar email';
          const errorCode = response.error_code || response.code || 'N/A';
          
          console.error('❌ [SendPulse] Erro ao enviar email de confirmação:');
          console.error('   Código:', errorCode);
          console.error('   Mensagem:', errorMessage);
          console.error('   Resposta completa:', JSON.stringify(response, null, 2));
          
          let userFriendlyError = errorMessage;
          if (errorMessage.toLowerCase().includes('sender') || 
              errorMessage.toLowerCase().includes('not valid') ||
              errorMessage.toLowerCase().includes('unauthorized')) {
            userFriendlyError = `Email remetente "${senderEmail}" não está verificado no SendPulse. Verifique se o email está verificado na sua conta SendPulse.`;
          } else if (errorMessage.toLowerCase().includes('argument email missing') ||
                     errorMessage.toLowerCase().includes('invalid')) {
            userFriendlyError = 'Estrutura do email inválida. Verifique a configuração.';
          }
          
          resolve({
            success: false,
            error: userFriendlyError,
            email: ticketData.email,
            errorCode: errorCode,
            details: response
          });
        } else {
          console.log(`✅ [SendPulse] Email de confirmação enviado com sucesso para ${email}`);
          console.log(`✅ [SendPulse] Message ID: ${response?.id || response?.result?.id || response?.data?.id || 'N/A'}`);
          resolve({
            success: true,
            messageId: response?.id || response?.result?.id || response?.data?.id || 'N/A',
            email: email,
            response: response
          });
        }
      }, emailData);
    });

  } catch (error) {
    console.error('❌ [SendPulse] Erro ao enviar email:', error);
    return {
      success: false,
      error: error.message || 'Erro desconhecido ao enviar email',
      email: ticketData.email
    };
  }
}

/**
 * Cria template HTML para email de conclusão (certidão pronta)
 * Usa formatação Guia Central quando domínio for guia-central.online
 */
function createCompletionEmailTemplate(ticketData, mensagemInteracao, domainInfo) {
  const { nomeCompleto, codigo, tipoCertidao } = ticketData;
  const isGC = isGuiaCentral(domainInfo);
  const s = isGC ? GUIA_CENTRAL_STYLE : { primary: '#28a745', primaryLight: '#28a745', cyan: '#007bff', bg: '#f8f9fa', cardBg: '#fff', text: '#333', textMuted: '#666', border: '#ddd' };

  const tipoCertidaoNome = {
    'criminal-federal': 'Certidão Criminal Federal',
    'criminal-estadual': 'Certidão Criminal Estadual',
    'antecedentes-pf': 'Antecedentes Criminais',
    'eleitoral': 'Certidão de Quitação Eleitoral',
    'civil-federal': 'Certidão Cível Federal',
    'civil-estadual': 'Certidão Cível Estadual',
    'cnd': 'Certidão Negativa de Débitos (CND)',
    'cpf-regular': 'Certidão de CPF Regular',
    'Certidão de Quitação Eleitoral': 'Certidão de Quitação Eleitoral',
    'Antecedentes Criminais (Polícia Federal)': 'Antecedentes Criminais',
    'Antecedentes Criminais': 'Antecedentes Criminais',
    'Certidão Criminal Federal': 'Certidão Criminal Federal',
    'Certidão Criminal Estadual': 'Certidão Criminal Estadual',
    'Certidão Cível Federal': 'Certidão Cível Federal',
    'Certidão Cível Estadual': 'Certidão Cível Estadual',
    'Certidão Negativa de Débitos (CND)': 'Certidão Negativa de Débitos (CND)',
    'Certidão de CPF Regular': 'Certidão de CPF Regular',
    'Certidão de Débito Trabalhista': 'Certidão de Débito Trabalhista',
    'CCIR - Cadastro de Imóvel Rural': 'CCIR - Cadastro de Imóvel Rural'
  }[tipoCertidao] || tipoCertidao;

  const headerHtml = isGC ? `
    <div style="background: linear-gradient(135deg, ${s.primary} 0%, ${s.cyan} 100%); padding: 24px 20px; border-radius: 12px 12px 0 0; text-align: center;">
      <span style="font-family: 'Segoe UI', system-ui, sans-serif; font-weight: 700; font-size: 18px; letter-spacing: 0.1em; color: #fff;">GUIA <span style="color: rgba(255,255,255,0.95);">CENTRAL</span></span>
      <p style="margin: 8px 0 0 0; font-size: 11px; color: rgba(255,255,255,0.85); letter-spacing: 0.15em; text-transform: uppercase;">Automação por IA</p>
    </div>
  ` : '';

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Certidão Pronta</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: ${s.text}; max-width: 600px; margin: 0 auto; padding: 20px; background: ${s.bg};">
  <div style="background: ${s.cardBg}; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">
    ${headerHtml}
    <div style="padding: 24px 20px;">
      <h1 style="color: ${s.primary}; margin: 0 0 16px 0; font-size: 22px; font-weight: 700;">✅ Certidão Pronta!</h1>
      <p style="margin: 0 0 16px 0;">Olá <strong>${nomeCompleto}</strong>,</p>
      <p style="margin: 0 0 20px 0;">Sua certidão está pronta e disponível em anexo neste e-mail.</p>
      <div style="background: ${s.bg}; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${s.primary};">
        <h2 style="margin: 0 0 12px 0; color: ${s.text}; font-size: 16px; font-weight: 600;">Detalhes da Certidão</h2>
        <p style="margin: 6px 0;"><strong>Código:</strong> ${codigo}</p>
        <p style="margin: 6px 0;"><strong>Tipo:</strong> ${tipoCertidaoNome}</p>
        <p style="margin: 6px 0;"><strong>Status:</strong> Concluída</p>
      </div>
      ${mensagemInteracao ? `
      <div style="background: rgba(37, 99, 235, 0.06); padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${s.cyan};">
        <h3 style="margin: 0 0 8px 0; color: ${s.text}; font-size: 14px; font-weight: 600;">Informações Adicionais</h3>
        <p style="margin: 0; white-space: pre-wrap; font-size: 14px;">${mensagemInteracao}</p>
      </div>
      ` : ''}
      <p style="margin: 20px 0;">O arquivo PDF está disponível em anexo.</p>
      <p style="margin: 0;">Dúvidas: <a href="${domainInfo.websiteUrl}" style="color: ${s.primary}; text-decoration: none; font-weight: 500;">${domainInfo.website}</a></p>
    </div>
    <div style="padding: 16px 20px; background: ${s.bg}; border-top: 1px solid ${s.border};">
      <p style="font-size: 12px; color: ${s.textMuted}; margin: 0;">
        Este é um e-mail automático. Por favor não responda.<br>
        ${domainInfo.name} — Todos os direitos reservados.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Gera nome do arquivo para anexo: Certidao_Tipo_Nome_Usuario.ext
 */
function buildAttachmentFileName(ticketData, originalNome) {
  const sanitize = (s) => (s || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 50) || 'Documento';
  const tipo = sanitize(ticketData.tipoCertidao || 'Certidao');
  const nome = sanitize(ticketData.nomeCompleto || ticketData.nome || 'Cliente');
  const ext = (originalNome && path.extname(originalNome)) || '.pdf';
  return `Certidao_${tipo}_${nome}${ext}`;
}

/**
 * Envia email de conclusão de ticket via SendPulse com anexo
 */
async function sendCompletionEmail(ticketData, mensagemInteracao, anexo) {
  try {
    await initializeSendPulse();

    const { email, nomeCompleto, codigo } = ticketData;

    if (!email) {
      throw new Error('Email do cliente não fornecido');
    }

    // Obter domínio de origem do ticket
    const dominio = ticketData.dominio || ticketData.dadosFormulario?.origem || 'suporteonline.digital';
    const domainInfo = getSenderByDomain(dominio);
    
    // Usar remetente dinâmico baseado no domínio
    const senderEmail = domainInfo.email;
    const senderName = domainInfo.name;

    const htmlContent = createCompletionEmailTemplate(ticketData, mensagemInteracao, domainInfo);
    const textContent = `
Certidão Pronta!

Olá ${nomeCompleto},

Sua certidão está pronta e disponível para download.

Código do Ticket: ${codigo}
Status: Concluída

${mensagemInteracao ? `Informações Adicionais:\n${mensagemInteracao}\n\n` : ''}
Seu arquivo está disponível em anexo neste email.

Dúvidas acesse: ${domainInfo.website}

${domainInfo.name}
    `.trim();

    console.log(`📧 [SendPulse] Enviando email de conclusão para ${email} (Ticket: ${codigo})`);
    if (anexo) {
      console.log(`📎 [SendPulse] Anexo: ${anexo.nome} (${anexo.tipo})`);
      console.log(`📎 [SendPulse] Tamanho base64: ${anexo.base64 ? anexo.base64.length : 0} caracteres`);
    }

    // Estrutura do email conforme documentação oficial do SendPulse
    // SendPulse requer: subject, html, text, from {name, email}, to [{email}]
    const emailData = {
      subject: `Certidão Pronta - Ticket ${codigo}`,
      html: htmlContent,
      text: textContent, // OBRIGATÓRIO - SendPulse requer texto plano
      from: {
        name: senderName,
        email: senderEmail // DEVE estar verificado no SendPulse
      },
      to: [
        {
          email: email // Simplificado - apenas email, sem name
        }
      ]
    };

    // Adicionar anexo se disponível (formato correto para SendPulse)
    // O ARQUIVO É ENVIADO COMO ANEXO REAL, NÃO COMO LINK
    if (anexo && anexo.base64) {
      const fileName = buildAttachmentFileName(ticketData, anexo.nome) || anexo.nome || `certidao-${codigo}.pdf`;
      console.log(`📎 [SendPulse] Preparando ARQUIVO para envio como anexo: ${fileName}`);
      console.log(`📎 [SendPulse] Tamanho base64: ${anexo.base64.length} caracteres`);
      
      // Verificar tamanho do anexo (SendPulse aceita até 10MB por anexo)
      const base64SizeInMB = (anexo.base64.length * 3) / 4 / 1024 / 1024;
      console.log(`📎 [SendPulse] Tamanho estimado do arquivo: ${base64SizeInMB.toFixed(2)} MB`);
      
      if (base64SizeInMB > 10) {
        console.warn(`⚠️ [SendPulse] Anexo muito grande (${base64SizeInMB.toFixed(2)} MB). SendPulse pode rejeitar.`);
      }
      
      try {
        // Limpar base64 se tiver prefixo data URI
        let base64Content = anexo.base64;
        if (base64Content.startsWith('data:')) {
          const prefixMatch = base64Content.match(/^data:([^;]+);base64,(.+)$/);
          if (prefixMatch) {
            base64Content = prefixMatch[2];
            console.log(`📎 [SendPulse] Removido prefixo data URI. Tipo detectado: ${prefixMatch[1]}`);
          } else {
            base64Content = base64Content.split(',')[1] || base64Content;
            console.log(`📎 [SendPulse] Removido prefixo data URI (fallback)`);
          }
        }
        
        // Validar que temos conteúdo base64 válido
        if (!base64Content || base64Content.length < 100) {
          console.error(`❌ [SendPulse] Base64 inválido ou muito pequeno: ${base64Content?.length || 0} caracteres`);
          throw new Error('Conteúdo base64 do anexo inválido');
        }
        
        console.log(`📎 [SendPulse] Base64 validado, tamanho: ${base64Content.length} caracteres`);
        
        // SendPulse API: attachments_binary com nome do arquivo como chave
        // O ARQUIVO SERÁ ENVIADO COMO ANEXO REAL NO EMAIL
        emailData.attachments_binary = {
          [fileName]: base64Content
        };
        
        console.log(`✅ [SendPulse] Anexo preparado para envio:`, {
          fileName: fileName,
          type: anexo.tipo || 'application/pdf',
          sizeBytes: Math.round(base64Content.length * 0.75),
          sizeMB: base64SizeInMB.toFixed(2)
        });
      } catch (error) {
        console.error(`❌ [SendPulse] Erro ao preparar anexo:`, error);
        // Continuar sem anexo se houver erro ao preparar
        delete emailData.attachments_binary;
      }
    } else {
      console.log(`⚠️ [SendPulse] Nenhum anexo disponível para enviar`);
      if (!anexo) {
        console.log(`⚠️ [SendPulse] Anexo é null ou undefined`);
      } else if (!anexo.base64) {
        console.log(`⚠️ [SendPulse] Anexo não tem propriedade base64`);
      }
    }

    // Log detalhado do payload antes de enviar (sem o conteúdo base64 completo para não poluir logs)
    console.log(`📧 [SendPulse] Remetente: ${senderEmail} (${senderName})`);
    const logData = {
      subject: emailData.subject,
      from: emailData.from,
      to: emailData.to,
      htmlLength: emailData.html?.length || 0,
      textLength: emailData.text?.length || 0,
      attachments_binary: emailData.attachments_binary ? Object.keys(emailData.attachments_binary).map(fileName => ({
        fileName: fileName,
        contentLength: emailData.attachments_binary[fileName] ? emailData.attachments_binary[fileName].length : 0
      })) : undefined
    };
    console.log(`📧 [SendPulse] Payload do email de conclusão:`, JSON.stringify(logData, null, 2));

    return new Promise((resolve, reject) => {
      sendpulse.smtpSendMail((response) => {
        console.log(`📧 [SendPulse] Resposta completa:`, JSON.stringify(response, null, 2));
        
        // Verificar diferentes formatos de erro do SendPulse
        const hasError = response?.is_error || 
                        response?.error_code || 
                        (response?.error_code && response.error_code !== 200 && response.error_code !== 0) ||
                        (response?.message && (
                          response.message.toLowerCase().includes('not valid') ||
                          response.message.toLowerCase().includes('error') ||
                          response.message.toLowerCase().includes('invalid') ||
                          response.message.toLowerCase().includes('unauthorized') ||
                          response.message.toLowerCase().includes('forbidden') ||
                          response.message.toLowerCase().includes('sender') ||
                          response.message.toLowerCase().includes('internal server error')
                        ));
        
        if (hasError) {
          const errorMessage = response.message || response.error || 'Erro desconhecido ao enviar email';
          const errorCode = response.error_code || 'N/A';
          
          console.error(`❌ [SendPulse] Erro ao enviar email de conclusão:`);
          console.error(`   Código: ${errorCode}`);
          console.error(`   Mensagem: ${errorMessage}`);
          console.error(`   Resposta completa:`, JSON.stringify(response, null, 2));
          
          let userFriendlyError = errorMessage;
          if (errorMessage.toLowerCase().includes('sender') || 
              errorMessage.toLowerCase().includes('not valid') ||
              errorMessage.toLowerCase().includes('unauthorized')) {
            userFriendlyError = `Email remetente "${senderEmail}" não está verificado no SendPulse. Verifique se o email está verificado na sua conta SendPulse.`;
          } else if (errorMessage.toLowerCase().includes('argument email missing') ||
                     errorMessage.toLowerCase().includes('invalid')) {
            userFriendlyError = 'Estrutura do email inválida. Verifique a configuração.';
          }
          
          // Se o erro for relacionado a anexo muito grande, tentar enviar sem anexo
          if (errorMessage.toLowerCase().includes('server error') && emailData.attachments_binary && Object.keys(emailData.attachments_binary).length > 0) {
            console.log(`⚠️ [SendPulse] Tentando reenviar sem anexo devido a erro do servidor...`);
            const emailDataWithoutAttachment = { ...emailData };
            delete emailDataWithoutAttachment.attachments_binary;
            
            sendpulse.smtpSendMail((retryResponse) => {
              console.log(`📧 [SendPulse] Resposta do retry (sem anexo):`, JSON.stringify(retryResponse, null, 2));
              
              const retryHasError = retryResponse?.is_error || retryResponse?.error_code;
              if (retryHasError) {
                resolve({
                  success: false,
                  error: `Erro original: ${errorMessage}. Tentativa sem anexo também falhou: ${retryResponse.message || retryResponse.error}`,
                  email: email,
                  errorCode: retryResponse.error_code || 'N/A',
                  details: retryResponse
                });
              } else {
                console.log(`✅ [SendPulse] Email enviado com sucesso sem anexo`);
                resolve({
                  success: true,
                  messageId: retryResponse?.id || 'N/A',
                  email: email,
                  warning: 'Email enviado sem anexo devido a erro do servidor'
                });
              }
            }, emailDataWithoutAttachment);
            return;
          }
          
          resolve({
            success: false,
            error: userFriendlyError,
            errorCode: errorCode,
            email: email,
            details: response
          });
        } else {
          console.log(`✅ [SendPulse] Email de conclusão enviado com sucesso para ${email}`);
          console.log(`✅ [SendPulse] Message ID: ${response?.id || response?.result?.id || response?.data?.id || 'N/A'}`);
          resolve({
            success: true,
            messageId: response?.id || response?.result?.id || response?.data?.id || 'N/A',
            email: email,
            response: response
          });
        }
      }, emailData);
    });

  } catch (error) {
    console.error('❌ [SendPulse] Erro ao enviar email de conclusão:', error);
    return {
      success: false,
      error: error.message || 'Erro desconhecido ao enviar email',
      email: ticketData.email
    };
  }
}

/**
 * Envia email quando Plexi retorna bloqueio (ex: "já solicitado há menos de 30 dias")
 * Informa o cliente sobre o prazo para nova solicitação
 */
async function sendPlexiBlockedEmail(ticketData, mensagemErro) {
  try {
    await initializeSendPulse();

    const email = ticketData.email || ticketData.dadosFormulario?.email;
    const nomeCompleto = ticketData.nomeCompleto || ticketData.dadosFormulario?.nomeCompleto || 'Cliente';
    const codigo = ticketData.codigo;

    if (!email) {
      console.warn(`⚠️ [SendPulse] Email não disponível para enviar notificação de bloqueio (Ticket: ${codigo})`);
      return { success: false, error: 'Email do cliente não fornecido' };
    }

    const dominio = ticketData.dominio || ticketData.dadosFormulario?.origem || 'suporteonline.digital';
    const domainInfo = getSenderByDomain(dominio);

    const prazoTexto = mensagemErro && (mensagemErro.includes('30') || mensagemErro.toLowerCase().includes('dias'))
      ? 'Você poderá solicitar novamente em até 30 dias a partir da última solicitação na mesma comarca.'
      : 'Entre em contato conosco para verificar o prazo para nova solicitação.';

    const htmlContent = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;} .box{background:#f8f9fa;border-left:4px solid #ffc107;padding:16px;margin:16px 0;} .footer{font-size:12px;color:#666;margin-top:24px;}</style></head>
<body>
  <p>Olá ${nomeCompleto},</p>
  <p>Informamos que sua solicitação de certidão (Ticket ${codigo}) não pôde ser concluída automaticamente.</p>
  <div class="box">
    <strong>Motivo:</strong><br>
    ${mensagemErro || 'Solicitação já realizada anteriormente.'}
  </div>
  <p><strong>Prazo:</strong> ${prazoTexto}</p>
  <p>Se tiver dúvidas, entre em contato conosco.</p>
  <div class="footer">
    ${domainInfo.name}<br>
    ${domainInfo.website}
  </div>
</body>
</html>`.trim();

    const textContent = `
Olá ${nomeCompleto},

Informamos que sua solicitação de certidão (Ticket ${codigo}) não pôde ser concluída automaticamente.

Motivo: ${mensagemErro || 'Solicitação já realizada anteriormente.'}

Prazo: ${prazoTexto}

Dúvidas: ${domainInfo.website}

${domainInfo.name}
    `.trim();

    const emailData = {
      subject: `Solicitação em análise - Ticket ${codigo}`,
      html: htmlContent,
      text: textContent,
      from: { name: domainInfo.name, email: domainInfo.email },
      to: [{ email }]
    };

    console.log(`📧 [SendPulse] Enviando email de bloqueio Plexi para ${email} (Ticket: ${codigo})`);

    return new Promise((resolve) => {
      sendpulse.smtpSendMail((response) => {
        const hasError = response?.is_error || response?.error_code;
        if (hasError) {
          console.error(`❌ [SendPulse] Erro ao enviar email de bloqueio:`, response?.message || response?.error);
          resolve({ success: false, error: response?.message || response?.error, email });
        } else {
          console.log(`✅ [SendPulse] Email de bloqueio enviado para ${email}`);
          resolve({ success: true, messageId: response?.id, email });
        }
      }, emailData);
    });
  } catch (error) {
    console.error('❌ [SendPulse] Erro ao enviar email de bloqueio:', error);
    return { success: false, error: error.message, email: ticketData.email };
  }
}

/**
 * Enviar email genérico via SendPulse
 * @param {Object} options - Opções do email
 * @param {string|string[]} options.to - Email(s) destinatário(s)
 * @param {string} options.subject - Assunto do email
 * @param {string} options.html - Conteúdo HTML do email
 * @param {string} [options.text] - Conteúdo texto plano (recomendado pelo SendPulse)
 * @param {Object} options.from - Remetente { name, email }
 * @param {string|string[]} [options.cc] - Email(s) em cópia
 * @param {string|string[]} [options.bcc] - Email(s) em cópia oculta
 * @returns {Promise<Object>} Resultado do envio
 */
async function sendEmail({ to, subject, html, text, from, cc, bcc }) {
  await initializeSendPulse();
  
  // Normalizar destinatários para array
  const toArray = Array.isArray(to) ? to : [to];
  const ccArray = cc ? (Array.isArray(cc) ? cc : [cc]) : [];
  const bccArray = bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : [];
  
  // Remetente padrão - usar SENDPULSE_SENDER_EMAIL que é o email verificado no SendPulse
  const fromEmail = from?.email || process.env.SUPORTE_SENDER_EMAIL || process.env.SENDPULSE_SENDER_EMAIL || process.env.SUPPORT_EMAIL || 'contato@suporteonline.digital';
  const fromName = from?.name || process.env.SUPORTE_SENDER_NAME || process.env.SENDPULSE_SENDER_NAME || 'Suporte Online';
  
  const emailData = {
    subject: subject,
    html: html,
    text: text || html?.replace(/<[^>]*>/g, '') || '',
    from: {
      name: fromName,
      email: fromEmail
    },
    to: toArray.map(email => ({ email: email.trim() })),
    ...(ccArray.length > 0 && {
      cc: ccArray.map(email => ({ email: email.trim() }))
    }),
    ...(bccArray.length > 0 && {
      bcc: bccArray.map(email => ({ email: email.trim() }))
    })
  };
  
  console.log(`📧 [SendPulse] Enviando email genérico para: ${toArray.join(', ')}`);
  console.log(`📧 [SendPulse] Remetente: ${fromEmail} (${fromName})`);
  console.log(`📧 [SendPulse] Assunto: ${subject}`);
  
  return new Promise((resolve, reject) => {
    sendpulse.smtpSendMail((response) => {
      // Log completo da resposta para debug
      console.log(`📧 [SendPulse] Resposta completa:`, JSON.stringify(response, null, 2));
      
      const hasError = response?.is_error || 
                      response?.error_code || 
                      (response?.error_code && response.error_code !== 200 && response.error_code !== 0) ||
                      (response?.message && (
                        response.message.toLowerCase().includes('not valid') ||
                        response.message.toLowerCase().includes('error') ||
                        response.message.toLowerCase().includes('invalid') ||
                        response.message.toLowerCase().includes('unauthorized') ||
                        response.message.toLowerCase().includes('forbidden')
                      ));
      
      if (hasError) {
        const errorMessage = response.message || response.error || 'Erro desconhecido ao enviar email';
        console.error(`❌ [SendPulse] Erro ao enviar email:`, errorMessage);
        console.error(`❌ [SendPulse] Código de erro:`, response.error_code);
        console.error(`❌ [SendPulse] Resposta completa:`, JSON.stringify(response, null, 2));
        resolve({
          success: false,
          error: errorMessage,
          errorCode: response.error_code,
          fullResponse: response
        });
      } else {
        // Verificar se a resposta indica sucesso (aceito pelo SendPulse)
        // O SendPulse pode retornar sucesso mesmo que a entrega final ainda não tenha ocorrido
        const messageId = response?.id || response?.result?.id || response?.data?.id || null;
        const isAccepted = messageId !== null || 
                          response?.result === true || 
                          (response?.error_code === undefined && !response?.is_error);
        
        if (isAccepted) {
          console.log(`✅ [SendPulse] Email aceito pelo SendPulse`);
          console.log(`✅ [SendPulse] Message ID: ${messageId || 'N/A'}`);
          console.log(`✅ [SendPulse] Nota: A entrega final pode levar alguns minutos e será atualizada no painel do SendPulse`);
          resolve({
            success: true,
            messageId: messageId || 'N/A',
            fullResponse: response,
            status: 'accepted' // Aceito pelo SendPulse, aguardando entrega
          });
        } else {
          // Resposta ambígua - logar para investigação
          console.warn(`⚠️ [SendPulse] Resposta ambígua do SendPulse:`, JSON.stringify(response, null, 2));
          resolve({
            success: false,
            error: 'Resposta ambígua do SendPulse',
            errorCode: response?.error_code,
            fullResponse: response
          });
        }
      }
    }, emailData);
  });
}

/** Alias para InfoSimples - mesmo fluxo de bloqueio (ex: já solicitado há menos de 30 dias) */
const sendProviderBlockedEmail = sendPlexiBlockedEmail;

module.exports = {
  sendConfirmationEmail,
  sendCompletionEmail,
  buildAttachmentFileName,
  sendPlexiBlockedEmail,
  sendProviderBlockedEmail,
  sendEmail,
  initializeSendPulse
};
