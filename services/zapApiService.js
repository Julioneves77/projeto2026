/**
 * Serviço de Envio de Mensagem WhatsApp via Zap API
 * Suporta múltiplos provedores: Z-API, Evolution API, etc.
 */

const axios = require('axios');

// Zap API URL - DEVE ser configurada no .env
// Exemplos:
// - Z-API: https://api.z-api.io/v1
// - Evolution API: https://api.evolution-api.com/v1
// - URL personalizada da sua instância
const ZAP_API_URL = process.env.ZAP_API_URL || process.env.ZAP_API_BASE_URL || '';

/**
 * Cria template de mensagem WhatsApp para confirmação de pagamento
 */
function createWhatsAppMessage(ticketData) {
  const { nomeCompleto, codigo, tipoCertidao, prioridade } = ticketData;
  
  // Prazo de entrega fixo conforme solicitado
  const prazoEntrega = 'Depende da sua Comarca maioria até 2 horas';

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

  return `✅ *Pagamento Confirmado!*

Olá ${nomeCompleto.split(' ')[0]}, seu pagamento foi confirmado com sucesso! 🎉

📋 *Detalhes do Pedido:*
• Código: *${codigo}*
• Tipo: ${tipoCertidaoNome}
• Prazo: ${prazoEntrega}
• Status: Em Processamento

📧 Você receberá sua Solicitação por Email / WhatsApp assim que estiver Pronta

Portal Certidão
www.portalcertidao.org`;
}

/**
 * Formata número de telefone para formato internacional (Brasil)
 */
function formatPhoneNumber(phone) {
  if (!phone) return null;
  
  // Remove caracteres não numéricos
  let cleaned = phone.replace(/\D/g, '');
  
  // Se começa com 0, remover
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  
  // Se não começa com 55 (código do Brasil), adicionar
  if (!cleaned.startsWith('55')) {
    cleaned = '55' + cleaned;
  }
  
  return cleaned;
}

/**
 * Envia mensagem WhatsApp de confirmação de pagamento via Zap API
 * Suporta múltiplos formatos de API (Z-API, Evolution API, etc.)
 */
