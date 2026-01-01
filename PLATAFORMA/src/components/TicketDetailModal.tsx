import React, { useState, useRef } from 'react';
import { format, parse, isValid } from 'date-fns';
import { Ticket, TicketStatus, HistoricoItem } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useTickets } from '@/hooks/useTickets';
import { useRespostasProntas } from '@/hooks/useRespostasProntas';
import { 
  X, 
  Copy, 
  Check, 
  FileText, 
  MessageSquare, 
  BookOpen,
  Send,
  Paperclip,
  Mail,
  Clock,
  User,
  ArrowRight,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Download
} from 'lucide-react';

interface TicketDetailModalProps {
  ticket: Ticket;
  onClose: () => void;
}

type ModalTab = 'dados' | 'interacao' | 'respostas';

export function TicketDetailModal({ ticket, onClose }: TicketDetailModalProps) {
  const { currentUser, userRole } = useAuth();
  const { addHistorico } = useTickets();
  const { respostas, addResposta, updateResposta, deleteResposta } = useRespostasProntas();
  
  const [activeTab, setActiveTab] = useState<ModalTab>('dados');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  // Interação state
  const [novoStatus, setNovoStatus] = useState<TicketStatus>(ticket.status);
  const [mensagem, setMensagem] = useState('');
  const [enviarEmail, setEnviarEmail] = useState(false);
  const [anexo, setAnexo] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Respostas state
  const [novaResposta, setNovaResposta] = useState('');
  const [openRespostaMenu, setOpenRespostaMenu] = useState<number | null>(null);
  
  // Anexo viewer
  const [viewingAnexo, setViewingAnexo] = useState<HistoricoItem['anexo'] | null>(null);

  const tabs: { id: ModalTab; label: string; icon: React.ElementType }[] = [
    { id: 'dados', label: 'Dados', icon: FileText },
    { id: 'interacao', label: 'Interação', icon: MessageSquare },
    { id: 'respostas', label: 'Respostas Prontas', icon: BookOpen },
  ];

  const copyToClipboard = async (text: string, fieldId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleSaveInteracao = () => {
    if (!mensagem.trim()) {
      alert('Por favor, adicione uma mensagem.');
      return;
    }

    const historicoItem: Omit<HistoricoItem, 'id'> = {
      dataHora: new Date(),
      autor: currentUser?.nome || 'Sistema',
      statusAnterior: ticket.status,
      statusNovo: novoStatus,
      mensagem: mensagem.trim(),
      enviouEmail: enviarEmail,
      anexo: anexo ? {
        nome: anexo.name,
        url: URL.createObjectURL(anexo),
        tipo: anexo.type
      } : undefined
    };

    addHistorico(ticket.id, historicoItem);
    onClose();
  };

  const handleAddResposta = () => {
    if (!novaResposta.trim()) return;
    addResposta(novaResposta.trim());
    setNovaResposta('');
  };

  const handleEditResposta = (id: number, textoAtual: string) => {
    const novoTexto = prompt('Altere o texto da resposta:', textoAtual);
    if (novoTexto && novoTexto.trim()) {
      updateResposta(id, novoTexto.trim());
    }
    setOpenRespostaMenu(null);
  };

  const handleDeleteResposta = (id: number) => {
    if (confirm('Tem certeza que deseja deletar esta resposta pronta?')) {
      deleteResposta(id);
    }
    setOpenRespostaMenu(null);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('pt-BR');
  };

  const formatBirthDate = (dateStr: string) => {
    if (!dateStr) return '-';
    // Try to parse common formats and convert to dd/MM/yyyy
    const parsedDate = parse(dateStr, 'yyyy-MM-dd', new Date());
    if (isValid(parsedDate)) {
      return format(parsedDate, 'dd/MM/yyyy');
    }
    // If already in dd/MM/yyyy format or other, return as is
    return dateStr;
  };

  const statusOptions: { value: TicketStatus; label: string }[] = [
    { value: 'EM_ATENDIMENTO', label: 'Em atendimento' },
    { value: 'AGUARDANDO_INFO', label: 'Precisa de mais informações' },
    { value: 'FINANCEIRO', label: 'Financeiro' },
    { value: 'CONCLUIDO', label: 'Concluído' },
  ];

  const dadosSolicitacao = [
    { id: 'tipoCertidao', label: 'Tipo de Certidão', value: ticket.tipoCertidao },
    { id: 'estadoEmissao', label: 'Estado da Emissão', value: ticket.estadoEmissao },
    ...(ticket.cidadeEmissao ? [{ id: 'cidadeEmissao', label: 'Cidade da Emissão', value: ticket.cidadeEmissao }] : []),
    { id: 'tipoPessoa', label: 'Tipo de Pessoa', value: ticket.tipoPessoa },
    { id: 'nomeCompleto', label: 'Nome Completo', value: ticket.nomeCompleto },
    { id: 'cpfSolicitante', label: ticket.tipoPessoa === 'CPF' ? 'CPF' : 'CNPJ', value: ticket.cpfSolicitante },
    { id: 'dataNascimento', label: 'Data de Nascimento', value: formatBirthDate(ticket.dataNascimento) },
    { id: 'genero', label: 'Gênero', value: ticket.genero },
    { id: 'telefone', label: 'Telefone (WhatsApp)', value: ticket.telefone },
    { id: 'email', label: 'E-mail', value: ticket.email },
  ];

  const dadosTicket = [
    { id: 'codigo', label: 'Código do Ticket', value: ticket.codigo },
    { id: 'dominio', label: 'Domínio', value: ticket.dominio },
    { id: 'dataCadastro', label: 'Data/Hora de Cadastro', value: formatDate(ticket.dataCadastro) },
    { id: 'prioridade', label: 'Prioridade', value: ticket.prioridade ? 'Sim' : 'Não' },
    { id: 'status', label: 'Status Atual', value: ticket.status },
    { id: 'operador', label: 'Atendente/Operador', value: ticket.operador || '-' },
    { id: 'dataAtribuicao', label: 'Data/Hora da Atribuição', value: formatDate(ticket.dataAtribuicao) },
  ];

  const canAddRespostas = userRole === 'admin' || userRole === 'atendente';
  const canDeleteRespostas = userRole === 'admin';

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div 
          className="modal-content w-full max-w-4xl animate-slide-up"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div>
              <h2 className="text-xl font-bold text-foreground">Ticket {ticket.codigo}</h2>
              <p className="text-sm text-muted-foreground">{ticket.nomeCompleto}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                    activeTab === tab.id
                      ? 'text-primary border-primary'
                      : 'text-muted-foreground border-transparent hover:text-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 max-h-[60vh] scrollbar-thin">
            {/* Tab: Dados */}
            {activeTab === 'dados' && (
              <div className="space-y-6">
                {/* Dados da Solicitação */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                    Dados da Solicitação
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dadosSolicitacao.map((campo) => (
                      <div key={campo.id} className="flex items-start justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground mb-1">{campo.label}</p>
                          <p className="text-sm font-medium text-foreground break-words">{campo.value}</p>
                        </div>
                        <button
                          onClick={() => copyToClipboard(campo.value, campo.id)}
                          className="copy-btn flex-shrink-0 ml-2"
                          title="Copiar valor"
                        >
                          {copiedField === campo.id ? (
                            <Check className="w-4 h-4 text-status-complete" />
                          ) : (
                            <Copy className="w-4 h-4 text-muted-foreground" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dados do Ticket - apenas para admin/financeiro */}
                {userRole !== 'atendente' && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                      Dados do Ticket
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {dadosTicket.map((campo) => (
                        <div key={campo.id} className="flex items-start justify-between p-3 bg-muted/30 rounded-lg">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground mb-1">{campo.label}</p>
                            <p className="text-sm font-medium text-foreground break-words">{campo.value}</p>
                          </div>
                          <button
                            onClick={() => copyToClipboard(String(campo.value), campo.id)}
                            className="copy-btn flex-shrink-0 ml-2"
                            title="Copiar valor"
                          >
                            {copiedField === campo.id ? (
                              <Check className="w-4 h-4 text-status-complete" />
                            ) : (
                              <Copy className="w-4 h-4 text-muted-foreground" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Interação */}
            {activeTab === 'interacao' && (
              <div className="space-y-6">
                {/* Nova Interação */}
                {ticket.status !== 'CONCLUIDO' && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                      Nova Interação
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Próximo Status
                        </label>
                        <select
                          value={novoStatus}
                          onChange={(e) => setNovoStatus(e.target.value as TicketStatus)}
                          className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                        >
                          {statusOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className={`flex items-center gap-2 ${novoStatus !== 'CONCLUIDO' ? 'opacity-50' : ''}`}>
                        <input
                          type="checkbox"
                          id="enviarEmail"
                          checked={novoStatus === 'CONCLUIDO' ? enviarEmail : false}
                          onChange={(e) => setEnviarEmail(e.target.checked)}
                          disabled={novoStatus !== 'CONCLUIDO'}
                          className="w-4 h-4 rounded border-input text-primary focus:ring-primary disabled:cursor-not-allowed"
                        />
                        <label htmlFor="enviarEmail" className="text-sm text-foreground">
                          Enviar e-mail para o cliente
                        </label>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Mensagem
                        </label>
                        <textarea
                          value={mensagem}
                          onChange={(e) => setMensagem(e.target.value)}
                          rows={4}
                          placeholder="Digite sua mensagem..."
                          className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                        />
                      </div>

                      <div>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={(e) => setAnexo(e.target.files?.[0] || null)}
                          className="hidden"
                        />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm text-foreground border border-border rounded-lg hover:bg-muted transition-colors"
                        >
                          <Paperclip className="w-4 h-4" />
                          {anexo ? anexo.name : 'Anexar arquivo'}
                        </button>
                      </div>

                      <button
                        onClick={handleSaveInteracao}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary-hover transition-colors"
                      >
                        <Send className="w-5 h-5" />
                        Salvar Atualização
                      </button>
                    </div>
                  </div>
                )}

                {/* Histórico de Interações */}
                <div className={ticket.status !== 'CONCLUIDO' ? 'border-t border-border pt-6' : ''}>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                    Histórico de Interações
                  </h3>
                  <div className="space-y-3">
                    {ticket.historico.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhuma interação registrada
                      </p>
                    ) : (
                      ticket.historico.map((item) => (
                        <div key={item.id} className="p-4 bg-muted/30 rounded-lg border-l-4 border-primary/30">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm font-medium text-foreground">{item.autor}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {formatDate(item.dataHora)}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mb-2 text-xs">
                            <span className="status-badge status-progress">{item.statusAnterior}</span>
                            <ArrowRight className="w-3 h-3 text-muted-foreground" />
                            <span className={`status-badge ${item.statusNovo === 'CONCLUIDO' ? 'status-complete' : 'status-progress'}`}>
                              {item.statusNovo}
                            </span>
                            {item.enviouEmail && (
                              <span className="inline-flex items-center gap-1 text-primary">
                                <Mail className="w-3 h-3" />
                                E-mail enviado
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-foreground">{item.mensagem}</p>
                          {item.anexo && (
                            <button
                              onClick={() => setViewingAnexo(item.anexo)}
                              className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              <Paperclip className="w-3 h-3" />
                              {item.anexo.nome}
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Respostas Prontas */}
            {activeTab === 'respostas' && (
              <div className="space-y-4">
                {respostas.map((resp) => (
                  <div key={resp.id} className="flex items-start justify-between p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm text-foreground flex-1 mr-4">{resp.texto}</p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => copyToClipboard(resp.texto, `resp-${resp.id}`)}
                        className="copy-btn"
                        title="Copiar resposta"
                      >
                        {copiedField === `resp-${resp.id}` ? (
                          <Check className="w-4 h-4 text-status-complete" />
                        ) : (
                          <Copy className="w-4 h-4 text-muted-foreground" />
                        )}
                      </button>
                      {canAddRespostas && (
                        <div className="relative">
                          <button
                            onClick={() => setOpenRespostaMenu(openRespostaMenu === resp.id ? null : resp.id)}
                            className="p-2 rounded-lg hover:bg-muted transition-colors"
                          >
                            <MoreVertical className="w-4 h-4 text-muted-foreground" />
                          </button>
                          {openRespostaMenu === resp.id && (
                            <div className="absolute right-0 mt-1 w-36 bg-popover border border-border rounded-lg shadow-medium z-50 animate-fade-in">
                              <div className="py-1">
                                <button
                                  onClick={() => handleEditResposta(resp.id, resp.texto)}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted"
                                >
                                  <Pencil className="w-4 h-4" />
                                  Alterar
                                </button>
                                {canDeleteRespostas && (
                                  <button
                                    onClick={() => handleDeleteResposta(resp.id)}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/10"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Deletar
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {canAddRespostas && (
                  <div className="border-t border-border pt-4 mt-4">
                    <h4 className="text-sm font-medium text-foreground mb-3">Adicionar Nova Resposta</h4>
                    <div className="flex gap-2">
                      <textarea
                        value={novaResposta}
                        onChange={(e) => setNovaResposta(e.target.value)}
                        rows={2}
                        placeholder="Digite uma nova resposta pronta..."
                        className="flex-1 px-4 py-2 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                      />
                      <button
                        onClick={handleAddResposta}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary-hover transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Anexo Viewer Modal */}
      {viewingAnexo && (
        <div className="fixed inset-0 bg-foreground/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setViewingAnexo(null)}>
          <div className="bg-card rounded-2xl shadow-strong max-w-[80vw] max-h-[80vh] overflow-hidden animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <span className="font-medium text-foreground">{viewingAnexo.nome}</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={viewingAnexo.url}
                  download={viewingAnexo.nome}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <Download className="w-5 h-5 text-muted-foreground" />
                </a>
                <button
                  onClick={() => setViewingAnexo(null)}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </div>
            <div className="p-4 max-h-[70vh] overflow-auto">
              {viewingAnexo.tipo.startsWith('image/') ? (
                <img src={viewingAnexo.url} alt={viewingAnexo.nome} className="max-w-full h-auto" />
              ) : viewingAnexo.tipo === 'application/pdf' ? (
                <iframe src={viewingAnexo.url} className="w-full h-[60vh]" />
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Não é possível visualizar este arquivo.</p>
                  <a
                    href={viewingAnexo.url}
                    download={viewingAnexo.nome}
                    className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg"
                  >
                    <Download className="w-4 h-4" />
                    Baixar Arquivo
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close resposta menu */}
      {openRespostaMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setOpenRespostaMenu(null)}
        />
      )}
    </>
  );
}
