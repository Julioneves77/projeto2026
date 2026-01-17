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
 * Cria template de mensagem WhatsApp para conclusão de ticket
 */
function createCompletionWhatsAppMessage(ticketData, mensagemInteracao) {
  const { nomeCompleto, codigo, tipoCertidao } = ticketData;
  
  // Obter informações do domínio de origem
  const dominio = ticketData.dominio || ticketData.dadosFormulario?.origem || 'portalcertidao.org';
  const normalizedDomain = dominio.replace(/^www\./, '').toLowerCase();
  
  // Mapear domínio para informações da marca
  const domainInfo = {
    'verificacaoassistida.online': {
      name: 'Verificação Assistida',
      website: 'www.verificacaoassistida.online'
    },
    'portalcertidao.org': {
      name: 'Portal Certidão',
      website: 'www.portalcertidao.org'
    }
  };
  
  const senderInfo = domainInfo[normalizedDomain] || domainInfo['portalcertidao.org'];
  
  const tipoCertidaoNome = {
    'criminal-federal': 'Certidão Negativa Criminal Federal',
    'criminal-estadual': 'Certidão Negativa Criminal Estadual',
    'antecedentes-pf': 'Antecedente Criminal de Polícia Federal',
    'eleitoral': 'Certidão de Quitação Eleitoral',
    'civil-federal': 'Certidão Negativa Cível Federal',
    'civil-estadual': 'Certidão Negativa Cível Estadual',
    'cnd': 'Certidão Negativa de Débito (CND)',
    'cpf-regular': 'Certidão CPF Regular',
    'Certidão Criminal Federal': 'Certidão Criminal Federal'
  }[tipoCertidao] || tipoCertidao;

  let mensagem = `✅ *Certidão Pronta!*

Olá ${nomeCompleto.split(' ')[0]}, sua certidão está pronta! 🎉

📋 *Detalhes:*
• Código: *${codigo}*
• Tipo: ${tipoCertidaoNome}
• Status: Concluída`;

  if (mensagemInteracao) {
    mensagem += `\n\n📝 *Informações Adicionais:*
${mensagemInteracao}`;
  }

  mensagem += `\n\n${senderInfo.name}
${senderInfo.website}`;

  return mensagem;
}

/**
 * Cria template de mensagem WhatsApp para confirmação de pagamento
 */
