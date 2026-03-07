/**
 * Processador InfoSimples - processa ticket via API v2 InfoSimples
 * API síncrona: retorno imediato com data e site_receipts
 * Arquivos em site_receipts devem ser baixados e persistidos imediatamente (disponíveis 7 dias)
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const {
  ServiceRegistry,
  getRegistryKey,
  validateRequiredFields,
  formatMissingFieldsForUser,
  INFOSIMPLES_BASE_URL,
  INFOSIMPLES_TOKEN,
  INFOSIMPLES_DEFAULT_TIMEOUT,
} = require('./registry');

const LOCK_EXPIRY_MS = 10 * 60 * 1000;
const MAX_AUTO_RETRIES = 3;

const CODES_TRANSIENT = new Set([600, 605, 613, 615, 618]);
const CODES_FINAL = new Set([606, 607, 608, 610, 612, 614, 620, 621, 622]);

function addHistoricoItem(tickets, ticketIndex, mensagem, statusNovo = null) {
  const ticket = tickets[ticketIndex];
  const historico = ticket.historico || [];
  const now = new Date().toISOString();
  const uniqueId = `h-${Date.now()}-${historico.length}-${Math.random().toString(36).substr(2, 9)}-infosimples`;
  const historicoItem = {
    id: uniqueId,
    dataHora: now,
    autor: 'Sistema',
    statusAnterior: ticket.status,
    statusNovo: statusNovo || ticket.status,
    mensagem,
    enviouEmail: false,
    enviouWhatsApp: false,
  };
  tickets[ticketIndex].historico = [...historico, historicoItem];
}

function getCpfCnpjDigits(ticket) {
  const df = ticket.dadosFormulario || {};
  const cpf = (ticket.cpfSolicitante || df.cpf || '').replace(/\D/g, '');
  const cnpj = (df.cnpj || '').replace(/\D/g, '');
  const digits = cpf || cnpj || '000000';
  return digits.substring(0, 6);
}

function mergeAndSaveTicket(ticketId, ourTicket, options) {
  const { readTickets, saveTickets } = options;
  const fresh = readTickets();
  const idx = fresh.findIndex(t => t.id === ticketId || t.codigo === ticketId);
  if (idx < 0) return;
  const freshTicket = fresh[idx];
  let merged;
  if (freshTicket.status === 'CONCLUIDO' && ourTicket.status !== 'CONCLUIDO') {
    const automationFields = {
      automationStatus: ourTicket.automationStatus,
      automationLastError: ourTicket.automationLastError,
      automationLockAt: ourTicket.automationLockAt,
      automationLockOwner: ourTicket.automationLockOwner,
      automationAttempts: ourTicket.automationAttempts,
      infosimplesLastCheckAt: ourTicket.infosimplesLastCheckAt,
    };
    merged = { ...freshTicket, ...automationFields };
  } else {
    merged = { ...freshTicket, ...ourTicket };
    const freshHistIds = new Set((freshTicket.historico || []).map(h => h.id).filter(Boolean));
    const ourNewHist = (ourTicket.historico || []).filter(h => h.id && !freshHistIds.has(h.id));
    if (ourNewHist.length > 0) {
      merged.historico = [...(freshTicket.historico || []), ...ourNewHist];
    }
  }
  fresh[idx] = merged;
  saveTickets(fresh);
}

async function callInfoSimples(servico, payload, ticketId) {
  if (!INFOSIMPLES_TOKEN) {
    throw new Error('INFOSIMPLES_TOKEN não configurado. Configure a variável de ambiente.');
  }
  const url = `${INFOSIMPLES_BASE_URL}/${servico}`;
  const apiTimeoutSec = payload.timeout != null ? Math.min(600, Math.max(15, Number(payload.timeout))) : Math.floor(INFOSIMPLES_DEFAULT_TIMEOUT / 1000);
  const body = { token: INFOSIMPLES_TOKEN, timeout: apiTimeoutSec, ...payload };
  const clientTimeoutMs = Math.max(INFOSIMPLES_DEFAULT_TIMEOUT, (apiTimeoutSec + 30) * 1000);
  console.log(`[InfoSimples] POST ${servico} ticket=${ticketId} params=${Object.keys(payload).join(',')} timeout=${apiTimeoutSec}s`);
  if (process.env.NODE_ENV !== 'production' || process.env.LOG_INFOSIMPLES_PAYLOAD === '1') {
    const safe = { ...payload };
    if (safe.cpf) safe.cpf = `${String(safe.cpf).slice(0, 3)}***${String(safe.cpf).slice(-2)}`;
    console.log(`[InfoSimples] Payload (mascarado):`, JSON.stringify(safe));
  }
  const res = await axios.post(url, body, {
    timeout: clientTimeoutMs,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    validateStatus: () => true,
  });
  const data = res.data || {};
  const code = Number(data.code) || res.status;
  const codeMessage = data.code_message || data.message || '';
  const errors = Array.isArray(data.errors) ? data.errors : (data.errors ? [data.errors] : []);
  const responseData = Array.isArray(data.data) ? data.data : (data.data ? [data.data] : []);
  const siteReceipts = Array.isArray(data.site_receipts) ? data.site_receipts : (data.site_receipts ? [data.site_receipts] : []);

  return {
    code,
    code_message: codeMessage,
    data: responseData,
    errors,
    site_receipts: siteReceipts,
    header: data.header,
  };
}

function resolveUrl(baseUrl, relativeUrl) {
  if (!relativeUrl || relativeUrl.startsWith('data:')) return relativeUrl;
  if (/^https?:\/\//i.test(relativeUrl)) return relativeUrl;
  try {
    const base = new URL(baseUrl);
    return new URL(relativeUrl, base).href;
  } catch {
    return relativeUrl;
  }
}

/** URLs de fallback para brasões TRF2 quando o baseUrl não resolve */
const TRF2_BRASAO_FALLBACK_URLS = [
  'https://certidoes.trf2.jus.br/certidoes/img/brasaoColoridoTRF2.png',
  'https://www.trf2.jus.br/certidoes/img/brasaoColoridoTRF2.png',
];

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
  'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
};

