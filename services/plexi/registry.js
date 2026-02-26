/**
 * Registry de requisitos por tipo de serviço Plexi
 * Configurável - endpoints e requiredFields baseados no que existe no DB/formulário
 * Documentação: https://crawly.atlassian.net/wiki/spaces/PLEXIAPI/
 * URL Base: https://api.plexi.com.br
 */

const PLEXI_API_URL = (process.env.PLEXI_API_URL || 'https://api.plexi.com.br').replace(/\/$/, '');
const PLEXI_API_KEY = process.env.PLEXI_API_KEY || '';

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
  // Compatibilidade com nomes alternativos
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
  'Antecedentes - Polícia Federal': 'ANTECEDENTES_PF',
  'Certidão de Quitação Eleitoral': 'ELEITORAL_NEGATIVA',
  'Quitação Eleitoral': 'ELEITORAL_NEGATIVA',
  'Certidão Quitação Eleitoral': 'ELEITORAL_NEGATIVA',
  'certidão de quitação eleitoral': 'ELEITORAL_NEGATIVA',
  'certidao eleitoral': 'ELEITORAL_NEGATIVA',
  'Certidão Negativa de Débitos (CND)': 'CND',
  'CND - Certidão Negativa de Débitos': 'CND',
  'Certidão de CPF Regular': 'CPF_REGULAR',
  'Situação Cadastral do CPF': 'CPF_REGULAR',
  'Criminal': 'CRIMINAL_ESTADUAL',
  'Cível': 'CIVEL_ESTADUAL',
  'Eleitoral': 'ELEITORAL_NEGATIVA'
};

// TJRJ: mapeamento comarca (formulário) -> Plexi API
const COMARCA_RJ_TO_PLEXI = {
  'rio de janeiro': 'capital',
  'capital': 'capital',
  'niterói': 'niteroi',
  'niteroi': 'niteroi',
  'campos dos goytacazes': 'campos',
  'campos': 'campos'
};
// TJRJ: mapeamento finalidade (formulário) -> Plexi API (camelCase)
const FINALIDADE_RJ_TO_PLEXI = {
  'ação de tutela': 'acaoDeTutela',
  'adoção': 'adocao',
  'alienação fiduciária': 'alienacaoFiduciaria',
  'aluguel': 'aluguel',
  'apresentação à polícia federal': 'apresentacaoAPoliciaFederal',
  'autorização de viagem': 'autorizacaoDeViagem',
  'cadastro': 'cadastro',
  'carteira profissional': 'carteiraProfissional',
  'concursos públicos': 'informacaoPessoal',
  'credenciamento': 'credenciamentoReligioso',
  'emprego': 'trabalho',
  'estágio': 'trabalho',
  'financiamento': 'financiamento',
  'inscrição em conselho profissional': 'cadastro',
  'instrução de processo administrativo': 'instrucaoProcessual',
  'instrução de processo judicial': 'instrucaoProcessual',
  'licitação': 'concorrenciaELicitacao',
  'naturalização': 'naturalizacao',
  'ordem judicial': 'mandadoJudicial',
  'posse em cargo público': 'posseEmCargoPublico',
  'porte de arma': 'porteDeArma',
  'prova de vida': 'provaEmJuizo',
  'registro em órgão público': 'registroCivil',
  'seguro': 'seguro',
  'transferência de imóvel': 'transferenciaDeImovel',
  'universidade / faculdade': 'concurso',
  'visto / migração': 'vistoDeMigracao',
  'informação pessoal': 'informacaoPessoal',
  'informacao pessoal': 'informacaoPessoal'
};

// Certidão Negativa Criminal Federal = TRF (Justiça Federal), não Antecedentes PF
// Mapeamento UF -> TRF: TRF1(N/NE/CO), TRF2(RJ/ES), TRF3(SP/MS), TRF4(RS), TRF5(NE), TRF6(MG)
const ESTADO_TO_TRF = {
  AC: 1, AM: 1, AP: 1, BA: 1, DF: 1, GO: 1, MA: 1, MT: 1, PA: 1, PI: 1, RO: 1, RR: 1, TO: 1,
  RJ: 2, ES: 2,
  SP: 3, MS: 3,
  RS: 4,
  AL: 5, CE: 5, PB: 5, PE: 5, RN: 5, SE: 5,
  MG: 6
};

