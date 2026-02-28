/**
 * Serviço para criar tickets no formato da PLATAFORMA
 * Usa servidor de sincronização para integração entre PORTAL e PLATAFORMA
 * 
 * IMPORTANTE: Preserva TODOS os campos obrigatórios do formulário
 * (nomeMae, nacionalidade, paisNascimento, rg, comarca, etc.)
 * no campo dadosFormulario para uso na PLATAFORMA.
 * 
 * @updated 2026-01-02 - Adicionado dadosFormulario para campos obrigatórios
 */

// Versão do serviço para controle de cache
const TICKET_SERVICE_VERSION = '2.0.1-dadosFormulario';

// URL do servidor de sincronização - configurável via variável de ambiente
const SYNC_SERVER_URL = import.meta.env.VITE_SYNC_SERVER_URL || 'http://localhost:3001';

// Log versão e URL ao carregar módulo (para diagnóstico de tickets não entrando no Geral)
console.log(`📋 [PORTAL] TicketService v${TICKET_SERVICE_VERSION} carregado | API: ${SYNC_SERVER_URL}/tickets`);

// API Key para autenticação (opcional)
const SYNC_SERVER_API_KEY = import.meta.env.VITE_SYNC_SERVER_API_KEY || null;

// Validação em desenvolvimento
if (import.meta.env.DEV && !import.meta.env.VITE_SYNC_SERVER_URL) {
  console.warn('⚠️ [PORTAL] VITE_SYNC_SERVER_URL não está configurada. Usando padrão: http://localhost:3001');
  console.warn('⚠️ [PORTAL] Configure VITE_SYNC_SERVER_URL no arquivo .env.local para produção');
}

/**
 * Helper para fazer requisições autenticadas ao sync-server
 */
async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers);
  
  // Adicionar API Key se configurada
  if (SYNC_SERVER_API_KEY) {
    headers.set('X-API-Key', SYNC_SERVER_API_KEY);
  }
  
  // Log para debug
  console.log('🔵 [PORTAL] fetchWithAuth:', {
    url,
    method: options.method || 'GET',
    hasApiKey: !!SYNC_SERVER_API_KEY,
    headers: Object.fromEntries(headers.entries())
  });
  
  return fetch(url, {
    ...options,
    headers,
  });
}

export interface TicketData {
  id: string;
  codigo: string;
  tipoPessoa: 'CPF' | 'CNPJ';
  nomeCompleto: string;
  cpfSolicitante: string;
  dataNascimento: string;
  genero: string;
  estadoEmissao: string;
  cidadeEmissao: string;
  telefone: string;
  email: string;
  tipoCertidao: string;
  dominio: string;
  dataCadastro: string; // ISO string para serialização
  prioridade: 'padrao' | 'prioridade' | 'premium';
  status: 'GERAL';
  operador: null;
  dataAtribuicao: null;
  dataConclusao: null;
  historico: any[];
  // Dados completos do formulário para preservar TODOS os campos obrigatórios
  dadosFormulario: Record<string, string | boolean>;
}

interface PortalFormData {
  [key: string]: string | boolean;
}

interface SelectedPlan {
  id: string;
  name: string;
  price: number;
}

/**
 * Gera código único para ticket (TK-XXX)
 * Tenta obter do sync-server primeiro, com fallback para localStorage
 */
async function generateTicketCode(): Promise<string> {
  // Tentar obter código do sync-server primeiro
  try {
    const response = await fetchWithAuth(`${SYNC_SERVER_URL}/tickets/generate-code`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.codigo) {
        console.log('✅ [PORTAL] Código gerado pelo sync-server:', data.codigo);
        return data.codigo;
      }
    }
  } catch (error) {
    console.warn('⚠️ [PORTAL] Sync-server não disponível, usando fallback localStorage:', error);
  }
  
  // Fallback para localStorage se sync-server não estiver disponível
  const TICKETS_KEY = 'av_tickets';
  const stored = localStorage.getItem(TICKETS_KEY);
  
  if (!stored) {
    return 'TK-001';
  }

  try {
    const tickets = JSON.parse(stored);
    if (!Array.isArray(tickets) || tickets.length === 0) {
      return 'TK-001';
    }

    // Extrair número do último código
    const lastCode = tickets[tickets.length - 1]?.codigo || 'TK-000';
    const match = lastCode.match(/TK-(\d+)/);
    const lastNumber = match ? parseInt(match[1], 10) : 0;
    const nextNumber = lastNumber + 1;
    
    const codigo = `TK-${nextNumber.toString().padStart(3, '0')}`;
    console.log('⚠️ [PORTAL] Código gerado via fallback localStorage:', codigo);
    return codigo;
  } catch {
    return 'TK-001';
  }
}

