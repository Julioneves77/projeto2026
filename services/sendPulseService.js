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
    }
  };
  
  return domainMap[normalizedDomain] || {
    email: process.env.SUPORTE_SENDER_EMAIL || process.env.SENDPULSE_SENDER_EMAIL || 'contato@suporteonline.digital',
    name: process.env.SUPORTE_SENDER_NAME || 'Suporte Online',
    website: 'www.suporteonline.digital',
    websiteUrl: 'https://www.suporteonline.digital'
  };
}

/**
 * Cria template HTML para email de confirmação de pagamento
 */
function createEmailTemplate(ticketData, domainInfo) {
  const { nomeCompleto, codigo, tipoCertidao, email, telefone, prioridade } = ticketData;
  
  // Prazo de entrega fixo conforme solicitado
  const prazoEntrega = 'Depende da Comarca mas maioria até 2 horas';

  // Mapear tipo de certidão para nome amigável
  const tipoCertidaoNome = {
    'criminal-federal': 'Certidão Negativa Criminal Federal',
    'criminal-estadual': 'Certidão Negativa Criminal Estadual',
    'antecedentes-pf': 'Antecedente Criminal de Polícia Federal',
    'eleitoral': 'Certidão de Quitação Eleitoral',
    'civil-federal': 'Certidão Negativa Cível Federal',
    'civil-estadual': 'Certidão Negativa Cível Estadual',
    'cnd': 'Certidão Negativa de Débito (CND)',
    'cpf-regular': 'Certidão CPF Regular'
  }[tipoCertidao] || tipoCertidao;

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmação de Pagamento</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
    <h1 style="color: #28a745; margin-top: 0;">Pagamento Confirmado!</h1>
    
    <p>Olá <strong>${nomeCompleto}</strong>,</p>
    
    <p>Seu pagamento foi confirmado com sucesso. Seu pedido está sendo processado.</p>
    
    <div style="background-color: #fff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
      <h2 style="margin-top: 0; color: #333;">Detalhes do Pedido</h2>
      <p><strong>Código do Ticket:</strong> ${codigo}</p>
      <p><strong>Tipo de Certidão:</strong> ${tipoCertidaoNome}</p>
      <p><strong>Prazo de Entrega:</strong> ${prazoEntrega}</p>
      <p><strong>Status:</strong> Em Processamento</p>
    </div>
    
    <p>Você vai receber sua Solicitação por Email/WhatsApp assim que estiver Pronta.</p>
    
    <p>Dúvidas acesse: <a href="${domainInfo.websiteUrl}" style="color: #28a745; text-decoration: none;">${domainInfo.website}</a></p>
    
    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
    
    <p style="font-size: 12px; color: #666;">
      Este é um email automático, por favor não responda.<br>
      ${domainInfo.name} - Todos os direitos reservados.
    </p>
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
    
    // Se não for suporteonline.digital, usar fallback
    if (dominio !== 'suporteonline.digital' && dominio !== 'portalcertidao.org') {
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

Você vai receber sua Solicitação por Email/WhatsApp assim que estiver Pronta.

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
 * Cria template HTML para email de conclusão de ticket
 */
function createCompletionEmailTemplate(ticketData, mensagemInteracao, domainInfo) {
  const { nomeCompleto, codigo, tipoCertidao } = ticketData;
  
  const tipoCertidaoNome = {
    'criminal-federal': 'Certidão Negativa Criminal Federal',
    'criminal-estadual': 'Certidão Negativa Criminal Estadual',
    'antecedentes-pf': 'Antecedente Criminal de Polícia Federal',
    'eleitoral': 'Certidão de Quitação Eleitoral',
    'civil-federal': 'Certidão Negativa Cível Federal',
    'civil-estadual': 'Certidão Negativa Cível Estadual',
    'cnd': 'Certidão Negativa de Débito (CND)',
    'cpf-regular': 'Certidão CPF Regular'
  }[tipoCertidao] || tipoCertidao;

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Certidão Pronta</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
    <h1 style="color: #28a745; margin-top: 0;">✅ Certidão Pronta!</h1>
    
    <p>Olá <strong>${nomeCompleto}</strong>,</p>
    
    <p>Sua certidão está pronta e disponível para download.</p>
    
    <div style="background-color: #fff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
      <h2 style="margin-top: 0; color: #333;">Detalhes da Certidão</h2>
      <p><strong>Código do Ticket:</strong> ${codigo}</p>
      <p><strong>Tipo de Certidão:</strong> ${tipoCertidaoNome}</p>
      <p><strong>Status:</strong> Concluída</p>
    </div>
    
    ${mensagemInteracao ? `
    <div style="background-color: #e7f3ff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #007bff;">
      <h3 style="margin-top: 0; color: #333;">Informações Adicionais:</h3>
      <p style="white-space: pre-wrap;">${mensagemInteracao}</p>
    </div>
    ` : ''}
    
    <p>Seu arquivo está disponível em anexo neste email.</p>
    
    <p>Dúvidas acesse: <a href="${domainInfo.websiteUrl}" style="color: #007bff; text-decoration: none;">${domainInfo.website}</a></p>
    
    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
    
    <p style="font-size: 12px; color: #666;">
      Este é um email automático, por favor não responda.<br>
      ${domainInfo.name} - Todos os direitos reservados.
    </p>
  </div>
</body>
</html>
  `.trim();
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
      const fileName = anexo.nome || `certidao-${codigo}.pdf`;
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
 * Enviar email genérico via SendPulse
 * @param {Object} options - Opções do email
 * @param {string|string[]} options.to - Email(s) destinatário(s)
 * @param {string} options.subject - Assunto do email
 * @param {string} options.html - Conteúdo HTML do email
 * @param {Object} options.from - Remetente { name, email }
 * @param {string|string[]} [options.cc] - Email(s) em cópia
 * @param {string|string[]} [options.bcc] - Email(s) em cópia oculta
 * @returns {Promise<Object>} Resultado do envio
 */
async function sendEmail({ to, subject, html, from, cc, bcc }) {
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

module.exports = {
  sendConfirmationEmail,
  sendCompletionEmail,
  sendEmail,
  initializeSendPulse
};
