import React, { useState, useEffect, useCallback } from 'react';
import { 
  Mail, 
  Inbox, 
  Send, 
  Star, 
  Trash2, 
  Archive,
  Search,
  Plus,
  Paperclip,
  Clock,
  ChevronRight,
  RefreshCw,
  X,
  Loader2,
  HardDrive
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { EmailComposeModal } from './EmailComposeModal';

// URL do servidor de sincronização
const SYNC_SERVER_URL = import.meta.env.VITE_SYNC_SERVER_URL || 'http://localhost:3001';
const SYNC_SERVER_API_KEY = import.meta.env.VITE_SYNC_SERVER_API_KEY || null;

interface ContactMessage {
  id: string;
  type: 'received' | 'sent';
  from: string;
  fromEmail: string;
  to?: string;
  toEmail?: string;
  phone?: string;
  subject: string;
  preview: string;
  content: string;
  read: boolean;
  starred: boolean;
  archived: boolean;
  deleted: boolean;
  hasAttachment: boolean;
  createdAt: string;
  replies?: Reply[];
  lastReplyAt?: string;
  replyTo?: string;
}

interface Reply {
  id: string;
  content: string;
  subject: string;
  operador: string;
  sentAt: string;
  emailSent: boolean;
}

interface Stats {
  inbox: number;
  unread: number;
  starred: number;
  sent: number;
  archive: number;
  trash: number;
}

interface StorageStats {
  used: number;
  capacity: number;
  percentage: number;
  messagesCount: number;
  formatted: {
    used: string;
    capacity: string;
    available: string;
  };
}

const menuItems = [
  { id: 'inbox', label: 'Caixa de Entrada', icon: Inbox },
  { id: 'unread', label: 'Não lidos', icon: Mail },
  { id: 'starred', label: 'Favoritos', icon: Star },
  { id: 'sent', label: 'Enviados', icon: Send },
  { id: 'archive', label: 'Arquivados', icon: Archive },
  { id: 'trash', label: 'Lixeira', icon: Trash2 },
];

// Helper para fazer requisições autenticadas
async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers);
  if (SYNC_SERVER_API_KEY) {
    headers.set('X-API-Key', SYNC_SERVER_API_KEY);
  }
  headers.set('Content-Type', 'application/json');
  return fetch(url, { ...options, headers });
}

// Hook para contagem de emails não lidos (exportado para o Header)
export function useUnreadEmailsCount() {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetchWithAuth(`${SYNC_SERVER_URL}/contact-messages/stats`);
        if (response.ok) {
          const stats = await response.json();
          setCount(stats.unread || 0);
        }
      } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
      }
    };
    
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Atualizar a cada 30 segundos
    
    return () => clearInterval(interval);
  }, []);
  
  return count;
}