async function fetchImageAsDataUri(url, extraHeaders = {}) {
  const res = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 15000,
    validateStatus: () => true,
    headers: { ...BROWSER_HEADERS, ...extraHeaders },
  });
  if (res.status !== 200 || !res.data) return null;
  const buf = Buffer.from(res.data);
  const ct = (res.headers['content-type'] || 'image/png').split(';')[0].trim().toLowerCase();
  const mime = ct.includes('png') ? 'png' : ct.includes('jpeg') || ct.includes('jpg') ? 'jpeg' : ct.includes('gif') ? 'gif' : 'png';
  const b64 = buf.toString('base64');
  return `data:image/${mime};base64,${b64}`;
}

async function embedHtmlImages(html, baseUrl) {
  const imgRegex = /<img([^>]*?)src=["']([^"']+)["']([^>]*)>/gi;
  let match;
  const replacements = [];
  while ((match = imgRegex.exec(html)) !== null) {
    const fullTag = match[0];
    const beforeSrc = match[1];
    const src = match[2];
    const afterSrc = match[3];
    if (src.startsWith('data:')) continue;
    const absUrl = resolveUrl(baseUrl, src);
    const isBrasaoTrf2 = /brasao|TRF2/i.test(src);
    const trf2Referer = { 'Referer': 'https://certidoes.trf2.jus.br/' };
    let dataUri = null;
    try {
      dataUri = await fetchImageAsDataUri(absUrl, isBrasaoTrf2 ? trf2Referer : {});
    } catch (err) {
      console.warn(`[InfoSimples] Imagem não incorporada (${String(src).slice(0, 50)}...):`, err.message);
    }
    if (!dataUri && isBrasaoTrf2) {
      for (const fallbackUrl of TRF2_BRASAO_FALLBACK_URLS) {
        try {
          dataUri = await fetchImageAsDataUri(fallbackUrl, trf2Referer);
          if (dataUri) {
            console.log(`[InfoSimples] Brasão TRF2 incorporado via fallback: ${fallbackUrl}`);
            break;
          }
        } catch (_) { /* ignorar */ }
      }
    }
    if (!dataUri && isBrasaoTrf2) {
      const localPath = path.join(__dirname, '..', '..', 'assets', 'brasao', 'brasaoColoridoTRF2.png');
      if (fs.existsSync(localPath)) {
        try {
          const buf = fs.readFileSync(localPath);
          const b64 = buf.toString('base64');
          dataUri = `data:image/png;base64,${b64}`;
          console.log(`[InfoSimples] Brasão TRF2 incorporado via asset local`);
        } catch (_) { /* ignorar */ }
      }
    }
    if (dataUri) {
      replacements.push({ fullTag, newTag: `<img${beforeSrc} src="${dataUri}"${afterSrc}>` });
    }
  }
  let result = html;
  for (const { fullTag, newTag } of replacements) {
    result = result.replace(fullTag, () => newTag);
  }
  return { html: result, embeddedCount: replacements.length };
}

