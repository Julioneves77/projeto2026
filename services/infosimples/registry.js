/**
 * Registry InfoSimples - Mapeamento de serviços comerciais da plataforma para endpoints InfoSimples API v2
 * Documentação: https://infosimples.com/consultas/
 * API v2: POST https://api.infosimples.com/api/v2/consultas/{servico}
 */

const INFOSIMPLES_BASE_URL = (process.env.INFOSIMPLES_BASE_URL || 'https://api.infosimples.com/api/v2/consultas').replace(/\/$/, '');
const INFOSIMPLES_TOKEN = process.env.INFOSIMPLES_TOKEN || '';
const INFOSIMPLES_DEFAULT_TIMEOUT = parseInt(process.env.INFOSIMPLES_DEFAULT_TIMEOUT || '120000', 10);

const TIPO_CERTIDAO_TO_REGISTRY = {
  'criminal-federal': 'CRIMINAL_FEDERAL',
  'criminal-estadual': 'CRIMINAL_ESTADUAL',
  'civil-federal': 'CIVEL_FEDERAL',
  'civil-estadual': 'CIVEL_ESTADUAL',
  'civel-federal': 'CIVEL_FEDERAL',
  'civel-estadual': 'CIVEL_ESTADUAL',
  'antecedentes-pf': 'ANTECEDENTES_PF',
  'eleitoral': 'ELEITORAL_NEGATIVA',
  'cnd': 'CND',
  'cpf-regular': 'CPF_REGULAR',
  'policia-federal': 'ANTECEDENTES_PF',
  'Certidão Criminal Federal': 'CRIMINAL_FEDERAL',
  'Certidão Criminal Estadual': 'CRIMINAL_ESTADUAL',
  'Certidão Cível Federal': 'CIVEL_FEDERAL',
  'Certidão Cível Estadual': 'CIVEL_ESTADUAL',
  'Certidão Negativa Criminal Federal': 'CRIMINAL_FEDERAL',
  'Certidão Negativa Criminal Estadual': 'CRIMINAL_ESTADUAL',
  'Certidão Negativa Cível Federal': 'CIVEL_FEDERAL',
  'Certidão Negativa Cível Estadual': 'CIVEL_ESTADUAL',
  'Certidão Negativa Eleitoral': 'ELEITORAL_NEGATIVA',
  'Certidão Eleitoral': 'ELEITORAL_NEGATIVA',
  'Antecedentes Criminais': 'ANTECEDENTES_PF',
  'Antecedentes Criminais (Polícia Federal)': 'ANTECEDENTES_PF',
  'Antecedentes Criminais de Polícia Federal': 'ANTECEDENTES_PF',
  'Certidão de Quitação Eleitoral': 'ELEITORAL_NEGATIVA',
  'Certidão Negativa de Débitos (CND)': 'CND',
  'Certidão de CPF Regular': 'CPF_REGULAR',
  'Certidão CPF Regular': 'CPF_REGULAR',
  'Situação Cadastral do CPF': 'CPF_REGULAR',
  'Certidão Federal - CRIMINAL': 'CRIMINAL_FEDERAL',
  'Certidão Federal - CÍVEL': 'CIVEL_FEDERAL',
  'Certidão Federal - ELEITORAL': 'ELEITORAL_NEGATIVA',
};

const UF_CODES = new Set(['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']);

/** Mapeamento UF -> TRF com API dedicada (evita cert-unificada que retorna 600) */
const TRF_BY_UF = {
  TRF1: new Set(['AC', 'AM', 'AP', 'BA', 'DF', 'GO', 'MA', 'MT', 'PA', 'PI', 'RO', 'RR', 'TO']),
  TRF2: new Set(['RJ', 'ES']),
  TRF4: new Set(['RS', 'SC', 'PR']),
  TRF5: new Set(['AL', 'CE', 'PB', 'PE', 'RN', 'SE']),
};

const TRF5_ORGAO = { AL: 'JFAL', CE: 'JFCE', PB: 'JFPB', PE: 'JFPE', RN: 'JFRN', SE: 'JFSE' };

