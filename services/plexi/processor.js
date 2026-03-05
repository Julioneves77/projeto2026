/**
 * Processador Plexi - processa ticket automaticamente via API Plexi
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const {
  ServiceRegistry,
  getRegistryKey,
  validateRequiredFields,
  formatMissingFieldsForUser,
  PLEXI_API_URL,
  PLEXI_API_KEY
} = require('./registry');

const LOCK_EXPIRY_MS = 10 * 60 * 1000; // 10 min
const POLL_INTERVAL_MS = 10 * 1000;     // 10s
const POLL_TIMEOUT_MS = 10 * 60 * 1000; // 10 min
const MAX_AUTO_RETRIES = 3;

function addHistoricoItem(tickets, ticketIndex, mensagem, statusNovo = null) {
  const ticket = tickets[ticketIndex];
  const historico = ticket.historico || [];
  const now = new Date().toISOString();
  const uniqueId = `h-${Date.now()}-${historico.length}-${Math.random().toString(36).substr(2, 9)}-plexi`;
  const historicoItem = {
    id: uniqueId,
    dataHora: now,
    autor: 'Sistema',
    statusAnterior: ticket.status,
    statusNovo: statusNovo || ticket.status,
    mensagem,
    enviouEmail: false,
    enviouWhatsApp: false
  };
  tickets[ticketIndex].historico = [...historico, historicoItem];
}

function getCpfCnpjDigits(ticket) {
  const cpf = (ticket.cpfSolicitante || '').replace(/\D/g, '');
  const df = ticket.dadosFormulario || {};
  const cpfForm = (df.cpf || '').replace(/\D/g, '');
  const cnpj = (df.cnpj || '').replace(/\D/g, '');
  const digits = cpf || cpfForm || cnpj || '000000';
  return digits.substring(0, 6);
}

function getPlexiHeaders() {
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
  if (PLEXI_API_KEY) headers.Authorization = `Bearer ${PLEXI_API_KEY}`;
  return headers;
}

function maskCpfCnpj(val) {
  if (!val || typeof val !== 'string') return '***';
  const digits = val.replace(/\D/g, '');
  if (digits.length < 4) return '***';
  return `${digits.slice(0, 3)}***${digits.slice(-2)}`;
}

async function callPlexiStart(endpoint, payload, ticketId) {
  if (!PLEXI_API_URL || !PLEXI_API_KEY || !endpoint) {
    throw new Error('PLEXI_API_URL e PLEXI_API_KEY não configurados. Configure as variáveis de ambiente para ativar a automação.');
  }
  try {
    const res = await axios.post(endpoint, payload, {
      timeout: 30000,
      headers: getPlexiHeaders(),
      validateStatus: (status) => status === 201 || status === 409
    });
    if (res.status === 409) {
      if (res.data?.requestId) return res.data;
      throw new Error('Plexi: consulta duplicada. Aguarde alguns minutos e tente novamente.');
    }
    return res.data;
  } catch (err) {
    if (err.response) {
      const status = err.response.status;
      const data = err.response.data;
      const msg = typeof data === 'object' ? (data?.message || data?.error || JSON.stringify(data)) : String(data);
      const e = new Error(`Plexi retornou ${status}: ${msg || err.message}`);
      e.plexiStatus = status;
      e.plexiErrors = data?.errors || data;
      throw e;
    }
    throw err;
  }
}

async function callPlexiResult(requestId) {
  if (!PLEXI_API_URL || !PLEXI_API_KEY) {
    throw new Error('PLEXI_API_URL e PLEXI_API_KEY não configurados');
  }
  const url = `${PLEXI_API_URL.replace(/\/$/, '')}/api/maestro/result/${requestId}`;
  const res = await axios.get(url, { timeout: 30000, headers: getPlexiHeaders(), validateStatus: () => true });
  if (res.status === 202) return { status: 'processing', done: false };
  if (res.status === 404) throw new Error('Consulta expirada ou não encontrada');
  if (res.status >= 400) throw new Error(`Plexi retornou ${res.status}: ${res.data?.message || res.statusText}`);
  return { ...res.data, status: res.data?.status || 'ready', done: true };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Salva alterações do ticket re-lendo o arquivo antes, para não sobrescrever
 * atualizações concorrentes (ex: usuário alterou para CONCLUIDO manualmente).
 */
