import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { Ticket, HistoricoItem, TicketStatus } from '@/types';
import { ticketsMock } from '@/data/mockData';
import { safeStorage } from '@/lib/safeStorage';

interface TicketsContextType {
  tickets: Ticket[];
  updateTicket: (id: string, updates: Partial<Ticket>) => Promise<void>;
  deleteTicket: (id: string) => Promise<boolean>;
  addHistorico: (ticketId: string, item: Omit<HistoricoItem, 'id'>) => void;
  atribuirTicket: (ticketId: string, operador: string) => void;
  createTicket: (ticket: Omit<Ticket, 'id' | 'codigo' | 'dataCadastro'>) => Promise<Ticket>;
  pausePolling: () => void;
  resumePolling: () => void;
  refreshTickets: () => Promise<void>;
}

const TicketsContext = createContext<TicketsContextType | undefined>(undefined);

const TICKETS_KEY = 'av_tickets';

// URL do servidor de sincronização - configurável via variável de ambiente
const SYNC_SERVER_URL = import.meta.env.VITE_SYNC_SERVER_URL || 'http://localhost:3001';

// API Key para autenticação (opcional)
const SYNC_SERVER_API_KEY = import.meta.env.VITE_SYNC_SERVER_API_KEY || null;

// Validação em desenvolvimento
if (import.meta.env.DEV && !import.meta.env.VITE_SYNC_SERVER_URL) {
  console.warn('⚠️ [PLATAFORMA] VITE_SYNC_SERVER_URL não está configurada. Usando padrão: http://localhost:3001');
  console.warn('⚠️ [PLATAFORMA] Configure VITE_SYNC_SERVER_URL no arquivo .env.local para produção');
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
  
  return fetch(url, {
    ...options,
    headers,
  });
}

