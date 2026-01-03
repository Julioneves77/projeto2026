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
const os = require('os');

const app = express();

// Armazenar conexões SSE ativas para métricas do sistema
const sseClients = new Set();
const PORT = process.env.PORT || 3001;
const TICKETS_FILE = path.join(__dirname, 'tickets-data.json');
const COPIES_FILE = path.join(__dirname, 'copies-data.json');
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

  // Verificar API Key no header ou query string (query string necessário para SSE/EventSource)
  const apiKey = req.headers['x-api-key'] || 
                 req.headers['authorization']?.replace('Bearer ', '') ||
                 req.query.apiKey;
  
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
      transactions: '/transactions/pix',
      system: '/system/capacity',
      storage: '/contact-messages/storage-stats'
    }
  });
});

// GET /system/capacity - Capacidade do sistema (memória, disco, CPU)
app.get('/system/capacity', authenticateRequest, (req, res) => {
  try {
    // Informações de memória
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryPercentage = Math.round((usedMemory / totalMemory) * 100);
    
    // Informações de disco (diretório de trabalho)
    const workDir = __dirname;
    let diskTotal = 0;
    let diskFree = 0;
    let diskUsed = 0;
    
    try {
      // Calcular tamanho dos arquivos no diretório
      diskUsed = calculateDirectorySize(workDir);
      // Estimar capacidade total (assumir 20GB se não conseguir obter)
      diskTotal = 20 * 1024 * 1024 * 1024; // 20GB
      diskFree = diskTotal - diskUsed;
    } catch (diskError) {
      // Se falhar, usar valores padrão
      diskUsed = calculateDirectorySize(workDir);
      diskTotal = 20 * 1024 * 1024 * 1024; // 20GB padrão
      diskFree = diskTotal - diskUsed;
    }
    
    const diskPercentage = diskTotal > 0 ? Math.round((diskUsed / diskTotal) * 100) : 0;
    
    // Informações de CPU
    const cpus = os.cpus();
    const loadAvg = os.loadavg();
    // Calcular uso médio de CPU (estimativa baseada em load average)
    const cpuUsage = Math.min(100, Math.round((loadAvg[0] / cpus.length) * 100));
    
    res.json({
      storage: {
        total: diskTotal,
        used: diskUsed,
        available: diskFree,
        percentage: diskPercentage,
        formatted: {
          total: formatBytes(diskTotal),
          used: formatBytes(diskUsed),
          available: formatBytes(diskFree)
        }
      },
      memory: {
        total: totalMemory,
        used: usedMemory,
        free: freeMemory,
        percentage: memoryPercentage,
        formatted: {
          total: formatBytes(totalMemory),
          used: formatBytes(usedMemory),
          free: formatBytes(freeMemory)
        }
      },
      cpu: {
        loadAverage: loadAvg,
        usage: cpuUsage,
        cores: cpus.length,
        model: cpus[0]?.model || 'Unknown'
      },
      uptime: {
        seconds: os.uptime(),
        formatted: formatUptime(os.uptime())
      },
      platform: {
        type: os.type(),
        platform: os.platform(),
        arch: os.arch(),
        hostname: os.hostname()
      }
    });
  } catch (error) {
    logger.logError(error, { endpoint: 'GET /system/capacity' });
    res.status(500).json({ error: 'Erro ao obter capacidade do sistema' });
  }
});

