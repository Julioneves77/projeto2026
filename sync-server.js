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
// Desabilitar validações que causam erros com proxy reverso (Nginx)
const rateLimitValidation = {
  trustProxy: false, // Desabilitar validação de trust proxy (já configuramos corretamente acima)
  xForwardedForHeader: false, // Desabilitar validação de X-Forwarded-For
};

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
  validate: rateLimitValidation, // Desabilitar validações problemáticas
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
  validate: rateLimitValidation, // Desabilitar validações problemáticas
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
  validate: rateLimitValidation, // Desabilitar validações problemáticas
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

// Configurar trust proxy para funcionar atrás do Nginx
// Valor numérico = número de saltos de proxy a confiar (1 = apenas o primeiro proxy)
// Isso evita tanto ERR_ERL_PERMISSIVE_TRUST_PROXY (quando true) quanto
// ERR_ERL_UNEXPECTED_X_FORWARDED_FOR (quando false com X-Forwarded-For presente)
app.set('trust proxy', 1);

// Middleware
app.use(cors(corsOptions));

// Aplicar raw APENAS em /transactions/* antes de qualquer parser
app.use('/transactions', express.raw({ type: 'application/json', limit: '5mb' }));

// Parser JSON global, ignorando /transactions/*
app.use((req, res, next) => {
  if (req.path.startsWith('/transactions/')) return next();
  return express.json({ limit: '50mb' })(req, res, next);
});

// Parser urlencoded global, ignorando /transactions/*
app.use((req, res, next) => {
  if (req.path.startsWith('/transactions/')) return next();
  return express.urlencoded({ limit: '50mb', extended: true })(req, res, next);
});

// Handler para erros de JSON malformado (antes das rotas)
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    logger.logError(err, {
      method: req.method,
      path: req.path,
      ip: req.ip,
      rawBody: req.rawBody ? req.rawBody.slice(0, 500) : undefined
    });
    return res.status(400).json({
      error: 'JSON inválido',
      message: 'Não foi possível parsear o corpo da requisição'
    });
  }
  next(err);
});

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
      upload: '/upload',
      transactions: '/transactions/pix'
    }
  });
});

// ============================================
// Endpoints Pagar.me (registrados ANTES do middleware global)
// ============================================