export function TicketsProvider({ children }: { children: ReactNode }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const isPollingPausedRef = useRef(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadTickets = async () => {
    console.log('🟢 [PLATAFORMA] Carregando tickets do servidor de sincronização...');
    console.log(`🟢 [PLATAFORMA] URL: ${SYNC_SERVER_URL}/tickets`);
    
    // Tentar carregar do servidor de sincronização primeiro
    try {
      // Adicionar timestamp para evitar cache
      const url = `${SYNC_SERVER_URL}/tickets?t=${Date.now()}`;
      console.log(`🟢 [PLATAFORMA] Fazendo requisição para: ${url}`);
      
      const response = await fetchWithAuth(url);
      console.log(`🟢 [PLATAFORMA] Resposta do servidor: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const serverTickets = await response.json();
        console.log(`🟢 [PLATAFORMA] Recebidos ${serverTickets.length} tickets do servidor`);
        
        // Log de distribuição por status
        const statusCount: Record<string, number> = {};
        serverTickets.forEach((t: any) => {
          const status = t.status || 'SEM_STATUS';
          statusCount[status] = (statusCount[status] || 0) + 1;
        });
        console.log(`🟢 [PLATAFORMA] Distribuição por status:`, statusCount);
        
        // Log específico de tickets GERAL
        const ticketsGeral = serverTickets.filter((t: any) => t.status === 'GERAL');
        console.log(`🟢 [PLATAFORMA] Tickets com status GERAL: ${ticketsGeral.length}`);
        if (ticketsGeral.length > 0) {
          console.log(`🟢 [PLATAFORMA] Códigos dos tickets GERAL:`, ticketsGeral.map((t: any) => t.codigo).join(', '));
        }
        
        if (Array.isArray(serverTickets) && serverTickets.length > 0) {
          // Converter strings de data de volta para objetos Date
          const ticketsWithDates = serverTickets.map((t: any, index: number) => {
            try {
              if (!t.id || !t.codigo) {
                console.warn(`⚠️ [PLATAFORMA] Ticket ${index} sem id ou codigo:`, t);
                return null;
              }
              
              const historicoLimitado = (t.historico || []).slice(-50).map((h: any) => ({
                ...h,
                dataHora: h.dataHora ? new Date(h.dataHora) : new Date()
              }));

              const ticket = {
                ...t,
                dataCadastro: t.dataCadastro ? new Date(t.dataCadastro) : new Date(),
                dataAtribuicao: t.dataAtribuicao ? new Date(t.dataAtribuicao) : null,
                dataConclusao: t.dataConclusao ? new Date(t.dataConclusao) : null,
                historico: historicoLimitado
              };
              
              return ticket;
            } catch (error) {
              console.error(`❌ [PLATAFORMA] Erro ao processar ticket ${index}:`, error, t);
              return null;
            }
          }).filter((t: any) => t !== null);
          
          console.log(`🟢 [PLATAFORMA] ${ticketsWithDates.length} tickets processados do servidor`);
          setTickets(ticketsWithDates);
          
          // Evitar guardar histórico pesado no localStorage; salvar apenas dados mínimos
          try {
            const compactData = serverTickets.slice(-50).map((t: any) => ({
              id: t.id,
              codigo: t.codigo,
              status: t.status,
              dataCadastro: t.dataCadastro
            }));
            safeStorage.setItem(TICKETS_KEY, JSON.stringify(compactData));
            safeStorage.setItem('av_tickets_version', '3');
          } catch (error: any) {
            if (error?.name === 'QuotaExceededError') {
              safeStorage.removeItem(TICKETS_KEY);
              safeStorage.removeItem('av_tickets_version');
            }
          }
          return;
        }
      }
    } catch (error) {
      console.warn('⚠️ [PLATAFORMA] Servidor de sincronização não disponível, usando localStorage:', error);
    }
    
    // Fallback para localStorage (safeStorage para Safari modo privado)
    const stored = safeStorage.getItem(TICKETS_KEY);
    const storedVersion = safeStorage.getItem('av_tickets_version');
    const currentVersion = '3';
    
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        console.log(`🟢 [PLATAFORMA] Encontrados ${parsed.length} tickets no localStorage`);
        
        if (!Array.isArray(parsed)) {
          console.warn('⚠️ [PLATAFORMA] Dados não são um array, usando mock data');
          setTickets(ticketsMock);
          return;
        }
        
        if (!storedVersion && parsed.length === 0) {
          console.log('🟢 [PLATAFORMA] Sem versão e sem tickets, usando mock data');
          setTickets(ticketsMock);
          return;
        }
        
        const ticketsWithDates = parsed.map((t: any) => {
          try {
            if (!t.id || !t.codigo) return null;
            
            const historicoLimitado = (t.historico || []).slice(-50).map((h: any) => ({
              ...h,
              dataHora: h.dataHora ? new Date(h.dataHora) : new Date()
            }));

            return {
              ...t,
              dataCadastro: t.dataCadastro ? new Date(t.dataCadastro) : new Date(),
              dataAtribuicao: t.dataAtribuicao ? new Date(t.dataAtribuicao) : null,
              dataConclusao: t.dataConclusao ? new Date(t.dataConclusao) : null,
              historico: historicoLimitado
            };
          } catch (error) {
            console.error('❌ [PLATAFORMA] Erro ao processar ticket:', error);
            return null;
          }
        }).filter((t: any) => t !== null);
        
        console.log(`🟢 [PLATAFORMA] ${ticketsWithDates.length} tickets carregados do localStorage`);
        setTickets(ticketsWithDates);
      } catch (error) {
        console.error('❌ [PLATAFORMA] Erro ao parsear tickets:', error);
        setTickets([]);
      }
    } else {
      if (!storedVersion) {
        console.log('🟢 [PLATAFORMA] Nenhum dado salvo, usando mock data');
        setTickets(ticketsMock);
      } else {
        setTickets([]);
      }
    }
  };

  // Função para pausar polling - usando useCallback para evitar recriação
  const pausePolling = useCallback(() => {
    isPollingPausedRef.current = true;
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []); // Dependências vazias - função nunca muda

  // Função para retomar polling - usando useCallback para evitar recriação
  // Nota: loadTickets é estável (não muda entre renders), então não precisa estar nas dependências
  const resumePolling = useCallback(() => {
    isPollingPausedRef.current = false;
    
    // Sempre limpar intervalo existente antes de criar novo (prevenir múltiplos intervalos)
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    // Carregar imediatamente
    loadTickets();
    
    // Criar novo intervalo
    pollingIntervalRef.current = setInterval(() => {
      if (!isPollingPausedRef.current) {
        loadTickets();
      }
    }, 10000); // 10 segundos em vez de 2 segundos
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Dependências vazias - loadTickets é estável e não precisa estar aqui

  useEffect(() => {
    loadTickets();

    // Polling a cada 10 segundos para detectar novos tickets do PORTAL via servidor
    // Reduzido de 2 segundos para melhorar performance
    pollingIntervalRef.current = setInterval(() => {
      if (!isPollingPausedRef.current) {
        loadTickets();
      }
    }, 10000); // 10 segundos em vez de 2000ms

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, []);

  const saveTickets = async (newTickets: Ticket[]) => {
    setTickets(newTickets);
    
    // Salvar no localStorage apenas como cache compacto
    // Limitar dados para evitar quota excedida
    try {
      const compactTickets = newTickets.slice(-50).map(t => ({
        id: t.id,
        codigo: t.codigo,
        status: t.status,
        dataCadastro: t.dataCadastro instanceof Date ? t.dataCadastro.toISOString() : t.dataCadastro,
        dataAtribuicao: t.dataAtribuicao instanceof Date ? t.dataAtribuicao.toISOString() : t.dataAtribuicao,
        dataConclusao: t.dataConclusao instanceof Date ? t.dataConclusao.toISOString() : t.dataConclusao,
        // Limitar histórico para economizar espaço
        historico: (t.historico || []).slice(-5).map(h => ({
          id: h.id,
          dataHora: h.dataHora instanceof Date ? h.dataHora.toISOString() : h.dataHora,
          autor: h.autor,
          statusNovo: h.statusNovo,
          mensagem: h.mensagem?.substring(0, 200) // Limitar tamanho da mensagem
        }))
      }));
      
      safeStorage.setItem(TICKETS_KEY, JSON.stringify(compactTickets));
    } catch (error: any) {
      if (error?.name === 'QuotaExceededError') {
        safeStorage.removeItem(TICKETS_KEY);
        const minimalData = newTickets.slice(-20).map(t => ({
          id: t.id,
          codigo: t.codigo,
          status: t.status
        }));
        safeStorage.setItem(TICKETS_KEY, JSON.stringify(minimalData));
      }
    }
    
    // Sincronizar com servidor (apenas se houver mudanças significativas)
    // Nota: Para atualizações individuais, usar updateTicket que já sincroniza
  };

  const updateTicket = async (id: string, updates: Partial<Ticket>) => {
    const updated = tickets.map(t => t.id === id ? { ...t, ...updates } : t);
    
    // Sincronizar com servidor
    const ticketToUpdate = updated.find(t => t.id === id);
    if (ticketToUpdate) {
      try {
        // Converter datas para ISO strings para o servidor
        const updatesForServer = {
          ...updates,
          dataCadastro: ticketToUpdate.dataCadastro instanceof Date 
            ? ticketToUpdate.dataCadastro.toISOString() 
            : ticketToUpdate.dataCadastro,
          dataAtribuicao: ticketToUpdate.dataAtribuicao instanceof Date 
            ? ticketToUpdate.dataAtribuicao.toISOString() 
            : ticketToUpdate.dataAtribuicao,
          dataConclusao: ticketToUpdate.dataConclusao instanceof Date 
            ? ticketToUpdate.dataConclusao.toISOString() 
            : ticketToUpdate.dataConclusao,
          historico: (ticketToUpdate.historico || []).map(h => ({
            ...h,
            dataHora: h.dataHora instanceof Date ? h.dataHora.toISOString() : h.dataHora
          }))
        };
        
        const response = await fetchWithAuth(`${SYNC_SERVER_URL}/tickets/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatesForServer),
        });
        
        if (response.ok) {
          console.log(`✅ [PLATAFORMA] Ticket ${id} atualizado no servidor`);
        } else {
          console.warn(`⚠️ [PLATAFORMA] Erro ao atualizar ticket no servidor:`, response.status);
        }
      } catch (error) {
        console.warn('⚠️ [PLATAFORMA] Servidor não disponível ao atualizar ticket:', error);
      }
    }
    
    saveTickets(updated);
  };

  const deleteTicket = async (id: string): Promise<boolean> => {
    console.log(`🗑️ [PLATAFORMA] Deletando ticket: ${id}`);
    
    try {
      const response = await fetchWithAuth(`${SYNC_SERVER_URL}/tickets/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ [PLATAFORMA] Ticket deletado:`, result);
        
        // Remover do estado local
        const updated = tickets.filter(t => t.id !== id);
        saveTickets(updated);
        
        return true;
      } else {
        const error = await response.json().catch(() => ({}));
        console.error(`❌ [PLATAFORMA] Erro ao deletar ticket:`, response.status, error);
        return false;
      }
    } catch (error) {
      console.error('❌ [PLATAFORMA] Erro ao conectar com servidor:', error);
      return false;
    }
  };

  const addHistorico = (ticketId: string, item: Omit<HistoricoItem, 'id'>) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;

    // Gerar ID único usando timestamp + índice do histórico + random string
    // Isso garante unicidade mesmo se múltiplos itens forem criados no mesmo milissegundo
    const historicoLength = ticket.historico.length;
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substr(2, 9);
    const uniqueId = `h-${timestamp}-${historicoLength}-${randomStr}`;

    const newItem: HistoricoItem = {
      ...item,
      id: uniqueId
    };

    const updatedHistorico = [...ticket.historico, newItem];
    
    const updates: Partial<Ticket> = {
      historico: updatedHistorico,
      status: item.statusNovo
    };

    if (item.statusNovo === 'CONCLUIDO') {
      updates.dataConclusao = new Date();
    }

    updateTicket(ticketId, updates);
  };

  const atribuirTicket = (ticketId: string, operador: string) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;

    const statusAnterior = ticket.status;
    const statusNovo: TicketStatus = 'EM_ATENDIMENTO';
    
    // Criar item de histórico
    const historicoItem: Omit<HistoricoItem, 'id'> = {
      dataHora: new Date(),
      autor: operador,
      statusAnterior,
      statusNovo,
      mensagem: `Ticket atribuído para ${operador}`
    };

    // Gerar ID único usando timestamp + índice do histórico + random string
    // Isso garante unicidade mesmo se múltiplos tickets forem atribuídos no mesmo milissegundo
    const historicoLength = ticket.historico.length;
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substr(2, 9);
    const uniqueId = `h-${timestamp}-${historicoLength}-${randomStr}`;

    // Adicionar ao histórico existente
    const updatedHistorico = [...(ticket.historico || []), {
      ...historicoItem,
      id: uniqueId
    }];

    // Ao atribuir, mudar status para EM_ATENDIMENTO
    updateTicket(ticketId, {
      operador,
      dataAtribuicao: new Date(),
      status: statusNovo,
      historico: updatedHistorico
    });
  };

  const createTicket = async (ticketData: Omit<Ticket, 'id' | 'codigo' | 'dataCadastro'>): Promise<Ticket> => {
    // Gerar ID único
    const id = `ticket-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Tentar obter código do sync-server primeiro
    let codigo: string;
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
          codigo = data.codigo;
          console.log('✅ [PLATAFORMA] Código gerado pelo sync-server:', codigo);
        } else {
          throw new Error('Código não retornado pelo servidor');
        }
      } else {
        throw new Error(`Erro HTTP ${response.status}`);
      }
    } catch (error) {
      console.warn('⚠️ [PLATAFORMA] Sync-server não disponível, usando fallback local:', error);
      // Fallback para geração local
      const lastCode = tickets.length > 0 ? tickets[tickets.length - 1]?.codigo : 'TK-000';
      const match = lastCode.match(/TK-(\d+)/);
      const lastNumber = match ? parseInt(match[1], 10) : 0;
      const nextNumber = lastNumber + 1;
      codigo = `TK-${nextNumber.toString().padStart(3, '0')}`;
      console.log('⚠️ [PLATAFORMA] Código gerado via fallback local:', codigo);
    }

    const newTicket: Ticket = {
      ...ticketData,
      id,
      codigo,
      dataCadastro: new Date(),
    };

    const updatedTickets = [...tickets, newTicket];
    saveTickets(updatedTickets);
    
    return newTicket;
  };

  const refreshTickets = useCallback(async () => {
    await loadTickets();
  }, []);

  return (
    <TicketsContext.Provider value={{
      tickets,
      updateTicket,
      deleteTicket,
      addHistorico,
      atribuirTicket,
      createTicket,
      pausePolling,
      resumePolling,
      refreshTickets
    }}>
      {children}
    </TicketsContext.Provider>
  );
}

export function useTickets() {
  const context = useContext(TicketsContext);
  if (!context) {
    throw new Error('useTickets must be used within TicketsProvider');
  }
  return context;
}