// GET /system/capacity/stream - SSE para métricas em tempo real
app.get('/system/capacity/stream', authenticateRequest, (req, res) => {
  logger.info('SSE /system/capacity/stream - Cliente conectado', { ip: req.ip });
  
  // Configurar headers SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Desabilitar buffering no Nginx
  res.flushHeaders();
  
  // Adicionar cliente à lista
  sseClients.add(res);
  console.log(`📡 [SSE] Cliente conectado. Total: ${sseClients.size}`);
  
  // Função para coletar e enviar métricas
  const sendMetrics = () => {
    try {
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;
      const memoryPercentage = Math.round((usedMemory / totalMemory) * 100);
      
      const workDir = __dirname;
      let diskUsed = 0;
      try {
        diskUsed = calculateDirectorySize(workDir);
      } catch {}
      const diskTotal = 20 * 1024 * 1024 * 1024; // 20GB
      const diskFree = diskTotal - diskUsed;
      const diskPercentage = Math.round((diskUsed / diskTotal) * 100);
      
      const cpus = os.cpus();
      const loadAvg = os.loadavg();
      const cpuUsage = Math.min(100, Math.round((loadAvg[0] / cpus.length) * 100));
      
      const data = {
        storage: {
          total: diskTotal,
          used: diskUsed,
          available: diskFree,
          percentage: diskPercentage,
          formatted: {
            total: formatBytes(diskTotal),
            used: formatBytes(diskUsed),
            available: formatBytes(diskFree)
          }
        },
        memory: {
          total: totalMemory,
          used: usedMemory,
          free: freeMemory,
          percentage: memoryPercentage,
          formatted: {
            total: formatBytes(totalMemory),
            used: formatBytes(usedMemory),
            free: formatBytes(freeMemory)
          }
        },
        cpu: {
          loadAverage: loadAvg,
          usage: cpuUsage,
          cores: cpus.length,
          model: cpus[0]?.model || 'Unknown'
        },
        uptime: {
          seconds: os.uptime(),
          formatted: formatUptime(os.uptime())
        },
        platform: {
          type: os.type(),
          platform: os.platform(),
          arch: os.arch(),
          hostname: os.hostname()
        },
        timestamp: new Date().toISOString()
      };
      
      res.write(`event: capacity-update\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (error) {
      console.error('❌ [SSE] Erro ao enviar métricas:', error.message);
    }
  };
  
  // Enviar métricas imediatamente
  sendMetrics();
  
  // Configurar intervalo de 5 segundos
  const intervalId = setInterval(sendMetrics, 5000);
  
  // Heartbeat a cada 30 segundos para manter conexão viva
  const heartbeatId = setInterval(() => {
    try {
      res.write(`:heartbeat\n\n`);
    } catch {}
  }, 30000);
  
  // Limpar quando cliente desconectar
  req.on('close', () => {
    clearInterval(intervalId);
    clearInterval(heartbeatId);
    sseClients.delete(res);
    console.log(`📡 [SSE] Cliente desconectado. Total: ${sseClients.size}`);
  });
});

// ============================================
// Endpoints Pagar.me (registrados ANTES do middleware global)
// ============================================

// POST /transactions/pix - Criar pedido PIX via Pagar.me API v5
// Migrado de API v1 (/1/transactions) para API v5 (/core/v5/orders)
app.post('/transactions/pix', authenticateRequest, async (req, res) => {
  logger.info('POST /transactions/pix - Criando pedido PIX (API v5)', { ip: req.ip });
  
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
          .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
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

    const { amount, customer = {}, metadata } = body;

    // Normalizar campos
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
    
    const axios = require('axios');
    const docNumber = (customer.document_number ?? '').toString().replace(/\D/g, '');
    const phoneDDD = customer.phone?.ddd ? customer.phone.ddd.toString() : '11';
    const phoneNumber = customer.phone?.number ? customer.phone.number.toString() : '999999999';

    // Gerar code único para o pedido
    const orderCode = metadata?.ticket_id || metadata?.ticket_code || `pix-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const customerType = docNumber.length > 11 ? 'company' : 'individual';
    
    // ============================================
    // PAYLOAD API v5 - Estrutura de Orders
    // ============================================
    const payload = {
      code: orderCode,
      items: [{
        amount: Math.round(amountValue), // Valor em centavos
        description: metadata?.certificate_type || 'Certidão',
        quantity: 1
      }],
      customer: {
        name: customer.name,
        email: customer.email,
        type: customerType,
        document: docNumber,
        phones: {
          mobile_phone: {
            country_code: '55',
            area_code: phoneDDD,
            number: phoneNumber
          }
        }
      },
      payments: [{
        payment_method: 'pix',
        pix: {
          expires_in: 1800 // 30 minutos em segundos
        }
      }],
      // Metadata para rastreamento
      metadata: metadataValue
    };
    
    console.log('📦 [Pagar.me API v5] Criando pedido PIX...', {
      code: orderCode,
      amount: payload.items[0].amount,
      customer: payload.customer.name,
      ticket_id: metadata?.ticket_id || metadata?.ticket_code || 'N/A'
    });
    
    // ============================================
    // CHAMADA API v5 - Basic Auth com secret key
    // ============================================
    const authToken = Buffer.from(PAGARME_SECRET_KEY + ':').toString('base64');
    
    const pagarmeResponse = await axios.post(
      'https://api.pagar.me/core/v5/orders',
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${authToken}`
        },
        timeout: 30000
      }
    );
    
    const order = pagarmeResponse.data;
    
    // Extrair dados do charge/transaction
    const charge = order.charges?.[0];
    const lastTransaction = charge?.last_transaction;
    
    console.log('✅ [Pagar.me API v5] Pedido criado:', {
      order_id: order.id,
      code: order.code,
      status: order.status,
      charge_id: charge?.id,
      charge_status: charge?.status,
      qr_code_url: lastTransaction?.qr_code_url ? 'Gerado' : 'Não gerado'
    });
    
    // ============================================
    // RESPOSTA - Mapeada para formato do frontend
    // ============================================
    res.json({
      id: order.id,
      external_id: order.code,
      order_id: order.id,
      charge_id: charge?.id,
      status: order.status,
      amount: order.amount,
      payment_method: 'pix',
      // PIX data da API v5
      pix_qr_code: lastTransaction?.qr_code || null,
      pix_qr_code_url: lastTransaction?.qr_code_url || null,
      pix_expiration_date: lastTransaction?.expires_at || null,
      // Campos legados para compatibilidade
      transaction_id: lastTransaction?.id,
      metadata: order.metadata || metadataValue
    });
    
  } catch (error) {
    logger.logError(error, {
      endpoint: '/transactions/pix',
      ip: req.ip,
      errorMessage: error.message
    });
    
    console.error('❌ [Pagar.me API v5] Erro ao criar pedido:', error.message);
    
    // Log detalhado do erro
    if (error.response) {
      console.error('❌ [Pagar.me API v5] Detalhes do erro:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: JSON.stringify(error.response.data, null, 2)
      });
    }
    
    // Tratar erros específicos
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data || {};
      const errorMessage = errorData.message || errorData.errors?.[0]?.message || JSON.stringify(errorData);
      
      return res.status(status).json({
        error: errorMessage,
        details: process.env.NODE_ENV !== 'production' ? errorData : undefined
      });
    }
    
    res.status(500).json({
      error: process.env.NODE_ENV === 'production' 
        ? 'Erro ao processar pagamento' 
        : error.message || 'Erro desconhecido ao criar pedido'
    });
  }
});

// GET /transactions/:id - Consultar status de pedido/charge via Pagar.me API v5
// Aceita order_id (or_xxx) ou charge_id (ch_xxx)
app.get('/transactions/:id', authenticateRequest, async (req, res) => {
  const entityId = req.params.id;
  logger.info(`GET /transactions/${entityId} - Consultando status (API v5)`, { ip: req.ip });
  
  try {
    const PAGARME_SECRET_KEY = process.env.PAGARME_SECRET_KEY;
    
    if (!PAGARME_SECRET_KEY) {
      return res.status(500).json({ error: 'Configuração de pagamento não disponível' });
    }
    
    const axios = require('axios');
    const authToken = Buffer.from(PAGARME_SECRET_KEY + ':').toString('base64');
    
    // Determinar se é order ou charge pelo prefixo
    const isOrder = entityId.startsWith('or_');
    const isCharge = entityId.startsWith('ch_');
    
    let endpoint;
    if (isOrder) {
      endpoint = `https://api.pagar.me/core/v5/orders/${entityId}`;
    } else if (isCharge) {
      endpoint = `https://api.pagar.me/core/v5/charges/${entityId}`;
    } else {
      // Tentar como order primeiro
      endpoint = `https://api.pagar.me/core/v5/orders/${entityId}`;
    }
    
    const response = await axios.get(endpoint, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authToken}`
      },
      timeout: 30000
    });
    
    const data = response.data;
    
    // Mapear resposta para formato compatível
    if (isOrder || data.charges) {
      // É um Order
      const charge = data.charges?.[0];
      const lastTransaction = charge?.last_transaction;
      
      res.json({
        id: data.id,
        order_id: data.id,
        charge_id: charge?.id,
        status: data.status,
        amount: data.amount,
        payment_method: charge?.payment_method || 'pix',
        pix_qr_code: lastTransaction?.qr_code || null,
        pix_qr_code_url: lastTransaction?.qr_code_url || null,
        pix_expiration_date: lastTransaction?.expires_at || null,
        metadata: data.metadata || {}
      });
    } else {
      // É um Charge
      const lastTransaction = data.last_transaction;
      
      res.json({
        id: data.id,
        charge_id: data.id,
        order_id: data.order?.id,
        status: data.status,
        amount: data.amount,
        payment_method: data.payment_method || 'pix',
        pix_qr_code: lastTransaction?.qr_code || null,
        pix_qr_code_url: lastTransaction?.qr_code_url || null,
        pix_expiration_date: lastTransaction?.expires_at || null,
        metadata: data.metadata || {}
      });
    }
    
  } catch (error) {
    logger.logError(error, {
      endpoint: `/transactions/${entityId}`,
      ip: req.ip
    });
    
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data || {};
      
      return res.status(status).json({
        error: errorData.message || 'Erro ao consultar pedido/transação',
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

// ============================================
// LIMPEZA AUTOMÁTICA DE TICKETS ANTIGOS
// ============================================
// Regras:
// - GERAL: apaga após 5 dias
// - EM_OPERACAO: apaga após 7 dias
// - CONCLUIDO: apaga após 10 dias

const TICKET_CLEANUP_RULES = {
  'GERAL': 5,           // 5 dias
  'EM_OPERACAO': 7,     // 7 dias
  'CONCLUIDO': 10       // 10 dias
};

function cleanupOldTickets() {
  try {
    const tickets = readTickets();
    const now = new Date();
    const initialCount = tickets.length;
    
    const filteredTickets = tickets.filter(ticket => {
      const dataCadastro = new Date(ticket.dataCadastro);
      const diffTime = now - dataCadastro;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      const status = ticket.status || 'GERAL';
      const maxDays = TICKET_CLEANUP_RULES[status];
      
      // Se não tem regra definida, manter o ticket
      if (!maxDays) return true;
      
      // Se passou do limite, remover (retorna false)
      if (diffDays > maxDays) {
        console.log(`🗑️ [CLEANUP] Removendo ticket ${ticket.codigo} (${status}) - ${diffDays} dias`);
        return false;
      }
      
      return true;
    });
    
    const removedCount = initialCount - filteredTickets.length;
    
    if (removedCount > 0) {
      saveTickets(filteredTickets);
      console.log(`🧹 [CLEANUP] Limpeza concluída: ${removedCount} tickets removidos, ${filteredTickets.length} restantes`);
      logger.info(`Cleanup: ${removedCount} tickets removidos`);
    } else {
      console.log(`🧹 [CLEANUP] Nenhum ticket antigo para remover. Total: ${initialCount}`);
    }
    
    return { removed: removedCount, remaining: filteredTickets.length };
  } catch (error) {
    console.error('❌ [CLEANUP] Erro na limpeza de tickets:', error);
    logger.logError(error, { function: 'cleanupOldTickets' });
    return { removed: 0, remaining: 0, error: error.message };
  }
}

// Executar limpeza a cada 1 hora (3600000 ms)
const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hora

setInterval(() => {
  console.log('🧹 [CLEANUP] Iniciando limpeza automática de tickets...');
  cleanupOldTickets();
}, CLEANUP_INTERVAL);

// Executar limpeza inicial após 1 minuto do start
setTimeout(() => {
  console.log('🧹 [CLEANUP] Executando limpeza inicial...');
  cleanupOldTickets();
}, 60000);

console.log('🧹 [CLEANUP] Limpeza automática configurada: GERAL=5d, EM_OPERACAO=7d, CONCLUIDO=10d');

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

// GET /tickets/stats - Estatísticas de tickets por status e idade
// IMPORTANTE: Deve vir ANTES de /tickets/:id para não conflitar
app.get('/tickets/stats', (req, res) => {
  const tickets = readTickets();
  const now = new Date();
  
  const stats = {
    total: tickets.length,
    porStatus: {},
    aSerRemovidos: {
      em24h: 0,
      em48h: 0,
      em72h: 0
    },
    regras: TICKET_CLEANUP_RULES
  };
  
  tickets.forEach(ticket => {
    const status = ticket.status || 'GERAL';
    const dataCadastro = new Date(ticket.dataCadastro);
    const diffDays = Math.floor((now - dataCadastro) / (1000 * 60 * 60 * 24));
    const maxDays = TICKET_CLEANUP_RULES[status] || 999;
    const diasRestantes = maxDays - diffDays;
    
    // Contar por status
    if (!stats.porStatus[status]) {
      stats.porStatus[status] = { total: 0, mediaIdadeDias: 0, idades: [] };
    }
    stats.porStatus[status].total++;
    stats.porStatus[status].idades.push(diffDays);
    
    // Contar quantos serão removidos em breve
    if (diasRestantes <= 1) stats.aSerRemovidos.em24h++;
    else if (diasRestantes <= 2) stats.aSerRemovidos.em48h++;
    else if (diasRestantes <= 3) stats.aSerRemovidos.em72h++;
  });
  
  // Calcular média de idade por status
  Object.keys(stats.porStatus).forEach(status => {
    const idades = stats.porStatus[status].idades;
    stats.porStatus[status].mediaIdadeDias = idades.length > 0 
      ? Math.round(idades.reduce((a, b) => a + b, 0) / idades.length) 
      : 0;
    delete stats.porStatus[status].idades;
  });
  
  res.json(stats);
});

// POST /tickets/cleanup - Executar limpeza manual de tickets antigos
// IMPORTANTE: Deve vir ANTES de /tickets/:id para não conflitar
app.post('/tickets/cleanup', authenticateRequest, (req, res) => {
  console.log('🧹 [SYNC] POST /tickets/cleanup - Limpeza manual solicitada');
  const result = cleanupOldTickets();
  res.json({
    success: true,
    message: `Limpeza concluída: ${result.removed} tickets removidos`,
    ...result,
    rules: TICKET_CLEANUP_RULES
  });
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
  
  console.log('📥 [SYNC] POST /tickets - Dados recebidos:', {
    id: newTicket.id,
    codigo: newTicket.codigo,
    status: newTicket.status,
    nomeCompleto: newTicket.nomeCompleto,
    dataCadastro: newTicket.dataCadastro
  });
  
  // Validar ticket
  const validation = validateTicket(newTicket);
  if (!validation.isValid) {
    logger.warn('Ticket validation failed', { errors: validation.errors, ip: req.ip });
    console.error('❌ [SYNC] Validação do ticket falhou:', validation.errors);
    return res.status(400).json({ 
      error: 'Dados do ticket inválidos',
      errors: validation.errors 
    });
  }
  
  // Usar ticket sanitizado
  const sanitizedTicket = validation.sanitized;
  
  console.log('📥 [SYNC] Ticket sanitizado:', {
    id: sanitizedTicket.id,
    codigo: sanitizedTicket.codigo,
    status: sanitizedTicket.status
  });
  
  if (!sanitizedTicket.id || !sanitizedTicket.codigo) {
    console.error('❌ [SYNC] Ticket sem id ou codigo');
    return res.status(400).json({ error: 'Ticket deve ter id e codigo' });
  }
  
  const tickets = readTickets();
  console.log(`📥 [SYNC] Total de tickets existentes: ${tickets.length}`);
  
  // Verificar se ticket já existe
  const existingByCode = tickets.find(t => t.codigo === sanitizedTicket.codigo);
  const existingById = tickets.find(t => t.id === sanitizedTicket.id);
  
  // Se mesmo ID, é uma atualização do mesmo ticket (permitir)
  if (existingById && existingById.id === sanitizedTicket.id) {
    logger.info(`Ticket ${sanitizedTicket.codigo} (ID: ${sanitizedTicket.id}) já existe com mesmo ID, atualizando...`);
    console.log(`🔄 [SYNC] Ticket ${sanitizedTicket.codigo} já existe, atualizando...`);
    const existingIndex = tickets.findIndex(t => t.id === sanitizedTicket.id);
    tickets[existingIndex] = { ...tickets[existingIndex], ...sanitizedTicket };
    
    if (saveTickets(tickets)) {
      logger.info(`Ticket ${sanitizedTicket.codigo} atualizado com sucesso`);
      console.log(`✅ [SYNC] Ticket ${sanitizedTicket.codigo} atualizado com status: ${sanitizedTicket.status}`);
      res.json(sanitizedTicket);
    } else {
      logger.error('Erro ao salvar ticket', { codigo: sanitizedTicket.codigo });
      console.error(`❌ [SYNC] Erro ao salvar ticket ${sanitizedTicket.codigo}`);
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
    console.warn(`⚠️ [SYNC] Tentativa de criar ticket duplicado: ${sanitizedTicket.codigo}`);
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
  console.log(`➕ [SYNC] Adicionando novo ticket ${sanitizedTicket.codigo} com status: ${sanitizedTicket.status}`);
  tickets.push(sanitizedTicket);
  
  if (saveTickets(tickets)) {
    logger.info(`Ticket ${sanitizedTicket.codigo} salvo com sucesso`);
    console.log(`✅ [SYNC] Ticket ${sanitizedTicket.codigo} salvo com sucesso! Status: ${sanitizedTicket.status}`);
    console.log(`✅ [SYNC] Total de tickets após salvar: ${tickets.length}`);
    res.json(sanitizedTicket);
  } else {
    logger.error('Erro ao salvar ticket', { codigo: sanitizedTicket.codigo });
    console.error(`❌ [SYNC] Erro ao salvar ticket ${sanitizedTicket.codigo}`);
    res.status(500).json({ error: 'Erro ao salvar ticket' });
  }
});

// DELETE /tickets/:id - Deletar ticket
app.delete('/tickets/:id', authenticateRequest, (req, res) => {
  const { id } = req.params;
  console.log(`🗑️ [SYNC] DELETE /tickets/${id} - Deletando ticket`);
  
  const tickets = readTickets();
  const ticketIndex = tickets.findIndex(t => t.id === id || t.codigo === id);
  
  if (ticketIndex === -1) {
    console.log(`❌ [SYNC] Ticket não encontrado para deletar: ${id}`);
    return res.status(404).json({ error: 'Ticket não encontrado' });
  }
  
  const deletedTicket = tickets[ticketIndex];
  tickets.splice(ticketIndex, 1);
  
  if (saveTickets(tickets)) {
    console.log(`✅ [SYNC] Ticket ${deletedTicket.codigo} deletado com sucesso!`);
    logger.info(`Ticket ${deletedTicket.codigo} deletado`, { id, codigo: deletedTicket.codigo });
    res.json({ 
      success: true, 
      message: `Ticket ${deletedTicket.codigo} deletado com sucesso`,
      deleted: deletedTicket 
    });
  } else {
    console.error(`❌ [SYNC] Erro ao deletar ticket ${id}`);
    res.status(500).json({ error: 'Erro ao deletar ticket' });
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
// Suporta tanto API v1 (transaction.paid) quanto API v5 (order.paid, charge.paid)
app.post('/webhooks/pagarme', express.json(), async (req, res) => {
  logger.info('POST /webhooks/pagarme - Webhook recebido do Pagar.me', { ip: req.ip });
  
  try {
    // Pagar.me envia eventos como JSON
    const event = req.body;
    
    // Log completo do payload para debug
    console.log('📦 [Pagar.me Webhook v5] Payload completo recebido:', JSON.stringify(event, null, 2));
    
    // API v5 envia type, API v1 envia event
    const eventType = event.type || event.event || 'unknown';
    console.log('📦 [Pagar.me Webhook v5] Tipo de evento:', eventType);
    
    // Verificar se é evento de pagamento confirmado
    // API v5: order.paid, charge.paid
    // API v1 (legada): transaction.paid
    const isPaidEvent = 
      eventType === 'order.paid' ||
      eventType === 'charge.paid' ||
      eventType === 'transaction.paid' ||
      event.data?.status === 'paid' ||
      event.order?.status === 'paid' ||
      event.transaction?.status === 'paid' ||
      event.status === 'paid';
    
    if (!isPaidEvent) {
      console.log('⚠️ [Pagar.me Webhook v5] Evento ignorado (não é pagamento confirmado):', eventType);
      return res.status(200).json({ received: true, processed: false, reason: 'Evento não é pagamento confirmado' });
    }
    
    // ============================================
    // Extrair informações - API v5 usa estrutura data
    // ============================================
    let orderData = null;
    let orderId = null;
    let orderCode = null;  // Na v5, code é o identificador que definimos
    let metadata = {};
    
    // API v5: dados vêm em event.data
    if (event.data) {
      orderData = event.data;
      orderId = orderData.id?.toString();
      orderCode = orderData.code;  // CODE é o ticket_id que passamos na criação!
      metadata = orderData.metadata || {};
      
      console.log('📦 [Pagar.me Webhook v5] Estrutura API v5 detectada:', { orderId, orderCode });
    }
    // API v1 legada: event.order ou event.transaction
    else if (event.order) {
      orderData = event.order;
      orderId = orderData.id?.toString();
      orderCode = orderData.external_id;
      metadata = orderData.metadata || {};
      
      // Se metadata não estiver no order, verificar nos items
      if (!metadata.ticket_id && orderData.items && Array.isArray(orderData.items)) {
        for (const item of orderData.items) {
          if (item.metadata && item.metadata.ticket_id) {
            metadata = item.metadata;
            break;
          }
        }
      }
    } else if (event.transaction) {
      orderData = event.transaction;
      orderId = orderData.id?.toString();
      orderCode = orderData.external_id;
      metadata = orderData.metadata || {};
    } else {
      // Fallback - tentar usar o próprio event
      orderData = event;
      orderId = event.id?.toString();
      orderCode = event.code || event.external_id;
      metadata = event.metadata || {};
    }
    
    // ============================================
    // Encontrar ticket_id - Prioridade:
    // 1. orderCode (code da API v5 = ticket_id)
    // 2. metadata.ticket_id ou metadata.ticket_code
    // 3. external_id
    // ============================================
    let ticketId = orderCode || metadata.ticket_id || metadata.ticket_code;
    
    // Se não encontrou, verificar em diferentes estruturas
    if (!ticketId) {
      // Tentar no orderData direto
      if (orderData.metadata) {
        ticketId = orderData.metadata.ticket_id || orderData.metadata.ticket_code;
      }
      
      // Tentar nos items
      if (!ticketId && orderData.items && Array.isArray(orderData.items)) {
        for (const item of orderData.items) {
          if (item.metadata && (item.metadata.ticket_id || item.metadata.ticket_code)) {
            ticketId = item.metadata.ticket_id || item.metadata.ticket_code;
            break;
          }
        }
      }
      
      // Tentar no external_id (pode conter o ticket_id)
      if (!ticketId && orderData.external_id) {
        const externalId = orderData.external_id.toString();
        // Se external_id começa com ticket- ou TK-, usar ele
        if (externalId.startsWith('ticket-') || externalId.startsWith('TK-')) {
          ticketId = externalId;
        }
      }
    }
    
    console.log('📦 [Pagar.me Webhook v5] Dados extraídos:', {
      orderId,
      orderCode,
      ticketId,
      metadata,
      external_id: orderData.external_id,
      fullOrderData: JSON.stringify(orderData, null, 2).substring(0, 500)
    });
    
    if (!ticketId) {
      console.warn('⚠️ [Pagar.me Webhook v5] Ticket ID não encontrado. Metadata completo:', JSON.stringify(metadata, null, 2));
      console.warn('⚠️ [Pagar.me Webhook v5] Order Data completo:', JSON.stringify(orderData, null, 2).substring(0, 1000));
      // Não retornar erro 200 para que Pagar.me tente novamente
      return res.status(500).json({ received: true, processed: false, reason: 'Ticket ID não encontrado no webhook' });
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
      mensagem: `Pagamento confirmado via Pagar.me (Pedido: ${orderId || 'N/A'}). Ticket em processamento.`,
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
    
    logger.info('✅ [Pagar.me Webhook v5] Webhook processado com sucesso', {
      ticketCodigo: ticket.codigo,
      orderId: orderId,
      orderCode: orderCode,
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
const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY || '6LemYqorAAAAACIgB-Wv3TCak7n3N7JVFogR66BW';

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
      filtered = filtered.filter(m => !m.archived && m.type !== 'sent');
    } else if (folder === 'unread') {
      filtered = filtered.filter(m => !m.read && !m.archived && m.type !== 'sent');
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

// GET /contact-messages/storage-stats - Estatísticas de armazenamento
app.get('/contact-messages/storage-stats', authenticateRequest, (req, res) => {
  try {
    const messages = readContactMessages();
    
    // Calcular tamanho do arquivo JSON
    let fileSize = 0;
    if (fs.existsSync(CONTACT_MESSAGES_FILE)) {
      const stats = fs.statSync(CONTACT_MESSAGES_FILE);
      fileSize = stats.size;
    }
    
    // Calcular tamanho estimado das mensagens em memória (JSON stringificado)
    const messagesJson = JSON.stringify(messages);
    const estimatedSize = Buffer.byteLength(messagesJson, 'utf8');
    
    // Usar o maior valor (arquivo ou estimativa)
    const used = Math.max(fileSize, estimatedSize);
    
    // Capacidade configurável (padrão: 100MB)
    const capacityBytes = parseInt(process.env.EMAIL_STORAGE_CAPACITY || '104857600', 10); // 100MB em bytes
    const percentage = capacityBytes > 0 ? Math.round((used / capacityBytes) * 100) : 0;
    
    res.json({
      used,
      capacity: capacityBytes,
      percentage,
      messagesCount: messages.length,
      formatted: {
        used: formatBytes(used),
        capacity: formatBytes(capacityBytes),
        available: formatBytes(Math.max(0, capacityBytes - used))
      }
    });
  } catch (error) {
    logger.logError(error, { endpoint: 'GET /contact-messages/storage-stats' });
    res.status(500).json({ error: 'Erro ao obter estatísticas de armazenamento' });
  }
});

// Função auxiliar para formatar bytes
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// Função auxiliar para formatar uptime
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  
  return parts.join(' ');
}

// Função auxiliar para calcular tamanho do diretório
function calculateDirectorySize(dirPath) {
  let totalSize = 0;
  
  try {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      // Ignorar node_modules e .git para performance
      if (item === 'node_modules' || item === '.git') continue;
      
      const itemPath = path.join(dirPath, item);
      
      try {
        const stats = fs.statSync(itemPath);
        
        if (stats.isFile()) {
          totalSize += stats.size;
        } else if (stats.isDirectory()) {
          totalSize += calculateDirectorySize(itemPath);
        }
      } catch {
        // Ignorar erros de permissão
      }
    }
  } catch {
    // Retornar 0 se não conseguir ler o diretório
  }
  
  return totalSize;
}

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

// POST /contact-messages/compose - Compor e enviar novo email
app.post('/contact-messages/compose', authenticateRequest, async (req, res) => {
  logger.info('POST /contact-messages/compose - Compor novo email', { ip: req.ip });
  
  try {
    const { to, cc, bcc, subject, content, draft } = req.body;
    
    // Validar campos obrigatórios
    if (!to || !subject || !content) {
      return res.status(400).json({ 
        error: 'Campos obrigatórios: to, subject, content' 
      });
    }
    
    // Validar email destinatário (pode ser múltiplos separados por vírgula)
    const toEmails = to.split(',').map(e => e.trim());
    for (const email of toEmails) {
      if (!validateEmail(email)) {
        return res.status(400).json({ error: `Email destinatário inválido: ${email}` });
      }
    }
    
    // Validar emails CC e BCC se fornecidos
    if (cc) {
      const ccEmails = cc.split(',').map(e => e.trim());
      for (const email of ccEmails) {
        if (!validateEmail(email)) {
          return res.status(400).json({ error: `Email CC inválido: ${email}` });
        }
      }
    }
    if (bcc) {
      const bccEmails = bcc.split(',').map(e => e.trim());
      for (const email of bccEmails) {
        if (!validateEmail(email)) {
          return res.status(400).json({ error: `Email BCC inválido: ${email}` });
        }
      }
    }
    
    const messages = readContactMessages();
    
    // Gerar ID único
    const id = `MSG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newMessage = {
      id,
      type: 'sent',
      from: 'Sistema',
      fromEmail: process.env.SUPPORT_EMAIL || 'suporte@portalcertidao.org',
      to: to.split(',')[0].trim(), // Pegar primeiro email se múltiplos
      toEmail: to,
      cc: cc || null,
      bcc: bcc || null,
      subject,
      preview: content.replace(/<[^>]*>/g, '').substring(0, 100) + (content.length > 100 ? '...' : ''),
      content, // HTML do editor rico
      read: true,
      starred: false,
      archived: false,
      deleted: false,
      hasAttachment: false,
      createdAt: new Date().toISOString(),
      replies: [],
      draft: draft || false
    };
    
    // Se não for rascunho, enviar email via SendPulse
    if (!draft) {
      try {
        // Preparar destinatários
        const recipients = to.split(',').map(e => e.trim());
        const ccRecipients = cc ? cc.split(',').map(e => e.trim()) : undefined;
        const bccRecipients = bcc ? bcc.split(',').map(e => e.trim()) : undefined;
        
        // Enviar email via SendPulse
        const emailResult = await sendPulseService.sendEmail({
          to: recipients,
          cc: ccRecipients,
          bcc: bccRecipients,
          subject,
          html: content,
          from: {
            name: 'Portal Certidão',
            email: process.env.SUPPORT_EMAIL || 'suporte@portalcertidao.org'
          }
        });
        
        if (!emailResult.success) {
          console.error('❌ [Compose Email] Erro ao enviar email:', emailResult.error);
          return res.status(500).json({ 
            error: 'Erro ao enviar email',
            details: emailResult.error 
          });
        }
        
        console.log('✅ [Compose Email] Email enviado com sucesso para:', to);
      } catch (emailError) {
        console.error('❌ [Compose Email] Erro ao enviar email:', emailError);
        return res.status(500).json({ 
          error: 'Erro ao enviar email',
          details: emailError.message 
        });
      }
    }
    
    // Salvar mensagem
    messages.push(newMessage);
    saveContactMessages(messages);
    
    logger.info('Email composto salvo', { 
      id, 
      to, 
      draft: draft || false 
    });
    
    res.status(201).json({
      success: true,
      message: newMessage,
      sent: !draft
    });
    
  } catch (error) {
    logger.logError(error, { endpoint: 'POST /contact-messages/compose' });
    res.status(500).json({ error: 'Erro ao compor email' });
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

