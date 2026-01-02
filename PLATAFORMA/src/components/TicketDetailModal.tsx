import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { format, parse, isValid } from 'date-fns';
import { Ticket, TicketStatus, HistoricoItem } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useTickets } from '@/hooks/useTickets';
import { useRespostasProntas } from '@/hooks/useRespostasProntas';
import { useToast } from '@/hooks/use-toast';
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
  Download,
  MessageCircle
} from 'lucide-react';

interface TicketDetailModalProps {
  ticket: Ticket;
  onClose: () => void;
}

type ModalTab = 'dados' | 'interacao' | 'respostas';

// Limites para evitar travamentos com tickets pesados
const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10MB por anexo
const MAX_HISTORICO_RENDER = 50; // renderizar apenas as últimas interações

function TicketDetailModalComponent({ ticket, onClose }: TicketDetailModalProps) {
  // Debug: verificar se componente está sendo renderizado
  console.log('🔍 [TicketDetailModal] Componente renderizado para ticket:', ticket?.codigo);
  
  const { currentUser, userRole } = useAuth();
  const { addHistorico, updateTicket, pausePolling, resumePolling } = useTickets();
  const { respostas, addResposta, updateResposta, deleteResposta } = useRespostasProntas();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<ModalTab>('dados');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
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
  const anexoUrlRef = useRef<string | null>(null);

  // Pausar polling quando modal abre e retomar quando fecha
  // Usando dependências vazias porque pausePolling/resumePolling são estáveis (useCallback)
  useEffect(() => {
    pausePolling();
    return () => {
      resumePolling();
      // Limpar URL de objeto quando componente desmonta
      if (anexoUrlRef.current) {
        URL.revokeObjectURL(anexoUrlRef.current);
        anexoUrlRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Dependências vazias - executar apenas na montagem/desmontagem

  // Limpar URLs de objeto quando anexo muda
  useEffect(() => {
    return () => {
      if (anexoUrlRef.current) {
        URL.revokeObjectURL(anexoUrlRef.current);
        anexoUrlRef.current = null;
      }
    };
  }, [anexo]);

  // Sincronizar novoStatus com ticket.status apenas quando ticket.id muda
  useEffect(() => {
    // Resetar estado quando ticket muda
    setNovoStatus(ticket.status);
    setMensagem('');
    setEnviarEmail(false);
    setAnexo(null);
  }, [ticket.id]);

  // Quando status mudar para CONCLUIDO, marcar checkbox automaticamente
  // Usar useCallback para evitar atualizações desnecessárias
  useEffect(() => {
    if (novoStatus === 'CONCLUIDO' && !enviarEmail) {
      setEnviarEmail(true);
    }
  }, [novoStatus, enviarEmail]);

  // Estabilizar função de visualização de anexo
  const handleViewAnexo = useCallback((anexo: HistoricoItem['anexo']) => {
    setViewingAnexo(anexo);
  }, []);

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

  const handleSaveInteracao = async () => {
    if (isSaving) {
      console.log('⚠️ [PLATAFORMA] Salvamento já em andamento, ignorando clique duplicado');
      return;
    }
    
    if (!mensagem.trim()) {
      toast({
        title: "Atenção",
        description: "Por favor, adicione uma mensagem.",
        variant: "destructive"
      });
      return;
    }

  // Validar tamanho do anexo antes de processar
  if (anexo && anexo.size > MAX_ATTACHMENT_SIZE) {
    toast({
      title: "Anexo muito grande",
      description: "Limite de 10MB por anexo. Envie um arquivo menor.",
      variant: "destructive"
    });
    return;
  }
  
  setIsSaving(true);

    // Preparar anexo para envio (converter para base64 se disponível)
    // Otimizado com timeout para evitar travamento
    let anexoBase64 = null;
    if (anexo) {
      try {
        const reader = new FileReader();
        anexoBase64 = await new Promise((resolve, reject) => {
          // Calcular timeout baseado no tamanho do arquivo
          // Mínimo: 5s, Máximo: 30s, Base: 1s por MB
          const fileSizeMB = anexo.size / (1024 * 1024);
          const calculatedTimeout = Math.max(5000, Math.min(30000, fileSizeMB * 1000));
          console.log(`⏱️ [PLATAFORMA] Timeout calculado para arquivo de ${fileSizeMB.toFixed(2)}MB: ${calculatedTimeout}ms`);
          
          const timeout = setTimeout(() => {
            reader.abort();
            reject(new Error(`Timeout ao converter arquivo (${calculatedTimeout}ms). Arquivo muito grande ou corrompido.`));
          }, calculatedTimeout);
          
          reader.onload = () => {
            clearTimeout(timeout);
            const base64 = reader.result as string;
            // Remover prefixo data:type;base64,
            const base64Data = base64.split(',')[1] || base64;
            resolve({
              nome: anexo.name,
              tipo: anexo.type,
              base64: base64Data
            });
          };
          reader.onerror = () => {
            clearTimeout(timeout);
            reject(new Error('Erro ao ler arquivo'));
          };
          reader.readAsDataURL(anexo);
        });
      } catch (error) {
        console.error('Erro ao converter anexo para base64:', error);
        toast({
          title: "Erro ao processar anexo",
          description: error instanceof Error ? error.message : 'Erro desconhecido ao converter arquivo',
          variant: "destructive"
        });
        setIsSaving(false);
        return;
      }
    }

    // Criar URL de objeto apenas se necessário e armazenar referência para limpeza
    let anexoUrl: string | undefined = undefined;
    if (anexo) {
      // Limpar URL anterior se existir
      if (anexoUrlRef.current) {
        URL.revokeObjectURL(anexoUrlRef.current);
      }
      anexoUrl = URL.createObjectURL(anexo);
      anexoUrlRef.current = anexoUrl;
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
        url: anexoUrl!,
        tipo: anexo.type
      } : undefined
    };

    // Adicionar histórico (isso já atualiza o status do ticket automaticamente)
    console.log(`📝 [PLATAFORMA] Adicionando histórico com status: ${novoStatus}`);
    addHistorico(ticket.id, historicoItem);

    // Aguardar um pouco para garantir que o ticket foi atualizado no servidor
    console.log(`⏳ [PLATAFORMA] Aguardando atualização do ticket...`);
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log(`✅ [PLATAFORMA] Ticket atualizado no estado local`);

    // Se status é CONCLUIDO, enviar notificações
    if (novoStatus === 'CONCLUIDO') {
      try {
        console.log('📧 [PLATAFORMA] Enviando notificações de conclusão...');
        
        // Preparar payload do anexo
        let anexoPayload = null;
        if (anexoBase64) {
          console.log('📎 [PLATAFORMA] Preparando anexo para envio:', {
            nome: anexoBase64.nome,
            tipo: anexoBase64.tipo,
            base64Length: anexoBase64.base64 ? anexoBase64.base64.length : 0
          });
          anexoPayload = anexoBase64;
        } else {
          console.log('⚠️ [PLATAFORMA] Nenhum anexo para enviar');
        }
        
        // Chamar endpoint do sync-server para enviar email/WhatsApp
        console.log('📧 [PLATAFORMA] Enviando requisição para sync-server:', {
          ticketId: ticket.id,
          mensagemLength: mensagem.trim().length,
          anexoPresente: !!anexoPayload
        });
        
        // Usar URL do sync-server configurável
        const SYNC_SERVER_URL = import.meta.env.VITE_SYNC_SERVER_URL || 'http://localhost:3001';
        const SYNC_SERVER_API_KEY = import.meta.env.VITE_SYNC_SERVER_API_KEY || null;
        
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        if (SYNC_SERVER_API_KEY) {
          headers['X-API-Key'] = SYNC_SERVER_API_KEY;
        }
        
        const response = await fetch(`${SYNC_SERVER_URL}/tickets/${ticket.id}/send-completion`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            mensagemInteracao: mensagem.trim(),
            anexo: anexoPayload
          }),
        });
        
        console.log('📧 [PLATAFORMA] Resposta recebida:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        });

        if (response.ok) {
          const result = await response.json();
          console.log('✅ [PLATAFORMA] Notificações enviadas:', result);
          
          const ticketCodigo = result.ticketCodigo || ticket.codigo;
          let description = '';
          
          if (result.email?.success) {
            description += '✅ Email enviado. ';
          } else if (result.email?.error) {
            description += `❌ Erro no email: ${result.email.error}. `;
          }
          
          if (result.whatsapp?.success) {
            description += '✅ WhatsApp enviado.';
          } else if (result.whatsapp?.skipped) {
            description += '⏭️ WhatsApp não enviado (tipo padrão - apenas email).';
          } else if (result.whatsapp?.error) {
            description += `❌ Erro no WhatsApp: ${result.whatsapp.error}.`;
          }
          
          toast({
            title: `Ticket ${ticketCodigo} concluído!`,
            description: description.trim(),
            variant: "default"
          });
        } else {
          let errorData;
          try {
            errorData = await response.json();
          } catch (parseError) {
            errorData = { 
              error: `Erro HTTP ${response.status}: ${response.statusText}`,
              status: response.status,
              statusText: response.statusText
            };
          }
          
          console.error('❌ [PLATAFORMA] Erro ao enviar notificações:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData
          });
          
          const errorMessage = errorData.error || errorData.message || `Erro ${response.status}: ${response.statusText}`;
          const ticketCodigo = errorData.ticketCodigo || ticket.codigo;
          const statusInfo = errorData.currentStatus ? `Status atual: ${errorData.currentStatus}` : '';
          
          toast({
            title: "Erro ao enviar notificações",
            description: `Ticket ${ticketCodigo} concluído, mas houve erro ao enviar notificações: ${errorMessage}${statusInfo ? `. ${statusInfo}` : ''}`,
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('❌ [PLATAFORMA] Erro ao conectar com servidor:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        
        toast({
          title: "Erro de conexão",
          description: `Ticket concluído, mas não foi possível enviar notificações. Erro: ${errorMessage}. Verifique se o sync-server está rodando na porta 3001.`,
          variant: "destructive"
        });
      }
    }

    setIsSaving(false);
    // Limpar URL de objeto antes de fechar
    if (anexoUrlRef.current) {
      URL.revokeObjectURL(anexoUrlRef.current);
      anexoUrlRef.current = null;
    }
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

  const formatDate = useCallback((date: Date | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('pt-BR');
  }, []);

  // Função para filtrar histórico importante (reduzir repetições)
  const filterHistoricoImportante = useCallback((historico: HistoricoItem[]): HistoricoItem[] => {
    const filtered: HistoricoItem[] = [];
    const processedIds = new Set<string>();
    
    for (let i = 0; i < historico.length; i++) {
      const item = historico[i];
      const nextItem = historico[i + 1];
      
      // Sempre incluir se já foi processado (evitar duplicatas)
      if (processedIds.has(item.id)) continue;
      
      // Sempre mostrar mudanças de status reais
      if (item.statusAnterior !== item.statusNovo) {
        filtered.push(item);
        processedIds.add(item.id);
        continue;
      }
      
      // Sempre mostrar se tem mensagem do operador (não é sistema)
      if (item.autor !== 'Sistema' && item.mensagem && item.mensagem.trim()) {
        filtered.push(item);
        processedIds.add(item.id);
        continue;
      }
      
      // Sempre mostrar se tem anexo
      if (item.anexo) {
        filtered.push(item);
        processedIds.add(item.id);
        continue;
      }
      
      // Para entradas do sistema com mesmo status, tentar combinar email + WhatsApp
      if (item.autor === 'Sistema' && item.statusAnterior === item.statusNovo) {
        // Verificar se próximo item é complementar (email + WhatsApp)
        if (nextItem && 
            nextItem.autor === 'Sistema' && 
            nextItem.statusAnterior === nextItem.statusNovo &&
            nextItem.statusAnterior === item.statusAnterior &&
            ((item.enviouEmail && nextItem.enviouWhatsApp) || 
             (item.enviouWhatsApp && nextItem.enviouEmail))) {
          
          // Criar item consolidado
          const consolidated: HistoricoItem = {
            ...item,
            mensagem: item.mensagem.includes('confirmação') 
              ? 'Confirmação de pagamento enviada por email e WhatsApp'
              : item.mensagem.includes('conclusão')
              ? 'Resultado enviado por email e WhatsApp'
              : 'Notificação enviada por email e WhatsApp',
            enviouEmail: item.enviouEmail || nextItem.enviouEmail || false,
            enviouWhatsApp: item.enviouWhatsApp || nextItem.enviouWhatsApp || false
          };
          
          filtered.push(consolidated);
          processedIds.add(item.id);
          processedIds.add(nextItem.id);
          i++; // Pular próximo item
          continue;
        }
        
        // Se não tem complemento, mostrar apenas se for importante
        // Filtrar mensagens muito detalhadas do sistema (mas manter mensagens consolidadas)
        const mensagemSimples = item.mensagem.toLowerCase();
        const ehMensagemConsolidada = mensagemSimples.includes('confirmação de pagamento enviada por') ||
                                      mensagemSimples.includes('resultado enviado por') ||
                                      mensagemSimples.includes('notificação enviada por');
        
        if (!ehMensagemConsolidada && (
            mensagemSimples.includes('email de confirmação enviado para') ||
            mensagemSimples.includes('whatsapp de confirmação enviado para') ||
            mensagemSimples.includes('email de conclusão enviado para') ||
            mensagemSimples.includes('whatsapp de conclusão enviado para'))) {
          // Não incluir - muito detalhado e repetitivo (mas manter consolidadas)
          continue;
        }
        
        // Incluir mensagens consolidadas do backend
        if (ehMensagemConsolidada) {
          filtered.push(item);
          processedIds.add(item.id);
          continue;
        }
      }
      
      // Incluir outros itens por padrão
      filtered.push(item);
      processedIds.add(item.id);
    }
    
    return filtered;
  }, []);

  // Componente memoizado para item do histórico (simplificado)
  const HistoricoItemComponent = React.memo(({ item, onViewAnexo, formatDateFn }: { 
    item: HistoricoItem; 
    onViewAnexo: (anexo: HistoricoItem['anexo']) => void;
    formatDateFn: (date: Date | null) => string;
  }) => {
    const temMudancaStatus = item.statusAnterior !== item.statusNovo;
    const temMensagem = item.mensagem && item.mensagem.trim();
    const temAnexo = !!item.anexo;
    const temNotificacoes = item.enviouEmail || item.enviouWhatsApp;
    
    return (
      <div className="p-2.5 bg-muted/20 rounded border-l-2 border-primary/20 mb-2">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <User className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-xs font-medium text-foreground truncate">{item.autor}</span>
            {temMudancaStatus && (
              <>
                <span className="text-xs text-muted-foreground mx-1">•</span>
                <span className="text-xs status-badge status-progress">{item.statusAnterior}</span>
                <ArrowRight className="w-2.5 h-2.5 text-muted-foreground mx-0.5" />
                <span className={`text-xs status-badge ${item.statusNovo === 'CONCLUIDO' ? 'status-complete' : 'status-progress'}`}>
                  {item.statusNovo}
                </span>
              </>
            )}
            {temNotificacoes && !temMudancaStatus && (
              <>
                <span className="text-xs text-muted-foreground mx-1">•</span>
                <div className="flex items-center gap-1.5">
                  {item.enviouEmail && (
                    <span className="inline-flex items-center gap-0.5 text-primary" title="E-mail enviado">
                      <Mail className="w-3 h-3" />
                    </span>
                  )}
                  {item.enviouWhatsApp && (
                    <span className="inline-flex items-center gap-0.5 text-green-600" title="WhatsApp enviado">
                      <MessageCircle className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
            <Clock className="w-3 h-3" />
            <span>{formatDateFn(item.dataHora)}</span>
          </div>
        </div>
        {temMensagem && (
          <p className="text-xs text-foreground/90 mb-1">{item.mensagem}</p>
        )}
        {temAnexo && (
          <button
            onClick={() => onViewAnexo(item.anexo)}
            className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Paperclip className="w-3 h-3" />
            {item.anexo.nome}
          </button>
        )}
      </div>
    );
  });

  HistoricoItemComponent.displayName = 'HistoricoItemComponent';

  // Filtrar e limitar histórico para evitar travas com tickets pesados
  const { historicoLimitado, historicoTruncado, historicoOriginalLength } = useMemo(() => {
    const historico = Array.isArray(ticket.historico) ? ticket.historico : [];
    const historicoFiltrado = filterHistoricoImportante(historico);
    const slice = historicoFiltrado.slice(-MAX_HISTORICO_RENDER);
    const truncated = historicoFiltrado.length > MAX_HISTORICO_RENDER;
    return { 
      historicoLimitado: slice, 
      historicoTruncado: truncated,
      historicoOriginalLength: historico.length
    };
  }, [ticket.historico, filterHistoricoImportante]);

  // Memoizar histórico renderizado apenas quando necessário
  const historicoRenderizado = useMemo(() => {
    if (historicoLimitado.length === 0) {
      return null;
    }
    return historicoLimitado.map((item) => (
      <HistoricoItemComponent 
        key={item.id} 
        item={item} 
        onViewAnexo={handleViewAnexo}
        formatDateFn={formatDate}
      />
    ));
  }, [historicoLimitado, handleViewAnexo, formatDate]);

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
                            <p className="text-sm font-medium text-foreground break-words">{String(campo.value)}</p>
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
                          checked={novoStatus === 'CONCLUIDO' ? true : enviarEmail}
                          onChange={(e) => {
                            // Quando CONCLUIDO, não permitir desmarcar
                            if (novoStatus === 'CONCLUIDO') {
                              return;
                            }
                            setEnviarEmail(e.target.checked);
                          }}
                          disabled={novoStatus !== 'CONCLUIDO'}
                          className="w-4 h-4 rounded border-input text-primary focus:ring-primary disabled:cursor-not-allowed"
                        />
                        <label htmlFor="enviarEmail" className="text-sm text-foreground">
                          Enviar e-mail para o cliente
                          {novoStatus === 'CONCLUIDO' && <span className="text-red-500 ml-1">*</span>}
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
                        disabled={isSaving}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send className="w-5 h-5" />
                        {isSaving ? 'Salvando...' : 'Salvar Atualização'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Histórico de Interações */}
                <div className={ticket.status !== 'CONCLUIDO' ? 'border-t border-border pt-6' : ''}>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Histórico de Interações
                  </h3>
                  {historicoTruncado && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
                      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                        ⚠️ Histórico limitado para melhor performance
                      </p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                        Exibindo as últimas <strong>{MAX_HISTORICO_RENDER}</strong> de <strong>{historicoLimitado.length}</strong> interações importantes
                        {historicoOriginalLength > historicoLimitado.length && (
                          <span> (de <strong>{historicoOriginalLength}</strong> totais - itens repetitivos ocultos)</span>
                        )}
                      </p>
                    </div>
                  )}
                  {!historicoTruncado && historicoLimitado.length > 0 && (
                    <p className="text-xs text-muted-foreground mb-2">
                      Total: <strong>{historicoLimitado.length}</strong> {historicoLimitado.length === 1 ? 'interação importante' : 'interações importantes'}
                      {historicoOriginalLength > historicoLimitado.length && (
                        <span> (de <strong>{historicoOriginalLength}</strong> totais - itens repetitivos ocultos)</span>
                      )}
                    </p>
                  )}
                  <div className="space-y-3">
                    {historicoLimitado.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhuma interação registrada
                      </p>
                    ) : (
                      historicoRenderizado
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

// Otimizar renderização com React.memo
// Função de comparação personalizada: sempre re-renderizar quando ticket mudar
export const TicketDetailModal = React.memo(TicketDetailModalComponent, (prevProps, nextProps) => {
  // Retornar true se props são iguais (não re-renderizar)
  // Retornar false se props são diferentes (re-renderizar)
  // Sempre re-renderizar quando ticket.id mudar ou quando ticket for null/undefined
  if (!prevProps.ticket || !nextProps.ticket) {
    return false; // Re-renderizar se ticket mudou de null para objeto ou vice-versa
  }
  
  const ticketsEqual = prevProps.ticket.id === nextProps.ticket.id;
  const onCloseEqual = prevProps.onClose === nextProps.onClose;
  
  // Se ticket ou onClose mudaram, re-renderizar (retornar false)
  // Se ambos são iguais, não re-renderizar (retornar true)
  return ticketsEqual && onCloseEqual;
});