const ServiceRegistry = {
  CRIMINAL_FEDERAL: {
    endpoint: PLEXI_API_URL && PLEXI_API_KEY
      ? (ticket) => {
          const uf = (ticket.estadoEmissao || ticket.dadosFormulario?.estadoSelecionado || ticket.dadosFormulario?.estadoEmissao || 'SP').toUpperCase().replace(/\s/g, '').slice(0, 2);
          const trf = ESTADO_TO_TRF[uf] || 3;
          const path = trf === 4 ? 'certidao-regional' : trf === 5 ? 'certidao-negativa' : 'certidao-distribuicao';
          return `${PLEXI_API_URL}/api/maestro/trf${trf}/${path}`;
        }
      : '',
    requiredFields: ['nomeCompleto', 'cpfSolicitante', 'estadoEmissao', 'email', 'telefone'],
    buildPayload: (ticket) => {
      const df = ticket.dadosFormulario || {};
      const uf = (ticket.estadoEmissao || df.estadoSelecionado || df.estadoEmissao || 'SP').toUpperCase().replace(/\s/g, '').slice(0, 2);
      const trf = ESTADO_TO_TRF[uf] || 3;
      const cpfCnpj = (ticket.cpfSolicitante || df.cpf || '').replace(/\D/g, '') || (df.cnpj || '').replace(/\D/g, '');
      if (trf === 1) {
        const orgaoMap = { AC: 'ac', AM: 'am', AP: 'ap', BA: 'ba', DF: 'df', GO: 'go', MA: 'ma', MT: 'mt', PA: 'pa', PI: 'pi', RO: 'ro', RR: 'rr', TO: 'to' };
        const orgao = orgaoMap[uf] || 'regionalizada';
        return { tipo: 'criminal', cpfCnpj, orgaos: [orgao] };
      }
      if (trf === 2) return { cpfCnpj, tipo: 'criminal' };
      if (trf === 3) {
        const abrangenciaMap = { SP: 'sjsp', MS: 'sjms' };
        return { cpfCnpj, nome: ticket.nomeCompleto, abrangencia: abrangenciaMap[uf] || 'regional', tipo: 'criminal' };
      }
      if (trf === 4) return { tipo: 'criminal', cpfCnpj, nome: ticket.nomeCompleto };
      if (trf === 5) return { cpfCnpj, orgao: 'regional' };
      if (trf === 6) return { tipo: 'criminal', cpfCnpj, orgaos: ['mg'] };
      return { cpfCnpj, nome: ticket.nomeCompleto, tipo: 'criminal' };
    }
  },
  TRF3_ELEITORAL: {
    endpoint: PLEXI_API_URL && PLEXI_API_KEY ? `${PLEXI_API_URL}/api/maestro/trf3/certidao-distribuicao` : '',
    requiredFields: ['nomeCompleto', 'cpfSolicitante', 'estadoEmissao', 'email', 'telefone'],
    buildPayload: (ticket) => {
      const df = ticket.dadosFormulario || {};
      const cpfCnpj = (ticket.cpfSolicitante || df.cpf || '').replace(/\D/g, '') || (df.cnpj || '').replace(/\D/g, '');
      if (cpfCnpj.length === 14) {
        throw new Error('Eleitoral (TRF3) aceita apenas CPF.');
      }
      if (cpfCnpj.length !== 11) {
        throw new Error('Eleitoral (TRF3) exige CPF com 11 dígitos.');
      }
      const nome = (ticket.nomeCompleto || df.nomeCompleto || df.nome || '').trim();
      if (!nome) throw new Error('Nome é obrigatório para Eleitoral (TRF3).');
      const uf = (ticket.estadoEmissao || df.estadoSelecionado || df.estadoEmissao || 'SP').toUpperCase().replace(/\s/g, '').slice(0, 2);
      const abrangenciaMap = { SP: 'sjsp', MS: 'sjms' };
      let abrangencia = abrangenciaMap[uf] || 'regional';
      if (!ABRANGENCIA_VALIDAS.has(abrangencia)) abrangencia = 'regional';
      return { cpfCnpj, nome, abrangencia, tipo: 'eleitoral' };
    }
  },
  CRIMINAL_ESTADUAL: {
    endpoint: PLEXI_API_URL && PLEXI_API_KEY
      ? (ticket) => {
          const uf = (ticket.estadoEmissao || ticket.dadosFormulario?.estadoSelecionado || ticket.dadosFormulario?.estadoEmissao || '').toUpperCase().replace(/\s/g, '').slice(0, 2);
          const endpoints = {
            SP: 'ssp-sp/antecedentes-criminais',
            RJ: 'tjrj/certidao-judicial-eletronica',
            MG: 'pc-mg-atestado-antecedentes-criminais',
            RS: 'tjrs/certidao-negativa',
            ES: 'tjes/certidao-negativa',
            PA: 'tjpa/certidao-antecedentes-criminais',
            DF: 'tjdft/certidao-distribuicao',
            BA: 'tjba/consulta-primeiro-grau',
            CE: 'tjce/consulta-certidoes'
          };
          const path = endpoints[uf];
          if (!path) throw new Error(`Certidão Criminal Estadual: estado ${uf || 'não informado'} não suportado pela Plexi. Estados disponíveis: SP, RJ, MG, RS, ES, PA, DF, BA, CE.`);
          return `${PLEXI_API_URL}/api/maestro/${path}`;
        }
      : '',
    requiredFields: ['nomeCompleto', 'cpfSolicitante', 'dataNascimento', 'estadoEmissao', 'email', 'telefone'],
    buildPayload: (ticket) => {
      const df = ticket.dadosFormulario || {};
      const uf = (ticket.estadoEmissao || df.estadoSelecionado || df.estadoEmissao || '').toUpperCase().replace(/\s/g, '').slice(0, 2);
      const cpf = (ticket.cpfSolicitante || df.cpf || '').replace(/\D/g, '');
      const nome = ticket.nomeCompleto || '';
      const dataNasc = formatDataPlexi(ticket.dataNascimento);
      if (uf === 'RJ') {
        const email = ticket.email || df.email || '';
        const comarcaForm = String(df.comarca || 'Rio de Janeiro').toLowerCase().trim();
        const comarca = COMARCA_RJ_TO_PLEXI[comarcaForm] || (comarcaForm.includes('niterói') || comarcaForm.includes('niteroi') ? 'niteroi' : comarcaForm.includes('campos') ? 'campos' : 'outras');
        const finalidadeForm = String(df.finalidade || 'Informação pessoal').toLowerCase().trim();
        const finalidade = FINALIDADE_RJ_TO_PLEXI[finalidadeForm] || 'informacaoPessoal';
        const payload = {
          nomeRequerente: nome,
          cpfCnpjRequerente: cpf,
          emailRequerente: email,
          email: email,
          cpfCnpj: cpf,
          nome,
          dataNascimento: dataNasc,
          comarca,
          modeloRequerimento: 'acoesCriminais',
          finalidade
        };
        if (comarca === 'outras' && comarcaForm) {
          payload.cidade = comarcaForm.replace(/\s+/g, '_').replace(/[àáâãä]/g, 'a').replace(/[èéêë]/g, 'e').replace(/[ìíîï]/g, 'i').replace(/[òóôõö]/g, 'o').replace(/[ùúûü]/g, 'u').replace(/ç/g, 'c').toLowerCase();
        }
        return payload;
      }
      if (uf === 'SP') {
        const sexo = (ticket.genero || df.sexo || df.genero || 'masculino').toString().toLowerCase();
        const sexoPlexi = sexo.includes('fem') || sexo === 'f' ? 'feminino' : 'masculino';
        return {
          nome,
          cpf,
          sexo: sexoPlexi,
          dataExpedicao: dataNasc,
          dataNascimento: dataNasc,
          nomeMae: df.nomeMae || ''
        };
      }
      if (uf === 'MG') {
        const rg = (df.rg || ticket.rg || '').replace(/\D/g, '');
        if (!rg) throw new Error('Certidão Criminal Estadual MG exige RG. Preencha o campo RG.');
        return { nome, rg: df.rg || ticket.rg, dataNascimento: dataNasc };
      }
      if (uf === 'RS') {
        const endereco = ticket.endereco || df.endereco || df.enderecoCompleto || '';
        const nomeMae = df.nomeMae || ticket.nomeMae || '';
        const rg = (df.rg || ticket.rg || '').replace(/\D/g, '');
        const orgaoExpedidorRg = df.rgOrgaoEmissor || df.orgaoExpedidorRg || 'SSP';
        const ufRg = (df.ufRg || df.uf || uf).toLowerCase();
        const payload = { tipo: 2, cpfCnpj: cpf, nome, endereco: endereco || 'Não informado' };
        if (cpf && cpf.length <= 11) {
          if (!rg) throw new Error('Certidão Criminal Estadual RS exige RG para busca por CPF.');
          payload.rg = df.rg || ticket.rg;
          payload.orgaoExpedidorRg = orgaoExpedidorRg;
          payload.ufRg = ufRg;
          payload.nomeMae = nomeMae || 'Não informado';
          payload.dataNascimento = dataNasc;
        }
        return payload;
      }
      if (uf === 'ES') {
        return {
          instancia: 1,
          naturezaCertidao: 5,
          cpfCnpj: cpf,
          nome
        };
      }
      if (uf === 'PA') {
        const endereco = ticket.endereco || df.endereco || df.enderecoCompleto || '';
        const nomeMae = df.nomeMae || ticket.nomeMae || '';
        if (!nomeMae) throw new Error('Certidão Criminal Estadual PA exige nome da mãe.');
        return {
          requerente: nome,
          nomeMae,
          endereco: endereco || 'Não informado',
          cpf
        };
      }
      if (uf === 'DF') {
        const nomeMae = df.nomeMae || ticket.nomeMae || '';
        if (!nomeMae) throw new Error('Certidão Criminal Estadual DF exige nome da mãe.');
        return {
          tipoCertidao: 'criminal',
          cpfCnpj: cpf,
          nome,
          nomeMae
        };
      }
      if (uf === 'BA') {
        const endereco = ticket.endereco || df.endereco || df.enderecoCompleto || '';
        const nomeMae = df.nomeMae || ticket.nomeMae || '';
        if (!nomeMae) throw new Error('Certidão Criminal Estadual BA exige nome da mãe.');
        const ec = String(df.estadoCivil || 'solteiro').toLowerCase();
        let estadoCivil = 'solteiro';
        if (ec.includes('casad')) estadoCivil = 'casado';
        else if (ec.includes('divorci')) estadoCivil = 'divorciado';
        else if (ec.includes('viuv')) estadoCivil = 'viuvo';
        else if (ec.includes('união') || ec.includes('uniao')) estadoCivil = 'uniaoEstavel';
        else if (ec.includes('separad')) estadoCivil = 'separadoJudicialmente';
        return {
          modelo: 'criminalExecucaoPenal',
          participacao: 'ambas',
          cpfCnpj: cpf,
          nome,
          endereco: endereco || 'Não informado',
          nomeMae,
          nacionalidade: (df.nacionalidade || 'Brasileiro').toLowerCase().includes('brasil') ? 'brasileira' : 'brasileira',
          estadoCivil
        };
      }
      if (uf === 'CE') {
        const nomeMae = df.nomeMae || ticket.nomeMae || '';
        const nomePai = df.nomePai || ticket.nomePai || '';
        if (!nomeMae) throw new Error('Certidão Criminal Estadual CE exige nome da mãe.');
        return {
          natureza: 'criminal',
          instancia: 'primeiro_grau',
          tipoCertidao: 'certidao_judicial',
          cpf,
          nome,
          nomeMae,
          nomePai: nomePai || 'Não informado',
          dataNascimento: dataNasc,
          comarca: (df.comarca || 'fortaleza').toLowerCase().replace(/\s/g, '_')
        };
      }
      throw new Error(`Estado ${uf} não suportado para Criminal Estadual`);
    }
  },
  CIVEL_FEDERAL: {
    endpoint: PLEXI_API_URL && PLEXI_API_KEY ? `${PLEXI_API_URL}/api/maestro/civel-federal` : '',
    requiredFields: ['nomeCompleto', 'cpfSolicitante', 'dataNascimento', 'email', 'telefone'],
    buildPayload: (ticket) => buildBasePayload(ticket)
  },
  CIVEL_ESTADUAL: {
    endpoint: PLEXI_API_URL && PLEXI_API_KEY ? `${PLEXI_API_URL}/api/maestro/civel-estadual` : '',
    requiredFields: ['nomeCompleto', 'cpfSolicitante', 'dataNascimento', 'estadoEmissao', 'email', 'telefone'],
    buildPayload: (ticket) => buildBasePayload(ticket)
  },
  ANTECEDENTES_PF: {
    endpoint: PLEXI_API_URL && PLEXI_API_KEY ? `${PLEXI_API_URL}/api/maestro/pf-certidao-antecedentes-criminais` : '',
    requiredFields: ['nomeCompleto', 'cpfSolicitante', 'dataNascimento', 'nomeMae', 'email', 'telefone'],
    buildPayload: (ticket) => {
      const df = ticket.dadosFormulario || {};
      const nome = (ticket.nomeCompleto || df.nomeCompleto || df.nome || '').trim();
      const cpf = (ticket.cpfSolicitante || df.cpf || '').replace(/\D/g, '');
      const nomeMae = (df.nomeMae || '').trim();
      const dataNascimento = formatDataPlexi(ticket.dataNascimento || df.dataNascimento);
      return { nome, cpf, nomeMae, dataNascimento };
    }
  },
  ELEITORAL_NEGATIVA: {
    endpoint: PLEXI_API_URL && PLEXI_API_KEY ? `${PLEXI_API_URL}/api/maestro/eleitoral` : '',
    requiredFields: ['nomeCompleto', 'cpfSolicitante', 'dataNascimento', 'email', 'telefone'],
    buildPayload: (ticket) => {
      const df = ticket.dadosFormulario || {};
      const cpf = (ticket.cpfSolicitante || df.cpf || '').replace(/\D/g, '');
      const nome = (ticket.nomeCompleto || df.nomeCompleto || df.nome || '').trim();
      const dataNasc = formatDataPlexi(ticket.dataNascimento || df.dataNascimento);
      const estado = (ticket.estadoEmissao || df.estadoSelecionado || df.estadoEmissao || '').trim().toUpperCase().slice(0, 2);
      const payload = { nome, cpf, dataNascimento: dataNasc };
      if (estado && UF_CODES.has(estado)) payload.uf = estado;
      return payload;
    }
  },
  CND: {
    endpoint: PLEXI_API_URL && PLEXI_API_KEY ? `${PLEXI_API_URL}/api/maestro/cnd-federal-pgfn/certidao-conjunta` : '',
    requiredFields: ['nomeCompleto', 'cpfSolicitante', 'email', 'telefone'],
    buildPayload: (ticket) => {
      const df = ticket.dadosFormulario || {};
      const cnpj = (df.cnpj || '').replace(/\D/g, '');
      const cpf = (ticket.cpfSolicitante || '').replace(/\D/g, '');
      const cpfCnpj = cnpj || cpf || '00000000000';
      const payload = { cpfCnpj };
      if (cpfCnpj.length <= 11) payload.dataNascimento = formatDataPlexi(ticket.dataNascimento);
      return payload;
    }
  },
  CPF_REGULAR: {
    endpoint: PLEXI_API_URL && PLEXI_API_KEY ? `${PLEXI_API_URL}/api/maestro/receita/comprovante-situacao-cadastral` : '',
    requiredFields: ['nomeCompleto', 'cpfSolicitante', 'dataNascimento', 'email', 'telefone'],
    buildPayload: (ticket) => ({
      cpf: (ticket.cpfSolicitante || '').replace(/\D/g, ''),
      dataNascimento: formatDataPlexi(ticket.dataNascimento)
    })
  },
};

