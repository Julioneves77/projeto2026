import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Ticket, HistoricoItem, TicketStatus } from '@/types';
import { ticketsMock } from '@/data/mockData';

interface TicketsContextType {
  tickets: Ticket[];
  updateTicket: (id: string, updates: Partial<Ticket>) => Promise<void>;
  addHistorico: (ticketId: string, item: Omit<HistoricoItem, 'id'>) => void;
  atribuirTicket: (ticketId: string, operador: string) => void;
  createTicket: (ticket: Omit<Ticket, 'id' | 'codigo' | 'dataCadastro'>) => Ticket;
}

const TicketsContext = createContext<TicketsContextType | undefined>(undefined);

const TICKETS_KEY = 'av_tickets';
const SYNC_SERVER_URL = 'http://localhost:3001';

export function TicketsProvider({ children }: { children: ReactNode }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);

  const loadTickets = async () => {
    console.log('🟢 [PLATAFORMA] Carregando tickets do servidor de sincronização...');
    
    // Tentar carregar do servidor de sincronização primeiro
    try {
      const response = await fetch(`${SYNC_SERVER_URL}/tickets`);
      if (response.ok) {
        const serverTickets = await response.json();
        console.log(`🟢 [PLATAFORMA] Recebidos ${serverTickets.length} tickets do servidor`);
        
        if (Array.isArray(serverTickets) && serverTickets.length > 0) {
          // Converter strings de data de volta para objetos Date
          const ticketsWithDates = serverTickets.map((t: any, index: number) => {
            try {
              if (!t.id || !t.codigo) {
                console.warn(`⚠️ [PLATAFORMA] Ticket ${index} sem id ou codigo:`, t);
                return null;
              }
              
              const ticket = {
                ...t,
                dataCadastro: t.dataCadastro ? new Date(t.dataCadastro) : new Date(),
                dataAtribuicao: t.dataAtribuicao ? new Date(t.dataAtribuicao) : null,
                dataConclusao: t.dataConclusao ? new Date(t.dataConclusao) : null,
                historico: (t.historico || []).map((h: any) => ({
                  ...h,
                  dataHora: h.dataHora ? new Date(h.dataHora) : new Date()
                }))
              };
              
              return ticket;
            } catch (error) {
              console.error(`❌ [PLATAFORMA] Erro ao processar ticket ${index}:`, error, t);
              return null;
            }
          }).filter((t: any) => t !== null);
          
          console.log(`🟢 [PLATAFORMA] ${ticketsWithDates.length} tickets processados do servidor`);
          setTickets(ticketsWithDates);
          
          // Salvar no localStorage como cache
          localStorage.setItem(TICKETS_KEY, JSON.stringify(serverTickets));
          localStorage.setItem('av_tickets_version', '2');
          return;
        }
      }
    } catch (error) {
      console.warn('⚠️ [PLATAFORMA] Servidor de sincronização não disponível, usando localStorage:', error);
    }
    
    // Fallback para localStorage
    const stored = localStorage.getItem(TICKETS_KEY);
    const storedVersion = localStorage.getItem('av_tickets_version');
    const currentVersion = '2';
    
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
            
            return {
              ...t,
              dataCadastro: t.dataCadastro ? new Date(t.dataCadastro) : new Date(),
              dataAtribuicao: t.dataAtribuicao ? new Date(t.dataAtribuicao) : null,
              dataConclusao: t.dataConclusao ? new Date(t.dataConclusao) : null,
              historico: (t.historico || []).map((h: any) => ({
                ...h,
                dataHora: h.dataHora ? new Date(h.dataHora) : new Date()
              }))
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

  useEffect(() => {
    loadTickets();

    // Polling a cada 2 segundos para detectar novos tickets do PORTAL via servidor
    const interval = setInterval(() => {
      loadTickets();
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const saveTickets = async (newTickets: Ticket[]) => {
    setTickets(newTickets);
    
    // Salvar no localStorage (cache)
    const ticketsAsJson = newTickets.map(t => ({
      ...t,
      dataCadastro: t.dataCadastro instanceof Date ? t.dataCadastro.toISOString() : t.dataCadastro,
      dataAtribuicao: t.dataAtribuicao instanceof Date ? t.dataAtribuicao.toISOString() : t.dataAtribuicao,
      dataConclusao: t.dataConclusao instanceof Date ? t.dataConclusao.toISOString() : t.dataConclusao,
      historico: (t.historico || []).map(h => ({
        ...h,
        dataHora: h.dataHora instanceof Date ? h.dataHora.toISOString() : h.dataHora
      }))
    }));
    localStorage.setItem(TICKETS_KEY, JSON.stringify(ticketsAsJson));
    
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
        
        const response = await fetch(`${SYNC_SERVER_URL}/tickets/${id}`, {
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

  const addHistorico = (ticketId: string, item: Omit<HistoricoItem, 'id'>) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;

    const newItem: HistoricoItem = {
      ...item,
      id: `h-${Date.now()}`
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
    updateTicket(ticketId, {
      operador,
      dataAtribuicao: new Date(),
      status: 'EM_OPERACAO'
    });
  };

  const createTicket = (ticketData: Omit<Ticket, 'id' | 'codigo' | 'dataCadastro'>): Ticket => {
    // Gerar ID único
    const id = `ticket-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Gerar código sequencial
    const lastCode = tickets.length > 0 ? tickets[tickets.length - 1]?.codigo : 'TK-000';
    const match = lastCode.match(/TK-(\d+)/);
    const lastNumber = match ? parseInt(match[1], 10) : 0;
    const nextNumber = lastNumber + 1;
    const codigo = `TK-${nextNumber.toString().padStart(3, '0')}`;

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

  return (
    <TicketsContext.Provider value={{
      tickets,
      updateTicket,
      addHistorico,
      atribuirTicket,
      createTicket
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
