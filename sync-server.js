/**
 * Servidor de Sincronização de Tickets
 * Sincroniza tickets entre PORTAL (localhost:3000) e PLATAFORMA (localhost:8081)
 * Roda na porta 3001
 */

require('dotenv').config();
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// ETAPA 6: Gerar SHEETS_CREDENTIALS_ENCRYPTION_KEY automaticamente se não existir
const ENV_PATH = path.join(__dirname, '.env');
if (!process.env.SHEETS_CREDENTIALS_ENCRYPTION_KEY) {
  try {
    const newKey = crypto.randomBytes(32).toString('base64');
    const line = `\n# GCLID/Sheets - gerado automaticamente\nSHEETS_CREDENTIALS_ENCRYPTION_KEY=${newKey}\n`;
    if (fs.existsSync(ENV_PATH)) {
      fs.appendFileSync(ENV_PATH, line);
      console.log('✅ [SYNC] SHEETS_CREDENTIALS_ENCRYPTION_KEY gerada e salva no .env');
    } else {
      fs.writeFileSync(ENV_PATH, `SHEETS_CREDENTIALS_ENCRYPTION_KEY=${newKey}\n`);
      console.log('✅ [SYNC] .env criado com SHEETS_CREDENTIALS_ENCRYPTION_KEY');
    }
    process.env.SHEETS_CREDENTIALS_ENCRYPTION_KEY = newKey;
  } catch (e) {
    console.warn('⚠️ [SYNC] Não foi possível gerar/salvar SHEETS_CREDENTIALS_ENCRYPTION_KEY:', e.message);
  }
}

const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const sendPulseService = require('./services/sendPulseService');
const zapApiService = require('./services/zapApiService');
const plexiWorker = require('./services/plexi/worker');
const { getRegistryKey, validateRequiredFields, formatMissingFieldsForUser, ServiceRegistry } = require('./services/plexi/registry');
const { validateEmail, validatePhone } = require('./utils/validators');
const logger = require('./utils/logger');
const { validateTicket, validateUpload, validateInteraction } = require('./utils/validation');
const os = require('os');
const cron = require('node-cron');

// Inicializar banco de dados do funil (se feature flag estiver habilitada)
let funnelDatabase = null;
if (process.env.COLLECTOR_ENABLED !== 'false') {
  try {
    const funnelDb = require('./services/funnelDatabase');
    funnelDatabase = funnelDb;
    funnelDb.initDatabase();
    console.log('✅ [SYNC] Banco de dados do funil inicializado');
  } catch (error) {
    console.error('⚠️ [SYNC] Erro ao inicializar banco de dados do funil:', error.message);
  }
}

// Inicializar banco GCLID/Sheets (conversões offline para Google Ads)
let gclidSheetsDb = null;
try {
  gclidSheetsDb = require('./services/gclidSheetsDatabase');
  gclidSheetsDb.initDatabase();
  console.log('✅ [SYNC] Banco GCLID/Sheets inicializado');
} catch (error) {
  console.error('⚠️ [SYNC] Erro ao inicializar banco GCLID/Sheets:', error.message);
}

const app = express();

// Armazenar conexões SSE ativas para métricas do sistema
const sseClients = new Set();
const PORT = process.env.PORT || 3001;
const TICKETS_FILE = path.join(__dirname, 'tickets-data.json');
const CONTACT_MESSAGES_FILE = path.join(__dirname, 'contact-messages.json');
const COPIES_FILE = path.join(__dirname, 'copies-data.json');
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const STORAGE_CERTIDOES_PATH = path.join(__dirname, 'storage', 'certidoes');

// Configuração de CORS
// IMPORTANTE: Quando credentials: true, não podemos usar '*' como origem
// Precisamos especificar as origens explicitamente
const getCorsOrigins = () => {
  if (process.env.CORS_ORIGINS) {
    const origins = process.env.CORS_ORIGINS.split(',').map(origin => origin.trim());
    // Garantir que localhost:8083 está incluído se não estiver na lista (desenvolvimento)
    if (!origins.includes('http://localhost:8083') && process.env.NODE_ENV !== 'production') {
      origins.push('http://localhost:8083');
    }
    // Garantir que www.suporteonline.digital está incluído se não estiver na lista (produção)
    const suporteOnlineOrigins = [
      'https://www.suporteonline.digital',
      'https://suporteonline.digital',
      'http://www.suporteonline.digital',
      'http://suporteonline.digital'
    ];
    suporteOnlineOrigins.forEach(origin => {
      if (!origins.includes(origin)) {
        origins.push(origin);
      }
    });
    // Garantir que www.centraldascertidoes.com está incluído se não estiver na lista (produção)
    const guiaCertidoesOrigins = [
      'https://www.centraldascertidoes.com',
      'https://centraldascertidoes.com',
      'http://www.centraldascertidoes.com',
      'http://centraldascertidoes.com'
    ];
    guiaCertidoesOrigins.forEach(origin => {
      if (!origins.includes(origin)) {
        origins.push(origin);
      }
    });
    // Garantir que www.guia-central.online está incluído se não estiver na lista (produção)
    const guiaCentralOrigins = [
      'https://www.guia-central.online',
      'https://guia-central.online',
      'http://www.guia-central.online',
      'http://guia-central.online'
    ];
    guiaCentralOrigins.forEach(origin => {
      if (!origins.includes(origin)) {
        origins.push(origin);
      }
    });
    return origins;
  }
  // Em desenvolvimento, incluir origens comuns do localhost
  // Não usar '*' quando credentials: true
  const defaultOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:8080',
    'http://localhost:8081',
    'http://localhost:8083',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:8080',
    'http://127.0.0.1:8081',
    'http://127.0.0.1:8083',
    // Incluir suporteonline.digital mesmo em desenvolvimento para testes
    'https://www.suporteonline.digital',
    'https://suporteonline.digital',
    // Incluir centraldascertidoes.com mesmo em desenvolvimento para testes
    'https://www.centraldascertidoes.com',
    'https://centraldascertidoes.com',
    // Incluir guia-central.online mesmo em desenvolvimento para testes
    'https://www.guia-central.online',
    'https://guia-central.online',
  ];
  return defaultOrigins;
};

// Configuração de CORS - usar lista direta que sempre inclui localhost:8083
const corsOriginsList = getCorsOrigins();

const corsOptions = {
  origin: corsOriginsList, // Lista de origens permitidas (sempre inclui localhost:8083)
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
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
// Configuração ajustada para não bloquear CORS
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "http://localhost:*", "http://127.0.0.1:*"], // Permitir conexões de localhost em desenvolvimento
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Permitir uploads de arquivos
  crossOriginResourcePolicy: false, // Desabilitar completamente para não interferir com CORS
}));

// Configurar trust proxy para funcionar atrás do Nginx
// Valor numérico = número de saltos de proxy a confiar (1 = apenas o primeiro proxy)
// Isso evita tanto ERR_ERL_PERMISSIVE_TRUST_PROXY (quando true) quanto
// ERR_ERL_UNEXPECTED_X_FORWARDED_FOR (quando false com X-Forwarded-For presente)
app.set('trust proxy', 1);

// Middleware adicional para garantir header Access-Control-Allow-Origin ANTES do CORS
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
    // Sempre adicionar o header Access-Control-Allow-Origin
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    // Adicionar headers adicionais para requisições OPTIONS
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-API-Key');
      res.setHeader('Access-Control-Max-Age', '86400'); // 24 horas
      return res.status(200).end(); // Responder imediatamente para OPTIONS
    }
  }
  next();
});

// Middleware CORS
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

// Secret key reCAPTCHA para Guia Central (guia-central.online)
// RECAPTCHA_GUIA_SECRET_KEY = chave real | RECAPTCHA_GUIA_TEST_SECRET = fallback para testes
// Envia email via SendPulse E salva na tabela de email (contact-messages) para aparecer na plataforma
const RECAPTCHA_GUIA_SECRET_KEY = process.env.RECAPTCHA_GUIA_SECRET_KEY || process.env.RECAPTCHA_GUIA_TEST_SECRET || process.env.RECAPTCHA_SECRET_KEY;

// Handler do formulário Fale Conosco (reutilizado em /api/contato e /contato)
const handleContato = async (req, res) => {
  try {
    const { nome, email, mensagem, recaptchaToken } = req.body || {};
    if (!nome || !email || !mensagem) {
      return res.status(400).json({ ok: false, error: 'Campos obrigatórios: nome, email, mensagem' });
    }
    if (!validateEmail(email)) {
      return res.status(400).json({ ok: false, error: 'E-mail inválido' });
    }
    if (!recaptchaToken) {
      return res.status(400).json({ ok: false, error: 'Verificação reCAPTCHA obrigatória' });
    }
    const guiaSecretKey = RECAPTCHA_GUIA_SECRET_KEY;
    if (!guiaSecretKey) {
      console.error('[SYNC] RECAPTCHA_GUIA_SECRET_KEY não configurada');
      return res.status(500).json({ ok: false, error: 'Configuração reCAPTCHA incompleta' });
    }
    const recaptchaRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${guiaSecretKey}&response=${recaptchaToken}`
    });
    const recaptchaData = await recaptchaRes.json();
    if (!recaptchaData.success) {
      return res.status(400).json({ ok: false, error: 'Verificação reCAPTCHA falhou' });
    }
    // Usar SendPulse (API) em vez de SMTP GoDaddy - evita timeout em servidores cloud
    const htmlContent = `<p><strong>Nome:</strong> ${nome}</p><p><strong>E-mail:</strong> <a href="mailto:${email}">${email}</a></p><p><strong>Mensagem:</strong></p><p>${String(mensagem).replace(/\n/g, '<br>')}</p>`;
    const textContent = `Nome: ${nome}\nE-mail: ${email}\n\nMensagem:\n${mensagem}`;
    const fromEmail = process.env.GUIA_CENTRAL_SENDER_EMAIL || process.env.SENDPULSE_SENDER_EMAIL || 'contato@portalcertidao.org';
    const fromName = process.env.GUIA_CENTRAL_SENDER_NAME || process.env.SENDPULSE_SENDER_NAME || 'Guia Central';

    try {
      const result = await sendPulseService.sendEmail({
        to: 'contato@guia-central.online',
        subject: `Fale Conosco — ${nome}`,
        html: htmlContent,
        text: textContent,
        from: { name: fromName, email: fromEmail }
      });
      if (result.success) {
        try {
          const messages = readContactMessages();
          const id = `MSG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const newMessage = {
            id,
            type: 'received',
            from: nome,
            fromEmail: email,
            phone: req.body?.telefone || null,
            subject: `Fale Conosco (Guia Central) — ${nome}`,
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
          logger.info('Mensagem Fale Conosco salva na tabela de email', { id, from: nome, email });
        } catch (saveErr) {
          console.error('[SYNC] Erro ao salvar mensagem na tabela de email (email já enviado):', saveErr.message);
        }
        console.log('[SYNC] Email contato enviado via SendPulse para contato@guia-central.online');
        return res.json({ ok: true });
      }
      console.error('[SYNC] SendPulse rejeitou email contato:', result.error);
      return res.status(500).json({ ok: false, error: 'Erro ao enviar mensagem. Tente novamente ou envie para contato@guia-central.online.' });
    } catch (mailErr) {
      console.error('[SYNC] Erro ao enviar email contato:', mailErr.message);
      return res.status(500).json({ ok: false, error: 'Erro ao enviar mensagem. Tente novamente ou envie para contato@guia-central.online.' });
    }
  } catch (err) {
    console.error('[SYNC] Erro ao enviar email contato:', err);
    return res.status(500).json({ ok: false, error: 'Erro ao enviar mensagem. Tente novamente mais tarde.' });
  }
};

// POST /api/contato e POST /contato - Formulário Fale Conosco (SMTP GoDaddy)
// /contato existe para nginx que faz proxy_pass removendo /api
app.post('/api/contato', createTicketLimiter, express.json(), handleContato);
app.post('/contato', createTicketLimiter, express.json(), handleContato);

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

// GET /system/email/health - Health check do serviço de email (SendPulse)
app.get('/system/email/health', authenticateRequest, (req, res) => {
  try {
    const SENDPULSE_CLIENT_ID = process.env.SENDPULSE_CLIENT_ID;
    const SENDPULSE_CLIENT_SECRET = process.env.SENDPULSE_CLIENT_SECRET;
    const SENDPULSE_SENDER_EMAIL = process.env.SENDPULSE_SENDER_EMAIL;
    
    const isConfigured = !!(SENDPULSE_CLIENT_ID && SENDPULSE_CLIENT_SECRET && SENDPULSE_SENDER_EMAIL);
    
    res.json({
      status: isConfigured ? 'ok' : 'not_configured',
      service: 'SendPulse',
      configured: isConfigured,
      timestamp: new Date().toISOString(),
      ...(isConfigured ? {} : { message: 'Serviço de email não configurado' })
    });
  } catch (error) {
    logger.logError(error, { endpoint: 'GET /system/email/health' });
    res.status(500).json({ 
      status: 'error',
      error: 'Erro ao verificar status do serviço de email' 
    });
  }
});

