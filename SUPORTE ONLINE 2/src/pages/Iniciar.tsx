import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PrivateDocumentPreview } from '@/components/PrivateDocumentPreview';
import { ProgressBar } from '@/components/ProgressBar';
import { StatusChip } from '@/components/StatusChip';
import { saveUserData, saveMeta, generateProtocolo, formatCPF, formatCNPJ, formatPhone, validateCPF, validateCNPJ, UF_LIST, type UserData } from '@/lib/storage';
import { createTicket } from '@/lib/ticketService';
// Valida nome completo (pelo menos 2 nomes)
const validateFullName = (name: string): boolean => {
  const trimmed = name.trim();
  const names = trimmed.split(/\s+/).filter(n => n.length >= 2);
  return names.length >= 2;
};

// Validação mais rigorosa de email
const validateEmail = (email: string): boolean => {
  if (!email || email.trim().length === 0) return false;
  // Regex mais rigoroso que exige formato completo de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailRegex.test(email)) return false;
  // Garante que não há espaços e que tem pelo menos um caractere antes e depois do @
  const parts = email.split('@');
  if (parts.length !== 2) return false;
  if (parts[0].length < 1 || parts[1].length < 3) return false;
  // Garante que tem pelo menos um ponto após o @ e domínio válido
  const domainParts = parts[1].split('.');
  if (domainParts.length < 2 || domainParts[domainParts.length - 1].length < 2) return false;
  return true;
};