/**
 * Gera ID único para ticket
 */
function generateTicketId(): string {
  return `ticket-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Mapeia dados do formulário PORTAL para estrutura Ticket da PLATAFORMA
 */
async function mapFormDataToTicket(
  formData: PortalFormData,
  certificateType: string,
  state: string | undefined,
  selectedPlan: SelectedPlan,
  origem?: 'portalcacesso' | 'solicite',
  funnelId?: string
): Promise<TicketData> {
  // Determinar tipo de pessoa (CPF ou CNPJ)
  const cpfOuCnpj = formData.cpf || formData.cnpj || formData.cpfOuCnpj || formData.documento || '';
  const cleanDoc = cpfOuCnpj.toString().replace(/\D/g, '');
  const tipoPessoa: 'CPF' | 'CNPJ' = cleanDoc.length > 11 ? 'CNPJ' : 'CPF';

  // Mapear prioridade do plano
  const prioridadeMap: Record<string, 'padrao' | 'prioridade' | 'premium'> = {
    padrao: 'padrao',
    prioridade: 'prioridade',
    premium: 'premium',
  };
  const prioridade = prioridadeMap[selectedPlan.id] || 'padrao';

  // Extrair dados do formulário - mapear vários possíveis nomes de campos
  // Log para debug
  console.log('🔵 [PORTAL] Mapeando dados do formulário:', Object.keys(formData));
  
  const nomeCompleto = (
    formData.nomeCompleto || 
    formData.nome || 
    formData.nomeCompletoSolicitante ||
    formData.razaoSocial || // Para CNPJ
    ''
  ).toString().trim();
  
  const cpfSolicitante = cpfOuCnpj.toString();
  
  // Formatar data de nascimento (aceitar vários formatos)
  let dataNascimento = (formData.dataNascimento || formData.dataNascimentoSolicitante || '').toString();
  if (dataNascimento) {
    // Converter DD/MM/YYYY para YYYY-MM-DD
    if (dataNascimento.includes('/')) {
      const parts = dataNascimento.split('/');
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        dataNascimento = `${year}-${month}-${day}`;
      }
    } else if (dataNascimento.includes('-')) {
      // Já está no formato correto ou precisa inverter
      const parts = dataNascimento.split('-');
      if (parts.length === 3 && parts[0].length === 2) {
        // Formato DD-MM-YYYY, converter para YYYY-MM-DD
        dataNascimento = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }
  }
  
  // Mapear gênero
  let genero = (
    formData.genero || 
    formData.sexo || 
    formData.generoSolicitante ||
    ''
  ).toString();
  
  // Normalizar valores de gênero
  if (genero) {
    const generoLower = genero.toLowerCase();
    if (generoLower.includes('masc') || generoLower === 'm') {
      genero = 'Masculino';
    } else if (generoLower.includes('femi') || generoLower === 'f') {
      genero = 'Feminino';
    } else if (generoLower.includes('empresa') || tipoPessoa === 'CNPJ') {
      genero = 'Empresa';
    }
  }
  
  if (!genero || genero.trim() === '') {
    genero = tipoPessoa === 'CNPJ' ? 'Empresa' : 'Não informado';
  }
  
  // Estado de Emissão: SEMPRE priorizar a escolha explícita do cliente no formulário
  // Federais: estadoEmissao vem do campo do form; Estaduais: state vem da URL/seleção
  const estadoEmissao = (
    formData.estadoEmissao ||
    formData.estado ||
    state ||
    formData.estadoSolicitante ||
    ''
  ).toString().trim();
  
  const cidadeEmissao = (
    formData.cidadeEmissao || 
    formData.cidade || 
    formData.cidadeSolicitante ||
    ''
  ).toString().trim();
  
  // Normalizar telefone: remover +55 (país) se presente para evitar rejeição na validação do sync-server
  let telefone = (
    formData.telefone || 
    formData.telefoneSolicitante ||
    ''
  ).toString().trim();
  const cleanTel = telefone.replace(/\D/g, '');
  if (cleanTel.length === 12 || cleanTel.length === 13) {
    if (cleanTel.startsWith('55')) {
      telefone = cleanTel.slice(2); // Remove 55 (DDI Brasil)
    }
  }
  
  const email = (
    formData.email || 
    formData.emailSolicitante ||
    ''
  ).toString().trim();
  
  console.log('🔵 [PORTAL] Dados mapeados:', {
    nomeCompleto,
    cpfSolicitante,
    dataNascimento,
    genero,
    estadoEmissao,
    cidadeEmissao,
    telefone,
    email,
    tipoPessoa
  });

  // Gerar código do ticket (aguardar se necessário)
  const codigo = await generateTicketCode();
  
  // Preservar TODOS os dados do formulário - obrigatório que cheguem na plataforma
  const dadosFormulario: Record<string, string | boolean> = {};
  for (const [key, value] of Object.entries(formData)) {
    if (key === 'termos') continue;
    dadosFormulario[key] = value;
  }
  // Estado de Emissão: priorizar escolha do formulário (federais) ou state (estaduais)
  const estadoCliente = (formData.estadoEmissao || formData.estado || state || '').toString().trim();
  if (estadoCliente) {
    dadosFormulario['estadoSelecionado'] = estadoCliente;
  }
  // Adicionar origem se disponível
  if (origem) {
    dadosFormulario['origem'] = origem;
  }
  // Adicionar funnel_id se disponível
  if (funnelId) {
    dadosFormulario['funnel_id'] = funnelId;
  }
  // Adicionar Click ID (gclid/wbraid/gbraid) para atribuição de conversões (Google Ads)
  const { getStoredClickId } = await import('./gclid');
  const clickId = formData.gclid ? { value: String(formData.gclid), type: (formData.clickIdType as string) || 'GCLID' } : getStoredClickId();
  if (clickId && clickId.value && clickId.value.length <= 256) {
    dadosFormulario['gclid'] = clickId.value.trim();
    dadosFormulario['clickIdType'] = clickId.type;
  }

  console.log('🔵 [PORTAL] Dados do formulário preservados:', Object.keys(dadosFormulario));
  
  const ticket: TicketData = {
    id: generateTicketId(),
    codigo: codigo,
    tipoPessoa,
    nomeCompleto: nomeCompleto || 'Não informado',
    cpfSolicitante: cpfSolicitante || '',
    dataNascimento: dataNascimento || '',
    genero: genero || 'Não informado',
    estadoEmissao: estadoEmissao || '',
    cidadeEmissao: cidadeEmissao || '',
    telefone: telefone || '',
    email: email || '',
    tipoCertidao: certificateType || 'Não especificado',
    dominio: 'www.guia-central.online',
    dataCadastro: new Date().toISOString(),
    prioridade,
    status: 'GERAL', // IMPORTANTE: Tickets criados no PORTAL sempre começam com status GERAL
    operador: null,
    dataAtribuicao: null,
    dataConclusao: null,
    historico: [],
    dadosFormulario, // IMPORTANTE: Preserva TODOS os campos do formulário
  };
  
  console.log('🔵 [PORTAL] Ticket final criado:', {
    codigo: ticket.codigo,
    status: ticket.status,
    nomeCompleto: ticket.nomeCompleto,
    prioridade: ticket.prioridade
  });
  
  // Garantir que status seja sempre GERAL para tickets novos
  if (ticket.status !== 'GERAL') {
    console.warn('⚠️ [PORTAL] ATENÇÃO: Status do ticket não é GERAL, corrigindo...', ticket.status);
    ticket.status = 'GERAL';
  }
  
  return ticket;
}

/** Resultado da criação de ticket - inclui flag se falhou sincronização com servidor */
export interface CreateTicketResult {
  ticket: TicketData;
  serverSyncFailed?: boolean;
}

/**
 * Cria um novo ticket no localStorage compartilhado com a PLATAFORMA
 * Retorna { ticket, serverSyncFailed } - serverSyncFailed=true quando POST ao sync-server falhar
 */
export async function createTicket(
  formData: PortalFormData,
  certificateType: string,
  state: string | undefined,
  selectedPlan: SelectedPlan,
  origem?: 'portalcacesso' | 'solicite',
  funnelId?: string
): Promise<CreateTicketResult | null> {
  try {
    const TICKETS_KEY = 'av_tickets';
    
    console.log('🔵 [PORTAL] Criando ticket com dados:', {
      formData,
      certificateType,
      state,
      selectedPlan,
      funnelId
    });
    
    // Criar ticket (aguardar geração de código)
    const newTicket = await mapFormDataToTicket(formData, certificateType, state, selectedPlan, origem, funnelId);
    
    console.log('🔵 [PORTAL] Ticket criado:', newTicket);

    // Buscar tickets existentes
    const stored = localStorage.getItem(TICKETS_KEY);
    let existingTickets: any[] = [];

    if (stored) {
      try {
        existingTickets = JSON.parse(stored);
        if (!Array.isArray(existingTickets)) {
          console.warn('⚠️ [PORTAL] Tickets existentes não são um array, resetando');
          existingTickets = [];
        }
        console.log(`🔵 [PORTAL] Encontrados ${existingTickets.length} tickets existentes`);
      } catch (error) {
        console.error('❌ [PORTAL] Erro ao parsear tickets existentes:', error);
        existingTickets = [];
      }
    } else {
      console.log('🔵 [PORTAL] Nenhum ticket existente encontrado');
    }

    // Adicionar novo ticket
    const updatedTickets = [...existingTickets, newTicket];
    console.log(`🔵 [PORTAL] Total de tickets após adicionar: ${updatedTickets.length}`);

    // Salvar no localStorage (backup)
    localStorage.setItem(TICKETS_KEY, JSON.stringify(updatedTickets));
    const currentVersion = '2';
    localStorage.setItem('av_tickets_version', currentVersion);
    
    // Enviar para servidor de sincronização e AGUARDAR resposta
    // IMPORTANTE: Aguardar resposta antes de retornar
    try {
      console.log('📤 [PORTAL] Enviando ticket para servidor de sincronização...');
      console.log('📤 [PORTAL] URL do servidor:', SYNC_SERVER_URL);
      console.log('📤 [PORTAL] Dados do ticket:', { 
        id: newTicket.id, 
        codigo: newTicket.codigo,
        status: newTicket.status,
        nomeCompleto: newTicket.nomeCompleto
      });
      
      // Garantir que status seja sempre GERAL antes de enviar
      if (newTicket.status !== 'GERAL') {
        console.warn('⚠️ [PORTAL] Corrigindo status do ticket antes de enviar:', newTicket.status, '-> GERAL');
        newTicket.status = 'GERAL';
      }
      
      console.log('📤 [PORTAL] Enviando ticket para servidor:', {
        url: `${SYNC_SERVER_URL}/tickets`,
        codigo: newTicket.codigo,
        status: newTicket.status,
        nomeCompleto: newTicket.nomeCompleto
      });
      
      const response = await fetchWithAuth(`${SYNC_SERVER_URL}/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTicket),
      });
      
      console.log('📤 [PORTAL] Resposta do servidor:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (response.ok) {
        const serverTicket = await response.json();
        console.log('✅ [PORTAL] Ticket enviado para servidor com sucesso!', serverTicket.codigo);
        console.log('✅ [PORTAL] Ticket confirmado no servidor:', { 
          id: serverTicket.id, 
          codigo: serverTicket.codigo,
          status: serverTicket.status
        });
        
        // Verificar se status foi preservado
        if (serverTicket.status !== 'GERAL') {
          console.error('❌ [PORTAL] ERRO CRÍTICO: Status do ticket no servidor é diferente de GERAL:', serverTicket.status);
          console.error('❌ [PORTAL] Esperado: GERAL, Recebido:', serverTicket.status);
        } else {
          console.log('✅ [PORTAL] Status GERAL confirmado no servidor!');
        }
      } else {
        const errorText = await response.text();
        console.error('❌ [PORTAL] Erro ao enviar ticket para servidor:', response.status, errorText);
        console.error('❌ [PORTAL] Ticket não foi criado no servidor, mas foi salvo localmente');
        console.error('❌ [PORTAL] URL tentada:', `${SYNC_SERVER_URL}/tickets`);
        console.error('❌ [PORTAL] Dados enviados:', JSON.stringify(newTicket, null, 2));
        return { ticket: newTicket, serverSyncFailed: true };
      }
    } catch (error) {
      console.error('❌ [PORTAL] Erro ao conectar com servidor de sincronização:', error);
      console.error('❌ [PORTAL] Detalhes do erro:', {
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined
      });
      console.error('❌ [PORTAL] Ticket não foi criado no servidor, mas foi salvo localmente');
      return { ticket: newTicket, serverSyncFailed: true };
    }
    
    console.log('✅ [PORTAL] Ticket salvo no localStorage com sucesso!');

    return { ticket: newTicket };
  } catch (error) {
    console.error('❌ [PORTAL] Erro ao criar ticket:', error);
    return null;
  }
}