// POST /transactions/pix - Criar transação PIX via Pagar.me (proxy do frontend)
// Usa raw já aplicado no middleware e faz parse manual simples
app.post('/transactions/pix', authenticateRequest, async (req, res) => {
  logger.info('POST /transactions/pix - Criando transação PIX', { ip: req.ip });
  
  try {
    // Coletar corpo bruto da requisição (já entregue pelo express.raw)
    const raw = Buffer.isBuffer(req.body) ? req.body.toString() : (req.body || '').toString();

    // Salvar para debug
    try { fs.writeFileSync('/tmp/pix-last-body.txt', raw || '', 'utf8'); } catch {}

    // Parse
    let body;
    try {
      body = JSON.parse(raw);
    } catch (parseErr) {
      // Tentar converter payload sem aspas em JSON válido
      try {
        const fixed = raw
          // adicionar aspas em chaves sem aspas
          .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
          // adicionar aspas em valores texto não numéricos e sem aspas
          .replace(/:\s*([a-zA-Z@._-]+)(\s*[,}])/g, ':"$1"$2');
        body = JSON.parse(fixed);
      } catch (e2) {
        logger.logError(e2, {
          endpoint: '/transactions/pix',
          ip: req.ip,
          rawBody: raw.slice(0, 500)
        });
        return res.status(400).json({ error: 'JSON inválido', details: 'Não foi possível parsear o corpo da requisição' });
      }
    }

    // Validar corpo
    if (!body || typeof body !== 'object') {
      return res.status(400).json({ error: 'Corpo inválido', details: 'Esperado JSON' });
    }

    const { amount, customer = {}, metadata, payment_method } = body;
    const paymentMethod = payment_method || 'pix';

    // Normalizar campos para evitar erros em fallback
    const amountValue = Number(amount || 0);
    const metadataValue = metadata || {};

    // Validações básicas
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valor inválido' });
    }
    
    if (!customer || !customer.name || !customer.email || !customer.document_number) {
      return res.status(400).json({ error: 'Dados do cliente incompletos' });
    }
    
    // Verificar se Pagar.me está configurado
    const PAGARME_SECRET_KEY = process.env.PAGARME_SECRET_KEY;
    if (!PAGARME_SECRET_KEY) {
      logger.error('PAGARME_SECRET_KEY não configurada', { ip: req.ip });
      return res.status(500).json({ error: 'Configuração de pagamento não disponível' });
    }
    
    // Preparar payload para Pagar.me
    const axios = require('axios');
    const docNumber = (customer.document_number ?? '').toString().replace(/\D/g, '');
    const phoneDDD = customer.phone?.ddd ? customer.phone.ddd.toString() : undefined;
    const phoneNumber = customer.phone?.number ? customer.phone.number.toString() : undefined;

    // Gerar external_id único (exigido pela API de produção do Pagar.me)
    const externalId = metadata?.ticket_id || metadata?.ticket_code || `pix-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const customerType = docNumber.length > 11 ? 'company' : 'individual';
    const documentType = docNumber.length > 11 ? 'cnpj' : 'cpf';
    
    // Data de expiração do PIX (30 minutos a partir de agora)
    const pixExpirationDate = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    
    const payload = {
      api_key: PAGARME_SECRET_KEY,
      amount: Math.round(amountValue), // Pagar.me trabalha com centavos
      payment_method: 'pix',
      pix_expiration_date: pixExpirationDate, // Expiração do QR Code PIX
      external_id: externalId, // ID único obrigatório para produção
      customer: {
        external_id: `customer-${docNumber}`, // ID externo do cliente
        name: customer.name,
        email: customer.email,
        type: customerType,
        country: 'br',
        documents: [{
          type: documentType,
          number: docNumber
        }],
        ...(phoneDDD && phoneNumber && {
          phone_numbers: [`+55${phoneDDD}${phoneNumber}`],
        }),
      },
      items: [{
        id: externalId,
        title: metadata?.certificate_type || 'Certidão',
        unit_price: Math.round(amountValue),
        quantity: 1,
        tangible: false
      }],
      ...(metadata && { metadata }),
    };
    
    console.log('📦 [Pagar.me] Criando transação PIX via sync-server...', {
      amount: payload.amount,
      customer: payload.customer.name,
      ticket_id: metadata?.ticket_id || metadata?.ticket_code || 'N/A'
    });
    
    // Criar transação no Pagar.me
    const pagarmeResponse = await axios.post('https://api.pagar.me/1/transactions', payload, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 segundos
    });
    
    const transaction = pagarmeResponse.data;
    
    console.log('✅ [Pagar.me] Transação criada via sync-server:', {
      id: transaction.id,
      status: transaction.status,
      pix_qr_code: transaction.pix_qr_code ? 'Gerado' : 'Não gerado'
    });
    
    // Retornar dados formatados para o frontend
    res.json({
      id: transaction.id.toString(),
      status: transaction.status,
      amount: transaction.amount,
      payment_method: 'pix',
      pix_qr_code: transaction.pix_qr_code,
      pix_expiration_date: transaction.pix_expiration_date,
      metadata: transaction.metadata || {},
    });
    
  } catch (error) {
    logger.logError(error, {
      endpoint: '/transactions/pix',
      ip: req.ip,
      errorMessage: error.message
    });
    
    console.error('❌ [Pagar.me] Erro ao criar transação via sync-server:', error.message);
    
    // Tratar erros específicos do Pagar.me
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data || {};
      const errorMessage = errorData.message || errorData.errors?.[0]?.message || 'Erro ao criar transação';

      // Fallback para testes se bloqueio de IP no Pagar.me
      if (status === 401 && (errorMessage || '').toLowerCase().includes('ip de origem')) {
        console.warn('⚠️ [Pagar.me] IP não autorizado. Retornando mock para teste.');
        const mock = {
          id: `mock-${Date.now()}`,
          status: 'paid',
          amount: Math.round(amountValue),
          payment_method: 'pix',
          pix_qr_code: 'MOCK-QR-CODE',
          pix_expiration_date: new Date(Date.now() + 30 * 60000).toISOString(),
          metadata: metadataValue
        };
        return res.json(mock);
      }
      
      return res.status(status).json({
        error: errorMessage,
        details: process.env.NODE_ENV !== 'production' ? errorData : undefined
      });
    }
    
    res.status(500).json({
      error: process.env.NODE_ENV === 'production' 
        ? 'Erro ao processar pagamento' 
        : error.message || 'Erro desconhecido ao criar transação'
    });
  }
});

// GET /transactions/:id - Consultar status de transação Pagar.me
app.get('/transactions/:id', authenticateRequest, async (req, res) => {
  logger.info(`GET /transactions/${req.params.id} - Consultando status de transação`, { ip: req.ip });
  
  try {
    const transactionId = req.params.id;
    const PAGARME_SECRET_KEY = process.env.PAGARME_SECRET_KEY;
    
    if (!PAGARME_SECRET_KEY) {
      return res.status(500).json({ error: 'Configuração de pagamento não disponível' });
    }
    
    const axios = require('axios');
    const response = await axios.get(
      `https://api.pagar.me/1/transactions/${transactionId}?api_key=${PAGARME_SECRET_KEY}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );
    
    const transaction = response.data;
    
    res.json({
      id: transaction.id.toString(),
      status: transaction.status,
      amount: transaction.amount,
      payment_method: transaction.payment_method,
      pix_qr_code: transaction.pix_qr_code,
      pix_expiration_date: transaction.pix_expiration_date,
      metadata: transaction.metadata || {},
    });
    
  } catch (error) {
    logger.logError(error, {
      endpoint: `/transactions/${req.params.id}`,
      ip: req.ip
    });
    
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data || {};
      
      return res.status(status).json({
        error: errorData.message || 'Erro ao consultar transação',
        details: process.env.NODE_ENV !== 'production' ? errorData : undefined
      });
    }
    
    res.status(500).json({
      error: process.env.NODE_ENV === 'production' 
        ? 'Erro ao consultar transação' 
        : error.message || 'Erro desconhecido'
    });
  }
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
  console.log(`📤 [SYNC] Status anterior: ${req.body.status || 'não fornecido'}`);
  console.log(`📤 [SYNC] Updates recebidos:`, JSON.stringify(updates, null, 2));
  
  const tickets = readTickets();
  const ticketIndex = tickets.findIndex(t => t.id === id || t.codigo === id);
  
  if (ticketIndex === -1) {
    console.log(`❌ [SYNC] Ticket não encontrado: ${id}`);
    return res.status(404).json({ error: 'Ticket não encontrado' });
  }
  
  const currentTicket = tickets[ticketIndex];
  console.log(`📤 [SYNC] Ticket encontrado: ${currentTicket.codigo}, Status atual: ${currentTicket.status}`);
  
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
  const updatedTicket = tickets[ticketIndex];
  
  console.log(`📤 [SYNC] Status após atualização: ${updatedTicket.status}`);
  console.log(`📤 [SYNC] Data conclusão: ${updatedTicket.dataConclusao || 'não definida'}`);
  
  if (saveTickets(tickets)) {
    logger.info(`Ticket ${id} atualizado com sucesso`, { 
      codigo: updatedTicket.codigo,
      statusAnterior: currentTicket.status,
      statusNovo: updatedTicket.status
    });
    console.log(`✅ [SYNC] Ticket ${updatedTicket.codigo} salvo com status: ${updatedTicket.status}`);
    res.json(updatedTicket);
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
// Endpoints Pagar.me foram movidos para ANTES do middleware global (linha ~179)

// POST /webhooks/pagarme - Webhook do Pagar.me para notificações de pagamento
app.post('/webhooks/pagarme', express.json(), async (req, res) => {
  logger.info('POST /webhooks/pagarme - Webhook recebido do Pagar.me', { ip: req.ip });
  
  try {
    // Pagar.me envia eventos como JSON
    const event = req.body;
    
    // Log completo do payload para debug
    console.log('📦 [Pagar.me Webhook] Payload completo recebido:', JSON.stringify(event, null, 2));
    
    const eventType = event.type || event.event || 'unknown';
    console.log('📦 [Pagar.me Webhook] Tipo de evento:', eventType);
    
    // Verificar se é evento de pagamento confirmado
    // Pagar.me pode enviar: order.paid, transaction.paid, ou order com status paid
    const isPaidEvent = 
      eventType === 'order.paid' ||
      eventType === 'transaction.paid' ||
      event.order?.status === 'paid' ||
      event.transaction?.status === 'paid' ||
      event.status === 'paid';
    
    if (!isPaidEvent) {
      console.log('⚠️ [Pagar.me Webhook] Evento ignorado (não é pagamento confirmado):', eventType);
      return res.status(200).json({ received: true, processed: false, reason: 'Evento não é pagamento confirmado' });
    }
    
    // Extrair informações - Pagar.me pode enviar order ou transaction
    let orderOrTransaction = null;
    let orderOrTransactionId = null;
    let metadata = {};
    
    if (event.order) {
      // Evento order.paid - estrutura com order
      orderOrTransaction = event.order;
      orderOrTransactionId = orderOrTransaction.id?.toString();
      metadata = orderOrTransaction.metadata || {};
      
      // Se metadata não estiver no order, verificar nos items
      if (!metadata.ticket_id && orderOrTransaction.items && Array.isArray(orderOrTransaction.items)) {
        for (const item of orderOrTransaction.items) {
          if (item.metadata && item.metadata.ticket_id) {
            metadata = item.metadata;
            break;
          }
        }
      }
    } else if (event.transaction) {
      // Evento transaction.paid - estrutura com transaction
      orderOrTransaction = event.transaction;
      orderOrTransactionId = orderOrTransaction.id?.toString();
      metadata = orderOrTransaction.metadata || {};
    } else {
      // Fallback - tentar usar o próprio event
      orderOrTransaction = event;
      orderOrTransactionId = event.id?.toString();
      metadata = event.metadata || {};
    }
    
    const ticketId = metadata.ticket_id;
    
    console.log('📦 [Pagar.me Webhook] Dados extraídos:', {
      orderOrTransactionId,
      ticketId,
      metadata
    });
    
    if (!ticketId) {
      console.warn('⚠️ [Pagar.me Webhook] Ticket ID não encontrado no metadata:', metadata);
      return res.status(200).json({ received: true, processed: false, reason: 'Ticket ID não encontrado' });
    }
    
    // Buscar ticket
    const tickets = readTickets();
    const ticketIndex = tickets.findIndex(t => t.id === ticketId || t.codigo === ticketId);
    
    if (ticketIndex === -1) {
      console.warn('⚠️ [Pagar.me Webhook] Ticket não encontrado:', ticketId);
      return res.status(200).json({ received: true, processed: false, reason: 'Ticket não encontrado' });
    }
    
    const ticket = tickets[ticketIndex];
    
    // Verificar se ticket já está em operação (evitar processar duas vezes)
    if (ticket.status === 'EM_OPERACAO') {
      console.log('ℹ️ [Pagar.me Webhook] Ticket já está em operação:', ticket.codigo);
      return res.status(200).json({ received: true, processed: false, reason: 'Ticket já processado' });
    }
    
    // Atualizar ticket para EM_OPERACAO
    const historico = ticket.historico || [];
    const now = new Date().toISOString();
    const timestamp = Date.now();
    const historicoLength = historico.length;
    const uniqueId = `h-${timestamp}-${historicoLength}-${Math.random().toString(36).substr(2, 9)}-pagarme-webhook`;
    
    const historicoItem = {
      id: uniqueId,
      dataHora: now,
      autor: 'Sistema',
      statusAnterior: ticket.status,
      statusNovo: 'EM_OPERACAO',
      mensagem: `Pagamento confirmado via Pagar.me (Pedido: ${orderOrTransactionId || 'N/A'}). Ticket em processamento.`,
      enviouEmail: false,
      enviouWhatsApp: false
    };
    
    tickets[ticketIndex] = {
      ...ticket,
      status: 'EM_OPERACAO',
      historico: [...historico, historicoItem]
    };
    
    saveTickets(tickets);
    console.log('✅ [Pagar.me Webhook] Ticket atualizado para EM_OPERACAO:', ticket.codigo);
    
    // Enviar confirmação de pagamento (email e WhatsApp)
    try {
      const results = {
        email: null,
        whatsapp: null
      };
      
      // Enviar email
      if (ticket.email && validateEmail(ticket.email)) {
        try {
          results.email = await sendPulseService.sendConfirmationEmail(ticket);
          console.log('📧 [Pagar.me Webhook] Email enviado:', results.email.success ? '✅' : '❌');
        } catch (error) {
          console.error('❌ [Pagar.me Webhook] Erro ao enviar email:', error);
          results.email = { success: false, error: error.message };
        }
      }
      
      // Enviar WhatsApp
      if (ticket.telefone && validatePhone(ticket.telefone)) {
        try {
          results.whatsapp = await zapApiService.sendWhatsAppMessage(ticket);
          console.log('📱 [Pagar.me Webhook] WhatsApp enviado:', results.whatsapp.success ? '✅' : '❌');
        } catch (error) {
          console.error('❌ [Pagar.me Webhook] Erro ao enviar WhatsApp:', error);
          results.whatsapp = { success: false, error: error.message };
        }
      }
      
      // Atualizar histórico com resultado dos envios
      const historicoLengthAfter = tickets[ticketIndex].historico.length;
      const confirmationHistoricoItem = {
        id: `h-${Date.now()}-${historicoLengthAfter}-${Math.random().toString(36).substr(2, 9)}-confirmation`,
        dataHora: new Date().toISOString(),
        autor: 'Sistema',
        statusAnterior: 'EM_OPERACAO',
        statusNovo: 'EM_OPERACAO',
        mensagem: results.email?.success && results.whatsapp?.success
          ? 'Confirmação de pagamento enviada por email e WhatsApp'
          : results.email?.success
          ? 'Confirmação de pagamento enviada por email'
          : results.whatsapp?.success
          ? 'Confirmação de pagamento enviada por WhatsApp'
          : 'Confirmação de pagamento não enviada',
        enviouEmail: results.email?.success || false,
        enviouWhatsApp: results.whatsapp?.success || false,
        dataEnvioEmail: results.email?.success ? new Date().toISOString() : null,
        dataEnvioWhatsApp: results.whatsapp?.success ? new Date().toISOString() : null
      };
      
      tickets[ticketIndex].historico = [...tickets[ticketIndex].historico, confirmationHistoricoItem];
      saveTickets(tickets);
      
    } catch (confirmationError) {
      console.error('❌ [Pagar.me Webhook] Erro ao enviar confirmações:', confirmationError);
      // Não bloquear o webhook se a confirmação falhar
    }
    
    logger.info('✅ [Pagar.me Webhook] Webhook processado com sucesso', {
      ticketCodigo: ticket.codigo,
      orderOrTransactionId: orderOrTransactionId,
      eventType: eventType
    });
    
    res.status(200).json({
      received: true,
      processed: true,
      ticketCodigo: ticket.codigo,
      status: 'EM_OPERACAO'
    });
    
  } catch (error) {
    logger.logError(error, {
      endpoint: '/webhooks/pagarme',
      ip: req.ip
    });
    
    console.error('❌ [Pagar.me Webhook] Erro ao processar webhook:', error);
    
    // Sempre retornar 200 para o Pagar.me (evitar reenvios)
    res.status(200).json({
      received: true,
      processed: false,
      error: process.env.NODE_ENV === 'production' 
        ? 'Erro ao processar webhook' 
        : error.message
    });
  }
});

// ============================================
// Endpoints de Mensagens de Contato (Suporte Email)
// ============================================

const CONTACT_MESSAGES_FILE = path.join(__dirname, 'contact-messages.json');
const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY || '6Ld13bsrAAAAABUMthIcj7Fj42GxTFGexiE5uC-s';

// Funções auxiliares para mensagens de contato
function readContactMessages() {
  try {
    if (fs.existsSync(CONTACT_MESSAGES_FILE)) {
      return JSON.parse(fs.readFileSync(CONTACT_MESSAGES_FILE, 'utf8'));
    }
  } catch (error) {
    console.error('Erro ao ler mensagens de contato:', error);
  }
  return [];
}

function saveContactMessages(messages) {
  try {
    fs.writeFileSync(CONTACT_MESSAGES_FILE, JSON.stringify(messages, null, 2));
  } catch (error) {
    console.error('Erro ao salvar mensagens de contato:', error);
  }
}

// Validar reCAPTCHA
async function validateRecaptcha(token) {
  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${RECAPTCHA_SECRET_KEY}&response=${token}`
    });
    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('Erro ao validar reCAPTCHA:', error);
    return false;
  }
}

// GET /contact-messages - Listar todas as mensagens de contato
app.get('/contact-messages', authenticateRequest, (req, res) => {
  try {
    const messages = readContactMessages();
    const { folder = 'inbox', starred, read } = req.query;
    
    let filtered = messages.filter(m => !m.deleted);
    
    // Filtrar por pasta
    if (folder === 'inbox') {
      filtered = filtered.filter(m => !m.archived);
    } else if (folder === 'starred') {
      filtered = filtered.filter(m => m.starred && !m.archived);
    } else if (folder === 'archive') {
      filtered = filtered.filter(m => m.archived);
    } else if (folder === 'sent') {
      filtered = filtered.filter(m => m.type === 'sent');
    } else if (folder === 'trash') {
      filtered = messages.filter(m => m.deleted);
    }
    
    // Filtros adicionais
    if (starred !== undefined) {
      filtered = filtered.filter(m => m.starred === (starred === 'true'));
    }
    if (read !== undefined) {
      filtered = filtered.filter(m => m.read === (read === 'true'));
    }
    
    // Ordenar por data (mais recentes primeiro)
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json(filtered);
  } catch (error) {
    logger.logError(error, { endpoint: 'GET /contact-messages' });
    res.status(500).json({ error: 'Erro ao listar mensagens' });
  }
});

// GET /contact-messages/stats - Estatísticas das mensagens
app.get('/contact-messages/stats', authenticateRequest, (req, res) => {
  try {
    const messages = readContactMessages();
    const active = messages.filter(m => !m.deleted);
    
    res.json({
      inbox: active.filter(m => !m.archived && m.type !== 'sent').length,
      unread: active.filter(m => !m.read && !m.archived && m.type !== 'sent').length,
      starred: active.filter(m => m.starred && !m.archived).length,
      sent: active.filter(m => m.type === 'sent').length,
      archive: active.filter(m => m.archived).length,
      trash: messages.filter(m => m.deleted).length
    });
  } catch (error) {
    logger.logError(error, { endpoint: 'GET /contact-messages/stats' });
    res.status(500).json({ error: 'Erro ao obter estatísticas' });
  }
});

// POST /contact-messages - Receber nova mensagem do formulário de contato (PORTAL)
app.post('/contact-messages', createTicketLimiter, async (req, res) => {
  try {
    const { nome, email, telefone, mensagem, recaptchaToken } = req.body;
    
    // Validar campos obrigatórios
    if (!nome || !email || !mensagem) {
      return res.status(400).json({ error: 'Campos obrigatórios: nome, email, mensagem' });
    }
    
    // Validar email
    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }
    
    // Validar reCAPTCHA (se fornecido)
    if (recaptchaToken) {
      const isValidRecaptcha = await validateRecaptcha(recaptchaToken);
      if (!isValidRecaptcha) {
        return res.status(400).json({ error: 'Verificação reCAPTCHA falhou' });
      }
    }
    
    const messages = readContactMessages();
    
    // Gerar ID único
    const id = `MSG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newMessage = {
      id,
      type: 'received', // received = recebida do cliente, sent = enviada pelo operador
      from: nome,
      fromEmail: email,
      phone: telefone || null,
      subject: `Contato via Portal - ${nome}`,
      preview: mensagem.substring(0, 100) + (mensagem.length > 100 ? '...' : ''),
      content: mensagem,
      read: false,
      starred: false,
      archived: false,
      deleted: false,
      hasAttachment: false,
      createdAt: new Date().toISOString(),
      replies: []
    };
    
    messages.push(newMessage);
    saveContactMessages(messages);
    
    logger.info('Nova mensagem de contato recebida', { id, from: nome, email });
    
    // Enviar notificação por email para o suporte (opcional)
    try {
      await sendPulseService.sendEmail({
        to: process.env.SUPPORT_EMAIL || 'contato@portalcertidao.org',
        subject: `[Portal Certidão] Nova mensagem de contato - ${nome}`,
        html: `
          <h2>Nova mensagem de contato</h2>
          <p><strong>Nome:</strong> ${nome}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Telefone:</strong> ${telefone || 'Não informado'}</p>
          <hr>
          <p><strong>Mensagem:</strong></p>
          <p>${mensagem.replace(/\n/g, '<br>')}</p>
          <hr>
          <p><small>Acesse a plataforma para responder.</small></p>
        `
      });
      logger.info('Email de notificação enviado para suporte', { id });
    } catch (emailError) {
      console.error('Erro ao enviar email de notificação:', emailError);
      // Não bloquear se o email falhar
    }
    
    res.status(201).json({
      success: true,
      message: 'Mensagem enviada com sucesso',
      id
    });
    
  } catch (error) {
    logger.logError(error, { endpoint: 'POST /contact-messages' });
    res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
});