async function sendWhatsAppMessage(ticketData) {
  try {
    const apiKey = process.env.ZAP_API_KEY;
    const apiUrl = ZAP_API_URL;
    const instanceId = process.env.ZAP_INSTANCE_ID || process.env.ZAP_INSTANCE; // Para Evolution API
    const clientToken = process.env.ZAP_CLIENT_TOKEN; // Client-Token de segurança da conta

    if (!apiKey) {
      throw new Error('Zap API Key não configurada. Verifique ZAP_API_KEY no .env');
    }

    if (!apiUrl) {
      throw new Error('Zap API URL não configurada. Configure ZAP_API_URL no .env com a URL correta da sua instância WhatsApp.\nExemplos:\n- Z-API: https://api.z-api.io/v1\n- Evolution API: https://api.evolution-api.com/v1\n- Sua URL personalizada');
    }

    const { telefone, codigo } = ticketData;

    if (!telefone) {
      throw new Error('Telefone do cliente não fornecido');
    }

    const phoneNumber = formatPhoneNumber(telefone);
    
    if (!phoneNumber) {
      throw new Error('Número de telefone inválido');
    }

    const message = createWhatsAppMessage(ticketData);

    console.log(`📱 [Zap API] URL: ${apiUrl}`);
    console.log(`📱 [Zap API] Enviando WhatsApp para ${phoneNumber} (Ticket: ${codigo})`);

    // Tentar diferentes formatos de API de WhatsApp
    let response;
    let lastError;
    let successFormat = null;

    // Formato 1: Z-API (https://api.z-api.io)
    // Documentação Z-API: O formato correto é instance:token
    // Endpoint: POST /instances/{instance}/token/{token}/send-text
    if (apiUrl.includes('z-api.io')) {
      try {
        // Z-API usa formato: instance:token
        // Se a API Key contém ':', usar como instance:token
        // Caso contrário, tentar usar instanceId ou 'default'
        const parts = apiKey.split(':');
        let instance, token;
        
        if (parts.length > 1) {
          // Formato instance:token
          instance = parts[0];
          token = parts[1];
        } else {
          // Tentar usar instanceId ou valores das outras chaves fornecidas
          // Baseado nas credenciais fornecidas: 3EAB7866FE55B1BEB70D52B01C4B842D:01A24B106EE5EB2500D9EA86:F8337947b89a14ae78d92f6365523269bS
          // Parece ser: instance:token:outro
          const allParts = apiKey.split(':');
          if (allParts.length >= 2) {
            instance = allParts[0];
            token = allParts[1];
          } else {
            instance = instanceId || 'default';
            token = apiKey;
          }
        }
        
        console.log(`📱 [Zap API] Tentando Z-API: instance=${instance}, token=${token.substring(0, 10)}...`);
        
        // Z-API endpoint correto conforme painel: https://api.z-api.io/instances/{instance}/token/{token}/send-text
        const baseUrl = apiUrl.replace('/v1', '').replace(/\/$/, '');
        const endpoint = `${baseUrl}/instances/${instance}/token/${token}/send-text`;
        
        console.log(`📱 [Zap API] Endpoint: ${endpoint}`);
        console.log(`📱 [Zap API] Payload: phone=${phoneNumber}, message length=${message.length}`);
        
        // Preparar headers - incluir Client-Token se configurado
        const headers = {
          'Content-Type': 'application/json'
        };
        
        if (clientToken) {
          headers['Client-Token'] = clientToken;
          console.log(`📱 [Zap API] Client-Token configurado: ${clientToken.substring(0, 6)}...`);
        } else {
          console.log(`⚠️ [Zap API] Client-Token não configurado. Configure ZAP_CLIENT_TOKEN no .env`);
        }
        
        // Enviar mensagem com Client-Token no header
        response = await axios.post(
          endpoint,
          {
            phone: phoneNumber,
            message: message
          },
          {
            headers: headers,
            timeout: 15000
          }
        );
        successFormat = 'Z-API';
      } catch (error) {
        lastError = error;
        console.log(`⚠️ [Zap API] Z-API falhou: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      }
    }
    
    // Formato 2: Evolution API
    // Endpoint: POST /message/sendText/{instance}
    if (!response && (apiUrl.includes('evolution-api') || instanceId)) {
      try {
        const instance = instanceId || 'default';
        console.log(`📱 [Zap API] Tentando Evolution API: instance=${instance}`);
        
        response = await axios.post(
          `${apiUrl}/message/sendText/${instance}`,
          {
            number: phoneNumber,
            text: message
          },
          {
            headers: {
              'apikey': apiKey,
              'Content-Type': 'application/json'
            },
            timeout: 15000
          }
        );
        successFormat = 'Evolution API';
      } catch (error) {
        if (!lastError) lastError = error;
        console.log(`⚠️ [Zap API] Evolution API falhou: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      }
    }
    
    // Formato 3: Genérico Bearer Token
    if (!response) {
      try {
        console.log(`📱 [Zap API] Tentando Bearer Token`);
        response = await axios.post(
          `${apiUrl}/messages`,
          {
            phone: phoneNumber,
            message: message
          },
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 15000
          }
        );
        successFormat = 'Bearer Token';
      } catch (error) {
        if (!lastError) lastError = error;
      }
    }
    
    // Formato 4: X-API-Key header
    if (!response) {
      try {
        console.log(`📱 [Zap API] Tentando X-API-Key`);
        response = await axios.post(
          `${apiUrl}/messages`,
          {
            phone: phoneNumber,
            message: message
          },
          {
            headers: {
              'X-API-Key': apiKey,
              'Content-Type': 'application/json'
            },
            timeout: 15000
          }
        );
        successFormat = 'X-API-Key';
      } catch (error) {
        if (!lastError) lastError = error;
      }
    }
    
    // Se nenhum formato funcionou, lançar erro
    if (!response) {
      throw lastError || new Error('Nenhum formato de API funcionou');
    }
    
    if (successFormat) {
      console.log(`✅ [Zap API] Formato que funcionou: ${successFormat}`);
    }

    // Verificar se a resposta indica sucesso ou erro
    const responseData = response.data || {};
    const hasError = responseData.error || 
                    responseData.is_error || 
                    (responseData.message && (
                      responseData.message.toLowerCase().includes('error') ||
                      responseData.message.toLowerCase().includes('not found') ||
                      responseData.message.toLowerCase().includes('failed')
                    )) ||
                    (response.status >= 400);
    
    if (hasError && !responseData.success) {
      // Resposta com erro mas não lançou exceção
      const errorMsg = responseData.message || responseData.error || 'Erro desconhecido';
      console.error(`❌ [Zap API] Resposta com erro: ${errorMsg}`);
      console.error('❌ [Zap API] Detalhes:', JSON.stringify(responseData, null, 2));
      
      return {
        success: false,
        error: errorMsg,
        phone: phoneNumber,
        statusCode: response.status,
        details: responseData
      };
    }
    
    console.log(`✅ [Zap API] Mensagem WhatsApp enviada com sucesso para ${phoneNumber}`);
    console.log('✅ [Zap API] Resposta:', JSON.stringify(responseData, null, 2));
    
    return {
      success: true,
      messageId: responseData?.id || responseData?.message_id || responseData?.key?.id || responseData?.result?.id || 'N/A',
      phone: phoneNumber,
      response: responseData
    };
  } catch (error) {
    const errorDetails = error.response?.data || error.message;
    const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message;
    const statusCode = error.response?.status;
    
    console.error('❌ [Zap API] Erro ao enviar WhatsApp:');
    console.error('   Status:', statusCode);
    console.error('   Código:', error.code);
    console.error('   Detalhes:', JSON.stringify(errorDetails, null, 2));
    console.error('   Mensagem:', errorMessage);
    
    // Mensagens de erro mais amigáveis
    let userFriendlyError = errorMessage;
    if (error.code === 'ENOTFOUND') {
      userFriendlyError = `URL da API não encontrada: ${ZAP_API_URL}. Verifique se ZAP_API_URL está correto no .env.`;
    } else if (statusCode === 401 || statusCode === 403) {
      userFriendlyError = 'Erro de autenticação. Verifique se ZAP_API_KEY está correto e se a instância está ativa.';
    } else if (statusCode === 404) {
      userFriendlyError = 'Endpoint não encontrado. Verifique se a URL e o formato da API estão corretos.';
    }
    
    return {
      success: false,
      error: userFriendlyError,
      phone: ticketData.telefone,
      statusCode: statusCode,
      errorCode: error.code,
      details: errorDetails
    };
  }
}

module.exports = {
  sendWhatsAppMessage,
  formatPhoneNumber
};