function getEstadoFromTicket(ticket) {
  const df = ticket.dadosFormulario || {};
  let raw = (ticket.estadoEmissao || df.estadoSelecionado || df.estadoEmissao || df.estado || '').toString().trim().toUpperCase().replace(/\s+/g, ' ');
  if (!raw && (ticket.cidadeEmissao || df.cidadeEmissao)) {
    raw = (ticket.cidadeEmissao || df.cidadeEmissao).toString().trim().toUpperCase().replace(/\s+/g, ' ');
  }
  if (raw.length === 2 && /^[A-Z]{2}$/.test(raw)) return raw;
  const ufMap = {
    'RIO DE JANEIRO': 'RJ', 'RJ': 'RJ', 'PERNAMBUCO': 'PE', 'PE': 'PE',
    'ESPIRITO SANTO': 'ES', 'ESPÍRITO SANTO': 'ES', 'ES': 'ES',
    'SÃO PAULO': 'SP', 'SAO PAULO': 'SP', 'SP': 'SP',
    'DISTRITO FEDERAL': 'DF', 'DF': 'DF', 'PARANÁ': 'PR', 'PARANA': 'PR', 'PR': 'PR',
    'RIO GRANDE DO SUL': 'RS', 'RS': 'RS', 'SANTA CATARINA': 'SC', 'SC': 'SC',
    'ALAGOAS': 'AL', 'AL': 'AL', 'CEARÁ': 'CE', 'CEARA': 'CE', 'CE': 'CE',
    'PARAÍBA': 'PB', 'PARAIBA': 'PB', 'PB': 'PB', 'RIO GRANDE DO NORTE': 'RN', 'RN': 'RN',
    'SERGIPE': 'SE', 'SE': 'SE', 'ACRE': 'AC', 'AC': 'AC', 'AMAZONAS': 'AM', 'AM': 'AM',
    'AMAPÁ': 'AP', 'AMAPA': 'AP', 'AP': 'AP', 'BAHIA': 'BA', 'BA': 'BA', 'GOIÁS': 'GO', 'GOIAS': 'GO', 'GO': 'GO',
    'MARANHÃO': 'MA', 'MARANHAO': 'MA', 'MA': 'MA', 'MATO GROSSO': 'MT', 'MT': 'MT',
    'MATO GROSSO DO SUL': 'MS', 'MS': 'MS', 'MINAS GERAIS': 'MG', 'MG': 'MG',
    'PARÁ': 'PA', 'PARA': 'PA', 'PA': 'PA', 'PIAUÍ': 'PI', 'PIAUI': 'PI', 'PI': 'PI',
    'RONDÔNIA': 'RO', 'RONDONIA': 'RO', 'RO': 'RO', 'RORAIMA': 'RR', 'RR': 'RR', 'TOCANTINS': 'TO', 'TO': 'TO',
  };
  return ufMap[raw] || (raw.length >= 2 ? raw.slice(0, 2) : '');
}

function getTrfForTicket(ticket) {
  const uf = getEstadoFromTicket(ticket);
  for (const [trf, states] of Object.entries(TRF_BY_UF)) {
    if (states.has(uf)) return trf;
  }
  return null;
}

function isTrf2(ticket) {
  return getTrfForTicket(ticket) === 'TRF2';
}

/** tribunal/trf2/certidao: cpf + tipo_certidao (1=Cível, 2=Eleitoral, 3=Criminal) */
function buildTrf2Payload(ticket, tipoCertidao) {
  const df = ticket.dadosFormulario || {};
  const cpfRaw = (ticket.cpfSolicitante || df.cpf || '').replace(/\D/g, '');
  const cpf = cpfRaw.length === 11 ? cpfRaw : cpfRaw.padStart(11, '0').slice(-11);
  const cnpj = (df.cnpj || '').replace(/\D/g, '');
  const payload = { tipo_certidao: String(tipoCertidao), timeout: 300 };
  if (cnpj && cnpj.length === 14) {
    payload.cnpj = cnpj;
  } else {
    payload.cpf = cpf;
  }
  return payload;
}

