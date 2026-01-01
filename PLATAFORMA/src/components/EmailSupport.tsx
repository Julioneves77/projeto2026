import React, { useState } from 'react';
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
  ChevronRight
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface Email {
  id: number;
  from: string;
  fromEmail: string;
  subject: string;
  preview: string;
  content: string;
  date: string;
  read: boolean;
  starred: boolean;
  hasAttachment: boolean;
  folder: string;
}

const mockEmails: Email[] = [
  {
    id: 1,
    from: 'João Silva',
    fromEmail: 'joao@cliente.com',
    subject: 'Dúvida sobre certidão criminal',
    preview: 'Olá, gostaria de saber sobre o prazo de entrega da minha certidão...',
    content: `Olá,

Gostaria de saber sobre o prazo de entrega da minha certidão criminal federal que solicitei há 2 dias.

O código do meu pedido é #TK001.

Aguardo retorno.

Atenciosamente,
João Silva`,
    date: '10:30',
    read: false,
    starred: true,
    hasAttachment: false,
    folder: 'inbox'
  },
  {
    id: 2,
    from: 'Maria Oliveira',
    fromEmail: 'maria@empresa.com.br',
    subject: 'Re: Certidão entregue com sucesso',
    preview: 'Muito obrigada pelo atendimento rápido e eficiente...',
    content: `Muito obrigada pelo atendimento rápido e eficiente!

Recebi a certidão no prazo informado e já consegui dar entrada no processo.

Vocês estão de parabéns!

Maria Oliveira`,
    date: '09:15',
    read: true,
    starred: false,
    hasAttachment: true,
    folder: 'inbox'
  },
  {
    id: 3,
    from: 'SendPulse',
    fromEmail: 'noreply@sendpulse.com',
    subject: 'Relatório de envios - Dezembro 2024',
    preview: 'Seu relatório mensal de envios está disponível...',
    content: `Olá,

Seu relatório mensal de envios está disponível.

Total de emails enviados: 1.523
Taxa de entrega: 98.5%
Taxa de abertura: 45.2%

Acesse o painel para mais detalhes.

Equipe SendPulse`,
    date: 'Ontem',
    read: true,
    starred: false,
    hasAttachment: true,
    folder: 'inbox'
  },
  {
    id: 4,
    from: 'Carlos Mendes',
    fromEmail: 'carlos@gmail.com',
    subject: 'Urgente: Problema no pagamento',
    preview: 'Fiz o pagamento via PIX mas ainda não recebi confirmação...',
    content: `Olá,

Fiz o pagamento via PIX há 3 horas mas ainda não recebi a confirmação.

Segue o comprovante em anexo.

Por favor, verificar com urgência.

Carlos Mendes
(11) 99999-8888`,
    date: 'Ontem',
    read: false,
    starred: true,
    hasAttachment: true,
    folder: 'inbox'
  },
  {
    id: 5,
    from: 'Suporte Interno',
    fromEmail: 'suporte@empresasvirtuais.com',
    subject: 'Atualização do sistema agendada',
    preview: 'Informamos que haverá uma atualização do sistema...',
    content: `Prezados,

Informamos que haverá uma atualização do sistema no próximo domingo, das 02h às 06h.

Durante este período, o sistema poderá apresentar instabilidades.

Atenciosamente,
Equipe de Suporte`,
    date: '25/12',
    read: true,
    starred: false,
    hasAttachment: false,
    folder: 'inbox'
  }
];

const menuItems = [
  { id: 'inbox', label: 'Caixa de Entrada', icon: Inbox, count: 12 },
  { id: 'starred', label: 'Favoritos', icon: Star, count: 3 },
  { id: 'sent', label: 'Enviados', icon: Send, count: 0 },
  { id: 'archive', label: 'Arquivados', icon: Archive, count: 0 },
  { id: 'trash', label: 'Lixeira', icon: Trash2, count: 0 },
];