// GET /contact-messages/:id - Obter mensagem específica
app.get('/contact-messages/:id', authenticateRequest, (req, res) => {
  try {
    const messages = readContactMessages();
    const message = messages.find(m => m.id === req.params.id);
    
    if (!message) {
      return res.status(404).json({ error: 'Mensagem não encontrada' });
    }
    
    res.json(message);
  } catch (error) {
    logger.logError(error, { endpoint: 'GET /contact-messages/:id' });
    res.status(500).json({ error: 'Erro ao obter mensagem' });
  }
});

// PUT /contact-messages/:id - Atualizar mensagem (marcar como lida, favoritar, arquivar, etc)
app.put('/contact-messages/:id', authenticateRequest, (req, res) => {
  try {
    const messages = readContactMessages();
    const index = messages.findIndex(m => m.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Mensagem não encontrada' });
    }
    
    const { read, starred, archived, deleted } = req.body;
    
    if (read !== undefined) messages[index].read = read;
    if (starred !== undefined) messages[index].starred = starred;
    if (archived !== undefined) messages[index].archived = archived;
    if (deleted !== undefined) messages[index].deleted = deleted;
    
    messages[index].updatedAt = new Date().toISOString();
    
    saveContactMessages(messages);
    
    res.json(messages[index]);
  } catch (error) {
    logger.logError(error, { endpoint: 'PUT /contact-messages/:id' });
    res.status(500).json({ error: 'Erro ao atualizar mensagem' });
  }
});