/**
 * Atualiza um ticket existente no localStorage
 */
export async function updateTicket(
  ticketId: string,
  updates: Partial<TicketData>
): Promise<boolean> {
  try {
    const TICKETS_KEY = 'av_tickets';
    const stored = localStorage.getItem(TICKETS_KEY);
    
    if (!stored) {
      console.warn('⚠️ [PORTAL] Nenhum ticket encontrado para atualizar');
      return false;
    }

    let tickets: any[] = [];
    try {
      tickets = JSON.parse(stored);
      if (!Array.isArray(tickets)) {
        console.error('❌ [PORTAL] Tickets não são um array');
        return false;
      }
    } catch (error) {
      console.error('❌ [PORTAL] Erro ao parsear tickets:', error);
      return false;
    }

    const ticketIndex = tickets.findIndex((t: any) => t.id === ticketId || t.codigo === ticketId);
    
    if (ticketIndex === -1) {
      console.warn(`⚠️ [PORTAL] Ticket ${ticketId} não encontrado`);
      return false;
    }

    // Atualizar ticket
    const currentTicket = tickets[ticketIndex];
    const updatedTicket = {
      ...currentTicket,
      ...updates
    };

    // Se histórico está sendo atualizado, mesclar com histórico existente
    if (updates.historico && Array.isArray(updates.historico)) {
      const existingHistorico = currentTicket.historico || [];
      updatedTicket.historico = [...existingHistorico, ...updates.historico];
    }

    tickets[ticketIndex] = updatedTicket;

    // Salvar no localStorage (backup)
    localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets));
    const currentVersion = '2';
    localStorage.setItem('av_tickets_version', currentVersion);
    
    // Enviar atualização para servidor de sincronização
    // Primeiro verificar se ticket existe no servidor
    try {
      console.log(`📤 [PORTAL] Verificando se ticket ${ticketId} existe no servidor...`);
      
      // Tentar buscar por ID primeiro
      let ticketExists = false;
      let serverTicketId = ticketId;
      
      try {
        const getResponse = await fetchWithAuth(`${SYNC_SERVER_URL}/tickets/${ticketId}`);
        if (getResponse.ok) {
          ticketExists = true;
          console.log(`✅ [PORTAL] Ticket ${ticketId} encontrado no servidor`);
        } else if (getResponse.status === 404) {
          // Tentar buscar por código
          const ticket = tickets.find((t: any) => t.id === ticketId || t.codigo === ticketId);
          if (ticket && ticket.codigo) {
            console.log(`🔄 [PORTAL] Tentando buscar por código ${ticket.codigo}...`);
            const getByCodeResponse = await fetchWithAuth(`${SYNC_SERVER_URL}/tickets/${ticket.codigo}`);
            if (getByCodeResponse.ok) {
              ticketExists = true;
              serverTicketId = ticket.codigo;
              console.log(`✅ [PORTAL] Ticket encontrado no servidor pelo código ${ticket.codigo}`);
            }
          }
          
          // Se ainda não existe, criar no servidor primeiro
          if (!ticketExists && currentTicket) {
            console.log(`📤 [PORTAL] Ticket não existe no servidor, criando primeiro...`);
            const createResponse = await fetchWithAuth(`${SYNC_SERVER_URL}/tickets`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(currentTicket),
            });
            
            if (createResponse.ok) {
              ticketExists = true;
              console.log(`✅ [PORTAL] Ticket criado no servidor com sucesso!`);
            } else {
              const errorText = await createResponse.text();
              console.error(`❌ [PORTAL] Erro ao criar ticket no servidor:`, createResponse.status, errorText);
            }
          }
        }
      } catch (getError) {
        console.warn('⚠️ [PORTAL] Erro ao verificar ticket no servidor:', getError);
      }
      
      // Agora tentar atualizar
      if (ticketExists) {
        console.log(`📤 [PORTAL] Enviando atualização do ticket ${serverTicketId} para servidor...`);
        const updateResponse = await fetchWithAuth(`${SYNC_SERVER_URL}/tickets/${serverTicketId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        });
        
        if (updateResponse.ok) {
          console.log(`✅ [PORTAL] Atualização enviada para servidor com sucesso!`);
        } else {
          const errorText = await updateResponse.text();
          console.error(`❌ [PORTAL] Erro ao atualizar ticket no servidor:`, updateResponse.status, errorText);
        }
      } else {
        console.warn(`⚠️ [PORTAL] Ticket ${ticketId} não existe no servidor e não foi possível criar`);
      }
    } catch (error) {
      console.error('❌ [PORTAL] Erro ao conectar com servidor de sincronização:', error);
    }
    
    console.log(`✅ [PORTAL] Ticket ${ticketId} atualizado localmente:`, updates);

    return true;
  } catch (error) {
    console.error('❌ [PORTAL] Erro ao atualizar ticket:', error);
    return false;
  }
}

/**
 * Envia confirmação de pagamento (email e WhatsApp) via servidor de sincronização
 */
export async function sendPaymentConfirmation(ticketId: string): Promise<{
  success: boolean;
  email?: { success: boolean; error?: string; alreadySent?: boolean };
  whatsapp?: { success: boolean; error?: string; alreadySent?: boolean };
  error?: string;
}> {
  try {
    console.log(`📧 [PORTAL] Enviando confirmação de pagamento para ticket ${ticketId}...`);
    
    const response = await fetchWithAuth(`${SYNC_SERVER_URL}/tickets/${ticketId}/send-confirmation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ [PORTAL] Confirmação enviada com sucesso:', result);
      return result;
    } else {
      const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
      console.error('❌ [PORTAL] Erro ao enviar confirmação:', response.status, errorData);
      return {
        success: false,
        error: errorData.error || `Erro ${response.status} ao enviar confirmação`
      };
    }
  } catch (error) {
    console.error('❌ [PORTAL] Erro ao conectar com servidor para enviar confirmação:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao enviar confirmação'
    };
  }
}