/** tribunal/trf1/certidao: tipo, orgao, cpf, considera_filiais. tipo: civel, criminal */
function buildTrf1Payload(ticket, tipoCertidao) {
  const df = ticket.dadosFormulario || {};
  const cpfRaw = (ticket.cpfSolicitante || df.cpf || '').replace(/\D/g, '');
  const cpf = cpfRaw.length === 11 ? cpfRaw : cpfRaw.padStart(11, '0').slice(-11);
  const uf = getEstadoFromTicket(ticket);
  const orgao = toTrf1Orgao(uf);
  const tipoMap = { 1: 'civel', 2: 'eleitoral', 3: 'criminal' };
  const tipo = tipoMap[tipoCertidao] || 'civel';
  return { tipo, orgao, cpf, considera_filiais: 'false', timeout: 300 };
}

/** tribunal/trf4/certidao: tipo, cpf. tipo: 1=Cível, 2=Eleitoral, 3=Criminal */
function buildTrf4Payload(ticket, tipoCertidao) {
  const df = ticket.dadosFormulario || {};
  const cpfRaw = (ticket.cpfSolicitante || df.cpf || '').replace(/\D/g, '');
  const cpf = cpfRaw.length === 11 ? cpfRaw : cpfRaw.padStart(11, '0').slice(-11);
  const cnpj = (df.cnpj || '').replace(/\D/g, '');
  const payload = { tipo: String(tipoCertidao), timeout: 300 };
  if (cnpj && cnpj.length === 14) {
    payload.cnpj = cnpj;
  } else {
    payload.cpf = cpf;
  }
  return payload;
}

/** tribunal/trf5/certidao: tipo_certidao, orgao, cpf, birthdate (obrigatório para CPF) */
function buildTrf5Payload(ticket, tipoCertidao) {
  const df = ticket.dadosFormulario || {};
  const cpfRaw = (ticket.cpfSolicitante || df.cpf || '').replace(/\D/g, '');
  const cpf = cpfRaw.length === 11 ? cpfRaw : cpfRaw.padStart(11, '0').slice(-11);
  const uf = getEstadoFromTicket(ticket);
  const orgao = TRF5_ORGAO[uf] || '5REG';
  const birthdate = formatBirthdateISO(ticket.dataNascimento || df.dataNascimento);
  const payload = { tipo_certidao: String(tipoCertidao), orgao, timeout: 300 };
  const cnpj = (df.cnpj || '').replace(/\D/g, '');
  if (cnpj && cnpj.length === 14) {
    payload.cnpj = cnpj;
  } else {
    payload.cpf = cpf;
    if (birthdate) payload.birthdate = birthdate;
  }
  return payload;
}

function getTrfServicoAndPayload(ticket, tipoCertidao) {
  const trf = getTrfForTicket(ticket);
  if (trf === 'TRF1') return { servico: 'tribunal/trf1/certidao', build: () => buildTrf1Payload(ticket, tipoCertidao) };
  if (trf === 'TRF2') return { servico: 'tribunal/trf2/certidao', build: () => buildTrf2Payload(ticket, tipoCertidao) };
  if (trf === 'TRF4') return { servico: 'tribunal/trf4/certidao', build: () => buildTrf4Payload(ticket, tipoCertidao) };
  if (trf === 'TRF5') return { servico: 'tribunal/trf5/certidao', build: () => buildTrf5Payload(ticket, tipoCertidao) };
  return null;
}

/** TRF1 orgao: siglas aceitas pela API tribunal/trf1/certidao */
const TRF1_ORGAO_MAP = {
  AC: 'AC', AM: 'AM', AP: 'AP', BA: 'BA', DF: 'DF', GO: 'GO', MA: 'MA', MT: 'MT',
  PA: 'PA', PI: 'PI', RO: 'RO', RR: 'RR', TO: 'TO',
  DISTRITOFEDERAL: 'DF', ACRE: 'AC', AMAZONAS: 'AM', AMAPA: 'AP', BAHIA: 'BA',
  GOIAS: 'GO', MARANHAO: 'MA', MATOGROSSO: 'MT', PARA: 'PA', PIAUI: 'PI',
  RONDONIA: 'RO', RORAIMA: 'RR', TOCANTINS: 'TO',
};
function toTrf1Orgao(val) {
  if (!val) return '1_2_GRAU';
  const raw = String(val).toUpperCase().replace(/\s/g, '');
  if (raw === '1_2_GRAU' || raw === '1_GRAU' || raw === 'TRF1') return raw;
  return TRF1_ORGAO_MAP[raw] || (raw.length === 2 ? raw : '1_2_GRAU');
}