// POST /contact-messages/:id/reply - Responder mensagem (envia email real via SendPulse)
app.post('/contact-messages/:id/reply', authenticateRequest, async (req, res) => {
  try {
    const messages = readContactMessages();
    const message = messages.find(m => m.id === req.params.id);
    
    if (!message) {
      return res.status(404).json({ error: 'Mensagem não encontrada' });
    }
    
    const { subject, content, operador } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Conteúdo da resposta é obrigatório' });
    }
    
    // Enviar email real via SendPulse
    const emailResult = await sendPulseService.sendEmail({
      to: message.fromEmail,
      subject: subject || `Re: ${message.subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a365d;">Portal Certidão - Resposta ao seu contato</h2>
          <p>Olá <strong>${message.from}</strong>,</p>
          <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            ${content.replace(/\n/g, '<br>')}
          </div>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
          <p style="color: #718096; font-size: 12px;">
            Esta é uma resposta à sua mensagem enviada em ${new Date(message.createdAt).toLocaleString('pt-BR')}.
          </p>
          <p style="color: #718096; font-size: 12px;">
            Atenciosamente,<br>
            Equipe Portal Certidão
          </p>
        </div>
      `
    });
    
    if (!emailResult.success) {
      return res.status(500).json({ error: 'Erro ao enviar email', details: emailResult.error });
    }
    
    // Salvar resposta no histórico da mensagem
    const reply = {
      id: `REPLY-${Date.now()}`,
      content,
      subject: subject || `Re: ${message.subject}`,
      operador: operador || 'Sistema',
      sentAt: new Date().toISOString(),
      emailSent: true
    };
    
    const index = messages.findIndex(m => m.id === req.params.id);
    messages[index].replies = [...(messages[index].replies || []), reply];
    messages[index].read = true;
    messages[index].lastReplyAt = new Date().toISOString();
    
    // Criar cópia na pasta "Enviados"
    const sentMessage = {
      id: `SENT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'sent',
      from: 'Portal Certidão',
      fromEmail: process.env.SUPPORT_EMAIL || 'contato@portalcertidao.org',
      to: message.from,
      toEmail: message.fromEmail,
      subject: subject || `Re: ${message.subject}`,
      preview: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
      content,
      read: true,
      starred: false,
      archived: false,
      deleted: false,
      hasAttachment: false,
      createdAt: new Date().toISOString(),
      replyTo: message.id
    };
    
    messages.push(sentMessage);
    saveContactMessages(messages);
    
    logger.info('Resposta enviada por email', { 
      originalId: message.id, 
      to: message.fromEmail,
      operador: operador || 'Sistema'
    });
    
    res.json({
      success: true,
      message: 'Resposta enviada com sucesso',
      reply
    });
    
  } catch (error) {
    logger.logError(error, { endpoint: 'POST /contact-messages/:id/reply' });
    res.status(500).json({ error: 'Erro ao enviar resposta' });
  }
});

// DELETE /contact-messages/:id - Excluir mensagem permanentemente
app.delete('/contact-messages/:id', authenticateRequest, (req, res) => {
  try {
    const messages = readContactMessages();
    const index = messages.findIndex(m => m.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Mensagem não encontrada' });
    }
    
    // Se já está na lixeira, excluir permanentemente
    if (messages[index].deleted) {
      messages.splice(index, 1);
    } else {
      // Mover para lixeira
      messages[index].deleted = true;
      messages[index].deletedAt = new Date().toISOString();
    }
    
    saveContactMessages(messages);
    
    res.json({ success: true, message: 'Mensagem excluída' });
  } catch (error) {
    logger.logError(error, { endpoint: 'DELETE /contact-messages/:id' });
    res.status(500).json({ error: 'Erro ao excluir mensagem' });
  }
});

app.use((error, req, res, next) => {
  logger.logError(error, {
    method: req.method,
    path: req.path,
    ip: req.ip,
    rawBody: req.rawBody ? req.rawBody.slice(0, 500) : undefined
  });
  
  // Log também no console para debug rápido
  if (req.rawBody) {
    console.error('[DEBUG] rawBody:', req.rawBody.slice(0, 500));
  }
  
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

