/**
 * Servidor de Sincronização de Tickets
 * Sincroniza tickets entre PORTAL (localhost:3000) e PLATAFORMA (localhost:8081)
 * Roda na porta 3001
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const sendPulseService = require('./services/sendPulseService');
const zapApiService = require('./services/zapApiService');

const app = express();
const PORT = 3001;
const TICKETS_FILE = path.join(__dirname, 'tickets-data.json');
const UPLOAD_DIR = path.join(__dirname, 'uploads');

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
// Servir arquivos enviados
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOAD_DIR));

/**
 * Upload de anexo em base64 e retorna URL local para uso no WhatsApp
 * Body: { fileName, base64, mimeType }
 */
app.post('/upload', async (req, res) => {
  try {
    const { fileName, base64, mimeType } = req.body || {};
    if (!base64 || !fileName) {
      return res.status(400).json({ success: false, error: 'fileName e base64 são obrigatórios' });
    }

    // limpar data URI se houver
    let base64Content = base64;
    const match = base64Content.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      base64Content = match[2];
    } else if (base64Content.includes(',')) {
      base64Content = base64Content.split(',')[1];
    }

    const buffer = Buffer.from(base64Content, 'base64');
    const ext = path.extname(fileName) || '.bin';
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    const filePath = path.join(UPLOAD_DIR, safeName);
    fs.writeFileSync(filePath, buffer);

    const url = `${process.env.PUBLIC_BASE_URL || 'http://localhost:3001'}/uploads/${safeName}`;
    res.json({ success: true, url, mimeType: mimeType || 'application/octet-stream', name: safeName });
  } catch (error) {
    console.error('❌ Erro ao fazer upload:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Inicializar arquivo de tickets se não existir
if (!fs.existsSync(TICKETS_FILE)) {
  fs.writeFileSync(TICKETS_FILE, JSON.stringify([]));
  console.log('📁 Arquivo de tickets criado:', TICKETS_FILE);
}

// Função auxiliar para ler tickets
function readTickets() {
  try {
    const data = fs.readFileSync(TICKETS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Erro ao ler tickets:', error);
    return [];
  }
}

// Função auxiliar para salvar tickets
function saveTickets(tickets) {
  try {
    fs.writeFileSync(TICKETS_FILE, JSON.stringify(tickets, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar tickets:', error);
    return false;
  }
}

// GET /tickets - Listar todos os tickets
app.get('/tickets', (req, res) => {
  console.log('📥 [SYNC] GET /tickets - Listando todos os tickets');
  const tickets = readTickets();
  console.log(`📥 [SYNC] Retornando ${tickets.length} tickets`);
  res.json(tickets);
});

// GET /tickets/:id - Buscar ticket específico
app.get('/tickets/:id', (req, res) => {
  const { id } = req.params;
  console.log(`📥 [SYNC] GET /tickets/${id} - Buscando ticket`);
  const tickets = readTickets();
  const ticket = tickets.find(t => t.id === id || t.codigo === id);
  
  if (ticket) {
    res.json(ticket);
  } else {
    res.status(404).json({ error: 'Ticket não encontrado' });
  }
});

// POST /tickets - Criar novo ticket
app.post('/tickets', (req, res) => {
  console.log('📤 [SYNC] POST /tickets - Criando novo ticket');
  const newTicket = req.body;
  
  if (!newTicket.id || !newTicket.codigo) {
    return res.status(400).json({ error: 'Ticket deve ter id e codigo' });
  }
  
  const tickets = readTickets();
  
  // Verificar se ticket já existe
  const existingIndex = tickets.findIndex(t => t.id === newTicket.id || t.codigo === newTicket.codigo);
  
  if (existingIndex !== -1) {
    console.log(`⚠️ [SYNC] Ticket ${newTicket.codigo} já existe, atualizando...`);
    tickets[existingIndex] = { ...tickets[existingIndex], ...newTicket };
  } else {
    console.log(`✅ [SYNC] Adicionando novo ticket ${newTicket.codigo}`);
    tickets.push(newTicket);
  }
  
  if (saveTickets(tickets)) {
    console.log(`✅ [SYNC] Ticket ${newTicket.codigo} salvo com sucesso`);
    res.json(newTicket);
  } else {
    res.status(500).json({ error: 'Erro ao salvar ticket' });
  }
});

// PUT /tickets/:id - Atualizar ticket existente
app.put('/tickets/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  console.log(`📤 [SYNC] PUT /tickets/${id} - Atualizando ticket`);
  
  const tickets = readTickets();
  const ticketIndex = tickets.findIndex(t => t.id === id || t.codigo === id);
  
  if (ticketIndex === -1) {
    return res.status(404).json({ error: 'Ticket não encontrado' });
  }
  
  const currentTicket = tickets[ticketIndex];
  
  // Mesclar histórico se fornecido
  if (updates.historico && Array.isArray(updates.historico)) {
    const existingHistorico = currentTicket.historico || [];
    updates.historico = [...existingHistorico, ...updates.historico];
  }
  
  tickets[ticketIndex] = { ...currentTicket, ...updates };
  
  if (saveTickets(tickets)) {
    console.log(`✅ [SYNC] Ticket ${id} atualizado com sucesso`);
    res.json(tickets[ticketIndex]);
  } else {
    res.status(500).json({ error: 'Erro ao atualizar ticket' });
  }
});

// POST /tickets/:id/send-confirmation - Enviar confirmação de pagamento (email e WhatsApp)
app.post('/tickets/:id/send-confirmation', async (req, res) => {
  const { id } = req.params;
  console.log(`📧 [SYNC] POST /tickets/${id}/send-confirmation - Enviando confirmação`);
  
  const tickets = readTickets();
  const ticketIndex = tickets.findIndex(t => t.id === id || t.codigo === id);
  
  if (ticketIndex === -1) {
    return res.status(404).json({ error: 'Ticket não encontrado' });
  }
  
  const ticket = tickets[ticketIndex];
  
  // Validar se status é EM_OPERACAO
  if (ticket.status !== 'EM_OPERACAO') {
    return res.status(400).json({ 
      error: 'Ticket deve estar com status EM_OPERACAO para enviar confirmação',
      currentStatus: ticket.status
    });
  }
  
  // Verificar se já foi enviado anteriormente (opcional - pode remover se quiser permitir reenvio)
  const historico = ticket.historico || [];
  const jaEnviouEmail = historico.some(h => h.enviouEmail === true);
  const jaEnviouWhatsApp = historico.some(h => h.enviouWhatsApp === true);
  
  if (jaEnviouEmail && jaEnviouWhatsApp) {
    console.log(`⚠️ [SYNC] Confirmação já foi enviada anteriormente para ticket ${ticket.codigo}`);
    return res.json({
      success: true,
      message: 'Confirmação já foi enviada anteriormente',
      email: { success: true, alreadySent: true },
      whatsapp: { success: true, alreadySent: true }
    });
  }
  
  // Enviar email e WhatsApp em paralelo
  const results = {
    email: null,
    whatsapp: null
  };
  
  try {
    // Enviar email (se ainda não foi enviado)
    if (!jaEnviouEmail && ticket.email) {
      console.log(`📧 [SYNC] Enviando email para ${ticket.email} (Ticket: ${ticket.codigo})`);
      try {
        results.email = await sendPulseService.sendConfirmationEmail(ticket);
        console.log(`📧 [SYNC] Resultado do email:`, results.email);
      } catch (error) {
        console.error(`❌ [SYNC] Erro ao chamar sendPulseService:`, error);
        results.email = { success: false, error: error.message || 'Erro ao enviar email' };
      }
    } else if (!ticket.email) {
      console.log(`⚠️ [SYNC] Email não disponível para ticket ${ticket.codigo}`);
      results.email = { success: false, error: 'Email não disponível' };
    } else {
      results.email = { success: true, alreadySent: true };
    }
    
    // Enviar WhatsApp (se ainda não foi enviado)
    if (!jaEnviouWhatsApp && ticket.telefone) {
      console.log(`📱 [SYNC] Enviando WhatsApp para ${ticket.telefone} (Ticket: ${ticket.codigo})`);
      try {
        results.whatsapp = await zapApiService.sendWhatsAppMessage(ticket);
        console.log(`📱 [SYNC] Resultado do WhatsApp:`, results.whatsapp);
      } catch (error) {
        console.error(`❌ [SYNC] Erro ao chamar zapApiService:`, error);
        results.whatsapp = { success: false, error: error.message || 'Erro ao enviar WhatsApp' };
      }
    } else if (!ticket.telefone) {
      console.log(`⚠️ [SYNC] Telefone não disponível para ticket ${ticket.codigo}`);
      results.whatsapp = { success: false, error: 'Telefone não disponível' };
    } else {
      results.whatsapp = { success: true, alreadySent: true };
    }
    
    // Atualizar histórico do ticket com resultado dos envios
    const historico = ticket.historico || [];
    const now = new Date().toISOString();
    const timestamp = Date.now();
    const historicoLength = historico.length;
    const newHistoricoItems = [];
    
    if (results.email && results.email.success && !jaEnviouEmail) {
      const uniqueId = `h-${timestamp}-${historicoLength}-${Math.random().toString(36).substr(2, 9)}-email-confirmation`;
      newHistoricoItems.push({
        id: uniqueId,
        dataHora: now,
        autor: 'Sistema',
        statusAnterior: ticket.status,
        statusNovo: ticket.status,
        mensagem: `Email de confirmação enviado para ${ticket.email}`,
        enviouEmail: true,
        enviouWhatsApp: false,
        dataEnvioEmail: now,
        dataEnvioWhatsApp: null
      });
    }
    
    if (results.whatsapp && results.whatsapp.success && !jaEnviouWhatsApp) {
      const uniqueId = `h-${timestamp}-${historicoLength + newHistoricoItems.length}-${Math.random().toString(36).substr(2, 9)}-whatsapp-confirmation`;
      newHistoricoItems.push({
        id: uniqueId,
        dataHora: now,
        autor: 'Sistema',
        statusAnterior: ticket.status,
        statusNovo: ticket.status,
        mensagem: `WhatsApp de confirmação enviado para ${ticket.telefone}`,
        enviouEmail: false,
        enviouWhatsApp: true,
        dataEnvioEmail: null,
        dataEnvioWhatsApp: now
      });
    }
    
    // Se ambos foram enviados, criar um item consolidado
    if (newHistoricoItems.length === 2 || 
        (results.email?.success && results.whatsapp?.success && !jaEnviouEmail && !jaEnviouWhatsApp)) {
      const uniqueId = `h-${timestamp}-${historicoLength + newHistoricoItems.length}-${Math.random().toString(36).substr(2, 9)}-both-confirmation`;
      newHistoricoItems.push({
        id: uniqueId,
        dataHora: now,
        autor: 'Sistema',
        statusAnterior: ticket.status,
        statusNovo: ticket.status,
        mensagem: 'Confirmação de pagamento enviada por email e WhatsApp',
        enviouEmail: results.email?.success || false,
        enviouWhatsApp: results.whatsapp?.success || false,
        dataEnvioEmail: results.email?.success ? now : null,
        dataEnvioWhatsApp: results.whatsapp?.success ? now : null
      });
    }
    
    // Adicionar ao histórico
    if (newHistoricoItems.length > 0) {
      tickets[ticketIndex].historico = [...historico, ...newHistoricoItems];
      saveTickets(tickets);
    }
    
    const allSuccess = (results.email?.success || results.email?.alreadySent) && 
                      (results.whatsapp?.success || results.whatsapp?.alreadySent);
    
    console.log(`✅ [SYNC] Confirmação processada para ticket ${ticket.codigo}:`, {
      email: results.email?.success ? '✅' : '❌',
      whatsapp: results.whatsapp?.success ? '✅' : '❌'
    });
    
    res.json({
      success: allSuccess,
      email: results.email,
      whatsapp: results.whatsapp,
      ticketCodigo: ticket.codigo
    });
    
  } catch (error) {
    console.error(`❌ [SYNC] Erro ao enviar confirmação para ticket ${ticket.codigo}:`, error);
    res.status(500).json({
      success: false,
      error: error.message,
      email: results.email,
      whatsapp: results.whatsapp
    });
  }
});

// POST /tickets/:id/send-completion - Enviar resultado de conclusão (email e WhatsApp)
app.post('/tickets/:id/send-completion', async (req, res) => {
  const { id } = req.params;
  const { mensagemInteracao, anexo } = req.body;
  
  console.log(`📧 [SYNC] ========== POST /tickets/${id}/send-completion ==========`);
  console.log(`📧 [SYNC] Enviando resultado de conclusão`);
  console.log(`📧 [SYNC] Body recebido:`, { 
    mensagemInteracao: mensagemInteracao ? `presente (${mensagemInteracao.length} chars)` : 'ausente', 
    anexo: anexo ? `presente (nome: ${anexo.nome || 'não especificado'}, tipo: ${anexo.tipo || 'não especificado'}, base64: ${anexo.base64 ? anexo.base64.length + ' chars' : 'ausente'})` : 'ausente' 
  });
  
  try {
    const tickets = readTickets();
    console.log(`📧 [SYNC] Total de tickets no arquivo: ${tickets.length}`);
    
    const ticketIndex = tickets.findIndex(t => t.id === id || t.codigo === id);
    
    if (ticketIndex === -1) {
      console.error(`❌ [SYNC] Ticket não encontrado: ${id}`);
      return res.status(404).json({ 
        error: 'Ticket não encontrado',
        ticketId: id,
        availableTickets: tickets.length
      });
    }
    
    const ticket = tickets[ticketIndex];
    console.log(`📧 [SYNC] Ticket encontrado: ${ticket.codigo}, Status: ${ticket.status}, Prioridade: ${ticket.prioridade}`);
    
    // Validar se status é CONCLUIDO
    if (ticket.status !== 'CONCLUIDO') {
      console.warn(`⚠️ [SYNC] Ticket ${ticket.codigo} não está com status CONCLUIDO. Status atual: ${ticket.status}`);
      return res.status(400).json({ 
        error: 'Ticket deve estar com status CONCLUIDO para enviar resultado',
        currentStatus: ticket.status,
        ticketCodigo: ticket.codigo
      });
    }
    
    // Verificar tipo de serviço para decidir se envia WhatsApp
    const shouldSendWhatsApp = ticket.prioridade === 'prioridade' || ticket.prioridade === 'premium';
    
    // Verificar se já foi enviado anteriormente (prevenir duplicatas)
    // IMPORTANTE: Verificar apenas histórico de CONCLUSÃO recente (últimas 24 horas)
    // Permitir reenvio se passou muito tempo ou se houve erro
    const historicoCompleto = ticket.historico || [];
    const agora = Date.now();
    const vinteQuatroHorasAtras = agora - (24 * 60 * 60 * 1000);
    
    // Verificar apenas envios recentes (últimas 24h) e bem-sucedidos
    const historicoRecente = historicoCompleto.filter(h => {
      if (!h.dataHora) return false;
      const dataHora = new Date(h.dataHora).getTime();
      return dataHora > vinteQuatroHorasAtras;
    });
    
    const jaEnviouEmailCompleto = historicoRecente.some(h => 
      h.statusNovo === 'CONCLUIDO' && 
      h.enviouEmail === true && 
      h.dataEnvioEmail &&
      // Verificar se não houve erro no último envio
      !h.mensagem?.includes('Erro') &&
      !h.mensagem?.includes('erro') &&
      !h.mensagem?.includes('falhou')
    );
    
    const jaEnviouWhatsAppCompleto = historicoRecente.some(h => 
      h.statusNovo === 'CONCLUIDO' && 
      h.enviouWhatsApp === true && 
      h.dataEnvioWhatsApp &&
      // Verificar se não houve erro no último envio
      !h.mensagem?.includes('Erro') &&
      !h.mensagem?.includes('erro') &&
      !h.mensagem?.includes('falhou')
    );
    
    // TEMPORARIAMENTE: Permitir reenvio sempre para testes e debug
    // TODO: Reativar verificação de duplicatas após confirmar funcionamento
    const FORCE_RESEND = true;
    
    console.log(`📧 [SYNC] Verificação de duplicatas (últimas 24h):`);
    console.log(`📧 [SYNC]   Histórico total: ${historicoCompleto.length} itens`);
    console.log(`📧 [SYNC]   Histórico recente: ${historicoRecente.length} itens`);
    console.log(`📧 [SYNC]   Email já enviado: ${jaEnviouEmailCompleto}`);
    console.log(`📧 [SYNC]   WhatsApp já enviado: ${jaEnviouWhatsAppCompleto}`);
    console.log(`📧 [SYNC]   FORCE_RESEND: ${FORCE_RESEND}`);
    
    if (!FORCE_RESEND) {
      // Se ambos já foram enviados COM SUCESSO nas últimas 24h, retornar early
      // Mas permitir reenvio se passou mais de 24h ou se houve erro
      if (shouldSendWhatsApp && jaEnviouEmailCompleto && jaEnviouWhatsAppCompleto) {
        console.log(`⚠️ [SYNC] Notificações já foram enviadas com sucesso nas últimas 24h para ticket ${ticket.codigo}`);
        console.log(`⚠️ [SYNC] Para forçar reenvio, aguarde 24h ou limpe o histórico do ticket`);
        return res.json({
          success: true,
          message: 'Notificações já foram enviadas nas últimas 24 horas',
          email: { success: true, alreadySent: true },
          whatsapp: { success: true, alreadySent: true },
          ticketCodigo: ticket.codigo
        });
      }
      
      // Se só email já foi enviado COM SUCESSO nas últimas 24h (tipo padrão), também retornar early
      if (!shouldSendWhatsApp && jaEnviouEmailCompleto) {
        console.log(`⚠️ [SYNC] Email já foi enviado com sucesso nas últimas 24h para ticket ${ticket.codigo}`);
        console.log(`⚠️ [SYNC] Para forçar reenvio, aguarde 24h ou limpe o histórico do ticket`);
        return res.json({
          success: true,
          message: 'Email já foi enviado nas últimas 24 horas',
          email: { success: true, alreadySent: true },
          whatsapp: { success: true, skipped: true, reason: 'Tipo de serviço padrão - apenas email enviado' },
          ticketCodigo: ticket.codigo
        });
      }
    } else {
      console.log(`🔄 [SYNC] FORCE_RESEND ativado - ignorando verificação de duplicatas para permitir testes`);
    }
    
    // Se chegou aqui, pode enviar (não foi enviado recentemente ou houve erro ou FORCE_RESEND)
    console.log(`✅ [SYNC] Prosseguindo com envio de notificações...`);
    
    // Função para gerar nome do arquivo
    function generateFileName(ticketData) {
      const nomeCliente = (ticketData.nomeCompleto || ticketData.nome || 'Cliente').replace(/[^a-zA-Z0-9]/g, '_');
      const tipoCertidaoMap = {
        'criminal-federal': 'Certidao_Criminal_Federal',
        'criminal-estadual': 'Certidao_Criminal_Estadual',
        'antecedentes-pf': 'Antecedente_PF',
        'eleitoral': 'Certidao_Eleitoral',
        'civil-federal': 'Certidao_Civil_Federal',
        'civil-estadual': 'Certidao_Civil_Estadual',
        'cnd': 'CND',
        'cpf-regular': 'CPF_Regular'
      };
      const tipoCertidao = tipoCertidaoMap[ticketData.tipoCertidao] || (ticketData.tipoCertidao ? ticketData.tipoCertidao.replace(/[^a-zA-Z0-9]/g, '_') : 'Certidao');
      return `${nomeCliente}_${tipoCertidao}.pdf`;
    }
    
    // Preparar anexo com nome correto se disponível
    let anexoPreparado = null;
    if (anexo && anexo.base64) {
      anexoPreparado = {
        ...anexo,
        nome: generateFileName(ticket)
      };
      console.log(`📎 [SYNC] Anexo preparado: ${anexoPreparado.nome}`);
    }
    
    const results = {
      email: null,
      whatsapp: null
    };
    
    try {
      // Sempre enviar email (FORCE_RESEND ignora verificação de duplicatas)
      if ((FORCE_RESEND || !jaEnviouEmailCompleto) && ticket.email) {
        console.log(`📧 [SYNC] Enviando email de conclusão para ${ticket.email} (Ticket: ${ticket.codigo})`);
        try {
          results.email = await sendPulseService.sendCompletionEmail(ticket, mensagemInteracao || '', anexoPreparado);
          console.log(`📧 [SYNC] Resultado do email:`, results.email);
        } catch (error) {
          console.error(`❌ [SYNC] Erro ao chamar sendPulseService:`, error);
          results.email = { success: false, error: error.message || 'Erro ao enviar email' };
        }
      } else if (jaEnviouEmailCompleto) {
        console.log(`ℹ️ [SYNC] Email já foi enviado anteriormente para ticket ${ticket.codigo}`);
        results.email = { success: true, alreadySent: true };
      } else {
        console.log(`⚠️ [SYNC] Email não disponível para ticket ${ticket.codigo}`);
        results.email = { success: false, error: 'Email não disponível' };
      }
      
      // Enviar WhatsApp apenas se for prioridade ou premium (FORCE_RESEND ignora verificação)
      if (shouldSendWhatsApp) {
        if ((FORCE_RESEND || !jaEnviouWhatsAppCompleto) && ticket.telefone && ticket.telefone.trim()) {
          console.log(`📱 [SYNC] Enviando WhatsApp de conclusão para ${ticket.telefone} (Ticket: ${ticket.codigo})`);
          try {
            results.whatsapp = await zapApiService.sendCompletionWhatsApp(ticket, mensagemInteracao || '', anexoPreparado);
            console.log(`📱 [SYNC] Resultado do WhatsApp:`, results.whatsapp);
          } catch (error) {
            console.error(`❌ [SYNC] Erro ao chamar zapApiService:`, error);
            results.whatsapp = { success: false, error: error.message || 'Erro ao enviar WhatsApp' };
          }
        } else if (jaEnviouWhatsAppCompleto) {
          console.log(`ℹ️ [SYNC] WhatsApp já foi enviado anteriormente para ticket ${ticket.codigo}`);
          results.whatsapp = { success: true, alreadySent: true };
        } else {
          console.log(`⚠️ [SYNC] Telefone não disponível para ticket ${ticket.codigo}`);
          results.whatsapp = { success: false, error: 'Telefone não disponível' };
        }
      } else {
        console.log(`ℹ️ [SYNC] Tipo de serviço é 'padrao', WhatsApp não será enviado (Ticket: ${ticket.codigo})`);
        results.whatsapp = { success: true, skipped: true, reason: 'Tipo de serviço padrão - apenas email enviado' };
      }
      
      // Atualizar histórico do ticket com resultado dos envios (apenas se realmente enviou agora)
      const historico = ticket.historico || [];
      const now = new Date().toISOString();
      const timestamp = Date.now();
      const historicoLength = historico.length;
      const newHistoricoItems = [];
      
      if (results.email && results.email.success && !results.email.alreadySent) {
        // Gerar ID único usando timestamp + índice do histórico + random string
        const uniqueId = `h-${timestamp}-${historicoLength}-${Math.random().toString(36).substr(2, 9)}-email-completion`;
        newHistoricoItems.push({
          id: uniqueId,
          dataHora: now,
          autor: 'Sistema',
          statusAnterior: ticket.status,
          statusNovo: ticket.status,
          mensagem: `Email de conclusão enviado para ${ticket.email}`,
          enviouEmail: true,
          enviouWhatsApp: false,
          dataEnvioEmail: now,
          dataEnvioWhatsApp: null
        });
      }
      
      if (results.whatsapp && results.whatsapp.success && !results.whatsapp.skipped && !results.whatsapp.alreadySent) {
        // Gerar ID único usando timestamp + índice do histórico + random string
        const uniqueId = `h-${timestamp}-${historicoLength + newHistoricoItems.length}-${Math.random().toString(36).substr(2, 9)}-whatsapp-completion`;
        newHistoricoItems.push({
          id: uniqueId,
          dataHora: now,
          autor: 'Sistema',
          statusAnterior: ticket.status,
          statusNovo: ticket.status,
          mensagem: `WhatsApp de conclusão enviado para ${ticket.telefone}`,
          enviouEmail: false,
          enviouWhatsApp: true,
          dataEnvioEmail: null,
          dataEnvioWhatsApp: now
        });
      }
      
      if (newHistoricoItems.length > 0) {
        tickets[ticketIndex].historico = [...historico, ...newHistoricoItems];
        saveTickets(tickets);
      }
      
      const allSuccess = results.email?.success && 
                        (results.whatsapp?.success || results.whatsapp?.skipped);
      
      console.log(`✅ [SYNC] Resultado de conclusão processado para ticket ${ticket.codigo}:`, {
        email: results.email?.success ? '✅' : '❌',
        whatsapp: results.whatsapp?.success ? '✅' : (results.whatsapp?.skipped ? '⏭️' : '❌')
      });
      
      res.json({
        success: allSuccess,
        email: results.email,
        whatsapp: results.whatsapp,
        ticketCodigo: ticket.codigo
      });
      
    } catch (error) {
      console.error(`❌ [SYNC] Erro ao enviar resultado de conclusão para ticket ${ticket?.codigo || id}:`, error);
      console.error(`❌ [SYNC] Stack trace:`, error.stack);
      res.status(500).json({
        success: false,
        error: error.message || 'Erro desconhecido ao processar solicitação',
        errorType: error.name || 'UnknownError',
        email: results.email,
        whatsapp: results.whatsapp,
        ticketCodigo: ticket?.codigo || id
      });
    }
  } catch (error) {
    console.error(`❌ [SYNC] Erro geral ao processar requisição:`, error);
    console.error(`❌ [SYNC] Stack trace:`, error.stack);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro desconhecido ao processar solicitação',
      errorType: error.name || 'UnknownError'
    });
  }
});

// GET /health - Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', tickets: readTickets().length });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor de sincronização rodando em http://localhost:${PORT}`);
  console.log(`📁 Arquivo de tickets: ${TICKETS_FILE}`);
  console.log(`📊 Tickets atuais: ${readTickets().length}`);
});