function formatBirthdate(val) {
  if (!val) return '';
  const str = String(val).trim();
  if (!str) return '';
  const dmY = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmY) return `${dmY[1].padStart(2, '0')}/${dmY[2].padStart(2, '0')}/${dmY[3]}`;
  const ymd = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymd) return `${ymd[3]}/${ymd[2]}/${ymd[1]}`;
  const d = new Date(str);
  if (isNaN(d.getTime())) return str;
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

/** ISO 8601 (YYYY-MM-DD) - exigido por APIs como antecedentes-criminais/pf/emit */
function formatBirthdateISO(val) {
  if (!val) return '';
  const str = String(val).trim();
  if (!str) return '';
  const ymd = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymd) return `${ymd[1]}-${ymd[2]}-${ymd[3]}`;
  const dmY = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmY) return `${dmY[3]}-${dmY[2].padStart(2, '0')}-${dmY[1].padStart(2, '0')}`;
  const d = new Date(str);
  if (isNaN(d.getTime())) return str;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Campos que vêm do formulário: priorizar dadosFormulario (fonte do cliente) sobre ticket root (pode estar desatualizado)
const FORM_PRIORITY_KEYS = new Set(['nomeMae', 'nomePai', 'ufNascimento', 'rg', 'comarca', 'estadoSelecionado']);

function getTicketField(ticket, ...keys) {
  const df = ticket.dadosFormulario || {};
  for (const k of keys) {
    const v = FORM_PRIORITY_KEYS.has(k) ? (df[k] ?? ticket[k]) : (ticket[k] ?? df[k]);
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
  }
  return '';
}

/**
 * Mapeamento centralizado: serviço interno -> endpoint InfoSimples
 * Serviços prioritários homologados: ANTECEDENTES_PF, ELEITORAL_NEGATIVA, CRIMINAL_FEDERAL, CIVEL_FEDERAL
 */