async function downloadAndSaveReceipts(siteReceipts, ticketId, cpfDigits, storageCertidoesPath) {
  const savedPaths = [];
  for (let i = 0; i < siteReceipts.length; i++) {
    const url = typeof siteReceipts[i] === 'string' ? siteReceipts[i] : siteReceipts[i]?.url || siteReceipts[i]?.link;
    if (!url) continue;
    try {
      const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 60000 });
      let buf = Buffer.from(res.data);
      const contentType = (res.headers['content-type'] || '').toLowerCase();
      const ext = contentType.includes('pdf') ? 'pdf' : 'html';
      const suffix = siteReceipts.length > 1 ? `_${i + 1}` : '';
      const fileName = `${ticketId}_${cpfDigits}${suffix}.${ext}`;
      const fullPath = path.join(storageCertidoesPath, fileName);
      fs.mkdirSync(storageCertidoesPath, { recursive: true });
      if (ext === 'html') {
        const html = buf.toString('utf8');
        const { html: htmlWithImages, embeddedCount } = await embedHtmlImages(html, url);
        buf = Buffer.from(htmlWithImages, 'utf8');
        if (embeddedCount > 0) {
          console.log(`[InfoSimples] ${embeddedCount} imagem(ns) incorporada(s) no HTML (ex.: brasão)`);
        }
      }
      fs.writeFileSync(fullPath, buf);
      const relPath = `storage/certidoes/${fileName}`;
      savedPaths.push({ path: relPath, fullPath, contentType, url });
      console.log(`[InfoSimples] Baixado e salvo: ${fileName} (${buf.length} bytes)`);
    } catch (err) {
      console.error(`[InfoSimples] Erro ao baixar receipt ${url}:`, err.message);
    }
  }
  return savedPaths;
}