// GET /system/whatsapp/health - Health check do serviço de WhatsApp (Zap API)
app.get('/system/whatsapp/health', authenticateRequest, (req, res) => {
  try {
    const ZAP_API_URL = process.env.ZAP_API_URL;
    const ZAP_API_KEY = process.env.ZAP_API_KEY;
    const ZAP_CLIENT_TOKEN = process.env.ZAP_CLIENT_TOKEN;
    
    const isConfigured = !!(ZAP_API_URL && ZAP_API_KEY && ZAP_CLIENT_TOKEN);
    
    res.json({
      status: isConfigured ? 'ok' : 'not_configured',
      service: 'Zap API',
      configured: isConfigured,
      timestamp: new Date().toISOString(),
      ...(isConfigured ? {} : { message: 'Serviço de WhatsApp não configurado' })
    });
  } catch (error) {
    logger.logError(error, { endpoint: 'GET /system/whatsapp/health' });
    res.status(500).json({ 
      status: 'error',
      error: 'Erro ao verificar status do serviço de WhatsApp' 
    });
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
      logger.warn('Dados do cliente incompletos', { 
        hasCustomer: !!customer,
        hasName: !!customer?.name,
        hasEmail: !!customer?.email,
        hasDocument: !!customer?.document_number,
        customer: customer
      });
      return res.status(400).json({ 
        error: 'Dados do cliente incompletos',
        details: 'Nome, email e documento são obrigatórios',
        received: {
          hasName: !!customer?.name,
          hasEmail: !!customer?.email,
          hasDocument: !!customer?.document_number
        }
      });
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

    // Validar email (bloquear caracteres especiais inválidos)
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/;
    const email = (customer.email || '').trim();
    const emailHasConsecutiveDots = email.includes('..');
    const [emailLocal] = email.split('@');
    const emailLocalInvalid = emailLocal ? (emailLocal.startsWith('.') || emailLocal.endsWith('.')) : true;
    if (!email || !emailRegex.test(email) || emailHasConsecutiveDots || emailLocalInvalid) {
      logger.warn('Email inválido no pedido PIX', { 
        email,
        reason: 'invalid_format_or_special_chars'
      });
      return res.status(400).json({ 
        error: 'Email inválido. Remova caracteres especiais e verifique o formato.'
      });
    }

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
        email: email, // Email validado
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
          expires_in: 86400 // 1 dia em segundos (24 horas)
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
    
    // Log completo da resposta para debug
    console.log('📦 [Pagar.me API v5] Resposta completa da API:', JSON.stringify(order, null, 2).substring(0, 2000));
    
    // Extrair dados do charge/transaction
    const charge = order.charges?.[0];
    const lastTransaction = charge?.last_transaction;
    
    // Log detalhado da resposta completa
    console.log('✅ [Pagar.me API v5] Pedido criado:', {
      order_id: order.id,
      code: order.code,
      status: order.status,
      charge_id: charge?.id,
      charge_status: charge?.status,
      hasLastTransaction: !!lastTransaction,
      lastTransactionKeys: lastTransaction ? Object.keys(lastTransaction) : [],
      qr_code: lastTransaction?.qr_code ? (lastTransaction.qr_code.substring(0, 50) + '...') : 'Não gerado',
      qr_code_url: lastTransaction?.qr_code_url || 'Não gerado',
      qr_code_length: lastTransaction?.qr_code?.length || 0,
      expires_at: lastTransaction?.expires_at || 'Não definido'
    });
    
    // Verificar se temos QR Code
    if (!lastTransaction?.qr_code && !lastTransaction?.qr_code_url) {
      console.error('❌ [Pagar.me API v5] QR Code não encontrado na resposta!', {
        order: order.id,
        charge: charge?.id,
        lastTransaction: lastTransaction ? Object.keys(lastTransaction) : 'null',
        fullCharge: charge ? JSON.stringify(charge, null, 2).substring(0, 1000) : 'null',
        fullResponse: JSON.stringify(order, null, 2).substring(0, 2000)
      });
      
      // Tentar buscar em outras estruturas possíveis
      if (charge) {
        console.log('🔍 [Pagar.me API v5] Tentando encontrar QR Code em outras estruturas...');
        console.log('🔍 Charge completo:', JSON.stringify(charge, null, 2).substring(0, 1000));
      }
    }
    
    // ============================================
    // RESPOSTA - Mapeada para formato do frontend
    // ============================================
    const responseData = {
      id: order.id,
      external_id: order.code,
      order_id: order.id,
      charge_id: charge?.id,
      status: order.status,
      amount: order.amount,
      payment_method: 'pix',
      // PIX data da API v5 - IMPORTANTE: usar qr_code (string completa) e qr_code_url (URL da imagem)
      pix_qr_code: lastTransaction?.qr_code || null,
      pix_qr_code_url: lastTransaction?.qr_code_url || null,
      pix_expiration_date: lastTransaction?.expires_at || null,
      // Campos legados para compatibilidade
      transaction_id: lastTransaction?.id,
      metadata: order.metadata || metadataValue
    };
    
    // Log da resposta que será enviada
    console.log('📤 [Pagar.me API v5] Resposta enviada ao frontend:', {
      id: responseData.id,
      status: responseData.status,
      has_pix_qr_code: !!responseData.pix_qr_code,
      pix_qr_code_length: responseData.pix_qr_code?.length || 0,
      has_pix_qr_code_url: !!responseData.pix_qr_code_url,
      pix_qr_code_url: responseData.pix_qr_code_url || 'Não disponível'
    });
    
    res.json(responseData);
    
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
      // É um Order - IMPORTANTE: verificar status do Charge, não do Order
      const charge = data.charges?.[0];
      const lastTransaction = charge?.last_transaction;
      
      // Status do Charge é o que importa para pagamento PIX
      // Order pode estar "paid" mas Charge ainda "pending_payment"
      const chargeStatus = charge?.status || data.status;
      
      res.json({
        id: data.id,
        order_id: data.id,
        charge_id: charge?.id,
        status: chargeStatus, // Usar status do Charge, não do Order
        amount: data.amount,
        payment_method: charge?.payment_method || 'pix',
        pix_qr_code: lastTransaction?.qr_code || null,
        pix_qr_code_url: lastTransaction?.qr_code_url || null,
        pix_expiration_date: lastTransaction?.expires_at || null,
        metadata: data.metadata || {}
      });
    } else {
      // É um Charge - usar status direto do Charge
      const lastTransaction = data.last_transaction;
      
      res.json({
        id: data.id,
        charge_id: data.id,
        order_id: data.order?.id,
        status: data.status, // Status do Charge já está correto
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
  // Tentar restaurar do backup mais recente antes de criar novo arquivo
  try {
    const backupDir = path.join(__dirname, 'backups');
    if (fs.existsSync(backupDir)) {
      const backups = fs.readdirSync(backupDir)
        .filter(f => f.startsWith('tickets-data-') && f.endsWith('.json'))
        .map(f => ({
          name: f,
          path: path.join(backupDir, f),
          time: fs.statSync(path.join(backupDir, f)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time);
      
      if (backups.length > 0) {
        const latestBackup = backups[0];
        console.log(`🔄 [RESTORE] Tentando restaurar de backup: ${latestBackup.name}`);
        fs.copyFileSync(latestBackup.path, TICKETS_FILE);
        const restoredTickets = readTickets();
        console.log(`✅ [RESTORE] Restaurados ${restoredTickets.length} tickets do backup`);
        logger.info(`Restaurados ${restoredTickets.length} tickets do backup ${latestBackup.name}`);
      } else {
        fs.writeFileSync(TICKETS_FILE, JSON.stringify([]));
        console.log('📁 Arquivo de tickets criado (sem backup disponível):', TICKETS_FILE);
      }
    } else {
      fs.writeFileSync(TICKETS_FILE, JSON.stringify([]));
      console.log('📁 Arquivo de tickets criado:', TICKETS_FILE);
    }
  } catch (error) {
    console.error('❌ [RESTORE] Erro ao restaurar backup:', error);
    fs.writeFileSync(TICKETS_FILE, JSON.stringify([]));
    console.log('📁 Arquivo de tickets criado (após erro na restauração):', TICKETS_FILE);
  }
}

// Inicializar arquivo de contact-messages se não existir
if (!fs.existsSync(CONTACT_MESSAGES_FILE)) {
  // Tentar restaurar do backup mais recente antes de criar novo arquivo
  try {
    const backupDir = path.join(__dirname, 'backups');
    if (fs.existsSync(backupDir)) {
      const backups = fs.readdirSync(backupDir)
        .filter(f => f.startsWith('contact-messages-') && f.endsWith('.json'))
        .map(f => ({
          name: f,
          path: path.join(backupDir, f),
          time: fs.statSync(path.join(backupDir, f)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time);
      
      if (backups.length > 0) {
        const latestBackup = backups[0];
        console.log(`🔄 [RESTORE CONTACT] Tentando restaurar de backup: ${latestBackup.name}`);
        fs.copyFileSync(latestBackup.path, CONTACT_MESSAGES_FILE);
        const restoredMessages = readContactMessages();
        console.log(`✅ [RESTORE CONTACT] Restauradas ${restoredMessages.length} mensagens do backup`);
        logger.info(`Restauradas ${restoredMessages.length} mensagens do backup ${latestBackup.name}`);
      } else {
        fs.writeFileSync(CONTACT_MESSAGES_FILE, JSON.stringify([]));
        console.log('📁 Arquivo de contact-messages criado (sem backup disponível):', CONTACT_MESSAGES_FILE);
      }
    } else {
      fs.writeFileSync(CONTACT_MESSAGES_FILE, JSON.stringify([]));
      console.log('📁 Arquivo de contact-messages criado:', CONTACT_MESSAGES_FILE);
    }
  } catch (error) {
    console.error('❌ [RESTORE CONTACT] Erro ao restaurar backup:', error);
    fs.writeFileSync(CONTACT_MESSAGES_FILE, JSON.stringify([]));
    console.log('📁 Arquivo de contact-messages criado (após erro na restauração):', CONTACT_MESSAGES_FILE);
  }
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

// Função genérica para limpar backups por limite de espaço
// Remove backups mais antigos quando o total ultrapassar maxSizeBytes
function cleanupBackupsBySize(backupDir, prefix, maxSizeBytes) {
  try {
    if (!fs.existsSync(backupDir)) {
      return;
    }

    // Listar todos os backups com o prefixo especificado
    const backups = fs.readdirSync(backupDir)
      .filter(f => f.startsWith(prefix) && f.endsWith('.json'))
      .map(f => {
        const filePath = path.join(backupDir, f);
        const stats = fs.statSync(filePath);
        return {
          name: f,
          path: filePath,
          size: stats.size,
          time: stats.mtime.getTime()
        };
      })
      .sort((a, b) => a.time - b.time); // Ordenar do mais antigo para o mais recente

    // Calcular tamanho total
    let totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);

    // Se ultrapassar o limite, remover backups mais antigos até ficar abaixo
    if (totalSize > maxSizeBytes) {
      console.log(`📊 [BACKUP] Tamanho total de backups ${prefix}: ${(totalSize / 1024 / 1024).toFixed(2)}MB (limite: ${(maxSizeBytes / 1024 / 1024).toFixed(2)}MB)`);
      
      let removedCount = 0;
      let removedSize = 0;
      
      for (const backup of backups) {
        if (totalSize <= maxSizeBytes) {
          break; // Já está abaixo do limite
        }
        
        fs.unlinkSync(backup.path);
        totalSize -= backup.size;
        removedSize += backup.size;
        removedCount++;
        console.log(`🗑️ [BACKUP] Removendo backup antigo para liberar espaço: ${backup.name} (${(backup.size / 1024 / 1024).toFixed(2)}MB)`);
      }
      
      if (removedCount > 0) {
        console.log(`✅ [BACKUP] Removidos ${removedCount} backups antigos. Espaço liberado: ${(removedSize / 1024 / 1024).toFixed(2)}MB. Tamanho atual: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
      }
    }
  } catch (error) {
    console.error(`⚠️ [BACKUP] Erro ao limpar backups por tamanho (${prefix}):`, error);
    logger.logError(error, { function: 'cleanupBackupsBySize', prefix });
  }
}

// Função auxiliar para fazer backup antes de salvar
function backupTicketsFile() {
  try {
    if (fs.existsSync(TICKETS_FILE)) {
      const backupDir = path.join(__dirname, 'backups');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      
      // Ler e validar arquivo antes de fazer backup
      const fileData = fs.readFileSync(TICKETS_FILE, 'utf8');
      let tickets;
      try {
        tickets = JSON.parse(fileData);
        if (!Array.isArray(tickets)) {
          console.error('⚠️ [BACKUP] Arquivo de tickets não é um array válido, pulando backup');
          return false;
        }
      } catch (parseError) {
        console.error('⚠️ [BACKUP] Erro ao parsear arquivo de tickets para backup:', parseError);
        return false;
      }
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(backupDir, `tickets-data-${timestamp}.json`);
      
      // Criar backup com verificação
      fs.writeFileSync(backupFile, fileData, 'utf8');
      
      // Verificar se backup foi criado corretamente
      if (!fs.existsSync(backupFile)) {
        console.error('❌ [BACKUP] ERRO: Backup não foi criado!');
        return false;
      }
      
      const backupData = fs.readFileSync(backupFile, 'utf8');
      const backupTickets = JSON.parse(backupData);
      
      if (backupTickets.length !== tickets.length) {
        console.error(`❌ [BACKUP] ERRO: Backup não corresponde ao arquivo original! Original: ${tickets.length}, Backup: ${backupTickets.length}`);
        fs.unlinkSync(backupFile); // Remover backup inválido
        return false;
      }
      
      console.log(`✅ [BACKUP] Backup criado com sucesso: ${backupFile.split('/').pop()} (${tickets.length} tickets)`);
      
      // Limpar backups antigos se ultrapassar 1GB (1073741824 bytes)
      const MAX_BACKUP_SIZE = 1073741824; // 1GB
      cleanupBackupsBySize(backupDir, 'tickets-data-', MAX_BACKUP_SIZE);
      
      return true;
    }
  } catch (error) {
    console.error('⚠️ [BACKUP] Erro ao criar backup:', error);
    logger.logError(error, { function: 'backupTicketsFile' });
  }
  return false;
}

// Função auxiliar para salvar tickets
function saveTickets(tickets) {
  try {
    // Fazer backup antes de salvar
    backupTicketsFile();
    
    const jsonData = JSON.stringify(tickets, null, 2);
    fs.writeFileSync(TICKETS_FILE, jsonData, 'utf8');
    
    // Verificar se o arquivo foi realmente escrito
    const verifyData = fs.readFileSync(TICKETS_FILE, 'utf8');
    const verifyTickets = JSON.parse(verifyData);
    
    if (verifyTickets.length !== tickets.length) {
      console.error(`❌ [SYNC] ERRO CRÍTICO: Arquivo não foi salvo corretamente! Esperado: ${tickets.length}, Salvo: ${verifyTickets.length}`);
      logger.logError(new Error(`Arquivo não foi salvo corretamente. Esperado: ${tickets.length}, Salvo: ${verifyTickets.length}`), { 
        function: 'saveTickets', 
        expectedCount: tickets.length,
        savedCount: verifyTickets.length
      });
      return false;
    }
    
    console.log(`✅ [SYNC] Arquivo verificado: ${verifyTickets.length} tickets salvos corretamente`);
    return true;
  } catch (error) {
    console.error(`❌ [SYNC] Erro ao salvar tickets:`, error);
    logger.logError(error, { function: 'saveTickets', ticketsCount: tickets.length });
    return false;
  }
}

// Inicializar worker Plexi
plexiWorker.init({
  readTickets,
  saveTickets,
  storageCertidoesPath: STORAGE_CERTIDOES_PATH,
  sendPulseService
});

// Recuperar tickets EM_OPERACAO com Plexi pendente (nunca processados)
// Útil após reinício do servidor ou quando enqueue falhou
function recoverPlexiPendingTickets() {
  try {
    const tickets = readTickets();
    const toEnqueue = tickets.filter(t => {
      if (t.status !== 'EM_OPERACAO') return false;
      if (t.pdfLocalPath || t.completedEmailSentAt) return false;
      const autoStatus = t.automationStatus;
      return !autoStatus || autoStatus === '' || autoStatus === 'PENDING';
    });
    if (toEnqueue.length > 0) {
      console.log(`🤖 [Plexi Recovery] Enfileirando ${toEnqueue.length} ticket(s) pendente(s) para processamento automático`);
      toEnqueue.forEach(t => {
        plexiWorker.enqueue(t.id);
        console.log(`🤖 [Plexi Recovery] Ticket ${t.codigo} enfileirado`);
      });
    }
  } catch (err) {
    console.error('❌ [Plexi Recovery] Erro:', err.message);
  }
}

// Executar recuperação na inicialização (após 3s para dar tempo do servidor subir)
setTimeout(recoverPlexiPendingTickets, 3000);

// Executar recuperação periodicamente (a cada 5 min) para pegar tickets que ficaram pendentes
const PLEXI_RECOVERY_INTERVAL = 5 * 60 * 1000;
setInterval(recoverPlexiPendingTickets, PLEXI_RECOVERY_INTERVAL);

// ============================================
// LIMPEZA AUTOMÁTICA DE TICKETS ANTIGOS
// ============================================
// Regras:
// - GERAL: apaga após 5 dias
// - EM_OPERACAO: apaga após 7 dias
// - CONCLUIDO: apaga após 10 dias

const TICKET_CLEANUP_RULES = {
  'GERAL': 30,          // 30 dias (aumentado de 5)
  'EM_OPERACAO': 60,    // 60 dias (aumentado de 7)
  'CONCLUIDO': 90       // 90 dias (aumentado de 10)
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

// Backup periódico mesmo sem mudanças (a cada 6 horas)
// Garante que sempre temos um backup recente mesmo se não houver alterações
const PERIODIC_BACKUP_INTERVAL = 6 * 60 * 60 * 1000; // 6 horas

setInterval(() => {
  console.log('💾 [BACKUP] Executando backup periódico...');
  
  // Backup de tickets
  const backupResult = backupTicketsFile();
  if (backupResult) {
    const tickets = readTickets();
    console.log(`✅ [BACKUP] Backup periódico de tickets concluído: ${tickets.length} tickets`);
    logger.info(`Backup periódico de tickets concluído: ${tickets.length} tickets`);
  } else {
    console.error('❌ [BACKUP] Falha no backup periódico de tickets!');
    logger.error('Falha no backup periódico de tickets');
  }
  
  // Backup de contact-messages
  const contactBackupResult = backupContactMessagesFile();
  if (contactBackupResult) {
    const messages = readContactMessages();
    console.log(`✅ [BACKUP CONTACT] Backup periódico de mensagens concluído: ${messages.length} mensagens`);
    logger.info(`Backup periódico de mensagens concluído: ${messages.length} mensagens`);
  } else {
    console.error('❌ [BACKUP CONTACT] Falha no backup periódico de mensagens!');
    logger.error('Falha no backup periódico de mensagens');
  }
}, PERIODIC_BACKUP_INTERVAL);

// Executar backup inicial após 1 minuto da inicialização
setTimeout(() => {
  console.log('💾 [BACKUP] Executando backup inicial...');
  
  // Backup inicial de tickets
  const backupResult = backupTicketsFile();
  if (backupResult) {
    const tickets = readTickets();
    console.log(`✅ [BACKUP] Backup inicial de tickets concluído: ${tickets.length} tickets`);
  }
  
  // Backup inicial de contact-messages
  const contactBackupResult = backupContactMessagesFile();
  if (contactBackupResult) {
    const messages = readContactMessages();
    console.log(`✅ [BACKUP CONTACT] Backup inicial de mensagens concluído: ${messages.length} mensagens`);
  }
}, 60000); // 1 minuto

// Executar limpeza inicial após 1 minuto do start
setTimeout(() => {
  console.log('🧹 [CLEANUP] Executando limpeza inicial...');
  cleanupOldTickets();
}, 60000);

console.log('🧹 [CLEANUP] Limpeza automática configurada: GERAL=30d, EM_OPERACAO=60d, CONCLUIDO=90d');

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
    dataCadastro: newTicket.dataCadastro,
    dominio: newTicket.dominio
  });
  if (newTicket.dominio && String(newTicket.dominio).includes('guia-central')) {
    console.log('📥 [SYNC] Ticket originado do GUIA_CENTRAL (guia-central.online)');
  }
  
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
  
  // Ao mover para EM_OPERACAO (ex: manualmente da aba Geral), enfileirar Plexi
  if (updates.status === 'EM_OPERACAO' && currentTicket.status !== 'EM_OPERACAO') {
    plexiWorker.enqueue(updatedTicket.id);
    console.log(`🤖 [Plexi] Ticket ${updatedTicket.codigo} enfileirado para processamento automático`);
  }
  
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

// POST /tickets/plexi/recover - Recuperar todos os tickets pendentes (EM_OPERACAO sem automationStatus)
app.post('/tickets/plexi/recover', authenticateRequest, express.json(), (req, res) => {
  logger.info('POST /tickets/plexi/recover - Recuperar tickets Plexi pendentes', { ip: req.ip });
  try {
    recoverPlexiPendingTickets();
    return res.json({
      success: true,
      message: 'Recuperação de tickets Plexi pendentes executada'
    });
  } catch (err) {
    logger.logError(err, { endpoint: '/tickets/plexi/recover', ip: req.ip });
    return res.status(500).json({ error: err.message });
  }
});

// POST /tickets/:id/plexi/retry - Reenviar para Plexi
app.post('/tickets/:id/plexi/retry', authenticateRequest, express.json(), (req, res) => {
  const { id } = req.params;
  logger.info(`POST /tickets/${id}/plexi/retry - Reenviar para Plexi`, { ip: req.ip });

  const tickets = readTickets();
  const ticketIndex = tickets.findIndex(t => t.id === id || t.codigo === id);
  if (ticketIndex === -1) {
    return res.status(404).json({ error: 'Ticket não encontrado' });
  }

  const ticket = tickets[ticketIndex];
  if (ticket.status !== 'EM_OPERACAO') {
    return res.status(400).json({
      error: 'Ticket deve estar em EM_OPERACAO para reenviar para Plexi',
      currentStatus: ticket.status
    });
  }

  const registryKey = getRegistryKey(ticket);
  if (!registryKey || !ServiceRegistry[registryKey]) {
    return res.status(400).json({
      error: `Esta certidão não possui API disponível na Plexi. Tipo: ${ticket.tipoCertidao}. A Plexi não oferece endpoint para este tipo de certidão.`,
      reason: 'NO_API'
    });
  }

  const config = ServiceRegistry[registryKey];
  const { valid, missing } = validateRequiredFields(ticket, config.requiredFields);
  if (!valid) {
    const labels = formatMissingFieldsForUser(missing);
    return res.status(400).json({
      error: `Dados faltando: ${labels}. Adicione esses campos no formulário de solicitação ou preencha manualmente no ticket e reenvie.`,
      reason: 'MISSING_FIELDS',
      missingFields: missing,
      missingFieldsLabels: labels
    });
  }

  plexiWorker.enqueue(ticket.id);
  return res.json({
    success: true,
    message: 'Ticket enfileirado para processamento Plexi',
    ticketCodigo: ticket.codigo
  });
});

// POST /tickets/:id/plexi/reset - Resetar Plexi (apenas admin/suporte autenticado)
app.post('/tickets/:id/plexi/reset', authenticateRequest, express.json(), (req, res) => {
  const { id } = req.params;
  logger.info(`POST /tickets/${id}/plexi/reset - Resetar Plexi`, { ip: req.ip });

  const tickets = readTickets();
  const ticketIndex = tickets.findIndex(t => t.id === id || t.codigo === id);
  if (ticketIndex === -1) {
    return res.status(404).json({ error: 'Ticket não encontrado' });
  }

  const ticket = tickets[ticketIndex];
  if (ticket.status !== 'EM_OPERACAO') {
    return res.status(400).json({
      error: 'Ticket deve estar em EM_OPERACAO para resetar Plexi',
      currentStatus: ticket.status
    });
  }

  const historico = ticket.historico || [];
  const now = new Date().toISOString();
  const uniqueId = `h-${Date.now()}-${historico.length}-${Math.random().toString(36).substr(2, 9)}-plexi-reset`;
  const historicoItem = {
    id: uniqueId,
    dataHora: now,
    autor: 'Sistema',
    statusAnterior: ticket.status,
    statusNovo: ticket.status,
    mensagem: 'Plexi resetado por admin',
    enviouEmail: false,
    enviouWhatsApp: false
  };

  tickets[ticketIndex] = {
    ...ticket,
    plexiRequestId: null,
    plexiStatus: null,
    automationLastError: null,
    automationLockAt: null,
    automationLockOwner: null,
    historico: [...historico, historicoItem]
  };
  saveTickets(tickets);

  return res.json({
    success: true,
    message: 'Plexi resetado. Use Reenviar para processar novamente.',
    ticketCodigo: ticket.codigo
  });
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
    
    let jaEnviouEmailCompleto = historicoRecente.some(h => 
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

    // Proteção anti-duplicidade: completedEmailSentAt (automação Plexi ou manual anterior)
    if (ticket.completedEmailSentAt && !FORCE_RESEND) {
      jaEnviouEmailCompleto = true;
    }
    
    console.log(`📧 [SYNC] Verificação de duplicatas (últimas 24h):`);
    console.log(`📧 [SYNC]   Histórico total: ${historicoCompleto.length} itens`);
    console.log(`📧 [SYNC]   Histórico recente: ${historicoRecente.length} itens`);
    console.log(`📧 [SYNC]   Email já enviado: ${jaEnviouEmailCompleto}`);
    console.log(`📧 [SYNC]   WhatsApp já enviado: ${jaEnviouWhatsAppCompleto}`);
    console.log(`📧 [SYNC]   FORCE_RESEND: ${FORCE_RESEND}`);
    
    if (!FORCE_RESEND) {
      // Se ambos já foram enviados COM SUCESSO nas últimas 24h, retornar early
      // Mas permitir reenvio se passou mais de 24h ou se houve erro
      if (jaEnviouEmailCompleto && jaEnviouWhatsAppCompleto) {
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
      
      // Se email já foi enviado mas WhatsApp não foi (ou vice-versa), continuar para enviar o que falta
      // Não retornar early aqui para permitir envio do que ainda falta
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
      
      // Sempre enviar WhatsApp se houver telefone válido (FORCE_RESEND ignora verificação de duplicatas)
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
        if (emailEnviado) {
          tickets[ticketIndex].completedEmailSentAt = now;
          tickets[ticketIndex].completedBy = 'MANUAL_SUPPORT';
        }
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
    
    // Buscar funnel_id do ticket
    let funnelId = null;
    if (ticket.dadosFormulario && ticket.dadosFormulario.funnel_id) {
      funnelId = ticket.dadosFormulario.funnel_id;
    } else if (ticket.metadata && ticket.metadata.funnel_id) {
      funnelId = ticket.metadata.funnel_id;
    }

    // Criar evento payment_confirmed se funnel_id disponível
    if (funnelId && funnelDatabase) {
      try {
        funnelDatabase.insertEvent({
          funnel_id: funnelId,
          event_type: 'payment_confirmed',
          ticket_id: ticketId,
          timestamp: Date.now(),
          metadata: {
            ticket_codigo: ticket.codigo,
            order_id: orderId,
            order_code: orderCode
          }
        });
        console.log('✅ [Pagar.me Webhook] Evento payment_confirmed criado para funnel_id:', funnelId);
      } catch (error) {
        console.error('⚠️ [Pagar.me Webhook] Erro ao criar evento payment_confirmed:', error);
        // Não bloquear processamento do webhook se evento falhar
      }
    } else if (!funnelId) {
      console.warn('⚠️ [Pagar.me Webhook] funnel_id não encontrado no ticket, evento payment_confirmed não criado');
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

    // Registrar conversão offline para Google Ads (GCLID/Sheets)
    if (gclidSheetsDb) {
      try {
        const integration = gclidSheetsDb.getIntegration();
        const conversionName = integration?.conversion_name || 'COMPRA';
        const defaultValue = integration?.default_conversion_value;
        let conversionValue = defaultValue;
        if (orderData?.amount != null) {
          conversionValue = Number(orderData.amount) / 100;
        } else if (orderData?.items?.[0]?.amount != null) {
          conversionValue = Number(orderData.items[0].amount) / 100;
        }
        if (conversionValue == null || isNaN(conversionValue)) conversionValue = defaultValue ?? 0;
        const gclid = (ticket.dadosFormulario && ticket.dadosFormulario.gclid) ? String(ticket.dadosFormulario.gclid).trim() : null;
        const clickIdType = (ticket.dadosFormulario && ticket.dadosFormulario.clickIdType) ? String(ticket.dadosFormulario.clickIdType) : null;
        const status = (gclid && gclid.length > 0) ? 'PENDING' : 'PENDING_NO_CLICKID';
        const errorMsg = !gclid ? 'Sem Click ID (provável tráfego não-Google Ads)' : null;
        const { getSafeConversionTime } = require('./utils/formatGoogleAdsDate');
        gclidSheetsDb.upsertConversion({
          ticket_id: ticket.id,
          gclid: gclid || null,
          click_id_type: clickIdType,
          conversion_name: conversionName,
          conversion_time: getSafeConversionTime(),
          conversion_value: conversionValue,
          conversion_currency: 'BRL',
          status,
          error_message: errorMsg
        });
        console.log('✅ [Pagar.me Webhook] Conversão offline registrada:', { ticket_id: ticket.id, gclid: !!gclid, status });
      } catch (convErr) {
        console.error('⚠️ [Pagar.me Webhook] Erro ao registrar conversão offline:', convErr.message);
      }
    }

    // Enfileirar job Plexi para processamento automático
    plexiWorker.enqueue(ticket.id);

    // Enviar confirmação de pagamento (email e WhatsApp)
    try {
      const results = {
        email: null,
        whatsapp: null
      };
      
      // Enviar email
      console.log('📧 [Pagar.me Webhook] Verificando envio de email...');
      console.log('📧 [Pagar.me Webhook] Ticket info:', {
        codigo: ticket.codigo,
        email: ticket.email,
        dominio: ticket.dominio,
        emailValido: ticket.email && validateEmail(ticket.email)
      });
      
      if (ticket.email && validateEmail(ticket.email)) {
        try {
          console.log('📧 [Pagar.me Webhook] Chamando sendConfirmationEmail...');
          results.email = await sendPulseService.sendConfirmationEmail(ticket);
          console.log('📧 [Pagar.me Webhook] Resultado do envio:', {
            success: results.email?.success,
            messageId: results.email?.messageId,
            error: results.email?.error,
            email: results.email?.email
          });
          console.log('📧 [Pagar.me Webhook] Email enviado:', results.email.success ? '✅' : '❌');
        } catch (error) {
          console.error('❌ [Pagar.me Webhook] Erro ao enviar email:', error);
          console.error('❌ [Pagar.me Webhook] Stack trace:', error.stack);
          results.email = { success: false, error: error.message };
        }
      } else {
        console.warn('⚠️ [Pagar.me Webhook] Email não enviado - email inválido ou não disponível:', {
          email: ticket.email,
          emailValido: ticket.email ? validateEmail(ticket.email) : false
        });
        results.email = { success: false, error: ticket.email ? 'Email inválido' : 'Email não disponível' };
      }
      
      // WhatsApp desabilitado - não será enviado
      // if (ticket.telefone && validatePhone(ticket.telefone)) {
      //   try {
      //     results.whatsapp = await zapApiService.sendWhatsAppMessage(ticket);
      //     console.log('📱 [Pagar.me Webhook] WhatsApp enviado:', results.whatsapp.success ? '✅' : '❌');
      //   } catch (error) {
      //     console.error('❌ [Pagar.me Webhook] Erro ao enviar WhatsApp:', error);
      //     results.whatsapp = { success: false, error: error.message };
      //   }
      // }
      results.whatsapp = { success: false, error: 'WhatsApp desabilitado' };
      
      // Atualizar histórico com resultado dos envios
      const historicoLengthAfter = tickets[ticketIndex].historico.length;
      const confirmationHistoricoItem = {
        id: `h-${Date.now()}-${historicoLengthAfter}-${Math.random().toString(36).substr(2, 9)}-confirmation`,
        dataHora: new Date().toISOString(),
        autor: 'Sistema',
        statusAnterior: 'EM_OPERACAO',
        statusNovo: 'EM_OPERACAO',
        mensagem: results.email?.success
          ? 'Confirmação de pagamento enviada por email'
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

// Função auxiliar para fazer backup de contact-messages antes de salvar
function backupContactMessagesFile() {
  try {
    if (fs.existsSync(CONTACT_MESSAGES_FILE)) {
      const backupDir = path.join(__dirname, 'backups');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      
      // Ler e validar arquivo antes de fazer backup
      const fileData = fs.readFileSync(CONTACT_MESSAGES_FILE, 'utf8');
      let messages;
      try {
        messages = JSON.parse(fileData);
        if (!Array.isArray(messages)) {
          console.error('⚠️ [BACKUP CONTACT] Arquivo de mensagens não é um array válido, pulando backup');
          return false;
        }
      } catch (parseError) {
        console.error('⚠️ [BACKUP CONTACT] Erro ao parsear arquivo de mensagens para backup:', parseError);
        return false;
      }
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(backupDir, `contact-messages-${timestamp}.json`);
      
      // Criar backup com verificação
      fs.writeFileSync(backupFile, fileData, 'utf8');
      
      // Verificar se backup foi criado corretamente
      if (!fs.existsSync(backupFile)) {
        console.error('❌ [BACKUP CONTACT] ERRO: Backup não foi criado!');
        return false;
      }
      
      const backupData = fs.readFileSync(backupFile, 'utf8');
      const backupMessages = JSON.parse(backupData);
      
      if (backupMessages.length !== messages.length) {
        console.error(`❌ [BACKUP CONTACT] ERRO: Backup não corresponde ao arquivo original! Original: ${messages.length}, Backup: ${backupMessages.length}`);
        fs.unlinkSync(backupFile); // Remover backup inválido
        return false;
      }
      
      console.log(`✅ [BACKUP CONTACT] Backup criado com sucesso: ${backupFile.split('/').pop()} (${messages.length} mensagens)`);
      
      // Limpar backups antigos se ultrapassar 1GB (1073741824 bytes)
      const MAX_BACKUP_SIZE = 1073741824; // 1GB
      cleanupBackupsBySize(backupDir, 'contact-messages-', MAX_BACKUP_SIZE);
      
      return true;
    }
  } catch (error) {
    console.error('⚠️ [BACKUP CONTACT] Erro ao criar backup:', error);
    logger.logError(error, { function: 'backupContactMessagesFile' });
  }
  return false;
}

function saveContactMessages(messages) {
  try {
    // Fazer backup antes de salvar
    backupContactMessagesFile();
    
    // Salvar arquivo
    fs.writeFileSync(CONTACT_MESSAGES_FILE, JSON.stringify(messages, null, 2));
    
    // Verificar se arquivo foi escrito corretamente
    if (fs.existsSync(CONTACT_MESSAGES_FILE)) {
      const savedData = fs.readFileSync(CONTACT_MESSAGES_FILE, 'utf8');
      const savedMessages = JSON.parse(savedData);
      
      if (savedMessages.length !== messages.length) {
        console.error(`❌ [SAVE CONTACT] ERRO CRÍTICO: Arquivo não foi salvo corretamente! Esperado: ${messages.length}, Salvo: ${savedMessages.length}`);
        logger.logError(new Error('Arquivo contact-messages.json não foi salvo corretamente'), {
          function: 'saveContactMessages',
          expected: messages.length,
          saved: savedMessages.length
        });
      } else {
        console.log(`✅ [SAVE CONTACT] Arquivo salvo com sucesso: ${messages.length} mensagens`);
      }
    }
  } catch (error) {
    console.error('❌ [SAVE CONTACT] Erro ao salvar mensagens de contato:', error);
    logger.logError(error, { function: 'saveContactMessages' });
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

// ============================================
// ENDPOINTS DO FUNIL (FUNNEL EVENTS)
// ============================================

// POST /funnel-events - Registrar evento do funil
app.post('/funnel-events', express.json(), async (req, res) => {
  // Verificar feature flag
  if (process.env.COLLECTOR_ENABLED === 'false' || !funnelDatabase) {
    return res.status(503).json({ 
      error: 'Serviço desabilitado',
      message: 'Coletor de eventos do funil está desabilitado'
    });
  }

  try {
    const {
      funnel_id,
      event_type,
      utm_campaign,
      utm_term,
      domain,
      path,
      ticket_id,
      metadata,
      timestamp
    } = req.body;

    // Validações obrigatórias
    if (!funnel_id) {
      return res.status(400).json({ 
        error: 'funnel_id é obrigatório' 
      });
    }

    if (!event_type) {
      return res.status(400).json({ 
        error: 'event_type é obrigatório' 
      });
    }

    // Lista de eventos permitidos
    const allowedEvents = [
      'links_view',
      'links_cta_click',
      'portal_view',
      'form_start',
      'form_submit_success',
      'form_submit_error',
      'pix_view',
      'pix_initiated',
      'payment_confirmed'
    ];

    if (!allowedEvents.includes(event_type)) {
      return res.status(400).json({ 
        error: 'event_type inválido',
        message: `Evento deve ser um dos: ${allowedEvents.join(', ')}`
      });
    }

    // Extrair domain e path da URL se não fornecidos
    let finalDomain = domain;
    let finalPath = path;
    if (!finalDomain && req.headers.referer) {
      try {
        const url = new URL(req.headers.referer);
        finalDomain = url.hostname;
        finalPath = url.pathname;
      } catch (e) {
        // Ignorar erro de parsing
      }
    }

    // Inserir evento
    const eventId = funnelDatabase.insertEvent({
      funnel_id,
      event_type,
      utm_campaign: utm_campaign || null,
      utm_term: utm_term || null,
      domain: finalDomain || null,
      path: finalPath || null,
      ticket_id: ticket_id || null,
      metadata: metadata || null,
      timestamp: timestamp || Date.now()
    });

    logger.info('Evento do funil registrado', {
      event_id: eventId,
      funnel_id,
      event_type,
      utm_campaign
    });

    res.status(200).json({ 
      success: true, 
      event_id: eventId 
    });
  } catch (error) {
    logger.logError(error, { endpoint: 'POST /funnel-events' });
    res.status(500).json({ 
      error: 'Erro ao registrar evento',
      message: error.message 
    });
  }
});

// GET /funnel-events - Buscar eventos do funil
app.get('/funnel-events', authenticateRequest, (req, res) => {
  if (!funnelDatabase) {
    return res.status(503).json({ 
      error: 'Serviço desabilitado',
      message: 'Coletor de eventos do funil está desabilitado'
    });
  }

  try {
    const filters = {
      funnel_id: req.query.funnel_id,
      event_type: req.query.event_type,
      utm_campaign: req.query.utm_campaign,
      ticket_id: req.query.ticket_id,
      date_from: req.query.date_from,
      date_to: req.query.date_to
    };

    const events = funnelDatabase.getEvents(filters);
    res.json(events);
  } catch (error) {
    logger.logError(error, { endpoint: 'GET /funnel-events' });
    res.status(500).json({ 
      error: 'Erro ao buscar eventos',
      message: error.message 
    });
  }
});

// GET /funnel-analytics - Calcular métricas agregadas do funil
app.get('/funnel-analytics', authenticateRequest, (req, res) => {
  if (!funnelDatabase) {
    return res.status(503).json({ 
      error: 'Serviço desabilitado',
      message: 'Coletor de eventos do funil está desabilitado'
    });
  }

  try {
    const {
      utm_campaign,
      domain,
      date_from,
      date_to
    } = req.query;

    // Buscar eventos filtrados
    const events = funnelDatabase.getEvents({
      utm_campaign,
      domain,
      date_from,
      date_to
    });

    // Determinar domain para buscar custos
    // Se domain fornecido, usar ele. Caso contrário, tentar inferir dos eventos
    let targetDomain = domain;
    if (!targetDomain && events.length > 0) {
      // Pegar domain mais comum dos eventos
      const domainCounts = {};
      events.forEach(e => {
        if (e.domain) {
          domainCounts[e.domain] = (domainCounts[e.domain] || 0) + 1;
        }
      });
      const domains = Object.keys(domainCounts).sort((a, b) => domainCounts[b] - domainCounts[a]);
      targetDomain = domains[0] || null;
    }

    // Buscar custos do Google Ads
    // Se domain fornecido, buscar apenas campanhas desse domain
    // Se utm_campaign fornecido, filtrar por ele também
    let campaigns = [];
    if (utm_campaign || targetDomain) {
      const campaignFilters = {
        date_from,
        date_to
      };
      
      if (targetDomain) {
        // Buscar customer_id do domain
        const customerId = funnelDatabase.getCustomerIdByDomain(targetDomain);
        if (customerId) {
          campaignFilters.customer_id = customerId;
        } else {
          // Se não há mapeamento, usar domain diretamente
          campaignFilters.domain = targetDomain;
        }
      }
      
      campaigns = funnelDatabase.getCampaigns(campaignFilters);
      
      // Filtrar por utm_campaign se fornecido (comparar campaign_name com utm_campaign)
      if (utm_campaign && campaigns.length > 0) {
        campaigns = campaigns.filter(c => 
          c.campaign_name === utm_campaign || 
          c.campaign_id === utm_campaign
        );
      }
    }

    // Calcular métricas por evento
    const eventCounts = {};
    events.forEach(event => {
      eventCounts[event.event_type] = (eventCounts[event.event_type] || 0) + 1;
    });

    // Calcular taxas de conversão
    const linksView = eventCounts.links_view || 0;
    const linksCtaClick = eventCounts.links_cta_click || 0;
    const portalView = eventCounts.portal_view || 0;
    const formStart = eventCounts.form_start || 0;
    const formSubmitSuccess = eventCounts.form_submit_success || 0;
    const pixView = eventCounts.pix_view || 0;
    const pixInitiated = eventCounts.pix_initiated || 0;
    const paymentConfirmed = eventCounts.payment_confirmed || 0;

    // Calcular custos
    let totalCost = 0;
    if (campaigns.length > 0) {
      totalCost = campaigns.reduce((sum, c) => sum + (c.cost_micros / 1000000), 0);
    }

    // Calcular métricas econômicas
    const ticketPrice = 39.90;
    const cpa = paymentConfirmed > 0 ? totalCost / paymentConfirmed : null;
    const roi = paymentConfirmed > 0 && totalCost > 0 
      ? (paymentConfirmed * ticketPrice) / totalCost 
      : null;

    // Calcular gasto sem conversão
    const spentWithoutConversion = paymentConfirmed === 0 ? totalCost : 0;
    const ticketsBurned = totalCost > 0 ? totalCost / ticketPrice : 0;

    // Identificar gargalo (lógica simplificada - será melhorada no frontend)
    let bottleneck = null;
    if (totalCost > 0 && linksView === 0) {
      bottleneck = 'TRÁFEGO';
    } else if (linksView > 0 && linksCtaClick / linksView < 0.1) {
      bottleneck = 'LINKS';
    } else if (portalView > 0 && formStart / portalView < 0.3) {
      bottleneck = 'PORTAL';
    } else if (formStart > 0 && formSubmitSuccess / formStart < 0.5) {
      bottleneck = 'FORMULÁRIO';
    } else if (pixView > 0 && paymentConfirmed / pixView < 0.3) {
      bottleneck = 'PIX';
    }

    // Calcular confiabilidade
    const funnelsWithId = new Set(events.filter(e => e.funnel_id).map(e => e.funnel_id));
    const funnelsWithCampaign = new Set(events.filter(e => e.utm_campaign).map(e => e.funnel_id));
    const completeFunnels = Array.from(funnelsWithId).filter(id => funnelsWithCampaign.has(id));
    
    let reliability = 'BAIXA';
    if (completeFunnels.length / Math.max(funnelsWithId.size, 1) > 0.8) {
      reliability = 'ALTA';
    } else if (funnelsWithId.size > 0 || funnelsWithCampaign.size > 0) {
      reliability = 'MÉDIA';
    }

    res.json({
      events: eventCounts,
      conversion_rates: {
        links_to_cta: linksView > 0 ? linksCtaClick / linksView : 0,
        portal_to_form: portalView > 0 ? formStart / portalView : 0,
        form_to_submit: formStart > 0 ? formSubmitSuccess / formStart : 0,
        pix_to_payment: pixView > 0 ? paymentConfirmed / pixView : 0
      },
      costs: {
        total: totalCost,
        spent_without_conversion: spentWithoutConversion,
        tickets_burned: ticketsBurned
      },
      metrics: {
        cpa,
        roi,
        payments: paymentConfirmed,
        ticket_price: ticketPrice
      },
      bottleneck,
      reliability,
      total_events: events.length,
      domain: targetDomain || null,
      campaigns_count: campaigns.length
    });
  } catch (error) {
    logger.logError(error, { endpoint: 'GET /funnel-analytics' });
    res.status(500).json({ 
      error: 'Erro ao calcular métricas',
      message: error.message 
    });
  }
});

// GET /google-ads/validate - Validar configuração do Google Ads API
app.get('/google-ads/validate', async (req, res) => {
  try {
    const validationScript = require('./scripts/validate-google-ads');
    // Chamar main com exitOnComplete=false para não fazer exit e retornar apenas o relatório
    const report = await validationScript.main(false);
    
    // Determinar status HTTP baseado no resultado
    const statusCode = report.status === 'error' ? 500 : report.status === 'warning' ? 200 : 200;
    
    res.status(statusCode).json(report);
  } catch (error) {
    logger.logError(error, { endpoint: 'GET /google-ads/validate' });
    res.status(500).json({
      status: 'error',
      error: 'Erro ao executar validação',
      message: error.message,
      checks: {},
      recommendations: ['Verifique os logs do servidor para mais detalhes'],
      next_steps: []
    });
  }
});

// POST /google-ads/sync - Sincronizar campanhas do Google Ads
app.post('/google-ads/sync', authenticateRequest, express.json(), async (req, res) => {
  // Verificar feature flag
  if (process.env.ADS_SYNC_ENABLED === 'false') {
    return res.status(503).json({ 
      error: 'Serviço desabilitado',
      message: 'Sincronização de Google Ads está desabilitada'
    });
  }

  if (!funnelDatabase) {
    return res.status(503).json({ 
      error: 'Banco de dados não disponível',
      message: 'Banco de dados do funil não está inicializado'
    });
  }

  try {
    let {
      customer_id,
      mcc_id,
      domain,
      date_from,
      date_to
    } = req.body;

    // Validações
    if (!date_from || !date_to) {
      return res.status(400).json({ 
        error: 'date_from e date_to são obrigatórios',
        message: 'Formato: YYYY-MM-DD'
      });
    }

    // Validar formato de data
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date_from) || !dateRegex.test(date_to)) {
      return res.status(400).json({ 
        error: 'Formato de data inválido',
        message: 'Use formato YYYY-MM-DD'
      });
    }

    const googleAdsService = require('./services/googleAdsService');
    let campaigns = [];
    const domainMappings = {};

    // Se domain fornecido, buscar customer_id do mapeamento
    if (domain) {
      const mappedCustomerId = funnelDatabase.getCustomerIdByDomain(domain);
      if (mappedCustomerId) {
        console.log(`🔗 [GoogleAds] Domain ${domain} mapeado para customer_id ${mappedCustomerId}`);
        customer_id = mappedCustomerId;
      } else {
        return res.status(400).json({ 
          error: 'Domain não mapeado',
          message: `Domain ${domain} não está mapeado para nenhum customer_id. Use POST /google-ads/map-domain para configurar.`
        });
      }
    }

    // Se mcc_id fornecido, buscar todos os clientes e sincronizar cada um
    if (mcc_id) {
      const customers = await googleAdsService.listCustomers(mcc_id);
      console.log(`📊 [GoogleAds] Encontrados ${customers.length} clientes no MCC ${mcc_id}`);

      for (const customer of customers) {
        try {
          const customerCampaigns = await googleAdsService.syncCampaigns(
            customer.id,
            date_from,
            date_to
          );
          
          // Tentar identificar domain pelo customer_id (se houver mapeamento)
          const mapping = funnelDatabase.getAllDomainMappings().find(m => m.customer_id === customer.id);
          const campaignDomain = mapping ? mapping.domain : null;
          
          // Adicionar domain às campanhas
          customerCampaigns.forEach(c => {
            c.domain = campaignDomain;
            if (campaignDomain) {
              domainMappings[campaignDomain] = customer.id;
            }
          });
          
          campaigns.push(...customerCampaigns);
        } catch (error) {
          console.error(`⚠️ [GoogleAds] Erro ao sincronizar cliente ${customer.id}:`, error.message);
          // Continuar com outros clientes
        }
      }
    } else if (customer_id) {
      // Sincronizar apenas um cliente específico
      campaigns = await googleAdsService.syncCampaigns(customer_id, date_from, date_to);
      
      // Tentar identificar domain pelo customer_id
      const mapping = funnelDatabase.getAllDomainMappings().find(m => m.customer_id === customer_id);
      const campaignDomain = mapping ? mapping.domain : domain || null;
      
      // Adicionar domain às campanhas
      campaigns.forEach(c => {
        c.domain = campaignDomain;
      });
    } else {
      return res.status(400).json({ 
        error: 'customer_id, mcc_id ou domain é obrigatório'
      });
    }

    // Salvar campanhas no banco de dados
    let saved = 0;
    for (const campaign of campaigns) {
      try {
        funnelDatabase.upsertCampaign(campaign);
        saved++;
      } catch (error) {
        console.error(`⚠️ [GoogleAds] Erro ao salvar campanha ${campaign.campaign_id}:`, error.message);
      }
    }

    logger.info('Campanhas Google Ads sincronizadas', {
      total: campaigns.length,
      saved,
      date_from,
      date_to,
      domain: domain || 'todos'
    });

    res.json({
      success: true,
      campaigns_synced: campaigns.length,
      campaigns_saved: saved,
      date_from,
      date_to,
      domain: domain || null,
      domain_mappings: Object.keys(domainMappings).length > 0 ? domainMappings : undefined
    });
  } catch (error) {
    logger.logError(error, { endpoint: 'POST /google-ads/sync' });
    res.status(500).json({ 
      error: 'Erro ao sincronizar campanhas',
      message: error.message 
    });
  }
});

// POST /google-ads/map-domain - Mapear domain para customer_id
app.post('/google-ads/map-domain', authenticateRequest, express.json(), async (req, res) => {
  if (!funnelDatabase) {
    return res.status(503).json({ 
      error: 'Banco de dados não disponível',
      message: 'Banco de dados do funil não está inicializado'
    });
  }

  try {
    const { domain, customer_id, account_name } = req.body;

    if (!domain || !customer_id) {
      return res.status(400).json({ 
        error: 'domain e customer_id são obrigatórios'
      });
    }

    funnelDatabase.upsertDomainMapping(domain, customer_id, account_name || null);

    logger.info('Mapeamento domain → customer_id criado', {
      domain,
      customer_id,
      account_name
    });

    res.json({
      success: true,
      domain,
      customer_id,
      account_name: account_name || null,
      message: `Domain ${domain} mapeado para customer_id ${customer_id}`
    });
  } catch (error) {
    logger.logError(error, { endpoint: 'POST /google-ads/map-domain' });
    res.status(500).json({ 
      error: 'Erro ao criar mapeamento',
      message: error.message 
    });
  }
});

// GET /google-ads/domain-mappings - Listar todos os mapeamentos domain → customer_id
app.get('/google-ads/domain-mappings', authenticateRequest, (req, res) => {
  if (!funnelDatabase) {
    return res.status(503).json({ 
      error: 'Banco de dados não disponível',
      message: 'Banco de dados do funil não está inicializado'
    });
  }

  try {
    const mappings = funnelDatabase.getAllDomainMappings();
    res.json({
      success: true,
      mappings,
      count: mappings.length
    });
  } catch (error) {
    logger.logError(error, { endpoint: 'GET /google-ads/domain-mappings' });
    res.status(500).json({ 
      error: 'Erro ao buscar mapeamentos',
      message: error.message 
    });
  }
});

// GET /funnel-validation - Validar configuração do funil por domínio
app.get('/funnel-validation', authenticateRequest, (req, res) => {
  if (!funnelDatabase) {
    return res.status(503).json({ 
      error: 'Banco de dados não disponível',
      message: 'Banco de dados do funil não está inicializado'
    });
  }

  try {
    const { date_from, date_to } = req.query;
    
    // Buscar todos os domínios que têm eventos
    const allEvents = funnelDatabase.getEvents({
      date_from,
      date_to
    });
    
    // Buscar todos os domínios mapeados (mesmo sem eventos)
    const allMappings = funnelDatabase.getAllDomainMappings();
    const mappedDomains = allMappings.map(m => m.domain);
    
    // Combinar domínios com eventos e domínios mapeados
    const eventDomains = [...new Set(allEvents.map(e => e.domain).filter(Boolean))];
    const domains = [...new Set([...eventDomains, ...mappedDomains])];
    
    const validation = domains.map(domain => {
      const domainEvents = allEvents.filter(e => e.domain === domain);
      const domainCampaigns = funnelDatabase.getCampaigns({ domain, date_from, date_to });
      const mapping = funnelDatabase.getAllDomainMappings().find(m => m.domain === domain);
      
      // Contar eventos por tipo
      const eventCounts = {};
      domainEvents.forEach(e => {
        eventCounts[e.event_type] = (eventCounts[e.event_type] || 0) + 1;
      });
      
      // Verificar se há utm_campaigns
      const utmCampaigns = [...new Set(domainEvents.map(e => e.utm_campaign).filter(Boolean))];
      
      // Verificar se há custos vinculados
      const totalCost = domainCampaigns.reduce((sum, c) => sum + (c.cost_micros / 1000000), 0);
      
      // Status de validação
      const hasEvents = domainEvents.length > 0;
      const hasMapping = !!mapping;
      const hasCampaigns = domainCampaigns.length > 0;
      const hasUtmCampaigns = utmCampaigns.length > 0;
      const hasCosts = totalCost > 0;
      
      let status = 'OK';
      const warnings = [];
      
      // ERROR só se não há mapeamento E não há eventos (problema real de configuração)
      if (!hasMapping && !hasEvents) {
        status = 'ERROR';
        warnings.push('Domain não está mapeado e nenhum evento coletado. Configure o mapeamento se este domínio usa Google Ads.');
      } 
      // WARNING se não há mapeamento mas há eventos (domínio sem Google Ads é válido)
      else if (!hasMapping && hasEvents) {
        status = 'WARNING';
        warnings.push('Domain não está mapeado para Customer ID. Se este domínio não usa Google Ads, isso é normal.');
      }
      // WARNING se há mapeamento mas não há eventos (pode ser normal se não há campanhas ativas)
      else if (hasMapping && !hasEvents) {
        status = 'WARNING';
        warnings.push('Nenhum evento coletado para este domínio. Isso é normal se não houver campanhas ativas no período.');
      } 
      // WARNING se há eventos mas não há campanhas sincronizadas
      else if (!hasCampaigns && hasUtmCampaigns) {
        status = 'WARNING';
        warnings.push('Há eventos com utm_campaign mas nenhuma campanha sincronizada. Sincronize as campanhas do Google Ads.');
      } 
      // WARNING se há campanhas mas não há custos
      else if (hasUtmCampaigns && !hasCosts) {
        status = 'WARNING';
        warnings.push('Há campanhas mas nenhum custo vinculado. Verifique se as campanhas têm gastos no período.');
      }
      
      return {
        domain,
        status,
        events: {
          total: domainEvents.length,
          by_type: eventCounts,
          utm_campaigns: utmCampaigns
        },
        campaigns: {
          total: domainCampaigns.length,
          total_cost: totalCost
        },
        mapping: mapping ? {
          customer_id: mapping.customer_id,
          account_name: mapping.account_name
        } : null,
        warnings
      };
    });
    
    res.json({
      success: true,
      validation,
      summary: {
        total_domains: domains.length,
        domains_with_events: validation.filter(v => v.events.total > 0).length,
        domains_with_mapping: validation.filter(v => v.mapping).length,
        domains_with_campaigns: validation.filter(v => v.campaigns.total > 0).length
      }
    });
  } catch (error) {
    logger.logError(error, { endpoint: 'GET /funnel-validation' });
    res.status(500).json({ 
      error: 'Erro ao validar configuração',
      message: error.message 
    });
  }
});

// ============================================
// GCLID / SHEETS - Conversões Google Ads
// ============================================
const sheetsExportService = gclidSheetsDb ? require('./services/sheetsExportService') : null;
const sheetsEncryption = gclidSheetsDb ? require('./services/sheetsEncryption') : null;

// Helper para extrair client_email do JSON decriptografado
function getClientEmailFromIntegration() {
  if (!gclidSheetsDb || !sheetsExportService) return null;
  const integration = gclidSheetsDb.getIntegration();
  if (!integration?.service_account_json_encrypted || !sheetsEncryption) return null;
  try {
    const payload = JSON.parse(integration.service_account_json_encrypted);
    const decrypted = sheetsEncryption.decrypt(payload);
    return sheetsExportService.extractClientEmail(decrypted);
  } catch { return null; }
}

// GET /admin/sheets/config - Obter configuração (sem JSON sensível)
app.get('/admin/sheets/config', authenticateRequest, (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  if (!gclidSheetsDb) return res.status(503).json({ error: 'Serviço desabilitado' });
  try {
    const integration = gclidSheetsDb.getIntegration();
    if (!integration) return res.json(null);
    const scheduleTimes = integration.schedule_times ? JSON.parse(integration.schedule_times) : null;
    const clientEmail = getClientEmailFromIntegration();
    res.json({
      id: integration.id,
      spreadsheet_id: integration.spreadsheet_id,
      worksheet_name: integration.worksheet_name,
      conversion_name: integration.conversion_name,
      default_conversion_value: integration.default_conversion_value,
      currency: integration.currency,
      is_enabled: !!integration.is_enabled,
      schedule_times: scheduleTimes,
      last_test_status: integration.last_test_status,
      last_test_message: integration.last_test_message,
      last_test_at: integration.last_test_at || null,
      last_write_at: integration.last_write_at || null,
      last_export_at: integration.last_export_at,
      has_credentials: !!(integration.service_account_json_encrypted),
      client_email: clientEmail
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /admin/sheets/config - Salvar configuração
app.post('/admin/sheets/config', authenticateRequest, express.json(), (req, res) => {
  if (!gclidSheetsDb || !sheetsEncryption) return res.status(503).json({ error: 'Serviço desabilitado' });
  try {
    const body = req.body || {};
    let serviceAccountEncrypted = null;
    let serviceAccountHash = null;
    if (body.service_account_json && body.service_account_json.trim()) {
      if (!process.env.SHEETS_CREDENTIALS_ENCRYPTION_KEY) {
        return res.status(400).json({ error: 'SHEETS_CREDENTIALS_ENCRYPTION_KEY não configurada. Configure no .env para salvar credenciais.' });
      }
      const enc = sheetsEncryption.encrypt(body.service_account_json.trim());
      serviceAccountEncrypted = JSON.stringify(enc);
      serviceAccountHash = sheetsEncryption.hashJson(body.service_account_json);
    } else {
      const existing = gclidSheetsDb.getIntegration();
      if (existing?.service_account_json_encrypted) {
        serviceAccountEncrypted = existing.service_account_json_encrypted;
        serviceAccountHash = existing.service_account_json_hash;
      }
    }
    gclidSheetsDb.saveIntegration({
      spreadsheet_id: body.spreadsheet_id || '',
      worksheet_name: body.worksheet_name || 'Página1',
      conversion_name: body.conversion_name || 'COMPRA',
      default_conversion_value: body.default_conversion_value ?? null,
      currency: body.currency || 'BRL',
      is_enabled: !!body.is_enabled,
      schedule_times: Array.isArray(body.schedule_times) ? body.schedule_times : (body.schedule_times ? JSON.parse(body.schedule_times) : null),
      service_account_json_encrypted: serviceAccountEncrypted,
      service_account_json_hash: serviceAccountHash
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /admin/sheets/test-connection - Testar conexão (legado, mantido para compatibilidade)
app.post('/admin/sheets/test-connection', authenticateRequest, express.json(), async (req, res) => {
  if (!gclidSheetsDb || !sheetsExportService) return res.status(503).json({ error: 'Serviço desabilitado' });
  try {
    const body = req.body || {};
    let credentialsJson = body.service_account_json;
    if (!credentialsJson && gclidSheetsDb.getIntegration()?.service_account_json_encrypted && sheetsEncryption) {
      const payload = JSON.parse(gclidSheetsDb.getIntegration().service_account_json_encrypted);
      credentialsJson = sheetsEncryption.decrypt(payload);
    }
    const result = await sheetsExportService.testConnection(
      credentialsJson,
      body.spreadsheet_id || gclidSheetsDb.getIntegration()?.spreadsheet_id,
      body.worksheet_name || gclidSheetsDb.getIntegration()?.worksheet_name
    );
    if (gclidSheetsDb.getIntegration()) {
      gclidSheetsDb.updateIntegrationTest(result.success ? 'ok' : 'error', result.message);
    }
    res.json(result);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /admin/sheets/test - Diagnóstico completo (read, write, permissão, aba, header)
app.post('/admin/sheets/test', authenticateRequest, express.json(), async (req, res) => {
  if (!gclidSheetsDb || !sheetsExportService) return res.status(503).json({ error: 'Serviço desabilitado' });
  try {
    const body = req.body || {};
    const integration = gclidSheetsDb.getIntegration();
    let credentialsJson = body.service_account_json?.trim();
    if (!credentialsJson && integration?.service_account_json_encrypted && sheetsEncryption) {
      const payload = JSON.parse(integration.service_account_json_encrypted);
      credentialsJson = sheetsEncryption.decrypt(payload);
    }
    const spreadsheetId = body.spreadsheet_id || integration?.spreadsheet_id;
    const worksheetName = body.worksheet_name || integration?.worksheet_name || 'Página1';
    const result = await sheetsExportService.fullDiagnostic(credentialsJson, spreadsheetId, worksheetName);
    if (integration) {
      gclidSheetsDb.updateIntegrationLastTest(result.lastTestAt, result.ok, result.message);
    }
    res.json(result);
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message, checks: {} });
  }
});

// POST /admin/sheets/test-write - Escrever linha de teste
app.post('/admin/sheets/test-write', authenticateRequest, express.json(), async (req, res) => {
  if (!gclidSheetsDb || !sheetsExportService) return res.status(503).json({ ok: false, message: 'Serviço desabilitado' });
  try {
    const body = req.body || {};
    const integration = gclidSheetsDb.getIntegration();
    let credentialsJson = body.service_account_json?.trim();
    if (!credentialsJson && integration?.service_account_json_encrypted && sheetsEncryption) {
      try {
        const payload = JSON.parse(integration.service_account_json_encrypted);
        credentialsJson = sheetsEncryption.decrypt(payload);
      } catch (decErr) {
        console.error('[Sheets] Erro ao decriptar credenciais:', decErr.message);
        return res.json({ ok: false, message: `Erro ao decriptar credenciais. Verifique SHEETS_CREDENTIALS_ENCRYPTION_KEY no servidor. Detalhe: ${decErr.message}` });
      }
    }
    const spreadsheetId = body.spreadsheet_id || integration?.spreadsheet_id;
    const worksheetName = body.worksheet_name || integration?.worksheet_name || 'Página1';
    if (!credentialsJson || !spreadsheetId) {
      return res.json({
        ok: false,
        message: 'Credenciais ou Spreadsheet ID ausentes. Salve a configuração (Spreadsheet ID + JSON da Service Account) e tente novamente.'
      });
    }
    const result = await sheetsExportService.testWrite(credentialsJson, spreadsheetId, worksheetName);
    if (integration && result.lastWriteAt && result.ok) {
      gclidSheetsDb.updateIntegrationLastWrite(result.lastWriteAt);
    }
    res.json(result);
  } catch (e) {
    console.error('[Sheets] Erro test-write:', e);
    res.json({ ok: false, message: e.message || 'Erro ao escrever' });
  }
});

// POST /admin/sheets/export-now - Exportar agora (manual, ignora is_enabled)
app.post('/admin/sheets/export-now', authenticateRequest, express.json(), async (req, res) => {
  if (!gclidSheetsDb || !sheetsExportService) return res.status(503).json({ success: false, error: 'Serviço desabilitado', exported: 0 });
  try {
    const body = req.body || {};
    const integration = gclidSheetsDb.getIntegration();
    let credentialsJson = body.service_account_json?.trim();
    if (!credentialsJson && integration?.service_account_json_encrypted && sheetsEncryption) {
      try {
        const payload = JSON.parse(integration.service_account_json_encrypted);
        credentialsJson = sheetsEncryption.decrypt(payload);
      } catch (decErr) {
        console.error('[Sheets] Erro ao decriptar credenciais:', decErr.message);
        return res.json({ success: false, error: `Credenciais não decriptam: ${decErr.message}`, reason: 'Credenciais inválidas', exported: 0 });
      }
    }
    const spreadsheetId = body.spreadsheet_id || integration?.spreadsheet_id;
    const worksheetName = body.worksheet_name || integration?.worksheet_name || 'Página1';
    const result = await sheetsExportService.exportPendingConversions({
      forceManual: true,
      credentialsJson: credentialsJson || undefined,
      spreadsheetId: spreadsheetId || undefined,
      worksheetName,
    });
    res.json(result);
  } catch (e) {
    console.error('[Sheets] Erro export-now:', e);
    res.json({ success: false, error: e.message, reason: e.message, exported: 0 });
  }
});

// GET /admin/sheets/conversions - Listar conversões
app.get('/admin/sheets/conversions', authenticateRequest, (req, res) => {
  if (!gclidSheetsDb) return res.status(503).json({ error: 'Serviço desabilitado' });
  try {
    const filters = {
      status: req.query.status,
      hasGclid: req.query.hasGclid === 'true' ? true : req.query.hasGclid === 'false' ? false : undefined,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      limit: parseInt(req.query.limit, 10) || 200
    };
    const list = gclidSheetsDb.listConversions(filters);
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /admin/sheets/conversions/:id/reexport - Marcar para reexportar
app.post('/admin/sheets/conversions/:id/reexport', authenticateRequest, (req, res) => {
  if (!gclidSheetsDb) return res.status(503).json({ error: 'Serviço desabilitado' });
  try {
    gclidSheetsDb.setPending(parseInt(req.params.id, 10));
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /admin/sheets/conversions/:id/skip - Marcar como ignorar
app.post('/admin/sheets/conversions/:id/skip', authenticateRequest, (req, res) => {
  if (!gclidSheetsDb) return res.status(503).json({ error: 'Serviço desabilitado' });
  try {
    gclidSheetsDb.markSkipped(parseInt(req.params.id, 10));
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /admin/sheets/diagnostic - Diagnóstico
app.get('/admin/sheets/diagnostic', authenticateRequest, (req, res) => {
  if (!gclidSheetsDb) return res.status(503).json({ error: 'Serviço desabilitado' });
  try {
    const stats = gclidSheetsDb.getConversionStats();
    const tickets = readTickets();
    const recentWithGclid = tickets
      .filter(t => t.dadosFormulario?.gclid)
      .slice(-50)
      .map(t => ({ id: t.id, codigo: t.codigo, gclid: t.dadosFormulario.gclid, dataCadastro: t.dataCadastro }));
    const integration = gclidSheetsDb.getIntegration();
    let canDecrypt = false;
    if (integration?.service_account_json_encrypted && sheetsEncryption) {
      try {
        const payload = JSON.parse(integration.service_account_json_encrypted);
        sheetsEncryption.decrypt(payload);
        canDecrypt = true;
      } catch (_) { /* ignore */ }
    }
    res.json({
      ...stats,
      recentTicketsWithGclid: recentWithGclid.length,
      configOk: !!(integration?.spreadsheet_id && integration?.service_account_json_encrypted && canDecrypt),
      hasSpreadsheetId: !!integration?.spreadsheet_id,
      hasCredentials: !!(integration?.service_account_json_encrypted),
      canDecryptCredentials: canDecrypt,
      lastExportAt: integration?.last_export_at
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /admin/sheets/test-conversion - Criar conversão de teste (sempre PENDING para poder exportar)
app.post('/admin/sheets/test-conversion', authenticateRequest, express.json(), (req, res) => {
  if (!gclidSheetsDb) return res.status(503).json({ error: 'Serviço desabilitado' });
  if (process.env.NODE_ENV === 'production' && !req.body?.confirm) {
    return res.status(400).json({ error: 'Em produção, envie confirm: true para criar conversão de teste' });
  }
  try {
    const { getSafeConversionTime } = require('./utils/formatGoogleAdsDate');
    const variant = req.body?.variant || 'default';
    const isWriteTest = variant === 'write-test';
    gclidSheetsDb.upsertConversion({
      ticket_id: 'test-' + Date.now(),
      gclid: isWriteTest ? 'TEST-CONN' : 'TESTE123',
      conversion_name: isWriteTest ? 'TEST' : (gclidSheetsDb.getIntegration()?.conversion_name || 'COMPRA'),
      conversion_time: getSafeConversionTime(),
      conversion_value: isWriteTest ? 0.01 : 1,
      conversion_currency: 'BRL',
      status: 'TEST'
    });
    res.json({ success: true, message: isWriteTest ? 'Conversão de teste criada (nunca será exportada). Use para validar a tabela na plataforma.' : 'Conversão de teste criada (nunca será exportada).' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /admin/sheets/clear - Limpar dados da planilha (header mantido, requer confirmação)
app.post('/admin/sheets/clear', authenticateRequest, express.json(), async (req, res) => {
  if (!gclidSheetsDb || !sheetsExportService) return res.status(503).json({ error: 'Serviço desabilitado' });
  if (!req.body?.confirm) {
    return res.status(400).json({ error: 'Envie confirm: true para confirmar a limpeza' });
  }
  try {
    const integration = gclidSheetsDb.getIntegration();
    if (!integration?.spreadsheet_id || !integration?.service_account_json_encrypted || !sheetsEncryption) {
      return res.status(400).json({ error: 'Configuração incompleta' });
    }
    const payload = JSON.parse(integration.service_account_json_encrypted);
    const credentialsJson = sheetsEncryption.decrypt(payload);
    const result = await sheetsExportService.clearWorksheetData(
      credentialsJson,
      integration.spreadsheet_id,
      integration.worksheet_name || 'Página1'
    );
    res.json(result);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

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
    // Evitar auto-envio (mesmo remetente e destinatário) que pode ser marcado como spam
    const supportEmail = process.env.SUPPORT_EMAIL || 'contato@portalcertidao.org';
    const shouldSendNotification = email.toLowerCase() !== supportEmail.toLowerCase();
    
    if (shouldSendNotification) {
      try {
        // Sanitizar mensagem para evitar palavras que disparam filtros de spam
        const sanitizedMessage = mensagem
          .replace(/[<>]/g, '') // Remover caracteres potencialmente problemáticos
          .replace(/\n/g, '<br>');
        
        await sendPulseService.sendEmail({
          to: supportEmail,
          subject: `Nova mensagem de contato - ${nome}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h2 style="color: #1a365d; margin-top: 0;">Nova mensagem de contato recebida</h2>
              </div>
              
              <div style="background: #ffffff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <p><strong>Nome:</strong> ${nome}</p>
                <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
                <p><strong>Telefone:</strong> ${telefone || 'Não informado'}</p>
              </div>
              
              <div style="background: #ffffff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; margin-top: 20px;">
                <p><strong>Mensagem:</strong></p>
                <div style="background: #f7fafc; padding: 15px; border-radius: 4px; margin-top: 10px;">
                  ${sanitizedMessage}
                </div>
              </div>
              
              <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
                <p style="color: #718096; font-size: 12px; margin: 0;">
                  Acesse a plataforma de suporte para responder esta mensagem.
                </p>
              </div>
            </body>
            </html>
          `,
          from: {
            name: process.env.SENDPULSE_SENDER_NAME || 'Portal Certidão',
            email: process.env.SENDPULSE_SENDER_EMAIL || process.env.SUPPORT_EMAIL || 'contato@portalcertidao.org'
          }
        });
        logger.info('Email de notificação enviado para suporte', { id, to: supportEmail });
      } catch (emailError) {
        console.error('Erro ao enviar email de notificação:', emailError);
        logger.error('Erro ao enviar email de notificação', { id, error: emailError.message });
        // Não bloquear se o email falhar
      }
    } else {
      logger.info('Email de notificação não enviado (auto-envio detectado)', { id, email });
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
    // Usar SENDPULSE_SENDER_EMAIL que é o email verificado no SendPulse
    const senderEmail = process.env.SENDPULSE_SENDER_EMAIL || process.env.SUPPORT_EMAIL || 'contato@portalcertidao.org';
    const senderName = process.env.SENDPULSE_SENDER_NAME || 'Portal Certidão';
    
    console.log(`📧 [Reply Email] Enviando resposta para: ${message.fromEmail}`);
    console.log(`📧 [Reply Email] Remetente: ${senderEmail} (${senderName})`);
    
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
      `,
      from: {
        name: senderName,
        email: senderEmail
      }
    });
    
    console.log(`📧 [Reply Email] Resultado:`, JSON.stringify(emailResult, null, 2));
    
    // Verificar se o email foi aceito pelo SendPulse (mesmo que ainda não tenha sido entregue)
    // O SendPulse aceita o email primeiro e depois tenta entregar
    const emailAccepted = emailResult.success || 
                          (emailResult.fullResponse && !emailResult.fullResponse.is_error && 
                           emailResult.fullResponse.id); // Se tem ID, foi aceito
    
    if (!emailAccepted) {
      console.error(`❌ [Reply Email] Email não foi aceito pelo SendPulse:`, emailResult);
      return res.status(500).json({ 
        error: 'Erro ao enviar email', 
        details: emailResult.error || 'Email não foi aceito pelo servidor de email',
        fullResponse: emailResult.fullResponse
      });
    }
    
    // Salvar resposta no histórico da mensagem
    const reply = {
      id: `REPLY-${Date.now()}`,
      content,
      subject: subject || `Re: ${message.subject}`,
      operador: operador || 'Sistema',
      sentAt: new Date().toISOString(),
      emailSent: true,
      emailMessageId: emailResult.messageId || emailResult.fullResponse?.id || null,
      emailStatus: 'accepted' // Aceito pelo SendPulse (entrega pode levar alguns minutos)
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
            name: process.env.SENDPULSE_SENDER_NAME || 'Portal Certidão',
            email: process.env.SENDPULSE_SENDER_EMAIL || process.env.SUPPORT_EMAIL || 'contato@portalcertidao.org'
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

// ============================================
// SISTEMA INTELIGENTE DE ANÚNCIOS - GOOGLE ADS v2.0
// ============================================

// Tipos de Certidão disponíveis
// Tipos de certidão disponíveis no Portal (portalcertidao.org)
const TIPOS_CERTIDAO = {
  criminal_federal: { nome: 'Criminal Federal', keywords: ['criminal federal', 'certidão negativa criminal federal', 'antecedentes federais'] },
  criminal_estadual: { nome: 'Criminal Estadual', keywords: ['criminal estadual', 'certidão negativa criminal estadual', 'antecedentes estaduais', 'polícia civil'] },
  antecedentes_pf: { nome: 'Antecedentes PF', keywords: ['antecedentes criminais', 'polícia federal', 'pf', 'ficha limpa'] },
  eleitoral: { nome: 'Eleitoral', keywords: ['eleitoral', 'quitação eleitoral', 'certidão eleitoral', 'título eleitor', 'situação eleitoral'] },
  civel_federal: { nome: 'Cível Federal', keywords: ['cível federal', 'certidão negativa cível federal', 'civil federal'] },
  civel_estadual: { nome: 'Cível Estadual', keywords: ['cível estadual', 'certidão negativa cível estadual', 'civil estadual'] },
  cnd: { nome: 'CND', keywords: ['cnd', 'certidão negativa de débitos', 'débitos', 'certidão de débitos'] },
  cpf_regular: { nome: 'CPF Regular', keywords: ['cpf regular', 'certidão cpf', 'cpf', 'situação cpf'] },
  geral: { nome: 'Geral', keywords: [] }
};

// Palavras bloqueadas (GovDocs) - Lista expandida
const PALAVRAS_BLOQUEADAS = [
  'governo', 'federal', 'oficial', 'ministerio', 'ministério', 'publico', 'público', 'publica', 'pública',
  'orgao', 'órgão', 'tribunal', 'justica', 'justiça', 'policia', 'polícia',
  'detran', 'receita', 'inss', 'tse', 'trf', 'trt', 'stf', 'stj',
  'prefeitura', 'secretaria', 'certidao oficial', 'certidão oficial',
  'documento oficial', 'site oficial', 'portal oficial', 'gov.br',
  'poder judiciario', 'poder judiciário', 'ministerio publico', 'ministério público',
  'cartório oficial', 'registro oficial', 'emitido pelo governo'
];

// Inicializar arquivo de copies se não existir
function initCopiesFile() {
  if (!fs.existsSync(COPIES_FILE)) {
    const initialData = {
      tipos: {},
      govdocs_bloqueados: PALAVRAS_BLOQUEADAS,
      metadata: { ultimaAtualizacao: new Date().toISOString(), totalImportacoes: 0, versao: '2.0' }
    };
    // Inicializar todos os tipos
    Object.keys(TIPOS_CERTIDAO).forEach(tipo => {
      initialData.tipos[tipo] = {
        nome: TIPOS_CERTIDAO[tipo].nome,
        titulos: [], descricoes: [], keywords: [], sitelinks: [], frases: []
      };
    });
    fs.writeFileSync(COPIES_FILE, JSON.stringify(initialData, null, 2));
    console.log('📁 Arquivo de copies v2.0 criado:', COPIES_FILE);
  }
}
initCopiesFile();

// Função auxiliar para ler copies
function readCopies() {
  try {
    const data = fs.readFileSync(COPIES_FILE, 'utf8');
    const parsed = JSON.parse(data);
    // Migrar dados antigos se necessário
    if (!parsed.tipos && parsed.titulos) {
      console.log('🔄 Migrando dados para v2.0...');
      const migrated = {
        tipos: {},
        govdocs_bloqueados: PALAVRAS_BLOQUEADAS,
        metadata: { ...parsed.metadata, versao: '2.0' }
      };
      Object.keys(TIPOS_CERTIDAO).forEach(tipo => {
        migrated.tipos[tipo] = {
          nome: TIPOS_CERTIDAO[tipo].nome,
          titulos: tipo === 'geral' ? (parsed.titulos || []) : [],
          descricoes: tipo === 'geral' ? (parsed.descricoes || []) : [],
          keywords: tipo === 'geral' ? (parsed.keywords || []) : [],
          sitelinks: tipo === 'geral' ? (parsed.sitelinks || []) : [],
          frases: tipo === 'geral' ? (parsed.frases || []) : []
        };
      });
      fs.writeFileSync(COPIES_FILE, JSON.stringify(migrated, null, 2));
      return migrated;
    }
    return parsed;
  } catch (error) {
    console.error('❌ Erro ao ler copies:', error);
    return { tipos: {}, metadata: {} };
  }
}

// Função auxiliar para salvar copies
function saveCopies(copies) {
  try {
    copies.metadata = copies.metadata || {};
    copies.metadata.ultimaAtualizacao = new Date().toISOString();
    fs.writeFileSync(COPIES_FILE, JSON.stringify(copies, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar copies:', error);
    return false;
  }
}

// Função para gerar ID único
function generateCopyId(tipo) {
  const prefix = tipo.substring(0, 3);
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
}

// Função para classificar copy baseado em métricas
function classificarCopy(copy) {
  const { impressoes = 0, ctr = 0, conversoes = 0, reprovado = false } = copy.metricas || {};
  
  if (reprovado) return 'bloqueado';
  if (ctr >= 4.0 && conversoes >= 10) return 'campeao';
  if (ctr >= 3.0 && conversoes >= 5) return 'ativo';
  if (ctr < 1.5 && impressoes > 500) return 'baixa_perf';
  if (copy.uso?.campanhas?.length > 0) return 'ativo';
  return 'disponivel';
}

// Verificar GovDocs
function verificarGovDocs(texto) {
  const textoLower = texto.toLowerCase();
  const encontradas = PALAVRAS_BLOQUEADAS.filter(p => textoLower.includes(p));
  return {
    seguro: encontradas.length === 0,
    palavrasEncontradas: encontradas
  };
}

// DETECTOR: Identificar tipo de certidão baseado no texto
function detectarTipoCertidao(texto) {
  const textoLower = texto.toLowerCase();
  
  for (const [tipoId, config] of Object.entries(TIPOS_CERTIDAO)) {
    if (tipoId === 'geral') continue;
    for (const keyword of config.keywords) {
      if (textoLower.includes(keyword)) {
        return tipoId;
      }
    }
  }
  return 'geral';
}

// PARSER: Interpretar linha colada do Google Ads
function parsearLinhaGoogleAds(linha) {
  // Normalizar linha: substituir múltiplos espaços por TAB para facilitar parsing
  let linhaNormalizada = linha;
  
  // Se não tem TAB, tentar detectar padrão de múltiplos espaços
  if (!linha.includes('\t')) {
    // Padrão comum: texto seguido de palavras conhecidas (Anúncio, Qualificada, Título, etc.)
    // Substituir sequências de 2+ espaços por TAB
    linhaNormalizada = linha.replace(/\s{2,}/g, '\t');
  }
  
  // Detectar separador (priorizar TAB que é o padrão do Google Ads)
  const separadores = ['\t', '|', ',', ';'];
  let melhorSeparador = '\t';
  let maxColunas = 0;
  
  for (const sep of separadores) {
    const colunas = linhaNormalizada.split(sep).map(c => c.trim());
    if (colunas.length > maxColunas) {
      maxColunas = colunas.length;
      melhorSeparador = sep;
    }
  }
  
  const colunas = linhaNormalizada.split(melhorSeparador).map(c => c.trim().replace(/^\"|\"$/g, ''));
  
  if (colunas.length < 2) {
    return { sucesso: false, erro: 'Linha com poucas colunas' };
  }
  
  const resultado = {
    sucesso: true,
    texto: null,
    tipoRecurso: null,
    tipoCertidao: null,
    metricas: {
      impressoes: 0,
      cliques: 0,
      ctr: 0,
      custo: 0,
      conversoes: 0
    }
  };
  
  // FORMATO ESPERADO DO GOOGLE ADS (Relatório de Anúncios):
  // 
  // FORMATO COMPACTO (sem "Adicionada por" e "Data"):
  // Coluna 0: Texto do recurso
  // Coluna 1: Nível ("Anúncio")
  // Coluna 2: Status ("Qualificada")
  // Coluna 3: Tipo de recurso ("Título", "Descrição", "Palavra-chave")
  // Coluna 4: Fixação ("Nenhuma")
  // Coluna 5: Impressões (número)
  // Coluna 6: Cliques (número)
  // Coluna 7: CTR ("31,58%")
  // Coluna 8: CPC ("R$ 2,04")
  // Coluna 9: Conversões ("0,00")
  // Coluna 10: Valor conv. ("0,00")
  // Coluna 11: Custo ("R$ 24,43")
  //
  // FORMATO COM "Adicionada por" e "Data":
  // Coluna 0: Texto do recurso
  // Coluna 1: Nível ("Anúncio" ou "Campanha")
  // Coluna 2: Status ("Qualificada")
  // Coluna 3: Tipo de recurso ("Título", "Descrição", "Sitelink", "Palavra-chave")
  // Coluna 4: Fixação ("Nenhuma")
  // Coluna 5: Adicionada por ("Anunciante")
  // Coluna 6: Data ("1 de dez. de 2025 16:16" ou "—")
  // Coluna 7: Impressões (número)
  // Coluna 8: Cliques (número)
  // Coluna 9: Custo ("R$ 187,74")
  // Coluna 10: Conversões (número decimal)
  // Coluna 11: Outro campo (número decimal)
  // Coluna 12: CTR ("16,05%")
  // Coluna 13: CPC ("R$ 1,36")
  
  // Detectar formato: se coluna 5 é número puro (impressões), é formato compacto
  // Se coluna 5 contém texto como "Anunciante", é formato com data
  let formatoCompacto = false;
  let formatoComData = false;
  
  if (colunas.length > 5) {
    // Se coluna 5 é um número puro (impressões no formato compacto)
    const col5SemPontos = colunas[5].replace(/\./g, '');
    if (/^\d+$/.test(col5SemPontos)) {
      formatoCompacto = true;
    } else if (colunas[5].toLowerCase().includes('anunciante') || 
               colunas[5].toLowerCase().includes('sistema') ||
               colunas[5].toLowerCase().includes('google')) {
      formatoComData = true;
    }
  }
  
  // Ajustar índices baseado no formato detectado
  let idxImpressoes, idxCliques, idxCusto, idxConversoes, idxCTR, idxCPC;
  
  if (formatoCompacto) {
    // Formato compacto: métricas começam na coluna 5
    idxImpressoes = 5;
    idxCliques = 6;
    idxCTR = 7;
    idxCPC = 8;
    idxConversoes = 9;
    idxCusto = 11;  // Custo está na última coluna (11)
  } else {
    // Formato com "Adicionada por" e "Data"
    idxImpressoes = 7;
    idxCliques = 8;
    idxCusto = 9;
    idxConversoes = 10;
    idxCTR = 12;
    idxCPC = 13;
  }
  
  // Extrair texto da coluna 0
  // Se o texto contém palavras conhecidas do Google Ads, extrair apenas a parte antes delas
  if (colunas.length > 0 && colunas[0]) {
    let texto = colunas[0];
    
    // Se o texto contém "Anúncio", "Qualificada", etc., pegar apenas a parte antes
    const palavrasConhecidas = ['anúncio', 'anuncio', 'qualificada', 'qualificado'];
    for (const palavra of palavrasConhecidas) {
      const index = texto.toLowerCase().indexOf(palavra);
      if (index > 0) {
        texto = texto.substring(0, index).trim();
        break;
      }
    }
    
    resultado.texto = texto || colunas[0];
  }
  
  // Extrair tipo de recurso da coluna 3 (ou procurar na linha inteira se não tiver colunas suficientes)
  let tipoDetectado = false;
  
  if (colunas.length > 3 && colunas[3]) {
    const tipoLower = colunas[3].toLowerCase();
    if (tipoLower === 'título' || tipoLower === 'titulo' || tipoLower === 'headline') {
      resultado.tipoRecurso = 'titulos';
      tipoDetectado = true;
    } else if (tipoLower === 'descrição' || tipoLower === 'descricao' || tipoLower === 'description') {
      resultado.tipoRecurso = 'descricoes';
      tipoDetectado = true;
    } else if (tipoLower.includes('palavra') || tipoLower === 'keyword' || tipoLower === 'palavra-chave') {
      resultado.tipoRecurso = 'keywords';
      tipoDetectado = true;
    } else if (tipoLower === 'sitelink' || tipoLower === 'site link') {
      resultado.tipoRecurso = 'sitelinks';
      tipoDetectado = true;
    } else if (tipoLower === 'frase' || tipoLower === 'phrase') {
      resultado.tipoRecurso = 'frases';
      tipoDetectado = true;
    }
  }
  
  // Se não detectou pela coluna 3, procurar na linha inteira
  if (!tipoDetectado) {
    const linhaLower = linha.toLowerCase();
    if (linhaLower.includes(' título') || linhaLower.includes(' titulo') || linhaLower.includes(' headline')) {
      resultado.tipoRecurso = 'titulos';
      tipoDetectado = true;
    } else if (linhaLower.includes(' descrição') || linhaLower.includes(' descricao') || linhaLower.includes(' description')) {
      resultado.tipoRecurso = 'descricoes';
      tipoDetectado = true;
    } else if (linhaLower.includes(' palavra') || linhaLower.includes(' keyword') || linhaLower.includes(' palavra-chave')) {
      resultado.tipoRecurso = 'keywords';
      tipoDetectado = true;
    } else if (linhaLower.includes(' sitelink') || linhaLower.includes(' site link')) {
      resultado.tipoRecurso = 'sitelinks';
      tipoDetectado = true;
    } else if (linhaLower.includes(' frase') || linhaLower.includes(' phrase')) {
      resultado.tipoRecurso = 'frases';
      tipoDetectado = true;
    }
  }
  
  // Extrair métricas usando índices dinâmicos baseados no formato
  // Impressões
  if (colunas.length > idxImpressoes && colunas[idxImpressoes]) {
    const impressoesStr = colunas[idxImpressoes].replace(/\./g, ''); // Remove pontos de milhar
    const impressoes = parseInt(impressoesStr.replace(/[^\d]/g, ''));
    if (!isNaN(impressoes) && impressoes > 0 && impressoes < 100000000) { // Validar que não é ano (2025, etc)
      resultado.metricas.impressoes = impressoes;
    }
  }
  
  // Cliques
  if (colunas.length > idxCliques && colunas[idxCliques]) {
    const cliques = parseInt(colunas[idxCliques].replace(/[^\d]/g, ''));
    if (!isNaN(cliques) && cliques > 0 && cliques < 1000000) { // Validar que não é ano
      resultado.metricas.cliques = cliques;
    }
  }
  
  // Custo (formato "R$ 187,74")
  if (colunas.length > idxCusto && colunas[idxCusto]) {
    const custoStr = colunas[idxCusto].replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.');
    const custo = parseFloat(custoStr);
    if (!isNaN(custo) && custo > 0) {
      resultado.metricas.custo = custo;
    }
  }
  
  // Conversões
  if (colunas.length > idxConversoes && colunas[idxConversoes]) {
    const conversoesStr = colunas[idxConversoes].replace(',', '.');
    const conversoes = parseFloat(conversoesStr);
    if (!isNaN(conversoes)) {
      resultado.metricas.conversoes = conversoes;
    }
  }
  
  // CTR da linha (se disponível no formato com data)
  if (idxCTR > 0 && colunas.length > idxCTR && colunas[idxCTR]) {
    const ctrStr = colunas[idxCTR].replace('%', '').replace(',', '.');
    const ctr = parseFloat(ctrStr);
    if (!isNaN(ctr) && ctr > 0 && ctr <= 100) {
      resultado.metricas.ctr = ctr;
    }
  }
  
  // Se não extraiu métricas das colunas corretas, procurar na linha inteira (fallback)
  // Mas ignorar números que fazem parte de datas (anos como 2025, 2024, etc)
  if (resultado.metricas.impressoes === 0 && resultado.metricas.cliques === 0) {
    // Procurar números na linha, mas ignorar anos (2020-2030)
    const numeros = linha.match(/[\d.]+/g) || [];
    const numerosInteiros = numeros
      .map(n => parseInt(n.replace(/\./g, '')))
      .filter(n => !isNaN(n) && n > 0 && (n < 2020 || n > 2030)); // Ignorar anos
    
    if (numerosInteiros.length >= 2) {
      // Ordenar: maior = impressões, segundo maior = cliques
      numerosInteiros.sort((a, b) => b - a);
      resultado.metricas.impressoes = numerosInteiros[0];
      resultado.metricas.cliques = numerosInteiros[1];
    } else if (numerosInteiros.length === 1) {
      // Se só tem um número, pode ser impressões ou cliques
      if (numerosInteiros[0] > 100) {
        resultado.metricas.impressoes = numerosInteiros[0];
      } else {
        resultado.metricas.cliques = numerosInteiros[0];
      }
    }
  }
  
  // Procurar custo na linha (formato R$ X,XX ou R$ X.XXX,XX) - fallback
  if (resultado.metricas.custo === 0) {
    const custoMatch = linha.match(/R\$\s*([\d.,]+)/i);
    if (custoMatch) {
      const custoStr = custoMatch[1].replace(/\./g, '').replace(',', '.');
      const custo = parseFloat(custoStr);
      if (!isNaN(custo) && custo > 0) {
        resultado.metricas.custo = custo;
      }
    }
  }
  
  // Se o texto contém muitas palavras conhecidas do Google Ads, tentar extrair apenas o texto real
  if (resultado.texto && resultado.texto.length > 50) {
    const palavrasConhecidas = ['anúncio', 'anuncio', 'qualificada', 'qualificado', 'nenhuma', 'anunciante'];
    let textoLimpo = resultado.texto;
    
    for (const palavra of palavrasConhecidas) {
      const regex = new RegExp(`\\s*${palavra}\\s*`, 'i');
      const index = textoLimpo.toLowerCase().indexOf(palavra);
      if (index > 0 && index < textoLimpo.length / 2) {
        // Se encontrou palavra conhecida na primeira metade, pegar só o que vem antes
        textoLimpo = textoLimpo.substring(0, index).trim();
        break;
      }
    }
    
    // Se conseguiu limpar, usar o texto limpo
    if (textoLimpo.length < resultado.texto.length && textoLimpo.length > 0) {
      resultado.texto = textoLimpo;
    }
  }
  
  // Se não detectou tipo de recurso, tentar fallback por tamanho do texto
  if (!resultado.tipoRecurso && resultado.texto) {
    if (resultado.texto.length <= 30) {
      resultado.tipoRecurso = 'titulos';
    } else if (resultado.texto.length <= 90) {
      resultado.tipoRecurso = 'descricoes';
    } else {
      resultado.tipoRecurso = 'keywords';
    }
  }
  
  // Detectar tipo de certidão pelo texto
  if (resultado.texto) {
    resultado.tipoCertidao = detectarTipoCertidao(resultado.texto);
    
    // Calcular CTR automaticamente apenas se não foi extraído da linha
    if (resultado.metricas.ctr === 0 && resultado.metricas.impressoes > 0 && resultado.metricas.cliques > 0) {
      resultado.metricas.ctr = parseFloat(((resultado.metricas.cliques / resultado.metricas.impressoes) * 100).toFixed(2));
    }
  }
  
  if (!resultado.texto) {
    resultado.sucesso = false;
    resultado.erro = 'Não foi possível identificar o texto principal';
  }
  
  return resultado;
}

// GET /copies/tipos - Listar tipos de certidão disponíveis
app.get('/copies/tipos', authenticateRequest, (req, res) => {
  res.json(Object.entries(TIPOS_CERTIDAO).map(([id, config]) => ({
    id,
    nome: config.nome,
    keywords: config.keywords
  })));
});

// POST /copies/verificar-duplicacao - Verificar se texto já existe em qualquer tipo de recurso
app.post('/copies/verificar-duplicacao', authenticateRequest, (req, res) => {
  const { texto, tipoCertidao } = req.body;
  
  if (!texto || !texto.trim()) {
    return res.status(400).json({ error: 'Texto é obrigatório' });
  }
  
  const copies = readCopies();
  const textoLower = texto.toLowerCase().trim();
  const duplicatas = [];
  
  // Verificar em todos os tipos de certidão ou apenas no especificado
  const tiposCertidaoParaVerificar = tipoCertidao && copies.tipos[tipoCertidao] 
    ? { [tipoCertidao]: copies.tipos[tipoCertidao] } 
    : copies.tipos || {};
  
  const tiposRecurso = ['titulos', 'descricoes', 'keywords', 'sitelinks', 'frases'];
  
  for (const [tipoCert, dados] of Object.entries(tiposCertidaoParaVerificar)) {
    for (const tipoRecurso of tiposRecurso) {
      if (dados[tipoRecurso] && Array.isArray(dados[tipoRecurso])) {
        const existente = dados[tipoRecurso].find(c => 
          c.texto && c.texto.toLowerCase().trim() === textoLower
        );
        
        if (existente) {
          duplicatas.push({
            id: existente.id,
            texto: existente.texto,
            tipoCertidao: tipoCert,
            tipoRecurso: tipoRecurso,
            metricas: existente.metricas,
            status: existente.status
          });
        }
      }
    }
  }
  
  res.json({
    existe: duplicatas.length > 0,
    duplicatas
  });
});

// POST /copies/preview-linha - Preview de linha sem salvar
app.post('/copies/preview-linha', authenticateRequest, (req, res) => {
  const { linha } = req.body;
  
  if (!linha || !linha.trim()) {
    return res.status(400).json({ sucesso: false, erro: 'Linha é obrigatória' });
  }
  
  const parsed = parsearLinhaGoogleAds(linha);
  res.json(parsed);
});

// POST /copies/colar-linha - Processar linha colada do Google Ads
app.post('/copies/colar-linha', authenticateRequest, (req, res) => {
  const { linha, tipoCertidaoOverride, tipoRecursoOverride, acaoDuplicacao, duplicataId, duplicataTipoCertidao, duplicataTipoRecurso } = req.body;
  
  if (!linha || !linha.trim()) {
    return res.status(400).json({ error: 'Linha é obrigatória' });
  }
  
  console.log('📥 [COPIES] POST /copies/colar-linha - Processando linha');
  console.log('   tipoCertidaoOverride:', tipoCertidaoOverride);
  console.log('   tipoRecursoOverride:', tipoRecursoOverride);
  console.log('   acaoDuplicacao:', acaoDuplicacao);
  
  // Parsear a linha
  const parsed = parsearLinhaGoogleAds(linha);
  
  if (!parsed.sucesso) {
    console.log('   ❌ Parse falhou:', parsed.erro);
    return res.status(400).json({ error: parsed.erro, parsed });
  }
  
  console.log('   ✅ Parse OK - tipoCertidao:', parsed.tipoCertidao, 'tipoRecurso:', parsed.tipoRecurso);
  
  // Override do tipo de certidão se especificado
  if (tipoCertidaoOverride && TIPOS_CERTIDAO[tipoCertidaoOverride]) {
    parsed.tipoCertidao = tipoCertidaoOverride;
    console.log('   🔄 Override tipoCertidao:', tipoCertidaoOverride);
  }
  
  // Override do tipo de recurso APENAS se não foi detectado automaticamente ou se usuário forçou
  // Prioridade: tipo detectado automaticamente > override manual
  if (!parsed.tipoRecurso && tipoRecursoOverride && ['titulos', 'descricoes', 'keywords', 'sitelinks', 'frases'].includes(tipoRecursoOverride)) {
    parsed.tipoRecurso = tipoRecursoOverride;
    console.log('   🔄 Override tipoRecurso (fallback):', tipoRecursoOverride);
  }
  
  // Verificar GovDocs
  const govCheck = verificarGovDocs(parsed.texto);
  if (!govCheck.seguro) {
    return res.status(400).json({
      error: 'Texto contém palavras bloqueadas (GovDocs)',
      palavras: govCheck.palavrasEncontradas,
      parsed
    });
  }
  
  const copies = readCopies();
  const tipoCert = parsed.tipoCertidao || 'geral';
  const tipoRecurso = parsed.tipoRecurso || 'titulos';
  const textoLower = parsed.texto.toLowerCase().trim();
  const tiposRecurso = ['titulos', 'descricoes', 'keywords', 'sitelinks', 'frases'];
  
  // VERIFICAÇÃO GLOBAL DE DUPLICAÇÃO - verificar em todos os tipos de recurso
  const duplicatasGlobais = [];
  
  if (copies.tipos && copies.tipos[tipoCert]) {
    for (const tipo of tiposRecurso) {
      if (copies.tipos[tipoCert][tipo] && Array.isArray(copies.tipos[tipoCert][tipo])) {
        const encontrado = copies.tipos[tipoCert][tipo].find(c => 
          c.texto && c.texto.toLowerCase().trim() === textoLower
        );
        if (encontrado) {
          duplicatasGlobais.push({
            id: encontrado.id,
            texto: encontrado.texto,
            tipoCertidao: tipoCert,
            tipoRecurso: tipo,
            metricas: encontrado.metricas,
            status: encontrado.status
          });
        }
      }
    }
  }
  
  // Se existe duplicata e não foi especificada ação, retornar para confirmação
  if (duplicatasGlobais.length > 0 && !acaoDuplicacao) {
    console.log('   ⚠️ Duplicata encontrada, aguardando decisão do usuário');
    return res.status(409).json({
      error: 'duplicata_encontrada',
      mensagem: 'Este texto já existe em outro tipo de recurso',
      duplicatas: duplicatasGlobais,
      parsed: {
        texto: parsed.texto,
        tipoRecurso: tipoRecurso,
        tipoCertidao: tipoCert,
        metricas: parsed.metricas
      },
      tipoRecursoDetectado: tipoRecurso
    });
  }
  
  console.log('   📍 Salvando em:', tipoCert, '/', tipoRecurso);
  
  // Garantir que a estrutura existe
  if (!copies.tipos) copies.tipos = {};
  if (!copies.tipos[tipoCert]) {
    copies.tipos[tipoCert] = {
      nome: TIPOS_CERTIDAO[tipoCert]?.nome || tipoCert,
      titulos: [], descricoes: [], keywords: [], sitelinks: [], frases: []
    };
    console.log('   📁 Criado tipo de certidão:', tipoCert);
  }
  if (!copies.tipos[tipoCert][tipoRecurso]) {
    copies.tipos[tipoCert][tipoRecurso] = [];
    console.log('   📁 Criado tipo de recurso:', tipoRecurso);
  }
  
  let resultado;
  
  // Processar de acordo com a ação de duplicação
  if (acaoDuplicacao === 'atualizar_existente' && duplicataId && duplicataTipoCertidao && duplicataTipoRecurso) {
    // Atualizar o copy existente onde ele está
    const existente = copies.tipos[duplicataTipoCertidao]?.[duplicataTipoRecurso]?.find(c => c.id === duplicataId);
  
  if (existente) {
    existente.metricas.impressoes += parsed.metricas.impressoes;
    existente.metricas.cliques += parsed.metricas.cliques;
    existente.metricas.custo += parsed.metricas.custo;
    if (existente.metricas.impressoes > 0) {
      existente.metricas.ctr = parseFloat(((existente.metricas.cliques / existente.metricas.impressoes) * 100).toFixed(2));
    }
    existente.status = classificarCopy(existente);
    existente.atualizadoEm = new Date().toISOString();
      existente.historico = existente.historico || [];
    existente.historico.push({ data: new Date().toISOString(), acao: 'atualizado_via_linha' });
    
      resultado = { acao: 'atualizado', copy: existente, localExistente: true };
    } else {
      return res.status(404).json({ error: 'Copy original não encontrado' });
    }
  } else if (acaoDuplicacao === 'mover_para_novo' && duplicataId && duplicataTipoCertidao && duplicataTipoRecurso) {
    // Remover do local antigo e criar no novo tipo detectado
    const arrayAntigo = copies.tipos[duplicataTipoCertidao]?.[duplicataTipoRecurso];
    if (arrayAntigo) {
      const index = arrayAntigo.findIndex(c => c.id === duplicataId);
      if (index !== -1) {
        arrayAntigo.splice(index, 1);
        console.log(`   🗑️ Removido de ${duplicataTipoCertidao}/${duplicataTipoRecurso}`);
      }
    }
    
    // Criar no novo local
    const novoCopy = {
      id: generateCopyId(tipoRecurso),
      texto: parsed.texto,
      caracteres: parsed.texto.length,
      tipoCertidao: tipoCert,
      tipoRecurso: tipoRecurso,
      status: 'disponivel',
      metricas: parsed.metricas,
      historico: [{ data: new Date().toISOString(), acao: 'movido_de_' + duplicataTipoRecurso }],
      validacao: { govdocs_safe: true },
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString()
    };
    
    novoCopy.status = classificarCopy(novoCopy);
    copies.tipos[tipoCert][tipoRecurso].push(novoCopy);
    
    resultado = { acao: 'movido', copy: novoCopy, deOnde: `${duplicataTipoCertidao}/${duplicataTipoRecurso}` };
  } else {
    // Comportamento padrão: verificar duplicata no mesmo tipo ou criar novo
    const existenteNoTipo = copies.tipos[tipoCert][tipoRecurso].find(c => 
      c.texto.toLowerCase() === textoLower
    );
    
    if (existenteNoTipo) {
      // Atualizar métricas
      existenteNoTipo.metricas.impressoes += parsed.metricas.impressoes;
      existenteNoTipo.metricas.cliques += parsed.metricas.cliques;
      existenteNoTipo.metricas.custo += parsed.metricas.custo;
      if (existenteNoTipo.metricas.impressoes > 0) {
        existenteNoTipo.metricas.ctr = parseFloat(((existenteNoTipo.metricas.cliques / existenteNoTipo.metricas.impressoes) * 100).toFixed(2));
      }
      existenteNoTipo.status = classificarCopy(existenteNoTipo);
      existenteNoTipo.atualizadoEm = new Date().toISOString();
      existenteNoTipo.historico = existenteNoTipo.historico || [];
      existenteNoTipo.historico.push({ data: new Date().toISOString(), acao: 'atualizado_via_linha' });
      
      resultado = { acao: 'atualizado', copy: existenteNoTipo };
  } else {
    // Criar novo
    const novoCopy = {
      id: generateCopyId(tipoRecurso),
      texto: parsed.texto,
      caracteres: parsed.texto.length,
      tipoCertidao: tipoCert,
      tipoRecurso: tipoRecurso,
      status: 'disponivel',
      metricas: parsed.metricas,
      historico: [{ data: new Date().toISOString(), acao: 'criado_via_linha' }],
      validacao: { govdocs_safe: true },
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString()
    };
    
    novoCopy.status = classificarCopy(novoCopy);
    copies.tipos[tipoCert][tipoRecurso].push(novoCopy);
    
    resultado = { acao: 'criado', copy: novoCopy };
    }
  }
  
  if (saveCopies(copies)) {
    console.log(`✅ [COPIES] ${resultado.acao}: ${parsed.texto.substring(0, 30)}... -> ${tipoCert}/${tipoRecurso}`);
    console.log(`   📊 Total de ${tipoRecurso} em ${tipoCert}:`, copies.tipos[tipoCert][tipoRecurso].length);
    res.json({
      success: true,
      ...resultado,
      parsed: {
        texto: parsed.texto,
        tipoRecurso: tipoRecurso,
        tipoCertidao: tipoCert,
        metricas: parsed.metricas
      }
    });
  } else {
    console.error('❌ [COPIES] Erro ao salvar copies');
    res.status(500).json({ error: 'Erro ao salvar' });
  }
});

// GET /copies/gerar-anuncio/:tipo - Gerar anúncio completo para um tipo
app.get('/copies/gerar-anuncio/:tipo', authenticateRequest, (req, res) => {
  const { tipo } = req.params;
  
  if (!TIPOS_CERTIDAO[tipo]) {
    return res.status(400).json({ error: 'Tipo de certidão inválido', tiposValidos: Object.keys(TIPOS_CERTIDAO) });
  }
  
  const copies = readCopies();
  const dados = copies.tipos?.[tipo] || { titulos: [], descricoes: [], keywords: [], sitelinks: [], frases: [] };
  
  // Ordenar por status (campeões primeiro) e CTR
  const ordenar = (arr) => {
    return [...(arr || [])].sort((a, b) => {
      const ordem = { campeao: 0, ativo: 1, disponivel: 2, pausado: 3, baixa_perf: 4, bloqueado: 5 };
      const ordemA = ordem[a.status] ?? 4;
      const ordemB = ordem[b.status] ?? 4;
      if (ordemA !== ordemB) return ordemA - ordemB;
      return (b.metricas?.ctr || 0) - (a.metricas?.ctr || 0);
    }).filter(c => c.status !== 'bloqueado');
  };
  
  const titulos = ordenar(dados.titulos).slice(0, 15);
  const descricoes = ordenar(dados.descricoes).slice(0, 4);
  const keywords = ordenar(dados.keywords).slice(0, 20);
  const sitelinks = ordenar(dados.sitelinks).slice(0, 6);
  const frases = ordenar(dados.frases).slice(0, 10);
  
  // Gerar anúncio formatado
  const anuncio = {
    tipo: tipo,
    nomeTipo: TIPOS_CERTIDAO[tipo].nome,
    geradoEm: new Date().toISOString(),
    completo: titulos.length >= 3 && descricoes.length >= 2,
    stats: {
      titulos: titulos.length,
      descricoes: descricoes.length,
      keywords: keywords.length,
      sitelinks: sitelinks.length,
      frases: frases.length,
      campeoes: {
        titulos: titulos.filter(t => t.status === 'campeao').length,
        descricoes: descricoes.filter(t => t.status === 'campeao').length
      }
    },
    componentes: {
      titulos: titulos.map(t => ({ texto: t.texto, status: t.status, ctr: t.metricas?.ctr })),
      descricoes: descricoes.map(t => ({ texto: t.texto, status: t.status, ctr: t.metricas?.ctr })),
      keywords: keywords.map(t => ({ texto: t.texto, status: t.status })),
      sitelinks: sitelinks.map(t => ({ texto: t.texto, status: t.status })),
      frases: frases.map(t => ({ texto: t.texto, status: t.status }))
    },
    textoCopiavel: {
      titulos: titulos.map(t => t.texto).join('\n'),
      descricoes: descricoes.map(t => t.texto).join('\n'),
      keywords: keywords.map(t => t.texto).join('\n'),
      sitelinks: sitelinks.map(t => t.texto).join('\n'),
      frases: frases.map(t => t.texto).join('\n')
    }
  };
  
  res.json(anuncio);
});

// GET /copies - Listar todos os copies (v2 - por tipo de certidão)
app.get('/copies', authenticateRequest, (req, res) => {
  console.log('📥 [COPIES] GET /copies - Listando copies');
  const copies = readCopies();
  const { tipoCertidao, tipoRecurso, status, ordenar } = req.query;
  
  // Se especificou tipo de certidão
  if (tipoCertidao && copies.tipos?.[tipoCertidao]) {
    const dados = copies.tipos[tipoCertidao];
    
    if (tipoRecurso && dados[tipoRecurso]) {
      let resultado = [...dados[tipoRecurso]];
      
      if (status) {
        resultado = resultado.filter(c => c.status === status);
      }
      
      if (ordenar === 'ctr') {
        resultado.sort((a, b) => (b.metricas?.ctr || 0) - (a.metricas?.ctr || 0));
      }
      
      return res.json(resultado);
    }
    
    return res.json(dados);
  }
  
  // Retornar todos organizados por tipo
  res.json({
    tipos: copies.tipos || {},
    tiposDisponiveis: Object.keys(TIPOS_CERTIDAO)
  });
});

// GET /copies/stats - Estatísticas dos copies (v2)
app.get('/copies/stats', authenticateRequest, (req, res) => {
  const copies = readCopies();
  
  const contarPorStatus = (arr) => {
    const stats = { disponivel: 0, ativo: 0, campeao: 0, baixa_perf: 0, bloqueado: 0, pausado: 0 };
    (arr || []).forEach(c => {
      if (stats.hasOwnProperty(c.status)) stats[c.status]++;
    });
    return stats;
  };
  
  const statsPorTipo = {};
  let totais = { titulos: 0, descricoes: 0, keywords: 0, sitelinks: 0, frases: 0 };
  
  if (copies.tipos) {
    Object.entries(copies.tipos).forEach(([tipoId, dados]) => {
      statsPorTipo[tipoId] = {
        nome: dados.nome,
        titulos: { total: (dados.titulos || []).length, ...contarPorStatus(dados.titulos) },
        descricoes: { total: (dados.descricoes || []).length, ...contarPorStatus(dados.descricoes) },
        keywords: { total: (dados.keywords || []).length, ...contarPorStatus(dados.keywords) },
        sitelinks: { total: (dados.sitelinks || []).length, ...contarPorStatus(dados.sitelinks) },
        frases: { total: (dados.frases || []).length, ...contarPorStatus(dados.frases) }
      };
      
      totais.titulos += (dados.titulos || []).length;
      totais.descricoes += (dados.descricoes || []).length;
      totais.keywords += (dados.keywords || []).length;
      totais.sitelinks += (dados.sitelinks || []).length;
      totais.frases += (dados.frases || []).length;
    });
  }
  
  res.json({
    totais,
    porTipo: statsPorTipo,
    ultimaAtualizacao: copies.metadata?.ultimaAtualizacao,
    totalImportacoes: copies.metadata?.totalImportacoes || 0
  });
});

// POST /copies - Criar novo copy
app.post('/copies', authenticateRequest, (req, res) => {
  const { tipo, texto, categoria, campanha } = req.body;
  
  if (!tipo || !texto) {
    return res.status(400).json({ error: 'Tipo e texto são obrigatórios' });
  }
  
  const tiposValidos = ['titulos', 'descricoes', 'keywords', 'sitelinks', 'frases'];
  if (!tiposValidos.includes(tipo)) {
    return res.status(400).json({ error: 'Tipo inválido', tiposValidos });
  }
  
  // Verificar GovDocs
  const govCheck = verificarGovDocs(texto);
  if (!govCheck.seguro) {
    return res.status(400).json({
      error: 'Texto contém palavras bloqueadas (GovDocs)',
      palavras: govCheck.palavrasEncontradas
    });
  }
  
  const copies = readCopies();
  
  // Verificar duplicata
  const duplicado = copies[tipo].find(c => c.texto.toLowerCase() === texto.toLowerCase());
  if (duplicado) {
    return res.status(409).json({
      error: 'Copy já existe',
      existente: duplicado
    });
  }
  
  const novoCopy = {
    id: generateCopyId(tipo),
    texto,
    caracteres: texto.length,
    categoria: categoria || 'geral',
    status: 'disponivel',
    metricas: {
      impressoes: 0,
      cliques: 0,
      ctr: 0,
      conversoes: 0,
      convRate: 0
    },
    uso: {
      campanhas: campanha ? [campanha] : [],
      grupos: [],
      ativo_em: []
    },
    historico: [
      { data: new Date().toISOString(), acao: 'criado' }
    ],
    validacao: {
      govdocs_safe: true,
      reprovado: false,
      motivo_reprovacao: null
    },
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString()
  };
  
  copies[tipo].push(novoCopy);
  
  if (saveCopies(copies)) {
    console.log(`✅ [COPIES] Novo ${tipo.slice(0, -1)} criado: ${novoCopy.id}`);
    res.status(201).json(novoCopy);
  } else {
    res.status(500).json({ error: 'Erro ao salvar copy' });
  }
});

// PUT /copies/:tipoCertidao/:tipoRecurso/:id - Atualizar copy
app.put('/copies/:tipoCertidao/:tipoRecurso/:id', authenticateRequest, (req, res) => {
  const { tipoCertidao, tipoRecurso, id } = req.params;
  const updates = req.body;
  
  const copies = readCopies();
  
  if (!copies.tipos?.[tipoCertidao]) {
    return res.status(400).json({ error: 'Tipo de certidão inválido' });
  }
  
  if (!copies.tipos[tipoCertidao][tipoRecurso]) {
    return res.status(400).json({ error: 'Tipo de recurso inválido' });
  }
  
  const index = copies.tipos[tipoCertidao][tipoRecurso].findIndex(c => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Copy não encontrado' });
  }
  
  // Atualizar campos permitidos
  const copy = copies.tipos[tipoCertidao][tipoRecurso][index];
  
  if (updates.texto) {
    const govCheck = verificarGovDocs(updates.texto);
    if (!govCheck.seguro) {
      return res.status(400).json({
        error: 'Texto contém palavras bloqueadas',
        palavras: govCheck.palavrasEncontradas
      });
    }
    copy.texto = updates.texto;
    copy.caracteres = updates.texto.length;
  }
  
  if (updates.categoria) copy.categoria = updates.categoria;
  if (updates.status) copy.status = updates.status;
  
  if (updates.metricas) {
    copy.metricas = { ...copy.metricas, ...updates.metricas };
    // Recalcular CTR
    if (copy.metricas.impressoes > 0 && copy.metricas.cliques > 0) {
      copy.metricas.ctr = parseFloat(((copy.metricas.cliques / copy.metricas.impressoes) * 100).toFixed(2));
    }
    // Recalcular Taxa de Conversão
    if (copy.metricas.cliques > 0 && copy.metricas.conversoes > 0) {
      copy.metricas.convRate = parseFloat(((copy.metricas.conversoes / copy.metricas.cliques) * 100).toFixed(2));
    }
    // Reclassificar automaticamente
    copy.status = classificarCopy(copy);
  }
  
  if (updates.reprovado !== undefined) {
    copy.validacao.reprovado = updates.reprovado;
    copy.validacao.motivo_reprovacao = updates.motivo_reprovacao || null;
    if (updates.reprovado) {
      copy.status = 'bloqueado';
    }
  }
  
  copy.atualizadoEm = new Date().toISOString();
  copy.historico.push({
    data: new Date().toISOString(),
    acao: 'atualizado',
    campos: Object.keys(updates)
  });
  
  copies.tipos[tipoCertidao][tipoRecurso][index] = copy;
  
  if (saveCopies(copies)) {
    console.log(`✅ [COPIES] ${tipoCertidao}/${tipoRecurso}/${id} atualizado`);
    res.json(copy);
  } else {
    res.status(500).json({ error: 'Erro ao salvar' });
  }
});

// DELETE /copies/:tipoCertidao/:tipoRecurso/:id - Deletar copy
app.delete('/copies/:tipoCertidao/:tipoRecurso/:id', authenticateRequest, (req, res) => {
  const { tipoCertidao, tipoRecurso, id } = req.params;
  
  const copies = readCopies();
  
  if (!copies.tipos?.[tipoCertidao]) {
    return res.status(400).json({ error: 'Tipo de certidão inválido' });
  }
  
  if (!copies.tipos[tipoCertidao][tipoRecurso]) {
    return res.status(400).json({ error: 'Tipo de recurso inválido' });
  }
  
  const index = copies.tipos[tipoCertidao][tipoRecurso].findIndex(c => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Copy não encontrado' });
  }
  
  const deletado = copies.tipos[tipoCertidao][tipoRecurso].splice(index, 1)[0];
  
  if (saveCopies(copies)) {
    console.log(`🗑️ [COPIES] ${tipoCertidao}/${tipoRecurso}/${id} deletado`);
    res.json({ success: true, deleted: deletado });
  } else {
    res.status(500).json({ error: 'Erro ao deletar' });
  }
});

// POST /copies/importar - Importar dados colados (modo simples: uma linha por texto)
app.post('/copies/importar', authenticateRequest, (req, res) => {
  const { dados, tipo, campanha } = req.body;
  
  if (!dados) {
    return res.status(400).json({ error: 'Dados são obrigatórios' });
  }
  
  console.log('📥 [COPIES] POST /copies/importar - Importando dados');
  
  try {
    const linhas = dados.trim().split('\n').filter(l => l.trim());
    
    if (linhas.length === 0) {
      return res.status(400).json({ error: 'Nenhum texto para importar' });
    }
    
    // Usar o tipo fornecido ou default para titulos
    const tipoDetectado = tipo || 'titulos';
    
    const copies = readCopies();
    const resultados = {
      importados: 0,
      atualizados: 0,
      duplicados: 0,
      bloqueados: 0,
      erros: [],
      itens: []
    };
    
    // Processar cada linha como um texto individual
    for (let i = 0; i < linhas.length; i++) {
      const texto = linhas[i].trim();
      
      if (!texto || texto.length < 2) {
        resultados.erros.push({ linha: i + 1, erro: 'Texto vazio ou muito curto' });
        continue;
      }
      
      // Verificar GovDocs
      const govCheck = verificarGovDocs(texto);
      if (!govCheck.seguro) {
        resultados.bloqueados++;
        resultados.itens.push({
          texto,
          status: 'BLOQUEADO',
          motivo: `Palavras GovDocs: ${govCheck.palavrasEncontradas.join(', ')}`
        });
        continue;
      }
      
      // Verificar duplicata
      const existente = copies[tipoDetectado].find(c => 
        c.texto.toLowerCase() === texto.toLowerCase()
      );
      
      // Sem métricas no modo simples
      const impressoes = 0;
      const cliques = 0;
      const conversoes = 0;
      
      if (existente) {
        // Já existe, marcar como duplicado
        resultados.duplicados++;
        resultados.itens.push({
          texto,
          status: 'DUPLICADO',
          id: existente.id
        });
      } else {
        // Criar novo
        const novoCopy = {
          id: generateCopyId(tipoDetectado),
          texto,
          caracteres: texto.length,
          categoria: 'geral',
          status: 'disponivel',
          metricas: {
            impressoes,
            cliques,
            ctr: 0,
            conversoes,
            convRate: 0
          },
          uso: {
            campanhas: campanha ? [campanha] : [],
            grupos: [],
            ativo_em: campanha ? [campanha] : []
          },
          historico: [
            { data: new Date().toISOString(), acao: 'importado', campanha }
          ],
          validacao: {
            govdocs_safe: true,
            reprovado: false,
            motivo_reprovacao: null
          },
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString()
        };
        
        // Classificar automaticamente
        novoCopy.status = classificarCopy(novoCopy);
        
        copies[tipoDetectado].push(novoCopy);
        resultados.importados++;
        resultados.itens.push({
          texto,
          status: 'NOVO',
          id: novoCopy.id,
          classificacao: novoCopy.status
        });
      }
    }
    
    // Atualizar metadata
    copies.metadata.totalImportacoes = (copies.metadata.totalImportacoes || 0) + 1;
    
    if (saveCopies(copies)) {
      console.log(`✅ [COPIES] Importação concluída: ${resultados.importados} novos, ${resultados.atualizados} atualizados`);
      res.json({
        success: true,
        tipo: tipoDetectado,
        ...resultados
      });
    } else {
      res.status(500).json({ error: 'Erro ao salvar importação' });
    }
    
  } catch (error) {
    console.error('❌ [COPIES] Erro na importação:', error);
    res.status(500).json({ error: 'Erro ao processar dados', details: error.message });
  }
});

// POST /copies/vincular - Vincular copy a uma campanha
app.post('/copies/vincular', authenticateRequest, (req, res) => {
  const { tipo, copyId, campanha, grupo } = req.body;
  
  if (!tipo || !copyId || !campanha) {
    return res.status(400).json({ error: 'Tipo, copyId e campanha são obrigatórios' });
  }
  
  const copies = readCopies();
  
  if (!copies[tipo]) {
    return res.status(400).json({ error: 'Tipo inválido' });
  }
  
  const copy = copies[tipo].find(c => c.id === copyId);
  if (!copy) {
    return res.status(404).json({ error: 'Copy não encontrado' });
  }
  
  // Adicionar campanha se não existir
  if (!copy.uso.campanhas.includes(campanha)) {
    copy.uso.campanhas.push(campanha);
  }
  if (!copy.uso.ativo_em.includes(campanha)) {
    copy.uso.ativo_em.push(campanha);
  }
  if (grupo && !copy.uso.grupos.includes(grupo)) {
    copy.uso.grupos.push(grupo);
  }
  
  // Atualizar status se estava disponível
  if (copy.status === 'disponivel') {
    copy.status = 'ativo';
  }
  
  copy.atualizadoEm = new Date().toISOString();
  copy.historico.push({
    data: new Date().toISOString(),
    acao: 'vinculado',
    campanha,
    grupo
  });
  
  if (saveCopies(copies)) {
    res.json({ success: true, copy });
  } else {
    res.status(500).json({ error: 'Erro ao vincular' });
  }
});

// GET /copies/sugestoes - Obter sugestões de copies para nova campanha
app.get('/copies/sugestoes', authenticateRequest, (req, res) => {
  const { tipo, campanha, limite = 15 } = req.query;
  
  const copies = readCopies();
  const tipoAlvo = tipo || 'titulos';
  
  if (!copies[tipoAlvo]) {
    return res.status(400).json({ error: 'Tipo inválido' });
  }
  
  // Filtrar copies disponíveis
  let sugestoes = copies[tipoAlvo].filter(c => 
    c.status !== 'bloqueado' && 
    c.status !== 'baixa_perf'
  );
  
  // Ordenar: campeões primeiro, depois disponíveis, depois ativos
  sugestoes.sort((a, b) => {
    const ordem = { campeao: 0, disponivel: 1, ativo: 2, pausado: 3 };
    const ordemA = ordem[a.status] ?? 4;
    const ordemB = ordem[b.status] ?? 4;
    
    if (ordemA !== ordemB) return ordemA - ordemB;
    
    // Dentro da mesma categoria, ordenar por CTR
    return (b.metricas?.ctr || 0) - (a.metricas?.ctr || 0);
  });
  
  // Marcar se já está em uso na campanha
  if (campanha) {
    sugestoes = sugestoes.map(c => ({
      ...c,
      jaEmUso: c.uso?.campanhas?.includes(campanha) || false
    }));
  }
  
  // Limitar resultados
  sugestoes = sugestoes.slice(0, parseInt(limite));
  
  res.json({
    tipo: tipoAlvo,
    campanha,
    sugestoes,
    total: sugestoes.length,
    campeoes: sugestoes.filter(c => c.status === 'campeao').length,
    disponiveis: sugestoes.filter(c => c.status === 'disponivel').length
  });
});

// POST /copies/campanhas - Criar/atualizar campanha
app.post('/copies/campanhas', authenticateRequest, (req, res) => {
  const { id, nome, produto, status = 'ativa' } = req.body;
  
  if (!nome) {
    return res.status(400).json({ error: 'Nome da campanha é obrigatório' });
  }
  
  const copies = readCopies();
  
  const campanha = {
    id: id || `camp-${Date.now()}`,
    nome,
    produto: produto || 'geral',
    status,
    criadaEm: new Date().toISOString(),
    atualizadaEm: new Date().toISOString()
  };
  
  const existente = copies.campanhas.findIndex(c => c.id === campanha.id);
  if (existente >= 0) {
    copies.campanhas[existente] = { ...copies.campanhas[existente], ...campanha };
  } else {
    copies.campanhas.push(campanha);
  }
  
  if (saveCopies(copies)) {
    res.json({ success: true, campanha });
  } else {
    res.status(500).json({ error: 'Erro ao salvar campanha' });
  }
});

// GET /copies/campanhas - Listar campanhas
app.get('/copies/campanhas', authenticateRequest, (req, res) => {
  const copies = readCopies();
  res.json(copies.campanhas || []);
});

console.log('🎯 [COPIES] Sistema de Gestão de Copies inicializado');

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

  // Cron para exportação automática de conversões (Google Sheets)
  if (gclidSheetsDb && sheetsExportService) {
    const scheduleExport = () => {
      const integration = gclidSheetsDb.getIntegration();
      if (!integration?.is_enabled || !integration?.schedule_times) return;
      const times = typeof integration.schedule_times === 'string' ? JSON.parse(integration.schedule_times || '[]') : (integration.schedule_times || []);
      if (times.length === 0) return;
      const now = new Date();
      const current = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      if (times.includes(current)) {
        sheetsExportService.exportPendingConversions().catch(e => console.error('❌ [Sheets Cron] Erro:', e.message));
      }
    };
    cron.schedule('* * * * *', scheduleExport); // Verificar a cada minuto
    console.log('✅ [SYNC] Cron de exportação Sheets ativo');
  }
});