const formSchema = z.object({
  uf: z.string().min(1, 'Selecione o estado'),
  tipoPessoa: z.string().min(1, 'Selecione o tipo'),
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').refine(validateFullName, 'Informe nome e sobrenome'),
  cpf: z.string().optional(),
  cnpj: z.string().optional(),
  whatsapp: z.string().min(14, 'WhatsApp inválido'),
  email: z.string().refine(validateEmail, 'E-mail inválido')
}).refine(data => {
  if (data.tipoPessoa === 'Pessoa Física') {
    return data.cpf && validateCPF(data.cpf);
  }
  if (data.tipoPessoa === 'Pessoa Jurídica') {
    return data.cnpj && validateCNPJ(data.cnpj);
  }
  return true;
}, {
  message: 'Documento inválido',
  path: ['cpf']
});
type FormData = z.infer<typeof formSchema>;
export default function Iniciar() {
  const navigate = useNavigate();
  const [showPreview, setShowPreview] = useState(false);
  const [protocolo, setProtocolo] = useState('');
  const [showMissingFields, setShowMissingFields] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: {
      errors,
      isValid
    }
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      tipoPessoa: 'Pessoa Física',
      uf: '',
      nome: '',
      cpf: '',
      cnpj: '',
      whatsapp: '',
      email: ''
    }
  });
  const formValues = watch();

  // Generate protocol when user starts typing
  useEffect(() => {
    if ((formValues.nome || formValues.cpf) && !protocolo) {
      setProtocolo(generateProtocolo());
    }
  }, [formValues.nome, formValues.cpf, protocolo]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    };
  }, [typingTimeout]);
  const isPessoaJuridica = formValues.tipoPessoa === 'Pessoa Jurídica';

  // Calculate progress
  const progress = useMemo(() => {
    const docField = isPessoaJuridica ? 'cnpj' : 'cpf';
    const fields = ['uf', 'tipoPessoa', 'nome', docField, 'whatsapp', 'email'];
    const filled = fields.filter(field => {
      const value = formValues[field as keyof FormData];
      return value && value.length > 0;
    }).length;
    return filled / fields.length * 100;
  }, [formValues, isPessoaJuridica]);

  // Status chips
  const statusItems = useMemo(() => {
    const filledCount = Object.values(formValues).filter(Boolean).length;
    return [{
      label: 'Dados capturados',
      status: filledCount >= 2 ? 'done' : 'pending'
    }, {
      label: 'Estrutura do documento',
      status: filledCount >= 4 ? 'done' : filledCount >= 2 ? 'processing' : 'pending'
    }, {
      label: 'Liberação pendente',
      status: 'pending'
    }] as const;
  }, [formValues]);
  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setValue('cpf', formatted, {
      shouldValidate: true
    });
  };
  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCNPJ(e.target.value);
    setValue('cnpj', formatted, {
      shouldValidate: true
    });
  };
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setValue('whatsapp', formatted, {
      shouldValidate: true
    });
  };

  // Get missing fields for feedback
  const missingFields = useMemo(() => {
    const fields: string[] = [];
    if (!formValues.uf) fields.push('Estado');
    if (!formValues.nome || formValues.nome.length < 3 || !validateFullName(formValues.nome)) fields.push('Nome Completo');
    if (isPessoaJuridica) {
      if (!formValues.cnpj || !validateCNPJ(formValues.cnpj)) fields.push('CNPJ');
    } else {
      if (!formValues.cpf || !validateCPF(formValues.cpf)) fields.push('CPF');
    }
    if (!formValues.whatsapp || formValues.whatsapp.length < 14) fields.push('WhatsApp');
    if (!formValues.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues.email)) fields.push('E-mail');
    return fields;
  }, [formValues, isPessoaJuridica]);
  const handleDisabledClick = () => {
    console.log('🔴 [Suporte Online 2] Button clicked, isValid:', isValid, 'missingFields:', missingFields);
    console.log('🔴 [Suporte Online 2] showMissingFields será setado para true');
    if (missingFields.length > 0) {
      setShowMissingFields(true);
      console.log('🔴 [Suporte Online 2] showMissingFields setado para true, campos faltantes:', missingFields);
      toast.error(`Preencha: ${missingFields.join(', ')}`, {
        duration: 4000
      });
      // Hide after 5 seconds
      setTimeout(() => {
        setShowMissingFields(false);
        console.log('🔴 [Suporte Online 2] showMissingFields setado para false após 5 segundos');
      }, 5000);
    } else {
      console.log('🔴 [Suporte Online 2] Nenhum campo faltante encontrado');
    }
  };
  const onSubmit = async (data: FormData) => {
    // Prevenir submissão se o usuário está digitando ou o email está em foco
    if (isTyping || focusedField === 'email' || isSubmitting) {
      console.log('⚠️ [Suporte Online 2] Submissão bloqueada:', {
        isTyping,
        focusedField,
        isSubmitting
      });
      return;
    }
    
    console.log('🚀 [Suporte Online 2] Iniciando submissão do formulário...', {
      nome: data.nome,
      email: data.email,
      tipoPessoa: data.tipoPessoa,
      uf: data.uf
    });
    
    setIsSubmitting(true);
    
    try {
      // Criar ticket na plataforma via sync-server
      console.log('📤 [Suporte Online 2] Criando ticket...');
      const ticket = await createTicket({
        uf: data.uf,
        tipoPessoa: data.tipoPessoa,
        nome: data.nome,
        cpf: data.tipoPessoa === 'Pessoa Física' ? data.cpf || '' : undefined,
        cnpj: data.tipoPessoa === 'Pessoa Jurídica' ? data.cnpj : undefined,
        whatsapp: data.whatsapp,
        email: data.email
      });

      if (!ticket) {
        console.error('❌ [Suporte Online 2] Ticket não foi criado (retornou null)');
        toast.error('Erro ao criar ticket. Verifique se o servidor está rodando e tente novamente.');
        setIsSubmitting(false);
        return;
      }

      console.log('✅ [Suporte Online 2] Ticket criado com sucesso:', {
        id: ticket.id,
        codigo: ticket.codigo
      });

      // Salvar dados localmente como backup
      console.log('💾 [Suporte Online 2] Salvando dados localmente...');
      const userData: UserData = {
        uf: data.uf,
        tipoPessoa: data.tipoPessoa,
        nome: data.nome,
        cpf: data.tipoPessoa === 'Pessoa Física' ? data.cpf || '' : '',
        cnpj: data.tipoPessoa === 'Pessoa Jurídica' ? data.cnpj : undefined,
        whatsapp: data.whatsapp,
        email: data.email
      };
      saveUserData(userData);
      saveMeta({
        protocolo: ticket.codigo,
        createdAt: new Date().toISOString(),
        progress: 78,
        paid: false,
        sentToPlatform: true
      });

      console.log('🔄 [Suporte Online 2] Redirecionando para página PIX...');
      // Redirecionar para página PIX com dados do ticket
      navigate('/pix', {
        state: {
          ticketId: ticket.id,
          ticketCode: ticket.codigo,
          formData: {
            tipoPessoa: data.tipoPessoa === 'Pessoa Física' ? 'fisica' : 'juridica',
            nome: data.nome,
            cpfCnpj: data.tipoPessoa === 'Pessoa Física' ? data.cpf || '' : data.cnpj || '',
            telefone: data.whatsapp,
            email: data.email,
            estado: data.uf
          }
        }
      });
      console.log('✅ [Suporte Online 2] Navegação para PIX concluída');
    } catch (error) {
      // Identificar tipo de erro
      const isNetworkError = error instanceof TypeError && error.message.includes('fetch');
      const isConnectionError = error instanceof Error && (
        error.message.includes('Failed to fetch') ||
        error.message.includes('NetworkError') ||
        error.message.includes('ERR_CONNECTION_REFUSED') ||
        error.message.includes('ERR_NETWORK_CHANGED')
      );
      const isServerError = error instanceof Error && error.message.includes('Erro ao criar ticket no servidor');
      
      console.error('❌ [Suporte Online 2] Erro ao processar solicitação:', {
        error,
        message: error instanceof Error ? error.message : String(error),
        type: isNetworkError || isConnectionError ? 'CONEXÃO' : isServerError ? 'SERVIDOR' : 'DESCONHECIDO',
        stack: error instanceof Error ? error.stack : undefined
      });

      // Mensagem de erro específica baseada no tipo
      let errorMessage = 'Erro ao processar solicitação. Tente novamente.';
      
      if (isNetworkError || isConnectionError) {
        errorMessage = 'Não foi possível conectar ao servidor. Verifique se o sync-server está rodando na porta 3001.';
        console.error('🔴 [Suporte Online 2] Erro de conexão detectado. Sync-server pode não estar rodando.');
      } else if (isServerError) {
        errorMessage = 'Erro no servidor ao criar ticket. Tente novamente em alguns instantes.';
      }
      
      toast.error(errorMessage, {
        duration: 5000
      });
      
      setIsSubmitting(false);
    }
  };

  // Direct submit for mobile overlay (when form is already valid and user is not typing)
  const handleDirectSubmit = () => {
    if (isValid && !isTyping && focusedField !== 'email' && !isSubmitting) {
      // Usar handleSubmit para garantir validação antes de submeter
      handleSubmit(onSubmit)();
    }
  };

  // Dismiss keyboard when form becomes valid on mobile, but only if user is not typing
  useEffect(() => {
    if (isValid && window.innerWidth < 1024 && !isTyping && focusedField === null) {
      // Blur active element to dismiss keyboard only if no field is focused and user is not typing
      const activeElement = document.activeElement as HTMLElement;
      if (activeElement && activeElement.tagName === 'INPUT' && activeElement.type !== 'text' && activeElement.type !== 'email') {
        activeElement.blur();
      }
    }
  }, [isValid, isTyping, focusedField]);

  // Handle typing detection
  const handleTypingStart = () => {
    setIsTyping(true);
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    const timeout = setTimeout(() => {
      setIsTyping(false);
    }, 1000); // Considera que parou de digitar após 1 segundo sem digitação
    setTypingTimeout(timeout);
  };
  return <div className="min-h-screen gradient-hero">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <FileText className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-foreground">Suporte Online</span>
        </div>
      </header>

      {/* Mobile Progress Bar - Always visible */}
      <div className="lg:hidden sticky top-[57px] z-40 bg-background/95 backdrop-blur-sm shadow-md">
        <div className="container mx-auto px-3 py-2">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">
                {progress === 100 ? 'Documento Solicitado' : 'Documento sendo Solicitado'}
              </span>
            </div>
            <span className="text-xs font-medium text-primary">{Math.round(progress)}%</span>
          </div>
          <ProgressBar progress={progress} size="sm" />
        </div>
      </div>

      {/* Mobile Document Overlay - Shows when form is valid and user is not typing */}
      {isValid && !isTyping && focusedField !== 'email' && <motion.div initial={{
      opacity: 0,
      y: -20
    }} animate={{
      opacity: 1,
      y: 0
    }} className="lg:hidden fixed inset-0 top-[100px] z-50 bg-background/98 backdrop-blur-md p-4 overflow-auto">
          <div className="max-w-[360px] mx-auto">
            <h3 className="text-center font-semibold text-foreground mb-4">
              🎉 Documento Pronto!
            </h3>
            <PrivateDocumentPreview userData={formValues} meta={{
          protocolo,
          createdAt: new Date().toISOString()
        }} />
            <div className="relative mt-4">
              <Button 
                type="button" 
                onClick={(e) => {
                  e.preventDefault();
                  // Se não está válido ou está processando, mostrar campos faltantes
                  if (!isValid || isTyping || focusedField === 'email' || isSubmitting) {
                    handleDisabledClick();
                    return;
                  }
                  // Se válido, submeter formulário
                  handleDirectSubmit();
                }} 
                size="lg" 
                className={`w-full gradient-primary text-primary-foreground py-6 text-lg font-semibold ${!isValid || isTyping || focusedField === 'email' || isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}
              >
                Liberar Documento
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              
              <AnimatePresence>
                {showMissingFields && missingFields.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-destructive/10 border border-destructive/30 rounded-lg p-3 z-10"
                  >
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-destructive">Campos obrigatórios:</p>
                        <p className="text-xs text-destructive/80 mt-1">{missingFields.join(' • ')}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <motion.div initial={{
          opacity: 0,
          scale: 0.8
        }} animate={{
          opacity: 1,
          scale: [1, 1.08, 1],
          boxShadow: ["0 0 0 0 rgba(16, 185, 129, 0.7)", "0 0 0 15px rgba(16, 185, 129, 0)", "0 0 0 0 rgba(16, 185, 129, 0)"]
        }} transition={{
          opacity: {
            duration: 0.3
          },
          scale: {
            duration: 0.8,
            repeat: Infinity,
            ease: "easeInOut"
          },
          boxShadow: {
            duration: 1.2,
            repeat: Infinity,
            ease: "easeOut"
          }
        }} onClick={handleDirectSubmit} className="mt-3 bg-gradient-to-r from-emerald-500 to-emerald-400 text-white rounded-lg px-4 py-3 flex items-center justify-center gap-3 shadow-xl border-2 border-white cursor-pointer hover:from-emerald-600 hover:to-emerald-500 transition-colors">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold">Documento Pronto!</p>
                <p className="text-xs opacity-90">Aguardando Liberação Final</p>
              </div>
            </motion.div>
          </div>
        </motion.div>}

      <div className="container mx-auto px-4 py-8 overflow-visible">
        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto overflow-visible">
          {/* Form Column */}
          <motion.div initial={{
          opacity: 0,
          x: -20
        }} animate={{
          opacity: 1,
          x: 0
        }} transition={{
          duration: 0.5
        }} className="overflow-visible">
            <div className="bg-card rounded-2xl shadow-card border border-border/50 p-6 md:p-8 overflow-visible">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-foreground mb-2 text-center">
                  Preencha seus Dados
                </h1>
                <p className="text-muted-foreground text-center">
                   para Solicitar Criminal Federal com Acompanhamento
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 overflow-visible">
                {/* UF */}
                <div className="space-y-2">
                  <Label htmlFor="uf">Estado da Solicitação *</Label>
                  <Select value={formValues.uf} onValueChange={value => setValue('uf', value, {
                  shouldValidate: true
                })}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Selecione o estado" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border border-border">
                      {UF_LIST.map(uf => <SelectItem key={uf} value={uf}>
                          {uf}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                  {errors.uf && <p className="text-xs text-destructive">{errors.uf.message}</p>}
                </div>

                {/* Tipo Pessoa */}
                <div className="space-y-2">
                  <Label htmlFor="tipoPessoa">Tipo de Pessoa</Label>
                  <Select value={formValues.tipoPessoa} onValueChange={value => setValue('tipoPessoa', value, {
                  shouldValidate: true
                })}>
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border border-border">
                      <SelectItem value="Pessoa Física">Pessoa Física</SelectItem>
                      <SelectItem value="Pessoa Jurídica">Pessoa Jurídica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Nome */}
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo *</Label>
                  <Input 
                    {...register('nome')} 
                    id="nome" 
                    placeholder="Digite seu nome completo" 
                    className="bg-background"
                    onFocus={() => {
                      setFocusedField('nome');
                      handleTypingStart();
                    }}
                    onBlur={() => {
                      setTimeout(() => {
                        setFocusedField(null);
                        setIsTyping(false);
                      }, 200);
                    }}
                    onInput={handleTypingStart}
                  />
                  {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
                </div>

                {/* CPF/CNPJ */}
                {isPessoaJuridica ? <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ *</Label>
                    <Input 
                      id="cnpj" 
                      value={formValues.cnpj || ''} 
                      onChange={(e) => {
                        handleCNPJChange(e);
                        handleTypingStart();
                      }}
                      placeholder="00.000.000/0000-00" 
                      className="bg-background"
                      onFocus={() => {
                        setFocusedField('cnpj');
                        handleTypingStart();
                      }}
                      onBlur={() => {
                        setTimeout(() => {
                          setFocusedField(null);
                          setIsTyping(false);
                        }, 200);
                      }}
                    />
                    {errors.cpf && <p className="text-xs text-destructive">CNPJ inválido</p>}
                  </div> : <div className="space-y-2">
                    <Label htmlFor="cpf">CPF *</Label>
                    <Input 
                      id="cpf" 
                      value={formValues.cpf || ''} 
                      onChange={(e) => {
                        handleCPFChange(e);
                        handleTypingStart();
                      }}
                      placeholder="000.000.000-00" 
                      className="bg-background"
                      onFocus={() => {
                        setFocusedField('cpf');
                        handleTypingStart();
                      }}
                      onBlur={() => {
                        setTimeout(() => {
                          setFocusedField(null);
                          setIsTyping(false);
                        }, 200);
                      }}
                    />
                    {errors.cpf && <p className="text-xs text-destructive">{errors.cpf.message}</p>}
                  </div>}

                {/* WhatsApp */}
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp *</Label>
                  <Input 
                    id="whatsapp" 
                    value={formValues.whatsapp} 
                    onChange={(e) => {
                      handlePhoneChange(e);
                      handleTypingStart();
                    }}
                    placeholder="(00) 00000-0000" 
                    className="bg-background"
                    onFocus={() => {
                      setFocusedField('whatsapp');
                      handleTypingStart();
                    }}
                    onBlur={() => {
                      setTimeout(() => {
                        setFocusedField(null);
                        setIsTyping(false);
                      }, 200);
                    }}
                  />
                  {errors.whatsapp && <p className="text-xs text-destructive">{errors.whatsapp.message}</p>}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail *</Label>
                  <Input 
                    {...register('email')} 
                    id="email" 
                    type="email" 
                    placeholder="seu@email.com" 
                    className="bg-background"
                    onFocus={() => {
                      setFocusedField('email');
                      handleTypingStart();
                    }}
                    onBlur={() => {
                      setTimeout(() => {
                        setFocusedField(null);
                        setIsTyping(false);
                      }, 200);
                    }}
                    onInput={handleTypingStart}
                    onKeyDown={(e) => {
                      // Prevenir submit acidental com Enter
                      if (e.key === 'Enter' && !isValid) {
                        e.preventDefault();
                      }
                    }}
                  />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>

                {/* Submit */}
                <div className={`relative overflow-visible ${showMissingFields && missingFields.length > 0 ? 'mb-32' : ''}`}>
                  <Button 
                    type="button"
                    size="lg" 
                    onClick={(e) => {
                      e.preventDefault();
                      // Se não está válido ou está processando, mostrar campos faltantes
                      if (!isValid || isTyping || focusedField === 'email' || isSubmitting) {
                        handleDisabledClick();
                        return;
                      }
                      // Se válido, submeter formulário
                      handleSubmit(onSubmit)();
                    }}
                    className={`w-full gradient-primary text-primary-foreground py-6 text-lg font-semibold shadow-soft hover:shadow-elevated transition-all duration-300 ${!isValid || isTyping || focusedField === 'email' || isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        Liberar Documento
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </>
                    )}
                  </Button>
                  
                  <AnimatePresence mode="wait">
                    {showMissingFields && missingFields.length > 0 && (
                      <motion.div 
                        key="missing-fields-message"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-destructive/10 border-2 border-destructive/50 rounded-lg p-4 z-[100] shadow-xl"
                        style={{ 
                          position: 'absolute',
                          zIndex: 100
                        }}
                      >
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-destructive mb-1">Campos obrigatórios:</p>
                            <p className="text-xs text-destructive/90 font-medium">{missingFields.join(' • ')}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                {isValid && !isTyping && focusedField !== 'email' && <motion.div initial={{
                opacity: 0,
                scale: 0.8
              }} animate={{
                opacity: 1,
                scale: [1, 1.08, 1],
                boxShadow: ["0 0 0 0 rgba(16, 185, 129, 0.7)", "0 0 0 15px rgba(16, 185, 129, 0)", "0 0 0 0 rgba(16, 185, 129, 0)"]
              }} transition={{
                opacity: {
                  duration: 0.3
                },
                scale: {
                  duration: 0.8,
                  repeat: Infinity,
                  ease: "easeInOut"
                },
                boxShadow: {
                  duration: 1.2,
                  repeat: Infinity,
                  ease: "easeOut"
                }
              }} onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (isValid && !isTyping && focusedField !== 'email') {
                  handleSubmit(onSubmit)();
                }
              }} className="bg-gradient-to-r from-emerald-500 to-emerald-400 text-white rounded-lg px-4 py-3 flex items-center gap-3 shadow-xl border-2 border-white cursor-pointer hover:from-emerald-600 hover:to-emerald-500 transition-colors">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-bold">Documento Pronto!</p>
                      <p className="text-xs opacity-90">Aguardando Liberação Final</p>
                    </div>
                  </motion.div>}
              </form>
            </div>
          </motion.div>

          {/* Preview Column - Desktop */}
          <motion.div initial={{
          opacity: 0,
          x: 20
        }} animate={{
          opacity: 1,
          x: 0
        }} transition={{
          duration: 0.5,
          delay: 0.2
        }} className="hidden lg:block">
            <div className="sticky top-24">
              {/* Progress Section */}
              <div className="bg-card rounded-2xl shadow-card border border-border/50 p-6 mb-6">
                <h3 className="font-semibold text-foreground mb-4">Progresso</h3>
                <ProgressBar progress={progress} />
                <div className="flex flex-wrap gap-2 mt-4">
                  {statusItems.map((item, index) => <StatusChip key={item.label} label={item.label} status={item.status} delay={index * 0.1} />)}
                </div>
              </div>

              {/* Document Preview */}
              <div>
                <h3 className="font-semibold text-foreground mb-4">
                  Prévia do Documento Privado
                </h3>
                <PrivateDocumentPreview userData={formValues} meta={{
                protocolo,
                createdAt: new Date().toISOString()
              }} />
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>;
}