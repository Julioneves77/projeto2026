/**
 * Servidor de Sincronização de Tickets
 * Sincroniza tickets entre PORTAL (localhost:3000) e PLATAFORMA (localhost:8081)
 * Roda na porta 3001
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const fs = require('fs');
const path = require('path');
const sendPulseService = require('./services/sendPulseService');
const zapApiService = require('./services/zapApiService');
const { validateEmail, validatePhone } = require('./utils/validators');
const logger = require('./utils/logger');
const { validateTicket, validateUpload, validateInteraction } = require('./utils/validation');

const app = express();
const PORT = process.env.PORT || 3001;
const TICKETS_FILE = path.join(__dirname, 'tickets-data.json');
const UPLOAD_DIR = path.join(__dirname, 'uploads');

// Configuração de CORS
const corsOptions = {
  origin: process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
    : '*', // Em desenvolvimento permite tudo, em produção deve ser configurado
  credentials: true,
  optionsSuccessStatus: 200
};

// Configuração de Rate Limiting
// Limite geral: 100 requisições por minuto por IP
const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 100, // máximo de 100 requisições por IP por minuto
  message: {
    error: 'Muitas requisições',
    message: 'Limite de requisições excedido. Tente novamente em alguns instantes.'
  },
  standardHeaders: true, // Retorna informações de rate limit nos headers `RateLimit-*`
  legacyHeaders: false, // Desabilita headers `X-RateLimit-*`
});

// Limite para criação de tickets: 10 requisições por minuto por IP
const createTicketLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // máximo de 10 requisições por IP por minuto
  message: {
    error: 'Muitas requisições',
    message: 'Limite de criação de tickets excedido. Tente novamente em alguns instantes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limite para upload de arquivos: 5 requisições por minuto por IP
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 5, // máximo de 5 requisições por IP por minuto
  message: {
    error: 'Muitas requisições',
    message: 'Limite de uploads excedido. Tente novamente em alguns instantes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware de segurança (Helmet)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Permitir uploads de arquivos
}));

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Middleware de logging de requisições
app.use((req, res, next) => {
  const startTime = Date.now();
  
  // Log quando resposta terminar
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    logger.logRequest(req, res, responseTime);
  });
  
  next();
});

// Aplicar rate limiting geral em todas as rotas (exceto health check e root)
app.use((req, res, next) => {
  if (req.path === '/health' || req.path === '/') {
    return next(); // Health check e root não têm rate limiting
  }
  generalLimiter(req, res, next);
});

// Middleware de autenticação básica (opcional via API Key)
const authenticateRequest = (req, res, next) => {
  // Se SYNC_SERVER_API_KEY não estiver configurado, permite todas as requisições (modo desenvolvimento)
  if (!process.env.SYNC_SERVER_API_KEY) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('⚠️ [SYNC] SYNC_SERVER_API_KEY não configurado em produção! API está aberta.');
    }
    return next();
  }

  // Verificar API Key no header
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  
  if (!apiKey || apiKey !== process.env.SYNC_SERVER_API_KEY) {
    return res.status(401).json({ 
      error: 'Não autorizado',
      message: 'API Key inválida ou ausente. Configure o header X-API-Key ou Authorization: Bearer <key>'
    });
  }

  next();
};

// Aplicar autenticação em todas as rotas exceto health check
app.use((req, res, next) => {
  if (req.path === '/health' || req.path === '/') {
    return next();
  }
  authenticateRequest(req, res, next);
});
// Servir arquivos enviados
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOAD_DIR));

// Health check endpoint (sem autenticação)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT
  });
});

// Root endpoint (sem autenticação)
app.get('/', (req, res) => {
  res.json({ 
    message: 'Sync Server API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      tickets: '/tickets',
      upload: '/upload'
    }
  });
});

/**
 * Upload de anexo em base64 e retorna URL local para uso no WhatsApp
 * Body: { fileName, base64, mimeType }
 * Rate Limit: 5 requisições por minuto por IP
 */