/**
 * Busca um ticket por ID ou código
 * IMPORTANTE: Para verificação de pagamento, só retorna ticket se existir no SERVIDOR
 */
export async function findTicket(ticketId: string): Promise<TicketData | null> {
  // Tentar buscar no servidor primeiro
  try {
    const response = await fetchWithAuth(`${SYNC_SERVER_URL}/tickets/${ticketId}`);
    if (response.ok) {
      const ticket = await response.json();
      console.log(`✅ [PORTAL] Ticket ${ticketId} encontrado no servidor`);
      return ticket;
    } else if (response.status === 404) {
      // Ticket não existe no servidor - retornar null sem fallback
      console.log(`⚠️ [PORTAL] Ticket ${ticketId} não encontrado no servidor (404)`);
      return null;
    }
  } catch (error) {
    console.warn('⚠️ [PORTAL] Servidor não disponível, buscando no localStorage:', error);
    // Só usar fallback para localStorage se o servidor não estiver disponível (erro de conexão)
    try {
      const TICKETS_KEY = 'av_tickets';
      const stored = localStorage.getItem(TICKETS_KEY);
      
      if (!stored) {
        return null;
      }

      const tickets = JSON.parse(stored);
      if (!Array.isArray(tickets)) {
        return null;
      }

      const ticket = tickets.find((t: any) => t.id === ticketId || t.codigo === ticketId);
      return ticket || null;
    } catch (localError) {
      console.error('❌ [PORTAL] Erro ao buscar ticket no localStorage:', localError);
      return null;
    }
  }
  
  return null;
}

