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

module.exports = {
  sendConfirmationEmail,
  initializeSendPulse
};
