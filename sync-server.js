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

// Middleware
app.use(cors());
app.use(express.json());

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
    const newHistoricoItems = [];
    const now = new Date().toISOString();
    
    if (results.email && results.email.success && !jaEnviouEmail) {
      newHistoricoItems.push({
        id: `h-${Date.now()}-email`,
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
      newHistoricoItems.push({
        id: `h-${Date.now()}-whatsapp`,
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
      newHistoricoItems.push({
        id: `h-${Date.now()}-confirmation`,
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
      const existingHistorico = ticket.historico || [];
      tickets[ticketIndex].historico = [...existingHistorico, ...newHistoricoItems];
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

