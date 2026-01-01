/**
 * Serviço para criar tickets no formato da PLATAFORMA
 * Usa servidor de sincronização para integração entre PORTAL e PLATAFORMA
 */

const SYNC_SERVER_URL = 'http://localhost:3001';

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
 */
function generateTicketCode(): string {
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
    
    return `TK-${nextNumber.toString().padStart(3, '0')}`;
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
function mapFormDataToTicket(
  formData: PortalFormData,
  certificateType: string,
  state: string | undefined,
  selectedPlan: SelectedPlan
): TicketData {
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
  
  const estadoEmissao = (
    state || 
    formData.estadoEmissao || 
    formData.estado || 
    formData.estadoSolicitante ||
    ''
  ).toString().trim();
  
  const cidadeEmissao = (
    formData.cidadeEmissao || 
    formData.cidade || 
    formData.cidadeSolicitante ||
    ''
  ).toString().trim();
  
  const telefone = (
    formData.telefone || 
    formData.telefoneSolicitante ||
    ''
  ).toString().trim();
  
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

  const ticket: TicketData = {
    id: generateTicketId(),
    codigo: generateTicketCode(),
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
    dominio: 'portalcertidao.com.br',
    dataCadastro: new Date().toISOString(),
    prioridade,
    status: 'GERAL',
    operador: null,
    dataAtribuicao: null,
    dataConclusao: null,
    historico: [],
  };
  
  console.log('🔵 [PORTAL] Ticket final criado:', ticket);
  
  return ticket;
}

/**
 * Cria um novo ticket no localStorage compartilhado com a PLATAFORMA
 */
export async function createTicket(
  formData: PortalFormData,
  certificateType: string,
  state: string | undefined,
  selectedPlan: SelectedPlan
): Promise<TicketData | null> {
  try {
    const TICKETS_KEY = 'av_tickets';
    
    console.log('🔵 [PORTAL] Criando ticket com dados:', {
      formData,
      certificateType,
      state,
      selectedPlan
    });
    
    // Criar ticket
    const newTicket = mapFormDataToTicket(formData, certificateType, state, selectedPlan);
    
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
      console.log('📤 [PORTAL] Dados do ticket:', { id: newTicket.id, codigo: newTicket.codigo });
      
      const response = await fetch(`${SYNC_SERVER_URL}/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTicket),
      });
      
      if (response.ok) {
        const serverTicket = await response.json();
        console.log('✅ [PORTAL] Ticket enviado para servidor com sucesso!', serverTicket.codigo);
        console.log('✅ [PORTAL] Ticket confirmado no servidor:', { id: serverTicket.id, codigo: serverTicket.codigo });
      } else {
        const errorText = await response.text();
        console.error('❌ [PORTAL] Erro ao enviar ticket para servidor:', response.status, errorText);
        console.error('❌ [PORTAL] Ticket não foi criado no servidor, mas foi salvo localmente');
        // Não bloquear, mas avisar claramente
      }
    } catch (error) {
      console.error('❌ [PORTAL] Erro ao conectar com servidor de sincronização:', error);
      console.error('❌ [PORTAL] Ticket não foi criado no servidor, mas foi salvo localmente');
      // Continuar mesmo se servidor não estiver disponível
    }
    
    console.log('✅ [PORTAL] Ticket salvo no localStorage com sucesso!');

    return newTicket;
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
        const getResponse = await fetch(`${SYNC_SERVER_URL}/tickets/${ticketId}`);
        if (getResponse.ok) {
          ticketExists = true;
          console.log(`✅ [PORTAL] Ticket ${ticketId} encontrado no servidor`);
        } else if (getResponse.status === 404) {
          // Tentar buscar por código
          const ticket = tickets.find((t: any) => t.id === ticketId || t.codigo === ticketId);
          if (ticket && ticket.codigo) {
            console.log(`🔄 [PORTAL] Tentando buscar por código ${ticket.codigo}...`);
            const getByCodeResponse = await fetch(`${SYNC_SERVER_URL}/tickets/${ticket.codigo}`);
            if (getByCodeResponse.ok) {
              ticketExists = true;
              serverTicketId = ticket.codigo;
              console.log(`✅ [PORTAL] Ticket encontrado no servidor pelo código ${ticket.codigo}`);
            }
          }
          
          // Se ainda não existe, criar no servidor primeiro
          if (!ticketExists && currentTicket) {
            console.log(`📤 [PORTAL] Ticket não existe no servidor, criando primeiro...`);
            const createResponse = await fetch(`${SYNC_SERVER_URL}/tickets`, {
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
        const updateResponse = await fetch(`${SYNC_SERVER_URL}/tickets/${serverTicketId}`, {
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
 * Busca um ticket por ID ou código
 */
export async function findTicket(ticketId: string): Promise<TicketData | null> {
  // Tentar buscar no servidor primeiro
  try {
    const response = await fetch(`${SYNC_SERVER_URL}/tickets/${ticketId}`);
    if (response.ok) {
      const ticket = await response.json();
      console.log(`✅ [PORTAL] Ticket ${ticketId} encontrado no servidor`);
      return ticket;
    }
  } catch (error) {
    console.warn('⚠️ [PORTAL] Servidor não disponível, buscando no localStorage:', error);
  }
  
  // Fallback para localStorage
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
  } catch (error) {
    console.error('❌ [PORTAL] Erro ao buscar ticket:', error);
    return null;
  }
}