function mergeAndSaveTicket(ticketId, ourTicket, options) {
  const { readTickets, saveTickets } = options;
  const fresh = readTickets();
  const idx = fresh.findIndex(t => t.id === ticketId || t.codigo === ticketId);
  if (idx < 0) return;
  const freshTicket = fresh[idx];
  let merged;
  if (freshTicket.status === 'CONCLUIDO' && ourTicket.status !== 'CONCLUIDO') {
    // Usuário concluiu manualmente: aplicar apenas campos de automação, preservar status/historico
    console.log(`[Plexi] Ticket ${freshTicket.codigo} já concluído manualmente, preservando status`);
    const automationFields = {
      automationStatus: ourTicket.automationStatus,
      automationLastError: ourTicket.automationLastError,
      automationLockAt: ourTicket.automationLockAt,
      automationLockOwner: ourTicket.automationLockOwner,
      automationAttempts: ourTicket.automationAttempts,
      plexiStatus: ourTicket.plexiStatus,
      plexiLastCheckAt: ourTicket.plexiLastCheckAt,
      plexiRequestId: ourTicket.plexiRequestId,
      plexiBlockedEmailSentAt: ourTicket.plexiBlockedEmailSentAt
    };
    merged = { ...freshTicket, ...automationFields };
  } else {
    merged = { ...freshTicket, ...ourTicket };
    // Preservar historico: manter itens do usuário e adicionar apenas os novos do Plexi
    const freshHistIds = new Set((freshTicket.historico || []).map(h => h.id).filter(Boolean));
    const ourNewHist = (ourTicket.historico || []).filter(h => h.id && !freshHistIds.has(h.id));
    if (ourNewHist.length > 0) {
      merged.historico = [...(freshTicket.historico || []), ...ourNewHist];
    }
  }
  fresh[idx] = merged;
  saveTickets(fresh);
}

