import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FileText, Mail, MapPin, Clock, Send, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

export default function Contato() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    assunto: '',
    mensagem: ''
  });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    
    // Simulate sending
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast({
      title: "Mensagem enviada!",
      description: "Retornaremos em breve pelo e-mail informado.",
    });
    
    setFormData({ nome: '', email: '', telefone: '', assunto: '', mensagem: '' });
    setSending(false);
  };

  const contactInfo = [
    {
      icon: Mail,
      title: 'E-mail',
      value: 'contato@suporteonline.com',
      description: 'Resposta em até 24h úteis'
    },
    {
      icon: Clock,
      title: 'Horário de Atendimento',
      value: 'Segunda a Sexta',
      description: '9:00 - 18:00'
    },
    {
      icon: MapPin,
      title: 'Localização',
      value: 'São Paulo, SP',
      description: 'Atendimento remoto em todo Brasil'
    }
  ];

  return (
    <div className="min-h-screen gradient-hero">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">Suporte Online</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Entre em <span className="text-gradient">Contato</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Estamos aqui para ajudar. Envie sua mensagem ou utilize um de nossos canais de atendimento.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-2xl shadow-elevated border border-border/50 p-6 md:p-8"
          >
            <h2 className="text-xl font-semibold text-foreground mb-6">
              Envie sua mensagem
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Nome completo
                  </label>
                  <Input
                    placeholder="Seu nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    E-mail
                  </label>
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Telefone
                  </label>
                  <Input
                    placeholder="(11) 99999-9999"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Assunto
                  </label>
                  <Input
                    placeholder="Assunto da mensagem"
                    value={formData.assunto}
                    onChange={(e) => setFormData({ ...formData, assunto: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Mensagem
                </label>
                <Textarea
                  placeholder="Descreva sua dúvida ou solicitação..."
                  rows={5}
                  value={formData.mensagem}
                  onChange={(e) => setFormData({ ...formData, mensagem: e.target.value })}
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full gradient-primary text-primary-foreground"
                disabled={sending}
              >
                {sending ? (
                  'Enviando...'
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Enviar mensagem
                  </>
                )}
              </Button>
            </form>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <h2 className="text-xl font-semibold text-foreground mb-6">
              Informações de contato
            </h2>
            
            {contactInfo.map((info, index) => (
              <motion.div
                key={info.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="bg-card rounded-xl p-5 shadow-card border border-border/50 flex items-start gap-4 hover:shadow-elevated transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shrink-0">
                  <info.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{info.title}</h3>
                  <p className="text-primary font-medium">{info.value}</p>
                  <p className="text-sm text-muted-foreground">{info.description}</p>
                </div>
              </motion.div>
            ))}

            {/* Additional Info Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-secondary/50 rounded-xl p-5 mt-6"
            >
              <h3 className="font-semibold text-foreground mb-2">
                Precisa de ajuda urgente?
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Para questões urgentes relacionadas ao seu processo, utilize nosso canal prioritário.
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate('/iniciar')}
              >
                Iniciar nova solicitação
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/30 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <a href="/termos-de-uso" className="hover:text-foreground transition-colors">Termos de Uso</a>
              <span>•</span>
              <a href="/politica-de-privacidade" className="hover:text-foreground transition-colors">Política de Privacidade</a>
              <span>•</span>
              <a href="/contato" className="hover:text-foreground transition-colors text-primary">Contato</a>
            </div>
            <p className="text-sm text-muted-foreground">
              Serviço privado de assistência
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
