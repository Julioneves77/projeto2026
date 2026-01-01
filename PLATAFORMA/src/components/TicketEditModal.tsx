import React, { useState } from 'react';
import { Ticket, TicketStatus, PrioridadeType, PersonType } from '@/types';
import { useTickets } from '@/hooks/useTickets';
import { X, Save } from 'lucide-react';
import { toast } from 'sonner';

interface TicketEditModalProps {
  ticket: Ticket;
  onClose: () => void;
}

export function TicketEditModal({ ticket, onClose }: TicketEditModalProps) {
  const { updateTicket } = useTickets();
  
  const [formData, setFormData] = useState({
    tipoPessoa: ticket.tipoPessoa,
    nomeCompleto: ticket.nomeCompleto,
    cpfSolicitante: ticket.cpfSolicitante,
    dataNascimento: ticket.dataNascimento,
    genero: ticket.genero,
    estadoEmissao: ticket.estadoEmissao,
    cidadeEmissao: ticket.cidadeEmissao,
    telefone: ticket.telefone,
    email: ticket.email,
    tipoCertidao: ticket.tipoCertidao,
    dominio: ticket.dominio,
    prioridade: ticket.prioridade,
    status: ticket.status,
    operador: ticket.operador || ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    updateTicket(ticket.id, {
      ...formData,
      operador: formData.operador || null
    });
    
    toast.success('Ticket atualizado com sucesso!');
    onClose();
  };

  const statusOptions: { value: TicketStatus; label: string }[] = [
    { value: 'GERAL', label: 'Geral' },
    { value: 'EM_OPERACAO', label: 'Em Operação' },
    { value: 'EM_ATENDIMENTO', label: 'Em Atendimento' },
    { value: 'AGUARDANDO_INFO', label: 'Aguardando Info' },
    { value: 'FINANCEIRO', label: 'Financeiro' },
    { value: 'CONCLUIDO', label: 'Concluído' },
  ];

  const prioridadeOptions: { value: PrioridadeType; label: string }[] = [
    { value: 'padrao', label: 'Padrão' },
    { value: 'prioridade', label: 'Prioridade' },
    { value: 'premium', label: 'Premium' },
  ];

  const tipoPessoaOptions: { value: PersonType; label: string }[] = [
    { value: 'CPF', label: 'CPF' },
    { value: 'CNPJ', label: 'CNPJ' },
  ];

  const generoOptions = ['Masculino', 'Feminino', 'Outro', 'Empresa'];

  const estadoOptions = [
    'Acre', 'Alagoas', 'Amapá', 'Amazonas', 'Bahia', 'Ceará', 'Distrito Federal',
    'Espírito Santo', 'Goiás', 'Maranhão', 'Mato Grosso', 'Mato Grosso do Sul',
    'Minas Gerais', 'Pará', 'Paraíba', 'Paraná', 'Pernambuco', 'Piauí',
    'Rio de Janeiro', 'Rio Grande do Norte', 'Rio Grande do Sul', 'Rondônia',
    'Roraima', 'Santa Catarina', 'São Paulo', 'Sergipe', 'Tocantins'
  ];

  const tipoCertidaoOptions = [
    'Certidão Negativa Criminal Federal',
    'Certidão Negativa Criminal Estadual',
    'Certidão de Antecedentes Criminais',
    'Certidão Negativa de Débitos',
    'Certidão de Regularidade Fiscal',
    'Certidão de Nascimento',
    'Certidão de Casamento',
    'Certidão de Óbito'
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content w-full max-w-4xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-xl font-bold text-foreground">Alterar Ticket {ticket.codigo}</h2>
            <p className="text-sm text-muted-foreground">Edite todos os campos do ticket</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 max-h-[70vh] overflow-y-auto scrollbar-thin">
          <div className="space-y-6">
            {/* Dados da Solicitação */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                Dados da Solicitação
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Tipo de Certidão</label>
                  <select
                    name="tipoCertidao"
                    value={formData.tipoCertidao}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  >
                    {tipoCertidaoOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Estado da Emissão</label>
                  <select
                    name="estadoEmissao"
                    value={formData.estadoEmissao}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  >
                    {estadoOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Cidade da Emissão</label>
                  <input
                    type="text"
                    name="cidadeEmissao"
                    value={formData.cidadeEmissao}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Tipo de Pessoa</label>
                  <select
                    name="tipoPessoa"
                    value={formData.tipoPessoa}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  >
                    {tipoPessoaOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-1">Nome Completo</label>
                  <input
                    type="text"
                    name="nomeCompleto"
                    value={formData.nomeCompleto}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    {formData.tipoPessoa === 'CPF' ? 'CPF' : 'CNPJ'}
                  </label>
                  <input
                    type="text"
                    name="cpfSolicitante"
                    value={formData.cpfSolicitante}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Data de Nascimento</label>
                  <input
                    type="date"
                    name="dataNascimento"
                    value={formData.dataNascimento}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Gênero</label>
                  <select
                    name="genero"
                    value={formData.genero}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  >
                    {generoOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Telefone (WhatsApp)</label>
                  <input
                    type="text"
                    name="telefone"
                    value={formData.telefone}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-1">E-mail</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
              </div>
            </div>

            {/* Dados do Ticket */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                Dados do Ticket
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Domínio</label>
                  <input
                    type="text"
                    name="dominio"
                    value={formData.dominio}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Prioridade</label>
                  <select
                    name="prioridade"
                    value={formData.prioridade}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  >
                    {prioridadeOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  >
                    {statusOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Operador/Atendente</label>
                  <input
                    type="text"
                    name="operador"
                    value={formData.operador}
                    onChange={handleChange}
                    placeholder="Nome do operador"
                    className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-foreground border border-border rounded-xl hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-xl hover:bg-primary-hover transition-colors"
            >
              <Save className="w-4 h-4" />
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