async function processTicket(ticketId, options) {
  const {
    readTickets,
    saveTickets,
    storageCertidoesPath,
    sendPulseService
  } = options;

  const tickets = readTickets();
  const ticketIndex = tickets.findIndex(t => t.id === ticketId || t.codigo === ticketId);
  if (ticketIndex === -1) {
    console.warn(`[Plexi] Ticket não encontrado: ${ticketId}`);
    return;
  }

  const ticket = tickets[ticketIndex];
  const now = new Date().toISOString();
  const lockOwner = `worker-${process.pid}`;

  // 1. Idempotência - não processar ticket já concluído (manual ou automático)
  if (ticket.status === 'CONCLUIDO') {
    console.log(`[Plexi] Ticket ${ticket.codigo} já concluído, ignorando`);
    return;
  }

  // 2. Adquirir lock
  const lockAt = ticket.automationLockAt ? new Date(ticket.automationLockAt).getTime() : 0;
  const lockExpired = Date.now() - lockAt > LOCK_EXPIRY_MS;
  if (ticket.automationLockAt && !lockExpired && ticket.automationLockOwner !== lockOwner) {
    console.log(`[Plexi] Ticket ${ticket.codigo} em lock por ${ticket.automationLockOwner}`);
    return;
  }

  tickets[ticketIndex] = {
    ...ticket,
    automationLockAt: now,
    automationLockOwner: lockOwner,
    automationStatus: 'PROCESSING'
  };
  mergeAndSaveTicket(ticketId, tickets[ticketIndex], options);
  addHistoricoItem(tickets, ticketIndex, 'Plexi iniciado');
  mergeAndSaveTicket(ticketId, tickets[ticketIndex], options);

  try {
    // 3. Obter config do registry
    const registryKey = getRegistryKey(ticket.tipoCertidao);
    if (!registryKey || !ServiceRegistry[registryKey]) {
      const errMsg = `Esta certidão não possui API disponível na Plexi. Tipo: ${ticket.tipoCertidao}. A Plexi não oferece endpoint para este tipo de certidão.`;
      tickets[ticketIndex] = {
        ...tickets[ticketIndex],
        automationStatus: 'FAILED_FINAL',
        automationLastError: errMsg,
        automationLockAt: null,
        automationLockOwner: null
      };
      addHistoricoItem(tickets, ticketIndex, `Erro Plexi: ${errMsg}`);
      mergeAndSaveTicket(ticketId, tickets[ticketIndex], options);
      return;
    }

    const config = ServiceRegistry[registryKey];

    // 4. Validar requiredFields (pode ser array ou função para campos condicionais por estado)
    const requiredFields = typeof config.requiredFields === 'function' ? config.requiredFields(ticket) : config.requiredFields;
    const { valid, missing } = validateRequiredFields(ticket, requiredFields);
    if (!valid) {
      const labels = formatMissingFieldsForUser(missing);
      const errMsg = `Dados faltando: ${labels}. Adicione esses campos no formulário de solicitação ou preencha manualmente no ticket e reenvie.`;
      tickets[ticketIndex] = {
        ...tickets[ticketIndex],
        automationStatus: 'WAITING_DATA',
        automationLastError: errMsg,
        automationLockAt: null,
        automationLockOwner: null
      };
      addHistoricoItem(tickets, ticketIndex, `Plexi aguardando dados: ${missing.join(', ')}`);
      mergeAndSaveTicket(ticketId, tickets[ticketIndex], options);
      return;
    }

    // 5. Start Plexi (se não tem plexiRequestId)
    let plexiRequestId = ticket.plexiRequestId;
    if (!plexiRequestId) {
      const endpoint = typeof config.endpoint === 'function' ? config.endpoint(ticket) : config.endpoint;
      if (!PLEXI_API_URL || !PLEXI_API_KEY || !endpoint) {
        const errMsg = 'PLEXI_API_URL e PLEXI_API_KEY não configurados. Configure as variáveis de ambiente para ativar a automação.';
        tickets[ticketIndex] = {
          ...tickets[ticketIndex],
          automationStatus: 'FAILED_TRANSIENT',
          automationLastError: errMsg,
          automationLockAt: null,
          automationLockOwner: null
        };
        addHistoricoItem(tickets, ticketIndex, `Plexi: ${errMsg}`);
        mergeAndSaveTicket(ticketId, tickets[ticketIndex], options);
        return;
      }
      try {
        const payload = config.buildPayload(ticket);
        if (registryKey === 'ELEITORAL_NEGATIVA' && endpoint && endpoint.includes('trf3')) {
          const masked = payload.cpfCnpj ? { ...payload, cpfCnpj: maskCpfCnpj(payload.cpfCnpj) } : payload;
          console.log('[Plexi] TRF3 Eleitoral request', { endpoint, payload: masked, ticketId: ticket.codigo });
        }
        if (registryKey === 'ANTECEDENTES_PF') {
          const masked = { ...payload, cpf: payload.cpf ? maskCpfCnpj(payload.cpf) : payload.cpf };
          console.log('[Plexi] Antecedentes PF request', { endpoint, payload: masked, ticketId: ticket.codigo });
        }
        const result = await callPlexiStart(endpoint, payload, ticketId);
        plexiRequestId = result.requestId || result.id || result.plexiRequestId;
        if (!plexiRequestId) {
          throw new Error('Plexi não retornou requestId');
        }
        tickets[ticketIndex] = {
          ...tickets[ticketIndex],
          plexiRequestId,
          plexiStatus: 'started'
        };
        mergeAndSaveTicket(ticketId, tickets[ticketIndex], options);
      } catch (err) {
        const is422 = err.plexiStatus === 422;
        const is5xx = err.response && err.response.status >= 500;
        const isTimeout = err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT';
        const attempts = (ticket.automationAttempts || 0) + 1;
        const errMsg = err.message || String(err);

        if (registryKey === 'ELEITORAL_NEGATIVA' && (is422 || err.plexiErrors)) {
          console.log('[Plexi] TRF3 Eleitoral erro', { status: err.plexiStatus, errors: err.plexiErrors, ticketId: ticket.codigo });
        }
        if (registryKey === 'ANTECEDENTES_PF' && (is422 || err.plexiErrors)) {
          console.log('[Plexi] Antecedentes PF erro', { status: err.plexiStatus, errors: err.plexiErrors, ticketId: ticket.codigo });
        }

        if ((is5xx || isTimeout) && attempts < MAX_AUTO_RETRIES) {
          tickets[ticketIndex] = {
            ...tickets[ticketIndex],
            automationStatus: 'FAILED_TRANSIENT',
            automationLastError: errMsg,
            automationAttempts: attempts,
            automationLockAt: null,
            automationLockOwner: null
          };
          addHistoricoItem(tickets, ticketIndex, `Erro Plexi (tentativa ${attempts}): ${errMsg}`);
          mergeAndSaveTicket(ticketId, tickets[ticketIndex], options);
          return;
        }
        const automationStatus = is422 ? 'ERRO_DADOS' : (is5xx || isTimeout ? 'FAILED_TRANSIENT' : 'FAILED_FINAL');
        const lastError = is422 && err.plexiErrors ? `${errMsg} | Detalhes: ${JSON.stringify(err.plexiErrors)}` : errMsg;
        tickets[ticketIndex] = {
          ...tickets[ticketIndex],
          automationStatus,
          automationLastError: lastError,
          automationAttempts: attempts,
          automationLockAt: null,
          automationLockOwner: null
        };
        addHistoricoItem(tickets, ticketIndex, `Erro Plexi: ${errMsg}`);
        mergeAndSaveTicket(ticketId, tickets[ticketIndex], options);
        return;
      }
    }

    // 6. Polling (requer PLEXI_API_URL e PLEXI_API_KEY)
    if (!PLEXI_API_URL || !PLEXI_API_KEY) {
      const errMsg = 'PLEXI_API_URL e PLEXI_API_KEY não configurados. Configure para ativar automação.';
      tickets[ticketIndex] = {
        ...tickets[ticketIndex],
        automationStatus: 'FAILED_TRANSIENT',
        automationLastError: errMsg,
        automationLockAt: null,
        automationLockOwner: null
      };
      addHistoricoItem(tickets, ticketIndex, `Plexi: ${errMsg}`);
      mergeAndSaveTicket(ticketId, tickets[ticketIndex], options);
      return;
    }

    const pollTimeout = config.pollTimeoutMs ?? POLL_TIMEOUT_MS;
    const startPoll = Date.now();
    let pdfBase64 = null;
    let pdfUrl = null;

    if (registryKey === 'ANTECEDENTES_PF') {
      console.log(`[Plexi] Antecedentes PF: polling até ${Math.round(pollTimeout / 60000)} min`);
    }

    while (Date.now() - startPoll < pollTimeout) {
      await sleep(POLL_INTERVAL_MS);
      try {
        const resultRes = await callPlexiResult(plexiRequestId);
        tickets[ticketIndex] = {
          ...tickets[ticketIndex],
          plexiStatus: resultRes.status || resultRes.state,
          plexiLastCheckAt: new Date().toISOString()
        };
        mergeAndSaveTicket(ticketId, tickets[ticketIndex], options);

        if (resultRes.done) {
          // PDF pode vir em várias estruturas (Plexi pode retornar direto ou aninhado)
          const statusVal = resultRes.status || resultRes.data?.status;
          const rawPdf =
            resultRes.pdf ||
            resultRes.base64 ||
            resultRes.data?.pdf ||
            resultRes.data?.base64 ||
            resultRes.document ||
            (resultRes.data && (resultRes.data.document || resultRes.data.conteudo)) ||
            resultRes.result?.pdf ||
            resultRes.response?.pdf;
          pdfBase64 = Array.isArray(rawPdf) ? rawPdf[0] : (typeof rawPdf === 'string' ? rawPdf : null);
          pdfUrl = resultRes.url || resultRes.data?.url;
          // Só lançar erro se status=erro E não tiver PDF (quando tem PDF, enviamos mesmo em erro)
          if (statusVal === 'erro' && resultRes.mensagem && !pdfBase64 && !pdfUrl) {
            throw new Error(resultRes.mensagem);
          }
          if (registryKey === 'ANTECEDENTES_PF') {
            console.log(`[Plexi] Antecedentes PF: status=${statusVal}, pdf=${!!pdfBase64}, url=${!!pdfUrl}`);
            if (!pdfBase64 && !pdfUrl) {
              console.warn(`[Plexi] Antecedentes PF sem PDF - keys: ${Object.keys(resultRes).join(', ')}`);
            }
          }
          break;
        }
      } catch (err) {
        const is5xx = err.response && err.response.status >= 500;
        const isTimeout = err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT';
        const attempts = (tickets[ticketIndex].automationAttempts || 0) + 1;

        if ((is5xx || isTimeout) && attempts < MAX_AUTO_RETRIES) {
          tickets[ticketIndex] = {
            ...tickets[ticketIndex],
            automationStatus: 'FAILED_TRANSIENT',
            automationLastError: err.message,
            automationAttempts: attempts,
            automationLockAt: null,
            automationLockOwner: null
          };
          addHistoricoItem(tickets, ticketIndex, `Erro polling Plexi: ${err.message}`);
          mergeAndSaveTicket(ticketId, tickets[ticketIndex], options);
          return;
        }
        throw err;
      }
    }

    if (!pdfBase64 && !pdfUrl) {
      throw new Error('Timeout aguardando PDF da Plexi');
    }

    // 7. Obter PDF (se URL, fazer fetch)
    let pdfBuffer = null;
    if (pdfBase64) {
      pdfBuffer = Buffer.from(pdfBase64, 'base64');
    } else if (pdfUrl) {
      const pdfRes = await axios.get(pdfUrl, { responseType: 'arraybuffer' });
      pdfBuffer = Buffer.from(pdfRes.data);
    }

    // 8. Salvar em storage/certidoes
    const cpfDigits = getCpfCnpjDigits(ticket);
    const fileName = `${ticketId}_${cpfDigits}.pdf`;
    const fullPath = path.join(storageCertidoesPath, fileName);
    fs.mkdirSync(storageCertidoesPath, { recursive: true });
    fs.writeFileSync(fullPath, pdfBuffer);
    const pdfLocalPath = `storage/certidoes/${fileName}`;

    // 9. Enviar email (reuso do manual)
    if (!ticket.completedEmailSentAt) {
      const anexo = {
        nome: fileName,
        base64: pdfBuffer.toString('base64'),
        tipo: 'application/pdf'
      };
      await sendPulseService.sendCompletionEmail(ticket, '', anexo);
    }

    // 10. Marcar CONCLUIDO
    const completedNow = new Date().toISOString();
    tickets[ticketIndex] = {
      ...tickets[ticketIndex],
      status: 'CONCLUIDO',
      dataConclusao: completedNow,
      pdfLocalPath,
      completedEmailSentAt: completedNow,
      completedBy: 'AUTO_PLEXI',
      automationStatus: 'DONE',
      automationLastError: null,
      automationLockAt: null,
      automationLockOwner: null
    };
    addHistoricoItem(tickets, ticketIndex, 'Plexi concluído - email enviado', 'CONCLUIDO');
    mergeAndSaveTicket(ticketId, tickets[ticketIndex], options);

    console.log(`[Plexi] Ticket ${ticket.codigo} concluído automaticamente`);
  } catch (err) {
    console.error(`[Plexi] Erro ao processar ticket ${ticketId}:`, err);
    const errMsg = err.message || String(err);
    const attempts = (ticket.automationAttempts || 0) + 1;
    const isTransient = err.response && err.response.status >= 500;

    // Detectar bloqueio "já solicitado" - enviar email ao cliente com prazo
    const isBlockedJaSolicitado = errMsg && (
      /já foi solicitado|já solicitado|menos de 30 dias|30 dias/i.test(errMsg)
    );
    let plexiBlockedEmailSentAt = null;
    if (isBlockedJaSolicitado && !ticket.plexiBlockedEmailSentAt) {
      try {
        const emailResult = await sendPulseService.sendPlexiBlockedEmail(ticket, errMsg);
        if (emailResult.success) {
          plexiBlockedEmailSentAt = new Date().toISOString();
          addHistoricoItem(tickets, ticketIndex, `Plexi bloqueado - email enviado ao cliente com prazo`);
        }
      } catch (emailErr) {
        console.error(`[Plexi] Erro ao enviar email de bloqueio:`, emailErr);
      }
    }

    tickets[ticketIndex] = {
      ...tickets[ticketIndex],
      ...(plexiBlockedEmailSentAt && { plexiBlockedEmailSentAt }),
      automationStatus: isBlockedJaSolicitado ? 'BLOCKED' : (isTransient && attempts < MAX_AUTO_RETRIES ? 'FAILED_TRANSIENT' : 'FAILED_FINAL'),
      automationLastError: errMsg,
      automationAttempts: attempts,
      automationLockAt: null,
      automationLockOwner: null
    };
    addHistoricoItem(tickets, ticketIndex, `Erro Plexi: ${errMsg}`);
    mergeAndSaveTicket(ticketId, tickets[ticketIndex], options);
  }
}

module.exports = { processTicket };
