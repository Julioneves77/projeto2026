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
 * Cria template HTML para email de confirmação de pagamento
 */
function createEmailTemplate(ticketData) {
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
    
    <p>Dúvidas acesse: <a href="https://www.portalcertidao.org" style="color: #28a745; text-decoration: none;">www.portalcertidao.org</a></p>
    
    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
    
    <p style="font-size: 12px; color: #666;">
      Este é um email automático, por favor não responda.<br>
      Portal Certidão - Todos os direitos reservados.
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
    // Inicializar biblioteca se necessário
    await initializeSendPulse();

    const { email, nomeCompleto, codigo } = ticketData;

    if (!email) {
      throw new Error('Email do cliente não fornecido');
    }

    // Email remetente configurável via variável de ambiente
    const senderEmail = process.env.SENDPULSE_SENDER_EMAIL || 'noreply@portalcertidao.com.br';
    const senderName = process.env.SENDPULSE_SENDER_NAME || 'Portal Certidão';

    // Criar template HTML
    const htmlContent = createEmailTemplate(ticketData);
    const textContent = `
Pagamento Confirmado!

Olá ${nomeCompleto},

Seu pagamento foi confirmado com sucesso. Seu pedido está sendo processado.

Código do Ticket: ${codigo}
Prazo de Entrega: Depende da Comarca mas maioria até 2 horas
Status: Em Processamento

Você vai receber sua Solicitação por Email/WhatsApp assim que estiver Pronta.

Dúvidas acesse: www.portalcertidao.org

Portal Certidão
    `.trim();

    console.log(`📧 [SendPulse] Enviando email para ${email} (Ticket: ${codigo})`);
    console.log(`📧 [SendPulse] Remetente: ${senderEmail} (${senderName})`);

    // Estrutura do email conforme documentação oficial do SendPulse
    // Baseado no exemplo da biblioteca oficial
    const emailData = {
      html: htmlContent,
      text: textContent,
      subject: `Confirmação de Pagamento - Ticket ${codigo}`,
      from: {
        name: senderName,
        email: senderEmail
      },
      to: [
        {
          name: nomeCompleto,
          email: email
        }
      ]
    };

    // Enviar usando a biblioteca oficial
    return new Promise((resolve, reject) => {
      sendpulse.smtpSendMail((response) => {
        // Verificar se há erro (biblioteca retorna is_error ou error_code)
        const hasError = response?.is_error || response?.error_code || 
                        (response?.message && response.message.includes('not valid')) ||
                        (response?.message && response.message.includes('error'));
        
        if (hasError || (response?.error_code && response.error_code !== 200)) {
          const errorMessage = response.message || response.error || 'Erro desconhecido ao enviar email';
          const errorCode = response.error_code || response.code;
          
          console.error('❌ [SendPulse] Erro ao enviar email:');
          console.error('   Código:', errorCode);
          console.error('   Detalhes:', JSON.stringify(response, null, 2));
          
          let userFriendlyError = errorMessage;
          if (errorMessage.includes('Sender is not valid') || 
              errorMessage.includes('sender') || 
              errorMessage.includes('not valid')) {
            userFriendlyError = 'Email remetente não está verificado no SendPulse. Configure SENDPULSE_SENDER_EMAIL no .env com um email verificado na sua conta SendPulse.';
          } else if (errorMessage.includes('Argument email missing')) {
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
          console.log(`✅ [SendPulse] Email enviado com sucesso para ${email}`);
          console.log('✅ [SendPulse] Resposta:', JSON.stringify(response, null, 2));
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
function createCompletionEmailTemplate(ticketData, mensagemInteracao) {
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
    
    <p>Dúvidas acesse: <a href="https://www.portalcertidao.org" style="color: #007bff; text-decoration: none;">www.portalcertidao.org</a></p>
    
    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
    
    <p style="font-size: 12px; color: #666;">
      Este é um email automático, por favor não responda.<br>
      Portal Certidão - Todos os direitos reservados.
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

    const senderEmail = process.env.SENDPULSE_SENDER_EMAIL || 'noreply@portalcertidao.com.br';
    const senderName = process.env.SENDPULSE_SENDER_NAME || 'Portal Certidão';

    const htmlContent = createCompletionEmailTemplate(ticketData, mensagemInteracao);
    const textContent = `
Certidão Pronta!

Olá ${nomeCompleto},

Sua certidão está pronta e disponível para download.

Código do Ticket: ${codigo}
Status: Concluída

${mensagemInteracao ? `Informações Adicionais:\n${mensagemInteracao}\n\n` : ''}
Seu arquivo está disponível em anexo neste email.

Dúvidas acesse: www.portalcertidao.org

Portal Certidão
    `.trim();

    console.log(`📧 [SendPulse] Enviando email de conclusão para ${email} (Ticket: ${codigo})`);
    if (anexo) {
      console.log(`📎 [SendPulse] Anexo: ${anexo.nome} (${anexo.tipo})`);
      console.log(`📎 [SendPulse] Tamanho base64: ${anexo.base64 ? anexo.base64.length : 0} caracteres`);
    }

    const emailData = {
      html: htmlContent,
      text: textContent,
      subject: `Certidão Pronta - Ticket ${codigo}`,
      from: {
        name: senderName,
        email: senderEmail
      },
      to: [
        {
          name: nomeCompleto,
          email: email
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

    // Log do payload antes de enviar (sem o conteúdo base64 completo para não poluir logs)
    const logData = {
      ...emailData,
      attachments_binary: emailData.attachments_binary ? Object.keys(emailData.attachments_binary).map(fileName => ({
        fileName: fileName,
        contentLength: emailData.attachments_binary[fileName] ? emailData.attachments_binary[fileName].length : 0
      })) : undefined
    };
    console.log(`📧 [SendPulse] Enviando email com payload:`, JSON.stringify(logData, null, 2));

    return new Promise((resolve, reject) => {
      sendpulse.smtpSendMail((response) => {
        console.log(`📧 [SendPulse] Resposta completa:`, JSON.stringify(response, null, 2));
        
        // Verificar diferentes formatos de erro do SendPulse
        const hasError = response?.is_error || 
                        response?.error_code || 
                        (response?.error_code && response.error_code !== 200 && response.error_code !== 0) ||
                        (response?.message && (
                          response.message.includes('not valid') ||
                          response.message.includes('error') ||
                          response.message.includes('Error') ||
                          response.message.includes('Interval server error') ||
                          response.message.includes('Internal server error')
                        ));
        
        if (hasError) {
          const errorMessage = response.message || response.error || 'Erro desconhecido ao enviar email';
          const errorCode = response.error_code || 'N/A';
          console.error(`❌ [SendPulse] Erro ao enviar email de conclusão:`, {
            message: errorMessage,
            error_code: errorCode,
            fullResponse: response
          });
          
          // Se o erro for relacionado a anexo muito grande, tentar enviar sem anexo
          if (errorMessage.includes('server error') && emailData.attachments_binary && Object.keys(emailData.attachments_binary).length > 0) {
            console.log(`⚠️ [SendPulse] Tentando reenviar sem anexo devido a erro do servidor...`);
            const emailDataWithoutAttachment = { ...emailData };
            delete emailDataWithoutAttachment.attachments_binary;
            
            sendpulse.smtpSendMail((retryResponse) => {
              if (retryResponse?.is_error || retryResponse?.error_code) {
                resolve({
                  success: false,
                  error: `Erro original: ${errorMessage}. Tentativa sem anexo também falhou: ${retryResponse.message || retryResponse.error}`,
                  email: email
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
            error: errorMessage,
            errorCode: errorCode,
            email: email
          });
        } else {
          console.log(`✅ [SendPulse] Email de conclusão enviado com sucesso para ${email}`);
          resolve({
            success: true,
            messageId: response?.id || 'N/A',
            email: email
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
  
  // Remetente padrão
  const fromEmail = from?.email || process.env.SUPPORT_EMAIL || 'contato@portalcertidao.org';
  const fromName = from?.name || 'Portal Certidão';
  
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
  
  return new Promise((resolve, reject) => {
    sendpulse.smtpSendMail((response) => {
      const hasError = response?.is_error || 
                      response?.error_code || 
                      (response?.error_code && response.error_code !== 200 && response.error_code !== 0) ||
                      (response?.message && (
                        response.message.includes('not valid') ||
                        response.message.includes('error') ||
                        response.message.includes('Error')
                      ));
      
      if (hasError) {
        const errorMessage = response.message || response.error || 'Erro desconhecido ao enviar email';
        console.error(`❌ [SendPulse] Erro ao enviar email:`, errorMessage);
        resolve({
          success: false,
          error: errorMessage,
          errorCode: response.error_code
        });
      } else {
        console.log(`✅ [SendPulse] Email enviado com sucesso`);
        resolve({
          success: true,
          messageId: response?.id || 'N/A'
        });
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
