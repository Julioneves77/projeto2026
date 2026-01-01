/**
 * Servidor de Sincronização de Tickets
 * Sincroniza tickets entre PORTAL (localhost:3000) e PLATAFORMA (localhost:8081)
 * Roda na porta 3001
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

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