export function EmailSupport() {
  const [selectedFolder, setSelectedFolder] = useState('inbox');
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState<Stats>({ inbox: 0, unread: 0, starred: 0, sent: 0, archive: 0, trash: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);

  // Buscar mensagens
  const fetchMessages = useCallback(async () => {
    try {
      const response = await fetchWithAuth(`${SYNC_SERVER_URL}/contact-messages?folder=${selectedFolder}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
    }
  }, [selectedFolder]);

  // Buscar estatísticas
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetchWithAuth(`${SYNC_SERVER_URL}/contact-messages/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    }
  }, []);

  // Buscar estatísticas de armazenamento
  const fetchStorageStats = useCallback(async () => {
    try {
      const response = await fetchWithAuth(`${SYNC_SERVER_URL}/contact-messages/storage-stats`);
      if (response.ok) {
        const data = await response.json();
        setStorageStats(data);
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas de armazenamento:', error);
    }
  }, []);

  // Carregar dados iniciais
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchMessages(), fetchStats(), fetchStorageStats()]);
      setIsLoading(false);
    };
    loadData();
  }, [fetchMessages, fetchStats, fetchStorageStats]);

  // Polling para atualizar mensagens
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMessages();
      fetchStats();
      fetchStorageStats();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchMessages, fetchStats, fetchStorageStats]);

  // Marcar como lida ao selecionar
  const handleSelectMessage = async (message: ContactMessage) => {
    setSelectedMessage(message);
    setIsReplying(false);
    setReplyContent('');
    
    if (!message.read) {
      try {
        await fetchWithAuth(`${SYNC_SERVER_URL}/contact-messages/${message.id}`, {
          method: 'PUT',
          body: JSON.stringify({ read: true }),
        });
        setMessages(prev => prev.map(m => m.id === message.id ? { ...m, read: true } : m));
        fetchStats();
      } catch (error) {
        console.error('Erro ao marcar como lida:', error);
      }
    }
  };

  // Toggle favorito
  const handleToggleStar = async (message: ContactMessage, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await fetchWithAuth(`${SYNC_SERVER_URL}/contact-messages/${message.id}`, {
        method: 'PUT',
        body: JSON.stringify({ starred: !message.starred }),
      });
      setMessages(prev => prev.map(m => m.id === message.id ? { ...m, starred: !m.starred } : m));
      if (selectedMessage?.id === message.id) {
        setSelectedMessage({ ...message, starred: !message.starred });
      }
      fetchStats();
    } catch (error) {
      console.error('Erro ao favoritar:', error);
      toast({ title: 'Erro', description: 'Não foi possível favoritar a mensagem', variant: 'destructive' });
    }
  };

  // Arquivar
  const handleArchive = async (message: ContactMessage) => {
    try {
      await fetchWithAuth(`${SYNC_SERVER_URL}/contact-messages/${message.id}`, {
        method: 'PUT',
        body: JSON.stringify({ archived: true }),
      });
      setMessages(prev => prev.filter(m => m.id !== message.id));
      setSelectedMessage(null);
      fetchStats();
      toast({ title: 'Arquivado', description: 'Mensagem arquivada com sucesso' });
    } catch (error) {
      console.error('Erro ao arquivar:', error);
      toast({ title: 'Erro', description: 'Não foi possível arquivar a mensagem', variant: 'destructive' });
    }
  };

  // Excluir (mover para lixeira)
  const handleDelete = async (message: ContactMessage) => {
    try {
      await fetchWithAuth(`${SYNC_SERVER_URL}/contact-messages/${message.id}`, {
        method: message.deleted ? 'DELETE' : 'PUT',
        body: message.deleted ? undefined : JSON.stringify({ deleted: true }),
      });
      setMessages(prev => prev.filter(m => m.id !== message.id));
      setSelectedMessage(null);
      fetchStats();
      toast({ 
        title: message.deleted ? 'Excluído permanentemente' : 'Movido para lixeira', 
        description: message.deleted ? 'Mensagem excluída permanentemente' : 'Mensagem movida para a lixeira'
      });
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast({ title: 'Erro', description: 'Não foi possível excluir a mensagem', variant: 'destructive' });
    }
  };

  // Enviar resposta
  const handleSendReply = async () => {
    if (!selectedMessage || !replyContent.trim()) return;
    
    setIsSendingReply(true);
    try {
      const response = await fetchWithAuth(`${SYNC_SERVER_URL}/contact-messages/${selectedMessage.id}/reply`, {
        method: 'POST',
        body: JSON.stringify({
          content: replyContent,
          subject: `Re: ${selectedMessage.subject}`,
          operador: 'Administrador', // TODO: pegar do contexto de auth
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao enviar resposta');
      }
      
      const result = await response.json();
      
      // Atualizar mensagem local com a resposta
      setMessages(prev => prev.map(m => 
        m.id === selectedMessage.id 
          ? { ...m, replies: [...(m.replies || []), result.reply], read: true }
          : m
      ));
      
      setSelectedMessage(prev => prev ? {
        ...prev,
        replies: [...(prev.replies || []), result.reply],
        read: true
      } : null);
      
      setReplyContent('');
      setIsReplying(false);
      fetchMessages();
      fetchStats();
      
      toast({ title: 'Resposta enviada', description: 'Email enviado com sucesso para o cliente' });
      
    } catch (error) {
      console.error('Erro ao enviar resposta:', error);
      toast({ 
        title: 'Erro ao enviar', 
        description: error instanceof Error ? error.message : 'Tente novamente',
        variant: 'destructive'
      });
    } finally {
      setIsSendingReply(false);
    }
  };

  // Filtrar mensagens por busca
  const filteredMessages = messages.filter(message =>
    message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem';
    }
    
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando mensagens...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-card rounded-xl border border-border overflow-hidden">
      {/* Coluna 1: Menu de Pastas */}
      <div className="w-56 border-r border-border bg-muted/30 flex flex-col">
        <div className="p-4 space-y-2">
          <Button 
            className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90" 
            size="sm"
            onClick={() => {
              console.log('🟢 [EmailSupport] Clicou em Novo Email');
              setShowComposeModal(true);
            }}
          >
            <Plus className="w-4 h-4" />
            Novo Email
          </Button>
          <Button 
            className="w-full gap-2" 
            size="sm"
            variant="outline"
            onClick={() => {
              fetchMessages();
              fetchStats();
              fetchStorageStats();
            }}
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </Button>
        </div>
        
        <nav className="flex-1 px-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = selectedFolder === item.id;
            const count = stats[item.id as keyof Stats] || 0;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setSelectedFolder(item.id);
                  setSelectedMessage(null);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-1 ${
                  isActive 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {count > 0 && (
                  <Badge 
                    variant={isActive ? "secondary" : "outline"} 
                    className="text-xs h-5 min-w-[20px] justify-center"
                  >
                    {count}
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border space-y-4">
          <div className="text-xs text-muted-foreground">
            <p>Total de mensagens</p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              {stats.inbox + stats.sent + stats.archive}
            </p>
          </div>
          
          {/* Controle de Espaço Usado */}
          {storageStats && (
            <div className="pt-4 border-t border-border">
              <div className="flex items-center gap-2 mb-2">
                <HardDrive className="w-4 h-4 text-muted-foreground" />
                <p className="text-xs font-medium text-foreground">Armazenamento</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {storageStats.formatted.used} / {storageStats.formatted.capacity}
                  </span>
                  <span className={`font-semibold ${
                    storageStats.percentage >= 80 
                      ? 'text-destructive' 
                      : storageStats.percentage >= 60 
                      ? 'text-yellow-600' 
                      : 'text-foreground'
                  }`}>
                    {storageStats.percentage}%
                  </span>
                </div>
                <Progress 
                  value={storageStats.percentage} 
                  className={`h-2 ${
                    storageStats.percentage >= 80 
                      ? '[&>div]:bg-destructive' 
                      : storageStats.percentage >= 60 
                      ? '[&>div]:bg-yellow-600' 
                      : ''
                  }`}
                />
                <p className="text-xs text-muted-foreground">
                  {storageStats.formatted.available} disponível
                </p>
                {storageStats.percentage >= 80 && (
                  <p className="text-xs text-destructive font-medium">
                    ⚠️ Espaço quase esgotado
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Composição */}
      <EmailComposeModal
        open={showComposeModal}
        onClose={() => setShowComposeModal(false)}
        onSent={() => {
          fetchMessages();
          fetchStats();
          fetchStorageStats();
        }}
      />

      {/* Coluna 2: Lista de Emails */}
      <div className="w-80 border-r border-border flex flex-col">
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar mensagens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="p-6 text-center text-muted-foreground">
              <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
              <p className="text-sm">Carregando...</p>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <Mail className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma mensagem encontrada</p>
            </div>
          ) : (
            filteredMessages.map((message) => (
              <button
                key={message.id}
                onClick={() => handleSelectMessage(message)}
                className={`w-full text-left p-3 border-b border-border transition-colors ${
                  selectedMessage?.id === message.id
                    ? 'bg-primary/10 border-l-2 border-l-primary'
                    : 'hover:bg-muted/50'
                } ${!message.read ? 'bg-muted/30' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleToggleStar(message, e)}
                        className="flex-shrink-0"
                      >
                        <Star className={`w-3 h-3 ${message.starred ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`} />
                      </button>
                      <span className={`text-sm truncate ${!message.read ? 'font-semibold text-foreground' : 'text-foreground'}`}>
                        {message.type === 'sent' ? `Para: ${message.to}` : message.from}
                      </span>
                    </div>
                    <p className={`text-sm truncate mt-0.5 ${!message.read ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                      {message.subject}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {message.preview}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(message.createdAt)}
                    </span>
                    {message.hasAttachment && (
                      <Paperclip className="w-3 h-3 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </ScrollArea>
      </div>

      {/* Coluna 3: Conteúdo do Email */}
      <div className="flex-1 flex flex-col">
        {selectedMessage ? (
          <>
            <div className="p-4 border-b border-border">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    {selectedMessage.subject}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">
                        {selectedMessage.from.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {selectedMessage.type === 'sent' ? `Para: ${selectedMessage.to}` : selectedMessage.from}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selectedMessage.type === 'sent' ? selectedMessage.toEmail : selectedMessage.fromEmail}
                        {selectedMessage.phone && ` • ${selectedMessage.phone}`}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(selectedMessage.createdAt).toLocaleString('pt-BR')}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => handleToggleStar(selectedMessage)}
                  >
                    <Star className={`w-4 h-4 ${selectedMessage.starred ? 'text-yellow-500 fill-yellow-500' : ''}`} />
                  </Button>
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1 p-6">
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm text-foreground bg-transparent p-0">
                  {selectedMessage.content}
                </pre>
              </div>

              {/* Histórico de respostas */}
              {selectedMessage.replies && selectedMessage.replies.length > 0 && (
                <div className="mt-6 pt-4 border-t border-border space-y-4">
                  <p className="text-sm font-medium text-muted-foreground">Respostas anteriores:</p>
                  {selectedMessage.replies.map((reply) => (
                    <div key={reply.id} className="bg-muted/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-foreground">{reply.operador}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(reply.sentAt).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <pre className="whitespace-pre-wrap font-sans text-sm text-foreground">
                        {reply.content}
                      </pre>
                    </div>
                  ))}
                </div>
              )}

              {/* Formulário de resposta */}
              {isReplying && selectedMessage.type !== 'sent' && (
                <div className="mt-6 pt-4 border-t border-border">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">Responder para: {selectedMessage.fromEmail}</p>
                      <Button variant="ghost" size="sm" onClick={() => setIsReplying(false)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <Textarea
                      placeholder="Digite sua resposta..."
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      rows={6}
                      className="resize-none"
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsReplying(false)}>
                        Cancelar
                      </Button>
                      <Button 
                        onClick={handleSendReply}
                        disabled={!replyContent.trim() || isSendingReply}
                      >
                        {isSendingReply ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Enviar Resposta
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </ScrollArea>

            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                {selectedMessage.type !== 'sent' && (
                  <Button 
                    className="gap-2"
                    onClick={() => setIsReplying(true)}
                    disabled={isReplying}
                  >
                    <Send className="w-4 h-4" />
                    Responder
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  className="gap-2 ml-auto"
                  onClick={() => handleArchive(selectedMessage)}
                >
                  <Archive className="w-4 h-4" />
                  Arquivar
                </Button>
                <Button 
                  variant="outline" 
                  className="gap-2 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(selectedMessage)}
                >
                  <Trash2 className="w-4 h-4" />
                  {selectedMessage.deleted ? 'Excluir' : 'Lixeira'}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Mail className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">Selecione uma mensagem</p>
              <p className="text-sm">Escolha uma mensagem da lista para visualizar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