const ServiceRegistry = {
  ANTECEDENTES_PF: {
    servico: 'antecedentes-criminais/pf/emit',
    requiredFields: ['nomeCompleto', 'cpfSolicitante', 'dataNascimento', 'nomeMae', 'email', 'telefone'],
    buildPayload: (ticket) => {
      const df = ticket.dadosFormulario || {};
      const cpfRaw = (ticket.cpfSolicitante || df.cpf || '').replace(/\D/g, '');
      const cpf = cpfRaw.length === 11 ? cpfRaw : cpfRaw.padStart(11, '0').slice(-11);
      const nome = (getTicketField(ticket, 'nomeCompleto', 'nome') || '').trim();
      const nomeMae = (getTicketField(ticket, 'nomeMae') || '').trim();
      const nomePai = (getTicketField(ticket, 'nomePai') || 'Não informado').trim();
      const birthdate = formatBirthdateISO(ticket.dataNascimento || df.dataNascimento);
      const ufNasc = (df.ufNascimento || ticket.estadoEmissao || df.estadoSelecionado || df.estadoEmissao || 'SP').toUpperCase().replace(/\s/g, '').slice(0, 2);
      if (!nome) throw new Error('Antecedentes PF: nome é obrigatório.');
      if (!cpf || cpf.length !== 11) throw new Error('Antecedentes PF: CPF inválido (11 dígitos).');
      if (!nomeMae) throw new Error('Antecedentes PF: nome da mãe é obrigatório.');
      if (!birthdate || !/^\d{4}-\d{2}-\d{2}$/.test(birthdate)) throw new Error('Antecedentes PF: data de nascimento obrigatória (formato YYYY-MM-DD).');
      if (!UF_CODES.has(ufNasc)) throw new Error(`Antecedentes PF: UF inválida: ${ufNasc}`);
      return { cpf, nome, nome_mae: nomeMae, nome_pai: nomePai, birthdate, uf_nascimento: ufNasc };
    },
  },
  /** tribunal/trf/cert-unificada: tipo 1=Cível, 2=Criminal, 3=Eleitoral. Cobre todos os TRFs. */
  _buildCertUnificadaPayload: (ticket, tipo) => {
    const df = ticket.dadosFormulario || {};
    const cpfRaw = (ticket.cpfSolicitante || df.cpf || '').replace(/\D/g, '');
    const cpf = cpfRaw.length === 11 ? cpfRaw : cpfRaw.padStart(11, '0').slice(-11);
    const cnpj = (df.cnpj || '').replace(/\D/g, '');
    const nome = (getTicketField(ticket, 'nomeCompleto', 'nome') || '').trim();
    const email = (getTicketField(ticket, 'email') || '').trim().toLowerCase();
    const payload = { tipo: String(tipo), email, timeout: 300 };
    if (nome) payload.nome_social = nome;
    if (cnpj && cnpj.length === 14) {
      payload.cnpj = cnpj;
    } else {
      payload.cpf = cpf;
    }
    return payload;
  },
  /** Cível/Criminal/Eleitoral: usa TRF regional quando disponível. TRF1 não tem Eleitoral; cert-unificada retorna 600. TRF2 é fallback para TRF1/outros. */
  ELEITORAL_NEGATIVA: {
    servico: 'tribunal/trf2/certidao',
    getServico: (ticket) => {
      const trf = getTrfForTicket(ticket);
      if (trf === 'TRF1') return 'tribunal/trf2/certidao';
      const t = getTrfServicoAndPayload(ticket, 2);
      if (t) return t.servico;
      return 'tribunal/trf2/certidao';
    },
    requiredFields: (ticket) => {
      const trf = getTrfForTicket(ticket);
      if (trf === 'TRF5') return ['cpfSolicitante', 'dataNascimento'];
      return ['cpfSolicitante'];
    },
    buildPayload: (ticket) => {
      const trf = getTrfForTicket(ticket);
      if (trf === 'TRF1') return buildTrf2Payload(ticket, 2);
      const t = getTrfServicoAndPayload(ticket, 2);
      if (t) return t.build();
      return buildTrf2Payload(ticket, 2);
    },
  },
  CRIMINAL_FEDERAL: {
    servico: 'tribunal/trf/cert-unificada',
    getServico: (ticket) => {
      const t = getTrfServicoAndPayload(ticket, 3);
      return t ? t.servico : 'tribunal/trf/cert-unificada';
    },
    requiredFields: (ticket) => {
      const trf = getTrfForTicket(ticket);
      if (trf === 'TRF5') return ['cpfSolicitante', 'dataNascimento'];
      if (trf) return ['cpfSolicitante'];
      return ['nomeCompleto', 'cpfSolicitante', 'email'];
    },
    buildPayload: (ticket) => {
      const t = getTrfServicoAndPayload(ticket, 3);
      return t ? t.build() : ServiceRegistry._buildCertUnificadaPayload(ticket, 2);
    },
  },
  CIVEL_FEDERAL: {
    servico: 'tribunal/trf/cert-unificada',
    getServico: (ticket) => {
      const t = getTrfServicoAndPayload(ticket, 1);
      return t ? t.servico : 'tribunal/trf/cert-unificada';
    },
    requiredFields: (ticket) => {
      const trf = getTrfForTicket(ticket);
      if (trf === 'TRF5') return ['cpfSolicitante', 'dataNascimento'];
      if (trf) return ['cpfSolicitante'];
      return ['nomeCompleto', 'cpfSolicitante', 'email'];
    },
    buildPayload: (ticket) => {
      const t = getTrfServicoAndPayload(ticket, 1);
      return t ? t.build() : ServiceRegistry._buildCertUnificadaPayload(ticket, 1);
    },
  },
  CND: {
    servico: 'receita-federal/pgfn',
    requiredFields: ['nomeCompleto', 'cpfSolicitante', 'email', 'telefone'],
    buildPayload: (ticket) => {
      const df = ticket.dadosFormulario || {};
      const cpf = (ticket.cpfSolicitante || df.cpf || '').replace(/\D/g, '');
      const cnpj = (df.cnpj || '').replace(/\D/g, '');
      const birthdate = formatBirthdate(ticket.dataNascimento || df.dataNascimento);
      if (cnpj && cnpj.length === 14) {
        return { cnpj, preferencia_emissao: '2via' };
      }
      return { cpf, birthdate, preferencia_emissao: '2via' };
    },
  },
  CPF_REGULAR: null,
  CRIMINAL_ESTADUAL: null,
  CIVEL_ESTADUAL: null,
};