app.post('/upload', uploadLimiter, async (req, res) => {
  try {
    const { fileName, base64, mimeType } = req.body || {};
    
    // Validar dados de upload
    const validation = validateUpload({ fileName, base64 });
    if (!validation.isValid) {
      logger.warn('Upload validation failed', { errors: validation.errors, ip: req.ip });
      return res.status(400).json({ 
        success: false, 
        error: 'Dados de upload inválidos',
        errors: validation.errors 
      });
    }
    
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

    const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || `http://localhost:${PORT}`;
    const url = `${PUBLIC_BASE_URL}/uploads/${safeName}`;
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
    logger.logError(error, { function: 'saveTickets', ticketsCount: tickets.length });
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

// GET /tickets/generate-code - Gerar próximo código disponível
// Usa um contador simples em memória para evitar duplicatas em requisições simultâneas
let lastGeneratedNumber = 0;

app.get('/tickets/generate-code', (req, res) => {
  logger.info('GET /tickets/generate-code - Gerando próximo código', { ip: req.ip });
  try {
    const tickets = readTickets();
    
    // Encontrar o maior número de código existente nos tickets salvos
    let maxNumberInFile = 0;
    tickets.forEach(ticket => {
      if (ticket.codigo) {
        const match = ticket.codigo.match(/TK-(\d+)/);
        if (match) {
          const number = parseInt(match[1], 10);
          if (number > maxNumberInFile) {
            maxNumberInFile = number;
          }
        }
      }
    });
    
    // Usar o maior entre o arquivo e o último gerado (para evitar duplicatas em requisições simultâneas)
    const maxNumber = Math.max(maxNumberInFile, lastGeneratedNumber);
    
    // Gerar próximo código e atualizar contador
    const nextNumber = maxNumber + 1;
    lastGeneratedNumber = nextNumber; // Atualizar contador em memória
    const codigo = `TK-${nextNumber.toString().padStart(3, '0')}`;
    
    console.log(`✅ [SYNC] Próximo código gerado: ${codigo} (último no arquivo: TK-${maxNumberInFile.toString().padStart(3, '0')}, último gerado: TK-${maxNumber.toString().padStart(3, '0')})`);
    res.json({ codigo });
  } catch (error) {
    console.error('❌ [SYNC] Erro ao gerar código:', error);
    res.status(500).json({ error: 'Erro ao gerar código de ticket' });
  }
});

// GET /tickets/:id - Buscar ticket específico
app.get('/tickets/:id', (req, res) => {
  const { id } = req.params;
  logger.info(`GET /tickets/${id} - Buscando ticket`, { ip: req.ip });
  const tickets = readTickets();
  const ticket = tickets.find(t => t.id === id || t.codigo === id);
  
  if (ticket) {
    res.json(ticket);
  } else {
    logger.warn(`Ticket não encontrado: ${id}`, { ip: req.ip });
    res.status(404).json({ error: 'Ticket não encontrado' });
  }
});

// POST /tickets - Criar novo ticket
// Rate Limit: 10 requisições por minuto por IP
app.post('/tickets', createTicketLimiter, (req, res) => {
  logger.info('POST /tickets - Criando novo ticket', { ip: req.ip });
  const newTicket = req.body;
  
  // Validar ticket
  const validation = validateTicket(newTicket);
  if (!validation.isValid) {
    logger.warn('Ticket validation failed', { errors: validation.errors, ip: req.ip });
    return res.status(400).json({ 
      error: 'Dados do ticket inválidos',
      errors: validation.errors 
    });
  }
  
  // Usar ticket sanitizado
  const sanitizedTicket = validation.sanitized;
  
  if (!sanitizedTicket.id || !sanitizedTicket.codigo) {
    return res.status(400).json({ error: 'Ticket deve ter id e codigo' });
  }
  
  const tickets = readTickets();
  
  // Verificar se ticket já existe
  const existingByCode = tickets.find(t => t.codigo === sanitizedTicket.codigo);
  const existingById = tickets.find(t => t.id === sanitizedTicket.id);
  
  // Se mesmo ID, é uma atualização do mesmo ticket (permitir)
  if (existingById && existingById.id === sanitizedTicket.id) {
    logger.info(`Ticket ${sanitizedTicket.codigo} (ID: ${sanitizedTicket.id}) já existe com mesmo ID, atualizando...`);
    const existingIndex = tickets.findIndex(t => t.id === sanitizedTicket.id);
    tickets[existingIndex] = { ...tickets[existingIndex], ...sanitizedTicket };
    
    if (saveTickets(tickets)) {
      logger.info(`Ticket ${sanitizedTicket.codigo} atualizado com sucesso`);
      res.json(sanitizedTicket);
    } else {
      logger.error('Erro ao salvar ticket', { codigo: sanitizedTicket.codigo });
      res.status(500).json({ error: 'Erro ao salvar ticket' });
    }
    return;
  }
  
  // Se código já existe mas ID é diferente, é uma duplicata (rejeitar)
  if (existingByCode && existingByCode.id !== sanitizedTicket.id) {
    logger.warn('Tentativa de criar ticket duplicado', { 
      codigo: sanitizedTicket.codigo,
      existingId: existingByCode.id,
      newId: sanitizedTicket.id,
      ip: req.ip
    });
    return res.status(409).json({ 
      error: 'Código de ticket já existe',
      conflict: {
        codigo: sanitizedTicket.codigo,
        existingId: existingByCode.id,
        newId: sanitizedTicket.id,
        message: 'Um ticket com este código já existe. Use um código diferente ou atualize o ticket existente.'
      }
    });
  }
  
  // Ticket novo, adicionar
  logger.info(`Adicionando novo ticket ${sanitizedTicket.codigo}`);
  tickets.push(sanitizedTicket);
  
  if (saveTickets(tickets)) {
    logger.info(`Ticket ${sanitizedTicket.codigo} salvo com sucesso`);
    res.json(sanitizedTicket);
  } else {
    logger.error('Erro ao salvar ticket', { codigo: sanitizedTicket.codigo });
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
  
  // Mesclar histórico se fornecido (evitando duplicação baseado em IDs)
  if (updates.historico && Array.isArray(updates.historico)) {
    const existingHistorico = currentTicket.historico || [];
    
    // Criar Set com IDs existentes para verificação rápida
    const existingIds = new Set(existingHistorico.map(h => h.id).filter(id => id));
    
    // Filtrar apenas itens novos (que não existem no histórico atual)
    const newHistoricoItems = updates.historico.filter(item => {
      // Se item não tem ID, sempre adicionar (será gerado depois)
      if (!item.id) return true;
      // Se ID já existe, não adicionar (evitar duplicação)
      return !existingIds.has(item.id);
    });
    
    // Se todos os itens já existem, não mesclar
    if (newHistoricoItems.length === 0) {
      console.log(`⚠️ [SYNC] Todos os itens do histórico já existem, ignorando mesclagem`);
      // Remover histórico dos updates para não sobrescrever
      delete updates.historico;
    } else {
      // Mesclar apenas itens novos
      updates.historico = [...existingHistorico, ...newHistoricoItems];
      console.log(`✅ [SYNC] Mesclando histórico: ${existingHistorico.length} existentes + ${newHistoricoItems.length} novos = ${updates.historico.length} total`);
    }
  }
  
  tickets[ticketIndex] = { ...currentTicket, ...updates };
  
  if (saveTickets(tickets)) {
    logger.info(`Ticket ${id} atualizado com sucesso`);
    res.json(tickets[ticketIndex]);
  } else {
    logger.error('Erro ao atualizar ticket', { ticketId: id });
    res.status(500).json({ error: 'Erro ao atualizar ticket' });
  }
});

// POST /tickets/:id/send-confirmation - Enviar confirmação de pagamento (email e WhatsApp)
app.post('/tickets/:id/send-confirmation', async (req, res) => {
  const { id } = req.params;
  logger.info(`POST /tickets/${id}/send-confirmation - Enviando confirmação`, { ip: req.ip });
  
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
      // Validar formato de email antes de enviar
      if (!validateEmail(ticket.email)) {
        console.error(`❌ [SYNC] Email inválido para ticket ${ticket.codigo}: ${ticket.email}`);
        results.email = { success: false, error: `Formato de email inválido: ${ticket.email}` };
      } else {
        console.log(`📧 [SYNC] Enviando email para ${ticket.email} (Ticket: ${ticket.codigo})`);
        try {
          results.email = await sendPulseService.sendConfirmationEmail(ticket);
          console.log(`📧 [SYNC] Resultado do email:`, results.email);
        } catch (error) {
          console.error(`❌ [SYNC] Erro ao chamar sendPulseService:`, error);
          results.email = { success: false, error: error.message || 'Erro ao enviar email' };
        }
      }
    } else if (!ticket.email) {
      console.log(`⚠️ [SYNC] Email não disponível para ticket ${ticket.codigo}`);
      results.email = { success: false, error: 'Email não disponível' };
    } else {
      results.email = { success: true, alreadySent: true };
    }
    
    // Enviar WhatsApp (se ainda não foi enviado)
    if (!jaEnviouWhatsApp && ticket.telefone) {
      // Validar formato de telefone antes de enviar
      if (!validatePhone(ticket.telefone)) {
        console.error(`❌ [SYNC] Telefone inválido para ticket ${ticket.codigo}: ${ticket.telefone}`);
        results.whatsapp = { success: false, error: `Formato de telefone inválido: ${ticket.telefone}` };
      } else {
        console.log(`📱 [SYNC] Enviando WhatsApp para ${ticket.telefone} (Ticket: ${ticket.codigo})`);
        try {
          results.whatsapp = await zapApiService.sendWhatsAppMessage(ticket);
          console.log(`📱 [SYNC] Resultado do WhatsApp:`, results.whatsapp);
        } catch (error) {
          logger.logError(error, { service: 'zapApiService', ticketCodigo: ticket.codigo });
          results.whatsapp = { success: false, error: error.message || 'Erro ao enviar WhatsApp' };
        }
      }
    } else if (!ticket.telefone) {
      console.log(`⚠️ [SYNC] Telefone não disponível para ticket ${ticket.codigo}`);
      results.whatsapp = { success: false, error: 'Telefone não disponível' };
    } else {
      results.whatsapp = { success: true, alreadySent: true };
    }
    
    // Atualizar histórico do ticket com resultado dos envios (consolidado)
    const historico = ticket.historico || [];
    const now = new Date().toISOString();
    const timestamp = Date.now();
    const historicoLength = historico.length;
    
    // Verificar se ambos foram enviados para criar apenas 1 item consolidado
    const emailEnviado = results.email && results.email.success && !jaEnviouEmail;
    const whatsappEnviado = results.whatsapp && results.whatsapp.success && !jaEnviouWhatsApp;
    
    if (emailEnviado || whatsappEnviado) {
      const uniqueId = `h-${timestamp}-${historicoLength}-${Math.random().toString(36).substr(2, 9)}-confirmation`;
      
      // Criar apenas 1 item consolidado
      const historicoItem = {
        id: uniqueId,
        dataHora: now,
        autor: 'Sistema',
        statusAnterior: ticket.status,
        statusNovo: ticket.status,
        mensagem: emailEnviado && whatsappEnviado 
          ? 'Confirmação de pagamento enviada por email e WhatsApp'
          : emailEnviado 
          ? 'Confirmação de pagamento enviada por email'
          : 'Confirmação de pagamento enviada por WhatsApp',
        enviouEmail: emailEnviado || false,
        enviouWhatsApp: whatsappEnviado || false,
        dataEnvioEmail: emailEnviado ? now : null,
        dataEnvioWhatsApp: whatsappEnviado ? now : null
      };
      
      tickets[ticketIndex].historico = [...historico, historicoItem];
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
  
  logger.info(`POST /tickets/${id}/send-completion - Enviando resultado de conclusão`, {
    ip: req.ip,
    mensagemLength: mensagemInteracao ? mensagemInteracao.length : 0,
    anexoPresente: !!anexo
  });
  
  // Validar mensagem de interação
  const interactionValidation = validateInteraction({ mensagemInteracao });
  if (!interactionValidation.isValid) {
    logger.warn('Interaction validation failed', { errors: interactionValidation.errors, ip: req.ip });
    return res.status(400).json({
      success: false,
      error: 'Dados de interação inválidos',
      errors: interactionValidation.errors
    });
  }
  
  try {
    const tickets = readTickets();
    logger.debug(`Total de tickets no arquivo: ${tickets.length}`);
    
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
    
    // Permitir reenvio forçado apenas se configurado via variável de ambiente
    // Em produção, deixe FORCE_RESEND=false ou não defina a variável
    const FORCE_RESEND = process.env.FORCE_RESEND === 'true' || process.env.FORCE_RESEND === '1';
    
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
        // Validar formato de email antes de enviar
        if (!validateEmail(ticket.email)) {
          console.error(`❌ [SYNC] Email inválido para ticket ${ticket.codigo}: ${ticket.email}`);
          results.email = { success: false, error: `Formato de email inválido: ${ticket.email}` };
        } else {
          console.log(`📧 [SYNC] Enviando email de conclusão para ${ticket.email} (Ticket: ${ticket.codigo})`);
          try {
            results.email = await sendPulseService.sendCompletionEmail(ticket, mensagemInteracao || '', anexoPreparado);
            console.log(`📧 [SYNC] Resultado do email:`, results.email);
          } catch (error) {
            console.error(`❌ [SYNC] Erro ao chamar sendPulseService:`, error);
            results.email = { success: false, error: error.message || 'Erro ao enviar email' };
          }
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
          // Validar formato de telefone antes de enviar
          if (!validatePhone(ticket.telefone)) {
            console.error(`❌ [SYNC] Telefone inválido para ticket ${ticket.codigo}: ${ticket.telefone}`);
            results.whatsapp = { success: false, error: `Formato de telefone inválido: ${ticket.telefone}` };
          } else {
            console.log(`📱 [SYNC] Enviando WhatsApp de conclusão para ${ticket.telefone} (Ticket: ${ticket.codigo})`);
            try {
              results.whatsapp = await zapApiService.sendCompletionWhatsApp(ticket, mensagemInteracao || '', anexoPreparado);
              console.log(`📱 [SYNC] Resultado do WhatsApp:`, results.whatsapp);
            } catch (error) {
              logger.logError(error, { service: 'zapApiService', ticketCodigo: ticket.codigo });
              results.whatsapp = { success: false, error: error.message || 'Erro ao enviar WhatsApp' };
            }
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
      
      // Verificar se email/WhatsApp foram enviados para criar apenas 1 item consolidado
      const emailEnviado = results.email && results.email.success && !results.email.alreadySent;
      const whatsappEnviado = results.whatsapp && results.whatsapp.success && !results.whatsapp.skipped && !results.whatsapp.alreadySent;
      
      if (emailEnviado || whatsappEnviado) {
        const uniqueId = `h-${timestamp}-${historicoLength}-${Math.random().toString(36).substr(2, 9)}-completion`;
        
        // Criar apenas 1 item consolidado
        const historicoItem = {
          id: uniqueId,
          dataHora: now,
          autor: 'Sistema',
          statusAnterior: ticket.status,
          statusNovo: ticket.status,
          mensagem: emailEnviado && whatsappEnviado 
            ? 'Resultado enviado por email e WhatsApp'
            : emailEnviado 
            ? 'Resultado enviado por email'
            : 'Resultado enviado por WhatsApp',
          enviouEmail: emailEnviado || false,
          enviouWhatsApp: whatsappEnviado || false,
          dataEnvioEmail: emailEnviado ? now : null,
          dataEnvioWhatsApp: whatsappEnviado ? now : null
        };
        
        tickets[ticketIndex].historico = [...historico, historicoItem];
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
      logger.logError(error, { 
        endpoint: `/tickets/${id}/send-completion`,
        ticketCodigo: ticket?.codigo || id,
        ip: req.ip
      });
      res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === 'production' 
          ? 'Erro ao processar solicitação' 
          : error.message || 'Erro desconhecido ao processar solicitação',
        errorType: process.env.NODE_ENV === 'production' ? undefined : error.name,
        email: results.email,
        whatsapp: results.whatsapp,
        ticketCodigo: ticket?.codigo || id
      });
    }
  } catch (error) {
    logger.logError(error, { 
      endpoint: `/tickets/${id}/send-completion`,
      ip: req.ip
    });
    res.status(500).json({
      success: false,
      error: process.env.NODE_ENV === 'production' 
        ? 'Erro ao processar solicitação' 
        : error.message || 'Erro desconhecido ao processar solicitação',
      errorType: process.env.NODE_ENV === 'production' ? undefined : error.name
    });
  }
});

// Health check já está definido acima (linha ~160)

// Middleware global de tratamento de erros (deve ser o último)
app.use((error, req, res, next) => {
  logger.logError(error, {
    method: req.method,
    path: req.path,
    ip: req.ip
  });
  
  res.status(error.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Erro interno do servidor'
      : error.message || 'Erro desconhecido',
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  logger.info(`🚀 Servidor de sincronização iniciado`, {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    authentication: process.env.SYNC_SERVER_API_KEY ? 'enabled' : 'disabled',
    corsOrigins: process.env.CORS_ORIGINS || '* (todos permitidos)',
    rateLimiting: 'enabled',
    ticketsCount: readTickets().length
  });
  
  // Log detalhado no console para desenvolvimento
  if (process.env.NODE_ENV !== 'production') {
    console.log(`🚀 Servidor de sincronização rodando em http://localhost:${PORT}`);
    console.log(`📋 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔐 Autenticação: ${process.env.SYNC_SERVER_API_KEY ? '✅ Habilitada' : '⚠️ Desabilitada (modo desenvolvimento)'}`);
    console.log(`🌐 CORS Origins: ${process.env.CORS_ORIGINS || '* (todos permitidos)'}`);
    console.log(`🛡️ Rate Limiting: ✅ Ativo`);
    console.log(`   - Geral: 100 req/min por IP`);
    console.log(`   - Criação de tickets: 10 req/min por IP`);
    console.log(`   - Upload: 5 req/min por IP`);
    console.log(`🛡️ Headers de Segurança: ✅ Ativo (Helmet)`);
    console.log(`📝 Logging: ✅ Estruturado (Winston)`);
    const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || `http://localhost:${PORT}`;
    console.log(`📁 Uploads públicos: ${PUBLIC_BASE_URL}/uploads`);
    console.log(`📁 Arquivo de tickets: ${TICKETS_FILE}`);
    console.log(`📊 Tickets atuais: ${readTickets().length}`);
  }
});