function formatDataPlexi(val) {
  if (!val) return '';
  const str = String(val).trim();
  if (!str) return '';
  // Já está em DD/MM/YYYY (PLEXI espera d/m/Y)
  const dmY = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmY) return `${dmY[1].padStart(2, '0')}/${dmY[2].padStart(2, '0')}/${dmY[3]}`;
  // YYYY-MM-DD (ISO) - parsear sem timezone para evitar off-by-one
  const ymd = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymd) return `${ymd[3]}/${ymd[2]}/${ymd[1]}`;
  const d = new Date(str);
  if (isNaN(d.getTime())) return str;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function buildBasePayload(ticket) {
  const df = ticket.dadosFormulario || {};
  const estadoEmissao = ticket.estadoEmissao || df.estadoSelecionado || df.estadoEmissao || '';
  const nomeMae = df.nomeMae || '';
  return {
    ticketId: ticket.id,
    codigo: ticket.codigo,
    nomeCompleto: ticket.nomeCompleto,
    cpfSolicitante: ticket.cpfSolicitante,
    dataNascimento: ticket.dataNascimento,
    email: ticket.email,
    telefone: ticket.telefone,
    estadoEmissao: estadoEmissao || undefined,
    nomeMae: nomeMae || undefined,
    ...df
  };
}

