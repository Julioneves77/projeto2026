import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Ticket, HistoricoItem, TicketStatus } from '@/types';
import { ticketsMock } from '@/data/mockData';

interface TicketsContextType {
  tickets: Ticket[];
  updateTicket: (id: string, updates: Partial<Ticket>) => void;
  addHistorico: (ticketId: string, item: Omit<HistoricoItem, 'id'>) => void;
  atribuirTicket: (ticketId: string, operador: string) => void;
  createTicket: (ticket: Omit<Ticket, 'id' | 'codigo' | 'dataCadastro'>) => Ticket;
}

const TicketsContext = createContext<TicketsContextType | undefined>(undefined);

const TICKETS_KEY = 'av_tickets';

export function TicketsProvider({ children }: { children: ReactNode }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);

  const loadTickets = () => {
    const stored = localStorage.getItem(TICKETS_KEY);
    const storedVersion = localStorage.getItem('av_tickets_version');
    const currentVersion = '2'; // Incrementar quando mudar mockData
    
    if (stored && storedVersion === currentVersion) {
      const parsed = JSON.parse(stored);
      // Converter strings de data de volta para objetos Date
      const ticketsWithDates = parsed.map((t: any) => ({
        ...t,
        dataCadastro: new Date(t.dataCadastro),
        dataAtribuicao: t.dataAtribuicao ? new Date(t.dataAtribuicao) : null,
        dataConclusao: t.dataConclusao ? new Date(t.dataConclusao) : null,
        historico: (t.historico || []).map((h: any) => ({
          ...h,
          dataHora: new Date(h.dataHora)
        }))
      }));
      setTickets(ticketsWithDates);
    } else {
      setTickets(ticketsMock);
      localStorage.setItem(TICKETS_KEY, JSON.stringify(ticketsMock));
      localStorage.setItem('av_tickets_version', currentVersion);
    }
  };

  useEffect(() => {
    loadTickets();

    // Listener para detectar mudanças no localStorage (quando PORTAL cria novos tickets)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === TICKETS_KEY) {
        loadTickets();
      }
    };

    // Listener para mudanças na mesma janela (quando PORTAL e PLATAFORMA estão na mesma origem)
    const handleStorage = () => {
      loadTickets();
    };

    window.addEventListener('storage', handleStorageChange);
    // Polling a cada 2 segundos para detectar mudanças do PORTAL na mesma origem
    const interval = setInterval(loadTickets, 2000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const saveTickets = (newTickets: Ticket[]) => {
    setTickets(newTickets);
    localStorage.setItem(TICKETS_KEY, JSON.stringify(newTickets));
  };

  const updateTicket = (id: string, updates: Partial<Ticket>) => {
    const updated = tickets.map(t => t.id === id ? { ...t, ...updates } : t);
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