async function processTicket(ticketId, options) {
  const {
    readTickets,
    saveTickets,
    storageCertidoesPath,
    sendPulseService,
  } = options;

  const tickets = readTickets();
  const ticketIndex = tickets.findIndex(t => t.id === ticketId || t.codigo === ticketId);
  if (ticketIndex === -1) {
    console.warn(`[InfoSimples] Ticket não encontrado: ${ticketId}`);
    return;
  }

  const ticket = tickets[ticketIndex];
  const now = new Date().toISOString();
  const lockOwner = `worker-${process.pid}`;

  if (ticket.status === 'CONCLUIDO') {
    console.log(`[InfoSimples] Ticket ${ticket.codigo} já concluído, ignorando`);
    return;
  }

  const lockAt = ticket.automationLockAt ? new Date(ticket.automationLockAt).getTime() : 0;
  const lockExpired = Date.now() - lockAt > LOCK_EXPIRY_MS;
  if (ticket.automationLockAt && !lockExpired && ticket.automationLockOwner !== lockOwner) {
    console.log(`[InfoSimples] Ticket ${ticket.codigo} em lock por ${ticket.automationLockOwner}`);
    return;
  }

  tickets[ticketIndex] = {
    ...ticket,
    automationLockAt: now,
    automationLockOwner: lockOwner,
    automationStatus: 'PROCESSING',
  };
  mergeAndSaveTicket(ticketId, tickets[ticketIndex], options);
  addHistoricoItem(tickets, ticketIndex, 'InfoSimples iniciado');
  mergeAndSaveTicket(ticketId, tickets[ticketIndex], options);

  try {
    const registryKey = getRegistryKey(ticket.tipoCertidao);
    const config = registryKey && ServiceRegistry[registryKey];
    if (!config) {
      const errMsg = `Certidão não suportada pela InfoSimples. Tipo: ${ticket.tipoCertidao}.`;
      tickets[ticketIndex] = {
        ...tickets[ticketIndex],
        automationStatus: 'FAILED_FINAL',
        automationLastError: errMsg,
        automationLockAt: null,
        automationLockOwner: null,
      };
      addHistoricoItem(tickets, ticketIndex, `Erro InfoSimples: ${errMsg}`);
      mergeAndSaveTicket(ticketId, tickets[ticketIndex], options);
      return;
    }

    const requiredFields = typeof config.requiredFields === 'function' ? config.requiredFields(ticket) : config.requiredFields;
    const { valid, missing } = validateRequiredFields(ticket, requiredFields);
    if (!valid) {
      const labels = formatMissingFieldsForUser(missing);
      const errMsg = `Dados faltando: ${labels}.`;
      tickets[ticketIndex] = {
        ...tickets[ticketIndex],
        automationStatus: 'WAITING_DATA',
        automationLastError: errMsg,
        automationLockAt: null,
        automationLockOwner: null,
      };
      addHistoricoItem(tickets, ticketIndex, `InfoSimples aguardando dados: ${missing.join(', ')}`);
      mergeAndSaveTicket(ticketId, tickets[ticketIndex], options);
      return;
    }

    const payload = config.buildPayload(ticket);
    let result;

    if (process.env.INFOSIMPLES_MOCK_SUCCESS === '1') {
      console.log(`[InfoSimples] MOCK: simulando sucesso para ${ticket.codigo}`);
      const cpfDigits = getCpfCnpjDigits(ticket);
      const mockPdfName = `${ticketId}_${cpfDigits}.pdf`;
      const mockFullPath = path.join(storageCertidoesPath, mockPdfName);
      fs.mkdirSync(storageCertidoesPath, { recursive: true });
      const minimalPdf = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000101 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF', 'utf8');
      fs.writeFileSync(mockFullPath, minimalPdf);
      result = {
        code: 200,
        site_receipts: [{ path: `storage/certidoes/${mockPdfName}`, fullPath: mockFullPath, contentType: 'application/pdf', _mock: true }],
      };
    } else {
      const servico = config.getServico ? config.getServico(ticket) : config.servico;
      result = await callInfoSimples(servico, payload, ticket.codigo);
    }

    tickets[ticketIndex] = {
      ...tickets[ticketIndex],
      infosimplesLastCheckAt: now,
    };
    mergeAndSaveTicket(ticketId, tickets[ticketIndex], options);

    if (result.code === 200 || result.code === 201) {
      const siteReceipts = result.site_receipts || [];
      const cpfDigits = getCpfCnpjDigits(ticket);
      let savedPaths;

      if (siteReceipts[0]?._mock) {
        savedPaths = siteReceipts;
      } else {
        if (siteReceipts.length === 0) {
          console.warn(`[InfoSimples] Ticket ${ticket.codigo} sucesso mas sem site_receipts`);
        }
        savedPaths = await downloadAndSaveReceipts(siteReceipts, ticketId, cpfDigits, storageCertidoesPath);
      }
      const primaryPath = savedPaths[0]?.path || null;

      if (!primaryPath && siteReceipts.length > 0) {
        throw new Error('Falha ao baixar arquivos de site_receipts');
      }

      if (primaryPath && !ticket.completedEmailSentAt) {
        const primarySaved = savedPaths.find(s => s.path === primaryPath) || savedPaths[0];
        const pdfSaved = savedPaths.find(s => s.contentType?.includes('pdf')) || primarySaved;
        const fileToAttach = pdfSaved || primarySaved;
        let base64 = '';
        let mimeType = 'application/pdf';
        if (fileToAttach && fs.existsSync(fileToAttach.fullPath)) {
          base64 = fs.readFileSync(fileToAttach.fullPath).toString('base64');
          mimeType = fileToAttach.contentType?.includes('pdf') ? 'application/pdf' : 'text/html';
        }
        const fileName = path.basename(primaryPath);
        const anexo = { nome: fileName, base64, tipo: mimeType };
        if (base64) {
          await sendPulseService.sendCompletionEmail(ticket, '', anexo);
        }
      }

      const completedNow = new Date().toISOString();
      tickets[ticketIndex] = {
        ...tickets[ticketIndex],
        status: 'CONCLUIDO',
        dataConclusao: completedNow,
        pdfLocalPath: primaryPath || ticket.pdfLocalPath,
        completedEmailSentAt: completedNow,
        completedBy: 'AUTO_INFOSIMPLES',
        automationStatus: 'DONE',
        automationLastError: null,
        automationLockAt: null,
        automationLockOwner: null,
      };
      addHistoricoItem(tickets, ticketIndex, 'InfoSimples concluído - email enviado', 'CONCLUIDO');
      mergeAndSaveTicket(ticketId, tickets[ticketIndex], options);
      console.log(`[InfoSimples] Ticket ${ticket.codigo} concluído automaticamente`);
      return;
    }

    const errCode = result.code;
    const errDetails = Array.isArray(result.errors) ? result.errors.join('; ') : (result.errors ? String(result.errors) : '');
    let errMsg = [result.code_message, errDetails].filter(Boolean).join('. ') || `Código ${errCode}`;
    if (errCode === 600 && CODES_TRANSIENT.has(600)) {
      errMsg += ' O sistema tentará novamente automaticamente. Você também pode clicar em Reenviar.';
    }
    if (errCode !== 200) {
      const servico = config.getServico ? config.getServico(ticket) : config.servico;
      console.log(`[InfoSimples] Erro ${errCode} ticket=${ticket.codigo} servico=${servico} | ${errMsg}`);
    }
    if (errCode === 607 || errCode === 608) {
      console.log(`[InfoSimples] Erro ${errCode} - code_message: ${result.code_message} | errors: ${JSON.stringify(result.errors)}`);
    }
    const isTransient = CODES_TRANSIENT.has(errCode);
    const attempts = (ticket.automationAttempts || 0) + 1;

    if (isTransient && attempts < MAX_AUTO_RETRIES) {
      tickets[ticketIndex] = {
        ...tickets[ticketIndex],
        automationStatus: 'FAILED_TRANSIENT',
        automationLastError: errMsg,
        automationAttempts: attempts,
        automationLockAt: null,
        automationLockOwner: null,
      };
      addHistoricoItem(tickets, ticketIndex, `Erro InfoSimples (tentativa ${attempts}): ${errMsg}`);
      mergeAndSaveTicket(ticketId, tickets[ticketIndex], options);
      return;
    }

    const isBlocked = /já foi solicitado|já solicitado|menos de 30 dias|bloqueio|bloqueado/i.test(errMsg);
    let providerBlockedEmailSentAt = null;
    if (isBlocked && !ticket.providerBlockedEmailSentAt) {
      try {
        const emailResult = await sendPulseService.sendProviderBlockedEmail(ticket, errMsg);
        if (emailResult?.success) {
          providerBlockedEmailSentAt = new Date().toISOString();
          addHistoricoItem(tickets, ticketIndex, 'InfoSimples bloqueado - email enviado ao cliente');
        }
      } catch (emailErr) {
        console.error('[InfoSimples] Erro ao enviar email de bloqueio:', emailErr);
      }
    }

    const automationStatus = isBlocked ? 'BLOCKED' : (isTransient && attempts < MAX_AUTO_RETRIES ? 'FAILED_TRANSIENT' : 'FAILED_FINAL');
    tickets[ticketIndex] = {
      ...tickets[ticketIndex],
      ...(providerBlockedEmailSentAt && { providerBlockedEmailSentAt }),
      automationStatus,
      automationLastError: errMsg,
      automationAttempts: attempts,
      automationLockAt: null,
      automationLockOwner: null,
    };
    addHistoricoItem(tickets, ticketIndex, `Erro InfoSimples: ${errMsg}`);
    mergeAndSaveTicket(ticketId, tickets[ticketIndex], options);

  } catch (err) {
    console.error(`[InfoSimples] Erro ao processar ticket ${ticketId}:`, err);
    const errMsg = err.message || String(err);
    const attempts = (ticket.automationAttempts || 0) + 1;
    const isTransient = err.response && err.response.status >= 500;

    const isBlocked = /já foi solicitado|já solicitado|menos de 30 dias/i.test(errMsg);
    let providerBlockedEmailSentAt = null;
    if (isBlocked && !ticket.providerBlockedEmailSentAt) {
      try {
        const emailResult = await sendPulseService.sendProviderBlockedEmail(ticket, errMsg);
        if (emailResult?.success) providerBlockedEmailSentAt = new Date().toISOString();
      } catch (emailErr) {
        console.error('[InfoSimples] Erro ao enviar email de bloqueio:', emailErr);
      }
    }

    tickets[ticketIndex] = {
      ...tickets[ticketIndex],
      ...(providerBlockedEmailSentAt && { providerBlockedEmailSentAt }),
      automationStatus: isBlocked ? 'BLOCKED' : (isTransient && attempts < MAX_AUTO_RETRIES ? 'FAILED_TRANSIENT' : 'FAILED_FINAL'),
      automationLastError: errMsg,
      automationAttempts: attempts,
      automationLockAt: null,
      automationLockOwner: null,
    };
    addHistoricoItem(tickets, ticketIndex, `Erro InfoSimples: ${errMsg}`);
    mergeAndSaveTicket(ticketId, tickets[ticketIndex], options);
  }
}

module.exports = { processTicket };
