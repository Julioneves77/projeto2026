import React, { useState } from 'react';
import { X, Send, Save, Paperclip, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { toast } from '@/hooks/use-toast';

const SYNC_SERVER_URL = import.meta.env.VITE_SYNC_SERVER_URL || 'http://localhost:3001';
const SYNC_SERVER_API_KEY = import.meta.env.VITE_SYNC_SERVER_API_KEY || null;

interface EmailComposeModalProps {
  open: boolean;
  onClose: () => void;
  onSent: () => void;
  initialTo?: string;
  initialSubject?: string;
  initialContent?: string;
}

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers);
  if (SYNC_SERVER_API_KEY) {
    headers.set('X-API-Key', SYNC_SERVER_API_KEY);
  }
  headers.set('Content-Type', 'application/json');
  return fetch(url, { ...options, headers });
}

export function EmailComposeModal({
  open,
  onClose,
  onSent,
  initialTo = '',
  initialSubject = '',
  initialContent = ''
}: EmailComposeModalProps) {
  const [to, setTo] = useState(initialTo);
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState(initialSubject);
  const [content, setContent] = useState(initialContent);
  const [isSending, setIsSending] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [showCcBcc, setShowCcBcc] = useState(false);

  // Configuração do editor Quill
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      ['link'],
      ['clean']
    ],
  };

  const quillFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'color', 'background',
    'link'
  ];

  const handleSend = async () => {
    if (!to.trim() || !subject.trim() || !content.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos obrigatórios (Para, Assunto, Conteúdo)',
        variant: 'destructive'
      });
      return;
    }

    setIsSending(true);
    try {
      const response = await fetchWithAuth(`${SYNC_SERVER_URL}/contact-messages/compose`, {
        method: 'POST',
        body: JSON.stringify({
          to,
          cc: cc.trim() || undefined,
          bcc: bcc.trim() || undefined,
          subject,
          content,
          draft: false
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao enviar email');
      }

      const result = await response.json();
      
      toast({
        title: 'Email enviado',
        description: `Email enviado com sucesso para ${to}`
      });

      // Limpar formulário
      setTo('');
      setCc('');
      setBcc('');
      setSubject('');
      setContent('');
      setShowCcBcc(false);
      
      onSent();
      onClose();
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      toast({
        title: 'Erro ao enviar',
        description: error instanceof Error ? error.message : 'Tente novamente',
        variant: 'destructive'
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!to.trim() || !subject.trim() || !content.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos obrigatórios para salvar rascunho',
        variant: 'destructive'
      });
      return;
    }

    setIsSavingDraft(true);
    try {
      const response = await fetchWithAuth(`${SYNC_SERVER_URL}/contact-messages/compose`, {
        method: 'POST',
        body: JSON.stringify({
          to,
          cc: cc.trim() || undefined,
          bcc: bcc.trim() || undefined,
          subject,
          content,
          draft: true
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao salvar rascunho');
      }

      toast({
        title: 'Rascunho salvo',
        description: 'Rascunho salvo com sucesso'
      });

      onClose();
    } catch (error) {
      console.error('Erro ao salvar rascunho:', error);
      toast({
        title: 'Erro ao salvar',
        description: error instanceof Error ? error.message : 'Tente novamente',
        variant: 'destructive'
      });
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleClose = () => {
    if (content.trim() && (to.trim() || subject.trim())) {
      // Se há conteúdo, perguntar se quer salvar como rascunho
      if (confirm('Deseja salvar como rascunho antes de fechar?')) {
        handleSaveDraft();
        return;
      }
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Novo Email</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Campo Para */}
          <div>
            <Label htmlFor="to">Para *</Label>
            <Input
              id="to"
              type="email"
              placeholder="email@exemplo.com"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Campos CC e BCC (expansíveis) */}
          <div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowCcBcc(!showCcBcc)}
              className="text-xs"
            >
              {showCcBcc ? 'Ocultar' : 'Mostrar'} CC/BCC
            </Button>
            
            {showCcBcc && (
              <div className="mt-2 space-y-2">
                <div>
                  <Label htmlFor="cc">CC</Label>
                  <Input
                    id="cc"
                    type="email"
                    placeholder="cc@exemplo.com"
                    value={cc}
                    onChange={(e) => setCc(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="bcc">BCC</Label>
                  <Input
                    id="bcc"
                    type="email"
                    placeholder="bcc@exemplo.com"
                    value={bcc}
                    onChange={(e) => setBcc(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Campo Assunto */}
          <div>
            <Label htmlFor="subject">Assunto *</Label>
            <Input
              id="subject"
              placeholder="Assunto do email"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Editor de Texto Rico */}
          <div>
            <Label>Mensagem *</Label>
            <div className="mt-1 border border-input rounded-md">
              <ReactQuill
                theme="snow"
                value={content}
                onChange={setContent}
                modules={quillModules}
                formats={quillFormats}
                placeholder="Digite sua mensagem..."
                className="bg-background"
                style={{ minHeight: '300px' }}
              />
            </div>
          </div>
        </div>

        {/* Rodapé com botões */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSaveDraft}
              disabled={isSending || isSavingDraft || !to.trim() || !subject.trim() || !content.trim()}
            >
              {isSavingDraft ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Rascunho
                </>
              )}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSending || isSavingDraft}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSend}
              disabled={isSending || isSavingDraft || !to.trim() || !subject.trim() || !content.trim()}
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