// Exportar contagem de emails não lidos
export function useUnreadEmailsCount() {
  // Em produção, isso viria de uma API real
  const unreadCount = mockEmails.filter(e => !e.read).length;
  return unreadCount;
}

export function EmailSupport() {
  const [selectedFolder, setSelectedFolder] = useState('inbox');
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(mockEmails[0]);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEmails = mockEmails.filter(email => 
    email.folder === selectedFolder &&
    (email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
     email.from.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-card rounded-xl border border-border overflow-hidden">
      {/* Coluna 1: Menu de Pastas */}
      <div className="w-56 border-r border-border bg-muted/30 flex flex-col">
        <div className="p-4">
          <Button className="w-full gap-2" size="sm">
            <Plus className="w-4 h-4" />
            Novo Email
          </Button>
        </div>
        
        <nav className="flex-1 px-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = selectedFolder === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSelectedFolder(item.id)}
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
                {item.count > 0 && (
                  <Badge 
                    variant={isActive ? "secondary" : "outline"} 
                    className="text-xs h-5 min-w-[20px] justify-center"
                  >
                    {item.count}
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="text-xs text-muted-foreground">
            <p>Armazenamento</p>
            <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full w-1/3 bg-primary rounded-full" />
            </div>
            <p className="mt-1">2.3 GB de 15 GB</p>
          </div>
        </div>
      </div>

      {/* Coluna 2: Lista de Emails */}
      <div className="w-80 border-r border-border flex flex-col">
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar emails..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {filteredEmails.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <Mail className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhum email encontrado</p>
            </div>
          ) : (
            filteredEmails.map((email) => (
              <button
                key={email.id}
                onClick={() => setSelectedEmail(email)}
                className={`w-full text-left p-3 border-b border-border transition-colors ${
                  selectedEmail?.id === email.id
                    ? 'bg-primary/10 border-l-2 border-l-primary'
                    : 'hover:bg-muted/50'
                } ${!email.read ? 'bg-muted/30' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {email.starred && (
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                      )}
                      <span className={`text-sm truncate ${!email.read ? 'font-semibold text-foreground' : 'text-foreground'}`}>
                        {email.from}
                      </span>
                    </div>
                    <p className={`text-sm truncate mt-0.5 ${!email.read ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                      {email.subject}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {email.preview}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {email.date}
                    </span>
                    {email.hasAttachment && (
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
        {selectedEmail ? (
          <>
            <div className="p-4 border-b border-border">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    {selectedEmail.subject}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">
                        {selectedEmail.from.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {selectedEmail.from}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selectedEmail.fromEmail}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {selectedEmail.date}
                  </span>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Star className={`w-4 h-4 ${selectedEmail.starred ? 'text-yellow-500 fill-yellow-500' : ''}`} />
                  </Button>
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1 p-6">
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm text-foreground bg-transparent p-0">
                  {selectedEmail.content}
                </pre>
              </div>

              {selectedEmail.hasAttachment && (
                <div className="mt-6 pt-4 border-t border-border">
                  <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                    <Paperclip className="w-4 h-4" />
                    Anexos
                  </p>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg border border-border">
                      <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
                        <span className="text-xs font-semibold text-red-600">PDF</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">documento.pdf</p>
                        <p className="text-xs text-muted-foreground">245 KB</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </ScrollArea>

            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Button className="gap-2">
                  <Send className="w-4 h-4" />
                  Responder
                </Button>
                <Button variant="outline" className="gap-2">
                  <ChevronRight className="w-4 h-4" />
                  Encaminhar
                </Button>
                <Button variant="outline" className="gap-2 ml-auto">
                  <Archive className="w-4 h-4" />
                  Arquivar
                </Button>
                <Button variant="outline" className="gap-2 text-destructive hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                  Excluir
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Mail className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">Selecione um email</p>
              <p className="text-sm">Escolha um email da lista para visualizar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