function getRegistryKey(tipoCertidao) {
  if (!tipoCertidao) return null;
  const str = String(tipoCertidao).trim();
  const normalized = str.toLowerCase();
  let key = TIPO_CERTIDAO_TO_REGISTRY[normalized] || TIPO_CERTIDAO_TO_REGISTRY[str];
  if (!key && str.includes('(')) {
    const base = str.replace(/\s*\([^)]*\)\s*$/, '').trim();
    key = TIPO_CERTIDAO_TO_REGISTRY[base] || TIPO_CERTIDAO_TO_REGISTRY[base.toLowerCase()];
  }
  if (!key && /\beleitoral\b|quitação\s*eleitoral|quitacao\s*eleitoral/i.test(str)) return 'ELEITORAL_NEGATIVA';
  if (!key && /antecedentes|policia\s*federal|polícia\s*federal|pf\s*criminal/i.test(str)) return 'ANTECEDENTES_PF';
  if (!key && /certidão\s*federal.*criminal|certidao\s*federal.*criminal/i.test(str)) return 'CRIMINAL_FEDERAL';
  if (!key && /certidão\s*federal.*(cível|civel)|certidao\s*federal.*(cível|civel)/i.test(str)) return 'CIVEL_FEDERAL';
  return key || null;
}

const FIELD_LABELS = {
  nomeCompleto: 'Nome Completo',
  cpfSolicitante: 'CPF',
  dataNascimento: 'Data de Nascimento',
  estadoEmissao: 'Estado de Emissão',
  email: 'E-mail',
  telefone: 'Telefone',
  nomeMae: 'Nome da Mãe',
  nomePai: 'Nome do Pai',
  ufNascimento: 'UF de Nascimento',
};

function getTicketFieldValue(ticket, fieldName) {
  const df = ticket.dadosFormulario || {};
  const rootMap = {
    nomeCompleto: ticket.nomeCompleto || df.nomeCompleto || df.nome,
    cpfSolicitante: ticket.cpfSolicitante || df.cpf,
    dataNascimento: ticket.dataNascimento || df.dataNascimento,
    estadoEmissao: ticket.estadoEmissao || df.estadoSelecionado || df.estadoEmissao,
    email: ticket.email || df.email,
    telefone: ticket.telefone || df.telefone,
    nomeMae: df.nomeMae || ticket.nomeMae,
    nomePai: df.nomePai || ticket.nomePai,
    ufNascimento: df.ufNascimento || ticket.ufNascimento,
  };
  return rootMap[fieldName] ?? df[fieldName] ?? ticket[fieldName] ?? '';
}

function validateRequiredFields(ticket, requiredFields) {
  const missing = [];
  for (const field of requiredFields) {
    const value = getTicketFieldValue(ticket, field);
    if (value === undefined || value === null || String(value).trim() === '') {
      missing.push(field);
    }
  }
  return { valid: missing.length === 0, missing };
}

function formatMissingFieldsForUser(missing) {
  if (!missing || missing.length === 0) return '';
  return missing.map(f => FIELD_LABELS[f] || f).join(', ');
}

module.exports = {
  ServiceRegistry,
  TIPO_CERTIDAO_TO_REGISTRY,
  getRegistryKey,
  getTicketFieldValue,
  validateRequiredFields,
  formatMissingFieldsForUser,
  FIELD_LABELS,
  INFOSIMPLES_BASE_URL,
  INFOSIMPLES_TOKEN,
  INFOSIMPLES_DEFAULT_TIMEOUT,
};