const UF_CODES = new Set(['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']);

const ABRANGENCIA_VALIDAS = new Set(['regional', 'sjsp', 'sjms', 'trf']);

function maskCpfCnpj(val) {
  if (!val || typeof val !== 'string') return '***';
  const digits = val.replace(/\D/g, '');
  if (digits.length <= 4) return '****';
  return `${digits.slice(0, 3)}***${digits.slice(-2)}`;
}

function getRegistryKey(ticketOrTipoCertidao) {
  const ticket = typeof ticketOrTipoCertidao === 'object' && ticketOrTipoCertidao !== null ? ticketOrTipoCertidao : null;
  const tipoCertidao = ticket ? ticket.tipoCertidao : ticketOrTipoCertidao;
  if (!tipoCertidao) return null;
  const str = String(tipoCertidao).trim();
  const normalized = str.toLowerCase();
  // Eleitoral: SP/MS usam TRF3 certidao-distribuicao com tipo=eleitoral (CPF only)
  if (/\beleitoral\b|quitação\s*eleitoral|quitacao\s*eleitoral|certidão\s*(negativa\s*)?eleitoral|certidao\s*(negativa\s*)?eleitoral/i.test(str)) {
    if (ticket) {
      const df = ticket.dadosFormulario || {};
      const uf = (ticket.estadoEmissao || df.estadoSelecionado || df.estadoEmissao || '').toUpperCase().replace(/\s/g, '').slice(0, 2);
      if (uf === 'SP' || uf === 'MS') return 'TRF3_ELEITORAL';
    }
    return 'ELEITORAL_NEGATIVA';
  }
  // Tentar match exato primeiro
  let key = TIPO_CERTIDAO_TO_REGISTRY[normalized] || TIPO_CERTIDAO_TO_REGISTRY[str];
  // Fallback: remover sufixo entre parênteses (ex: "Certidão Negativa Eleitoral (SP)" -> "Certidão Negativa Eleitoral")
  if (!key && str.includes('(')) {
    const base = str.replace(/\s*\([^)]*\)\s*$/, '').trim();
    key = TIPO_CERTIDAO_TO_REGISTRY[base] || TIPO_CERTIDAO_TO_REGISTRY[base.toLowerCase()];
  }
  // Fallback: remover UF no final (ex: "Certidão Eleitoral SC" -> "Certidão Eleitoral")
  if (!key) {
    const parts = str.split(/\s+/);
    const lastPart = parts[parts.length - 1];
    if (lastPart && UF_CODES.has(lastPart.toUpperCase())) {
      const base = parts.slice(0, -1).join(' ').trim();
      key = TIPO_CERTIDAO_TO_REGISTRY[base] || TIPO_CERTIDAO_TO_REGISTRY[base.toLowerCase()];
    }
  }
  // Fallback final: match por palavra-chave
  if (!key && /\beleitoral\b|quitação\s*eleitoral|quitacao\s*eleitoral|certidão\s*eleitoral|certidao\s*eleitoral/i.test(str)) {
    key = 'ELEITORAL_NEGATIVA';
  }
  return key || null;
}

function getTicketFieldValue(ticket, fieldName) {
  const df = ticket.dadosFormulario || {};
  const rootMap = {
    nomeCompleto: ticket.nomeCompleto,
    cpfSolicitante: ticket.cpfSolicitante,
    dataNascimento: ticket.dataNascimento,
    estadoEmissao: ticket.estadoEmissao || df.estadoSelecionado,
    email: ticket.email,
    telefone: ticket.telefone,
    nomeMae: df.nomeMae
  };
  return rootMap[fieldName] ?? df[fieldName] ?? ticket[fieldName] ?? '';
}

const FIELD_LABELS = {
  nomeCompleto: 'Nome Completo',
  cpfSolicitante: 'CPF',
  dataNascimento: 'Data de Nascimento',
  estadoEmissao: 'Estado de Emissão',
  email: 'E-mail',
  telefone: 'Telefone',
  nomeMae: 'Nome da Mãe',
  estadoSelecionado: 'Estado'
};

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
  maskCpfCnpj,
  FIELD_LABELS,
  PLEXI_API_URL,
  PLEXI_API_KEY
};