function createWhatsAppMessage(ticketData) {
  const { nomeCompleto, codigo, tipoCertidao, prioridade } = ticketData;
  
  // Obter informações do domínio de origem
  const dominio = ticketData.dominio || ticketData.dadosFormulario?.origem || 'portalcertidao.org';
  const normalizedDomain = dominio.replace(/^www\./, '').toLowerCase();
  
  // Mapear domínio para informações da marca
  const domainInfo = {
    'verificacaoassistida.online': {
      name: 'Verificação Assistida',
      website: 'www.verificacaoassistida.online'
    },
    'portalcertidao.org': {
      name: 'Portal Certidão',
      website: 'www.portalcertidao.org'
    }
  }[normalizedDomain] || {
    name: 'Portal Certidão',
    website: 'www.portalcertidao.org'
  };
  
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
    'cpf-regular': 'Certidão CPF Regular',
    'Certidão Criminal Federal': 'Certidão Criminal Federal'
  }[tipoCertidao] || tipoCertidao;

  return `✅ *Pagamento Confirmado!*

Olá ${nomeCompleto.split(' ')[0]}, seu pagamento foi confirmado com sucesso! 🎉

📋 *Detalhes do Pedido:*
• Código: *${codigo}*
• Tipo: ${tipoCertidaoNome}
• Prazo: ${prazoEntrega}
• Status: Em Processamento

📧 Você receberá sua Solicitação por Email / WhatsApp assim que estiver Pronta

${domainInfo.name}
${domainInfo.website}`;
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
    // Z-API requer instanceId - tentar obter de variável de ambiente ou extrair da API Key
    const instanceId = process.env.ZAP_INSTANCE_ID || process.env.ZAP_INSTANCE || null;
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
        // Caso contrário, tentar usar instanceId ou tentar obter via API
        const parts = apiKey.split(':');
        let instance, token;
        
        if (parts.length > 1) {
          // Formato instance:token
          instance = parts[0];
          token = parts[1];
          console.log(`📱 [Zap API] Extraído instance e token da API Key (formato instance:token)`);
        } else {
          // Se não tem instanceId configurado e API Key não tem ':', tentar obter instanceId via API
          if (!instanceId) {
            console.log(`⚠️ [Zap API] ZAP_INSTANCE_ID não configurado. Tentando obter instanceId via API...`);
            
            // Tentar obter lista de instâncias usando o token como autenticação
            // Z-API pode ter endpoint para listar instâncias
            try {
              const baseUrl = apiUrl.replace('/v1', '').replace(/\/$/, '');
              const instancesEndpoint = `${baseUrl}/instances`;
              
              const instancesHeaders = {
                'Content-Type': 'application/json'
              };
              
              if (clientToken) {
                instancesHeaders['Client-Token'] = clientToken;
              }
              
              // Tentar GET /instances com token no header ou query
              const instancesResponse = await axios.get(instancesEndpoint, {
                headers: instancesHeaders,
                params: { token: apiKey },
                timeout: 10000
              }).catch(() => null);
              
              if (instancesResponse?.data) {
                // Se retornou lista de instâncias, usar a primeira
                const instances = Array.isArray(instancesResponse.data) ? instancesResponse.data : 
                                 (instancesResponse.data.instances || []);
                if (instances.length > 0) {
                  instance = instances[0].instance || instances[0].id || instances[0].name;
                  token = apiKey;
                  console.log(`✅ [Zap API] InstanceId obtido via API: ${instance}`);
                }
              }
            } catch (apiError) {
              console.log(`⚠️ [Zap API] Não foi possível obter instanceId via API: ${apiError.message}`);
            }
          }
          
          // Se ainda não tem instance, usar instanceId configurado ou tentar alternativas
          if (!instance) {
            if (instanceId) {
              instance = instanceId;
              token = apiKey;
              console.log(`📱 [Zap API] Usando ZAP_INSTANCE_ID configurado: ${instance}`);
            } else {
              // IMPORTANTE: Z-API requer instanceId válido
              // Se não configurado, tentar usar Client-Token como instanceId
              // OU configurar manualmente ZAP_INSTANCE_ID no .env
              if (clientToken) {
                // Tentar usar Client-Token como instanceId (algumas configurações Z-API usam isso)
                instance = clientToken;
                token = apiKey;
                console.log(`📱 [Zap API] Tentando usar Client-Token como instanceId: ${instance.substring(0, 10)}...`);
                console.log(`⚠️ [Zap API] Se falhar, configure ZAP_INSTANCE_ID no .env com o instanceId correto da sua conta Z-API`);
              } else {
                // Último recurso: usar 'default' (provavelmente não funcionará)
                instance = 'default';
                token = apiKey;
                console.log(`❌ [Zap API] ERRO: ZAP_INSTANCE_ID não configurado e Client-Token não disponível.`);
                console.log(`❌ [Zap API] Configure ZAP_INSTANCE_ID no .env com o instanceId correto da sua conta Z-API`);
                console.log(`❌ [Zap API] Tentando usar instance='default' como último recurso (provavelmente falhará)`);
              }
            }
          }
        }
        
        console.log(`📱 [Zap API] Tentando Z-API: instance=${instance}, token=${token ? token.substring(0, 10) + '...' : 'N/A'}`);
        
        // Z-API endpoint correto: https://api.z-api.io/instances/{instance}/token/{token}/send-text
        // OU: https://api.z-api.io/instances/{instance}/token/{token}/send-text (sem /v1)
        // Tentar primeiro sem /v1, depois com /v1 se necessário
        const baseUrl = apiUrl.replace('/v1', '').replace(/\/$/, '');
        
        // Tentar formato 1: /instances/{instance}/token/{token}/send-text
        let endpoint = `${baseUrl}/instances/${instance}/token/${token}/send-text`;
        
        console.log(`📱 [Zap API] Tentando endpoint Z-API formato 1: ${endpoint}`);
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
        
        // Tentar enviar mensagem
        try {
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
          console.log(`✅ [Zap API] Mensagem enviada com sucesso usando formato 1`);
        } catch (firstError) {
          // Se falhar, tentar formato alternativo: /v1/instances/{instance}/token/{token}/send-text
          if (firstError.response?.status === 404 || firstError.response?.data?.message?.includes('Unable to find')) {
            console.log(`⚠️ [Zap API] Formato 1 falhou, tentando formato alternativo...`);
            endpoint = `${apiUrl}/instances/${instance}/token/${token}/send-text`;
            console.log(`📱 [Zap API] Tentando endpoint Z-API formato 2: ${endpoint}`);
            
            try {
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
              console.log(`✅ [Zap API] Mensagem enviada com sucesso usando formato 2`);
            } catch (secondError) {
              // Se ambos falharem, lançar erro
              console.error(`❌ [Zap API] Ambos os formatos falharam. Erro formato 2:`, secondError.response?.data || secondError.message);
              throw secondError;
            }
          } else {
            throw firstError;
          }
        }
      } catch (error) {
        lastError = error;
        console.log(`⚠️ [Zap API] Z-API falhou: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
        console.log(`⚠️ [Zap API] Detalhes do erro:`, JSON.stringify(error.response?.data || {}, null, 2));
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
    
    // Verificar múltiplos indicadores de erro
    const hasError = responseData.error || 
                    responseData.is_error || 
                    responseData.status === 'error' ||
                    responseData.status === 'failed' ||
                    (responseData.message && (
                      responseData.message.toLowerCase().includes('error') ||
                      responseData.message.toLowerCase().includes('not found') ||
                      responseData.message.toLowerCase().includes('failed') ||
                      responseData.message.toLowerCase().includes('unable to find') ||
                      responseData.message.toLowerCase().includes('matching target')
                    )) ||
                    (response.status >= 400);
    
    // Se tem erro OU não tem indicador de sucesso, considerar como falha
    if (hasError || (!responseData.success && !responseData.result && !responseData.id && !responseData.messageId)) {
      // Resposta com erro mas não lançou exceção
      const errorMsg = responseData.message || responseData.error || 'Erro desconhecido';
      console.error(`❌ [Zap API] Resposta com erro: ${errorMsg}`);
      console.error('❌ [Zap API] Status HTTP:', response.status);
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

/**
 * Envia mensagem WhatsApp de conclusão de ticket via Zap API com anexo
 */
async function sendCompletionWhatsApp(ticketData, mensagemInteracao, anexo) {
  try {
    const apiKey = process.env.ZAP_API_KEY;
    const apiUrl = ZAP_API_URL;
    const instanceId = process.env.ZAP_INSTANCE_ID || process.env.ZAP_INSTANCE;
    const clientToken = process.env.ZAP_CLIENT_TOKEN;

    if (!apiKey) {
      throw new Error('Zap API Key não configurada');
    }

    if (!apiUrl) {
      throw new Error('Zap API URL não configurada');
    }

    const { telefone, codigo } = ticketData;

    if (!telefone) {
      throw new Error('Telefone do cliente não fornecido');
    }

    const phoneNumber = formatPhoneNumber(telefone);
    if (!phoneNumber) {
      throw new Error('Número de telefone inválido');
    }

    const message = createCompletionWhatsAppMessage(ticketData, mensagemInteracao);

    console.log(`📱 [Zap API] Enviando WhatsApp de conclusão para ${phoneNumber} (Ticket: ${codigo})`);
    if (anexo) {
      console.log(`📎 [Zap API] Anexo: ${anexo.nome} (${anexo.tipo})`);
    }

    // Primeiro enviar mensagem de texto
    let response;
    let successFormat = null;

    if (apiUrl.includes('z-api.io')) {
      const parts = apiKey.split(':');
      let instance, token;
      
      if (parts.length > 1) {
        // Formato: instance:token
        instance = parts[0];
        token = parts[1];
      } else if (instanceId) {
        // Se temos instanceId separado, usar ele
        instance = instanceId;
        token = apiKey;
      } else {
        // Fallback: tentar usar 'default' ou apiKey como instance
        instance = 'default';
        token = apiKey;
      }
      
      // Z-API formato correto: https://api.z-api.io/instances/{instance}/token/{token}/send-text
      const baseUrl = apiUrl.replace('/v1', '').replace(/\/$/, '');
      let textEndpoint = `${baseUrl}/instances/${instance}/token/${token}/send-text`;
      
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (clientToken) {
        headers['Client-Token'] = clientToken;
      }
      
      // Tentar enviar mensagem de texto primeiro
      console.log(`📱 [Zap API] Tentando enviar mensagem de texto primeiro...`);
      console.log(`📱 [Zap API] Endpoint: ${textEndpoint}`);
      console.log(`📱 [Zap API] Telefone: ${phoneNumber}`);
      console.log(`📱 [Zap API] Mensagem (primeiros 100 chars): ${message.substring(0, 100)}...`);
      try {
        response = await axios.post(
          textEndpoint,
          {
            phone: phoneNumber,
            message: message
          },
          {
            headers: headers,
            timeout: 15000
          }
        );
        console.log(`✅ [Zap API] Mensagem de texto enviada com sucesso:`, response.data);
      } catch (firstError) {
        console.error(`❌ [Zap API] Erro ao enviar mensagem de texto:`, firstError.response?.data || firstError.message);
        console.error(`❌ [Zap API] Endpoint usado: ${textEndpoint}`);
        console.error(`❌ [Zap API] Instance: ${instance}, Token: ${token ? token.substring(0, 10) + '...' : 'N/A'}`);
        throw firstError;
      }
      
      successFormat = 'Z-API';
      
      // Se tem anexo, enviar arquivo como documento anexado (base64 direto, não link)
      if (anexo && anexo.base64) {
        console.log(`📎 [Zap API] Enviando anexo via Z-API como ARQUIVO (base64 direto)...`);
        console.log(`📎 [Zap API] Nome do arquivo: ${anexo.nome || 'certidao.pdf'}`);
        console.log(`📎 [Zap API] Tamanho base64: ${anexo.base64.length} caracteres`);
        
        // Derivar extensão pelo tipo ou nome do arquivo
        const mime = anexo.tipo || 'application/pdf';
        const extFromMime = mime.split('/')[1] || 'pdf';
        const extFromName = (anexo.nome && anexo.nome.includes('.')) ? anexo.nome.split('.').pop() : null;
        const ext = (extFromName || extFromMime || 'pdf').toLowerCase();
        const fileName = anexo.nome || `certidao-${codigo}.${ext}`;

        // Limpar base64 se tiver prefixo data URI
        let base64Content = anexo.base64;
        if (base64Content.startsWith('data:')) {
          const prefixMatch = base64Content.match(/^data:([^;]+);base64,(.+)$/);
          if (prefixMatch) {
            base64Content = prefixMatch[2];
            console.log(`📎 [Zap API] Removido prefixo data URI. Tipo detectado: ${prefixMatch[1]}`);
          } else {
            base64Content = base64Content.split(',')[1] || base64Content;
            console.log(`📎 [Zap API] Removido prefixo data URI (fallback)`);
          }
        }

        // Validar que temos conteúdo base64 válido
        if (!base64Content || base64Content.length < 100) {
          console.error(`❌ [Zap API] Base64 inválido ou muito pequeno: ${base64Content?.length || 0} caracteres`);
          throw new Error('Conteúdo base64 do anexo inválido');
        }

        console.log(`📎 [Zap API] Base64 limpo, tamanho: ${base64Content.length} caracteres`);

        // Endpoint para envio de documento com base64
        // Z-API aceita base64 no campo "document" diretamente
        const documentEndpoint = `${baseUrl}/instances/${instance}/token/${token}/send-document/${ext}`;
        
        console.log(`📎 [Zap API] Endpoint: ${documentEndpoint}`);
        
        // Tentar enviar com base64 diretamente (conforme documentação Z-API)
        let sent = false;
        let lastError = null;

        // Formato 1: document com base64 direto (preferido - envia arquivo real)
        try {
          console.log(`📎 [Zap API] Tentando formato: base64 direto no campo document...`);
          const resp = await axios.post(
            documentEndpoint,
            {
              phone: phoneNumber,
              document: base64Content,
              fileName: fileName
            },
            {
              headers: headers,
              timeout: 60000 // 60 segundos para arquivos grandes
            }
          );
          
          if (resp.data && !resp.data.error) {
            console.log(`✅ [Zap API] Documento enviado com sucesso (base64 direto)`);
            console.log(`📎 [Zap API] Resposta:`, JSON.stringify(resp.data, null, 2));
            sent = true;
          } else if (resp.data?.error) {
            throw new Error(resp.data.error);
          }
        } catch (err) {
          lastError = err;
          console.log(`⚠️ [Zap API] Falha no formato base64 direto: ${err.message}`);
        }

        // Formato 2: Fallback com data URI completo
        if (!sent) {
          try {
            console.log(`📎 [Zap API] Tentando formato: data URI completo...`);
            const dataUri = `data:${mime};base64,${base64Content}`;
            const resp = await axios.post(
              documentEndpoint,
              {
                phone: phoneNumber,
                document: dataUri,
                fileName: fileName
              },
              {
                headers: headers,
                timeout: 60000
              }
            );
            
            if (resp.data && !resp.data.error) {
              console.log(`✅ [Zap API] Documento enviado com sucesso (data URI)`);
              console.log(`📎 [Zap API] Resposta:`, JSON.stringify(resp.data, null, 2));
              sent = true;
            } else if (resp.data?.error) {
              throw new Error(resp.data.error);
            }
          } catch (err) {
            lastError = err;
            console.log(`⚠️ [Zap API] Falha no formato data URI: ${err.message}`);
          }
        }

        // Formato 3: Endpoint genérico sem extensão
        if (!sent) {
          try {
            console.log(`📎 [Zap API] Tentando endpoint genérico /send-document...`);
            const genericEndpoint = `${baseUrl}/instances/${instance}/token/${token}/send-document`;
            const resp = await axios.post(
              genericEndpoint,
              {
                phone: phoneNumber,
                document: base64Content,
                fileName: fileName,
                extension: ext
              },
              {
                headers: headers,
                timeout: 60000
              }
            );
            
            if (resp.data && !resp.data.error) {
              console.log(`✅ [Zap API] Documento enviado com sucesso (endpoint genérico)`);
              console.log(`📎 [Zap API] Resposta:`, JSON.stringify(resp.data, null, 2));
              sent = true;
            } else if (resp.data?.error) {
              throw new Error(resp.data.error);
            }
          } catch (err) {
            lastError = err;
            console.log(`⚠️ [Zap API] Falha no endpoint genérico: ${err.message}`);
          }
        }

        if (!sent) {
          console.error(`❌ [Zap API] Todas as tentativas de envio de documento falharam`);
          throw new Error(`Anexo não enviado: ${lastError?.message || 'Todos os formatos falharam'}`);
        }
      } else if (anexo && !anexo.base64) {
        console.log(`⚠️ [Zap API] Anexo presente mas sem base64 - não é possível enviar arquivo`);
      } else {
        console.log(`⚠️ [Zap API] Nenhum anexo disponível para enviar`);
      }
    } else {
      // Para outras APIs, tentar formato genérico
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
      successFormat = 'Generic API';
    }

    console.log(`✅ [Zap API] Mensagem de conclusão enviada com sucesso para ${phoneNumber}`);
    
    return {
      success: true,
      messageId: response?.data?.id || 'N/A',
      phone: phoneNumber
    };
  } catch (error) {
    console.error('❌ [Zap API] Erro ao enviar WhatsApp de conclusão:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      phone: ticketData.telefone
    };
  }
}

module.exports = {
  sendWhatsAppMessage,
  sendCompletionWhatsApp,
  formatPhoneNumber
};
