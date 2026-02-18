import { useState, useMemo, useRef, useEffect } from "react";
import { useParams, useSearchParams, Link, useNavigate, useLocation } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import FormField from "@/components/forms/FormField";
import SEOHead from "@/components/SEOHead";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { pushDLPortalcacesso } from "@/lib/portalcacessoDataLayer";
import { trackEvent, getFunnelId } from "@/lib/funnelTracker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Info, AlertCircle } from "lucide-react";
import {
  validateCPF,
  validateCNPJ,
  validateEmail,
  validatePhone,
  validateDate,
  formatCPF,
  formatCNPJ,
  formatPhone,
  formatDate,
} from "@/lib/validations";
import {
  COMARCAS_RJ,
  FINALIDADES_RJ,
  CIDADES_SE,
  ESTADOS_BRASIL,
  ESTADOS_CIVIS,
  NACIONALIDADES,
  PAISES,
} from "@/lib/constants";
import { getFormConfig, FormConfig, getAvailableStates } from "@/lib/formConfigs";

// Constantes de preço - atualizado em 05/01/2026
const BASE_PRICE = 39.90;
// Forçar novo build
const BUILD_VERSION = "2026.01.05.2123";

const CertificateForm = () => {
  const { category } = useParams<{ category: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state || {};
  const type = searchParams.get("type") || "";
  const source = searchParams.get("source") || ""; // Capturar origem da URL
  const formRef = useRef<HTMLDivElement>(null);
  
  // Inicializar selectedState com valor do location.state se disponível
  const [selectedState, setSelectedState] = useState<string>(
    (locationState.state && category === "estaduais") ? locationState.state : ""
  );
  
  // Pre-fill tipoCertidao based on URL type parameter for federais and estaduais
  // Prioridade: dados vindos do location.state (volta do pagamento)
  const getInitialFormData = (): Record<string, string | boolean> => {
    // Prioridade: dados vindos do location.state (volta do pagamento)
    if (locationState.formData) {
      return locationState.formData;
    }
    
    // Fallback: preencher baseado no type da URL
    if (type) {
      const typeMapping: Record<string, string> = {
        "criminal": "Criminal",
        "civel": "Cível",
        "eleitoral": "Eleitoral",
      };
      const mappedType = typeMapping[type.toLowerCase()];
      if (mappedType) {
        return { tipoCertidao: mappedType };
      }
    }
    return {};
  };
  
  const [formData, setFormData] = useState<Record<string, string | boolean>>(getInitialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formProgressTracked, setFormProgressTracked] = useState<Set<number>>(new Set());
  const [currentStep, setCurrentStep] = useState(0);

  // Get available states for estaduais category - DEVE VIR ANTES dos useEffect
  const availableStates = useMemo(() => {
    if (category === "estaduais") {
      return getAvailableStates();
    }
    return [];
  }, [category]);

  // Get form config based on category and selected state - DEVE VIR ANTES dos useEffect
  const formConfig = useMemo(() => {
    if (category === "estaduais") {
      if (!selectedState) return null;
      const config = getFormConfig(category, selectedState);
      if (config && type === "civel") {
        return {
          ...config,
          title: config.title.replace("Negativa Criminal", "Negativa Cível"),
        };
      }
      return config;
    }
    return getFormConfig(category || "", type);
  }, [category, type, selectedState]);

  const getCertificateTitle = () => {
    switch (category) {
      case "estaduais":
        if (type === "civel") {
          return "Certidão Negativa Cível Estadual";
        }
        return "Certidão Negativa Criminal Estadual";
      case "federais":
        const tipoCertidao = formData.tipoCertidao as string || type;
        const estadoEmissao = formData.estadoEmissao as string || "";
        
        if (tipoCertidao?.toLowerCase() === "criminal") {
          return "Certidão Negativa Criminal Federal";
        }
        if (tipoCertidao?.toLowerCase() === "eleitoral") {
          const estadoNome = estadoEmissao ? ` (${estadoEmissao})` : "";
          return `Certidão Negativa Eleitoral${estadoNome}`;
        }
        if (tipoCertidao?.toLowerCase() === "cível" || tipoCertidao?.toLowerCase() === "civel") {
          return "Certidão Negativa Cível Federal";
        }
        return `Certidão Negativa ${tipoCertidao || type?.toUpperCase() || ""} Federal`;
      case "policia-federal":
        return "Antecedentes - Polícia Federal";
      case "cnd":
        return "CND - Certidão Negativa de Débitos";
      case "cpf-regular":
        return "Situação Cadastral do CPF";
      default:
        return "Solicitar Certidão";
    }
  };

  // Garantir que a página sempre comece no topo ao carregar
  useEffect(() => {
    // Evento: portal_view - ao carregar página inicial
    trackEvent('portal_view', {
      category: category || '',
      type: type || ''
    });

    // Função para forçar scroll ao topo
    const scrollToTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      // Também tentar scroll no document.documentElement para compatibilidade
      if (document.documentElement) {
        document.documentElement.scrollTop = 0;
      }
      if (document.body) {
        document.body.scrollTop = 0;
      }
    };
    
    // Scroll imediatamente ao montar
    scrollToTop();
    
    // Remover qualquer hash da URL que possa causar scroll automático
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      scrollToTop();
    }
    
    // Garantir scroll no topo após delays progressivos (caso algum elemento cause scroll)
    const timeouts = [
      setTimeout(scrollToTop, 50),
      setTimeout(scrollToTop, 100),
      setTimeout(scrollToTop, 300),
      setTimeout(scrollToTop, 500),
    ];
    
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, []); // Executar apenas uma vez ao montar

  // Evento: form_start - quando usuário começa a preencher formulário
  useEffect(() => {
    if (formConfig && Object.keys(formData).length > 0) {
      // Verificar se é a primeira interação com o formulário
      const hasStarted = Object.values(formData).some(value => 
        value !== '' && value !== false && value !== null && value !== undefined
      );
      
      if (hasStarted) {
        trackEvent('form_start', {
          category: category || '',
          type: type || ''
        });
      }
    }
  }, [formData, formConfig, category, type]);

  // Restaurar selectedState se houver dados vindos do location.state
  useEffect(() => {
    if (locationState.state && category === "estaduais") {
      setSelectedState(locationState.state);
    }
  }, [locationState.state, category]);

  // Disparar evento quando formulário carrega (se origem = portalcacesso)
  useEffect(() => {
    if (formConfig) {
      pushDLPortalcacesso('portalcacesso_form_started', {
        funnel_step: 'form_start',
        certificateType: getCertificateTitle(),
        state: selectedState || undefined,
        category: category || undefined,
        type: type || undefined,
      });
    }
  }, [formConfig, category, type, selectedState]);

  // Calcular progresso do formulário e disparar eventos
  useEffect(() => {
    if (!formConfig) return;

    // Contar campos obrigatórios e preenchidos
    let totalRequired = 0;
    let filledRequired = 0;

    for (const step of formConfig.steps) {
      for (const field of step.fields) {
        if (field.showWhen) {
          const conditionValue = formData[field.showWhen.field];
          if (conditionValue !== field.showWhen.value) {
            continue;
          }
        }

        if (field.required) {
          totalRequired++;
          const value = formData[field.name];
          if (value && (typeof value !== 'string' || value.trim() !== '')) {
            filledRequired++;
          }
        }
      }
    }

    // Calcular percentual de progresso
    const progress = totalRequired > 0 ? Math.round((filledRequired / totalRequired) * 100) : 0;
    const certificateTitle = getCertificateTitle();

    // Disparar eventos de progresso (25%, 50%, 75%)
    if (progress >= 25 && !formProgressTracked.has(25)) {
      pushDLPortalcacesso('portalcacesso_form_progress_25', {
        funnel_step: 'form_progress_25',
        progress: 25,
        certificateType: certificateTitle,
      });
      setFormProgressTracked((prev) => new Set([...prev, 25]));
    }
    if (progress >= 50 && !formProgressTracked.has(50)) {
      pushDLPortalcacesso('portalcacesso_form_progress_50', {
        funnel_step: 'form_progress_50',
        progress: 50,
        certificateType: certificateTitle,
      });
      setFormProgressTracked((prev) => new Set([...prev, 50]));
    }
    if (progress >= 75 && !formProgressTracked.has(75)) {
      pushDLPortalcacesso('portalcacesso_form_progress_75', {
        funnel_step: 'form_progress_75',
        progress: 75,
        certificateType: certificateTitle,
      });
      setFormProgressTracked((prev) => new Set([...prev, 75]));
    }
  }, [formData, formConfig, formProgressTracked, category, type, selectedState]);

  // Show state selector for estaduais
  if (category === "estaduais" && !selectedState) {
    return (
      <Layout>
        <section className="relative overflow-hidden gradient-hero py-10 lg:py-12">
          <div className="container relative">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground mb-4 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
            <div className="animate-slide-up">
              <h1 className="font-heading text-2xl font-bold text-primary-foreground sm:text-3xl">
                {getCertificateTitle()}
              </h1>
              <p className="mt-1 text-primary-foreground/80">
                Selecione o estado para continuar
              </p>
            </div>
          </div>
        </section>

        <section className="py-10">
          <div className="container max-w-lg">
            <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
              <FormField label="Estado" required>
                <Select value={selectedState} onValueChange={setSelectedState}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Selecione o estado" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border z-50 max-h-60">
                    {availableStates.map((state) => (
                      <SelectItem key={state.sigla} value={state.sigla.toLowerCase()}>
                        {state.nome} ({state.sigla})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  if (!formConfig) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Formulário não encontrado
          </h1>
          <Button asChild className="mt-6">
            <Link to="/">Voltar ao Início</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const updateField = (field: string, value: string | boolean) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      
      // Se a nacionalidade mudar, limpar campos condicionais relacionados
      if (field === "nacionalidade") {
        // Limpar campos de nascimento quando nacionalidade mudar
        delete newData.paisNascimento;
        delete newData.ufNascimento;
        delete newData.municipioNascimento;
        delete newData.cidadeNascimento;
        // Limpar erros relacionados
        setErrors((err) => {
          const newErrors = { ...err };
          delete newErrors.paisNascimento;
          delete newErrors.ufNascimento;
          delete newErrors.municipioNascimento;
          delete newErrors.cidadeNascimento;
          return newErrors;
        });
      }
      
      return newData;
    });
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const formatField = (field: string, value: string): string => {
    switch (field) {
      case "cpf":
        return formatCPF(value);
      case "cnpj":
        return formatCNPJ(value);
      case "cpfOuCnpj":
        const cleanValue = value.replace(/\D/g, "");
        return cleanValue.length <= 11 ? formatCPF(value) : formatCNPJ(value);
      case "documento":
        const cleanDoc = value.replace(/\D/g, "");
        return cleanDoc.length <= 11 ? formatCPF(value) : formatCNPJ(value);
      case "telefone":
        return formatPhone(value);
      case "dataNascimento":
        return formatDate(value);
      default:
        return value;
    }
  };

  const validateAllSteps = (): { isValid: boolean; missingFields: string[] } => {
    const allErrors: Record<string, string> = {};
    const missingFields: string[] = [];

    // Validar todos os steps
    for (const step of formConfig.steps) {
      for (const field of step.fields) {
        // Skip validation for hidden conditional fields
        if (field.showWhen) {
          const conditionValue = formData[field.showWhen.field];
          if (conditionValue !== field.showWhen.value) {
            continue;
          }
        }

        const value = formData[field.name];

        if (field.required && (!value || (typeof value === "string" && !value.trim()))) {
          allErrors[field.name] = `${field.label} é obrigatório`;
          missingFields.push(field.label);
          continue;
        }

        if (value && typeof value === "string" && value.trim()) {
          switch (field.name) {
            case "cpf":
              if (!validateCPF(value)) {
                allErrors[field.name] = "CPF inválido";
                missingFields.push(`${field.label} (inválido)`);
              }
              break;
            case "cnpj":
              if (!validateCNPJ(value)) {
                allErrors[field.name] = "CNPJ inválido";
                missingFields.push(`${field.label} (inválido)`);
              }
              break;
            case "cpfOuCnpj":
            case "documento":
              const clean = value.replace(/\D/g, "");
              if (clean.length <= 11) {
                if (!validateCPF(value)) {
                  allErrors[field.name] = "CPF inválido";
                  missingFields.push(`${field.label} (inválido)`);
                }
              } else {
                if (!validateCNPJ(value)) {
                  allErrors[field.name] = "CNPJ inválido";
                  missingFields.push(`${field.label} (inválido)`);
                }
              }
              break;
            case "email":
              if (!validateEmail(value)) {
                allErrors[field.name] = "E-mail inválido";
                missingFields.push(`${field.label} (inválido)`);
              }
              break;
            case "telefone":
              if (!validatePhone(value)) {
                allErrors[field.name] = "Telefone inválido";
                missingFields.push(`${field.label} (inválido)`);
              }
              break;
            case "dataNascimento":
              if (!validateDate(value)) {
                allErrors[field.name] = "Data inválida (DD/MM/AAAA)";
                missingFields.push(`${field.label} (inválido)`);
              }
              break;
          }
        }
      }
    }

    // Verificar termos
    if (!formData.termos) {
      allErrors.termos = "Você deve aceitar os termos";
      missingFields.push("Aceite dos Termos");
    }

    setErrors(allErrors);
    return {
      isValid: Object.keys(allErrors).length === 0,
      missingFields,
    };
  };

  const handleSubmit = async () => {
    // Validar todos os campos antes de submeter
    const validation = validateAllSteps();
    
    if (!validation.isValid) {
      // Evento: form_submit_error
      trackEvent('form_submit_error', {
        category: category || '',
        type: type || '',
        missing_fields: validation.missingFields
      });

      const missingFieldsText = validation.missingFields.length > 0
        ? validation.missingFields.join(", ")
        : "alguns campos obrigatórios";
      
      toast({
        title: "Campos obrigatórios não preenchidos",
        description: `Por favor, preencha os seguintes campos: ${missingFieldsText}`,
        variant: "destructive",
      });
      
      // Scroll para o primeiro campo com erro
      setTimeout(() => {
        if (formRef.current) {
          const firstErrorField = formRef.current.querySelector('[data-error="true"]');
          if (firstErrorField) {
            firstErrorField.scrollIntoView({ behavior: "smooth", block: "center" });
          } else {
            // Se não encontrar por data-error, procurar pelo primeiro campo com erro visível
            const firstErrorInput = formRef.current.querySelector('.text-destructive');
            if (firstErrorInput) {
              firstErrorInput.closest('.space-y-2')?.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          }
        }
      }, 100);
      
      return;
    }

    // Construir tipo de certidão completo
    const finalFormData = { ...formData };
    if (category === "estaduais" && type === "civel" && !finalFormData.tipoCertidao) {
      finalFormData.tipoCertidao = "Cível";
    } else if (category === "estaduais" && type !== "civel" && !finalFormData.tipoCertidao) {
      finalFormData.tipoCertidao = "Criminal";
    }

    // Calcular preço e plano selecionado
    let finalPrice = BASE_PRICE;
    let planId = "padrao";
    let planName = "Certidão Atendimento Padrão";
    let deliveryTime = "até 3 dias úteis";
    let features: string[] = ["Atendimento Fila Normal", "Envio por E-mail em PDF"];

    const selectedPlan = {
      id: planId,
      name: planName,
      price: finalPrice,
      deliveryTime,
      features,
    };

    // Evento: form_submit_success
    trackEvent('form_submit_success', {
      category: category || '',
      type: type || '',
      plan_id: planId,
      plan_name: planName,
      price: finalPrice
    });

    // Disparar evento quando formulário é submetido (se origem = portalcacesso)
    pushDLPortalcacesso('portalcacesso_form_submitted', {
      funnel_step: 'form_submit',
      certificateType: getCertificateTitle(),
      planId: planId,
      planName: planName,
      price: finalPrice,
      state: selectedState || undefined,
    });

    // Navigate direto para pagamento, preservando parâmetro source se existir
    const pagamentoUrl = source ? `/pagamento?source=${source}` : "/pagamento";
    navigate(pagamentoUrl, {
      state: {
        formData: finalFormData,
        certificateType: getCertificateTitle(),
        category: category || "", // Passar categoria original para facilitar navegação de volta
        state: selectedState,
        selectedPlan,
        funnel_id: getFunnelId(), // Passar funnel_id para o Payment
      },
    });
  };

  const getSelectOptions = (optionsKey?: string): Array<{ value: string; label: string }> => {
    if (!optionsKey) return [];

    switch (optionsKey) {
      case "comarcasRJ":
        return COMARCAS_RJ.map((c) => ({ value: c, label: c }));
      case "finalidadesRJ":
        return FINALIDADES_RJ.map((f) => ({ value: f, label: f }));
      case "cidadesSE":
        return CIDADES_SE.map((c) => ({ value: c, label: c }));
      case "estados":
        return ESTADOS_BRASIL.map((e) => ({ value: e.sigla, label: `${e.nome} (${e.sigla})` }));
      case "estadosCivis":
        return ESTADOS_CIVIS.map((e) => ({ value: e, label: e }));
      case "nacionalidades":
        return NACIONALIDADES.map((n) => ({ value: n, label: n }));
      case "paises":
        return PAISES.map((p) => ({ value: p, label: p }));
      case "tipoPessoa":
        return [
          { value: "PF", label: "Pessoa Física" },
          { value: "PJ", label: "Pessoa Jurídica" },
        ];
      case "sexo":
        return [
          { value: "M", label: "Masculino" },
          { value: "F", label: "Feminino" },
        ];
      case "tipoCertidao":
        return [
          { value: "Criminal", label: "Criminal" },
          { value: "Cível", label: "Cível" },
          { value: "Eleitoral", label: "Eleitoral" },
        ];
      case "tipoDocumento":
        return [
          { value: "CPF", label: "CPF" },
          { value: "CNPJ", label: "CNPJ" },
        ];
      default:
        return [];
    }
  };

  const renderField = (field: FormConfig["steps"][0]["fields"][0], stepIndex: number, fieldIndex: number) => {
    const value = formData[field.name] || "";
    const hasError = !!errors[field.name];

    // Check conditional visibility
    if (field.showWhen) {
      const conditionValue = formData[field.showWhen.field];
      if (conditionValue !== field.showWhen.value) {
        return null;
      }
    }

    // Criar chave única considerando o tipo e condição para evitar conflitos
    const uniqueKey = `${stepIndex}-${fieldIndex}-${field.name}-${field.type}-${field.showWhen?.value || 'default'}`;

    switch (field.type) {
      case "select":
        const options = getSelectOptions(field.options);
        return (
          <FormField
            key={uniqueKey}
            label={field.label}
            required={field.required}
            error={errors[field.name]}
          >
            <Select
              value={value as string}
              onValueChange={(val) => updateField(field.name, val)}
            >
              <SelectTrigger className="bg-card" data-error={hasError ? "true" : undefined}>
                <SelectValue placeholder={field.placeholder || `Selecione ${field.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent className="bg-card border-border z-50 max-h-60">
                {options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        );

      case "checkbox":
        return (
          <div key={uniqueKey} className="flex items-start gap-3" data-error={hasError ? "true" : undefined}>
            <Checkbox
              id={`${field.name}-${uniqueKey}`}
              checked={value as boolean}
              onCheckedChange={(checked) => updateField(field.name, checked as boolean)}
            />
            <div className="flex-1">
              <label
                htmlFor={`${field.name}-${uniqueKey}`}
                className="text-sm text-muted-foreground cursor-pointer leading-relaxed"
              >
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </label>
              {errors[field.name] && (
                <p className="text-xs text-destructive mt-1">{errors[field.name]}</p>
              )}
            </div>
          </div>
        );

      default:
        return (
          <FormField
            key={uniqueKey}
            label={field.label}
            required={field.required}
            error={errors[field.name]}
          >
            <Input
              value={value as string}
              onChange={(e) => updateField(field.name, formatField(field.name, e.target.value))}
              placeholder={field.placeholder}
              data-error={hasError ? "true" : undefined}
              className={hasError ? "border-destructive" : ""}
            />
          </FormField>
        );
    }
  };

  // Multi-step: steps do formConfig + "Revisão e Pagamento"
  const totalSteps = formConfig.steps.length + 1;
  const stepLabels = [...formConfig.steps.map((s) => s.title), "Revisão e Pagamento"];
  const isReviewStep = currentStep === totalSteps - 1;

  // Validar apenas o step atual para permitir "Próximo"
  const canProceed = (): boolean => {
    if (isReviewStep) return true;
    const step = formConfig.steps[currentStep];
    for (const field of step.fields) {
      if (field.showWhen) {
        const conditionValue = formData[field.showWhen.field];
        if (conditionValue !== field.showWhen.value) continue;
      }
      const value = formData[field.name];
      if (field.required && (!value || (typeof value === "string" && !value.trim()))) {
        return false;
      }
      if (value && typeof value === "string" && value.trim()) {
        switch (field.name) {
          case "cpf":
            if (!validateCPF(value)) return false;
            break;
          case "cnpj":
            if (!validateCNPJ(value)) return false;
            break;
          case "cpfOuCnpj":
          case "documento":
            const clean = value.replace(/\D/g, "");
            if (clean.length <= 11 && !validateCPF(value)) return false;
            if (clean.length > 11 && !validateCNPJ(value)) return false;
            break;
          case "email":
            if (!validateEmail(value)) return false;
            break;
          case "telefone":
            if (!validatePhone(value)) return false;
            break;
          case "dataNascimento":
            if (!validateDate(value)) return false;
            break;
        }
      }
    }
    return true;
  };

  // Componente ReviewRow para o step de revisão
  const ReviewRow = ({ label, value }: { label: string; value: string }) => (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground font-medium text-right">{value}</span>
    </div>
  );

  // Gerar linhas de revisão a partir do formConfig e formData
  const renderReviewRows = () => {
    const rows: React.ReactNode[] = [];
    for (const step of formConfig.steps) {
      for (const field of step.fields) {
        if (field.name === "termos") continue;
        if (field.showWhen) {
          const conditionValue = formData[field.showWhen.field];
          if (conditionValue !== field.showWhen.value) continue;
        }
        const value = formData[field.name];
        if (value === undefined || value === null || value === false) continue;
        const displayValue =
          typeof value === "string"
            ? formatField(field.name, value)
            : value
            ? "Sim"
            : "Não";
        if (displayValue) {
          rows.push(
            <ReviewRow key={field.name} label={field.label} value={displayValue} />
          );
        }
      }
    }
    return rows;
  };

  return (
    <Layout>
      <SEOHead
        title={`${getCertificateTitle()} - Guia Central`}
        description={formConfig.description || "Preencha o formulário para solicitar sua certidão. Processo rápido, seguro e 100% online."}
      />
      {/* Hero */}
      <section className="relative overflow-hidden gradient-hero py-10 lg:py-12">
        <div className="container relative">
          <button
            onClick={() => {
              if (category === "estaduais") {
                setSelectedState("");
              } else {
                navigate(-1);
              }
            }}
            className="inline-flex items-center gap-2 text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>

          <div className="animate-slide-up">
            <h1 className="font-heading text-2xl font-bold text-primary-foreground sm:text-3xl">
              {getCertificateTitle()}
            </h1>
            <p className="mt-1 text-primary-foreground/80">
              {category === "federais" && formData.estadoEmissao
                ? `Tribunal Regional Federal (${formData.estadoEmissao})`
                : category === "federais"
                ? "Tribunal Regional Federal"
                : formConfig.description}
            </p>
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="py-10">
        <div className="container max-w-2xl mx-auto">
          {/* Explicação de Campos Obrigatórios */}
          <Card className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  Campos Obrigatórios
                </h3>
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  Os campos marcados com <span className="text-destructive font-semibold">*</span> são obrigatórios e devem ser preenchidos corretamente para prosseguir com a solicitação da certidão.
                </p>
              </div>
            </div>
          </Card>

          {/* Formulário Multi-Step */}
          <form ref={formRef} onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="rounded-xl border border-border bg-card p-6 shadow-card animate-fade-in space-y-8">
            {/* Abas de step (multi-step) */}
            <div className={`grid gap-1 mb-6 ${totalSteps <= 2 ? "grid-cols-2" : "grid-cols-3"}`}>
              {stepLabels.map((label, i) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => i < currentStep && setCurrentStep(i)}
                  className={`py-3 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                    i === currentStep
                      ? "gradient-hero text-primary-foreground shadow-hero"
                      : i < currentStep
                      ? "bg-primary/10 text-primary"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {!isReviewStep ? (
              /* Steps 0..N-1: campos do formConfig */
              <div className="space-y-5">
                {formConfig.steps[currentStep].title && (
                  <div className="border-b border-border pb-2 mb-4">
                    <h3 className="font-semibold text-foreground text-base">
                      {currentStep === 0
                        ? `Formulário ${getCertificateTitle()}`
                        : formConfig.steps[currentStep].title}
                    </h3>
                    {formConfig.steps[currentStep].description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {formConfig.steps[currentStep].description}
                      </p>
                    )}
                  </div>
                )}
                <div className="space-y-5">
                  {formConfig.steps[currentStep].fields.map((field, fieldIndex) =>
                    renderField(field, currentStep, fieldIndex)
                  )}
                </div>
              </div>
            ) : (
              /* Step N: Revisão e Pagamento */
              <div className="space-y-6">
                <h3 className="font-semibold text-foreground text-base">Revisão e Pagamento</h3>
                <Card className="border bg-card">
                  <CardContent className="pt-6">
                    <div className="space-y-3">{renderReviewRows()}</div>
                  </CardContent>
                </Card>
                {/* Bloco de total e PIX */}
                <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-semibold text-foreground">R$ 39,90</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Pagamento via PIX. Você receberá o QR Code na próxima tela.
                  </p>
                </div>
              </div>
            )}

            {/* Navegação Voltar / Próximo */}
            <div className="flex flex-col-reverse sm:flex-row gap-4 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => (currentStep > 0 ? setCurrentStep(currentStep - 1) : navigate(-1))}
                size="lg"
                className="gap-2 w-full sm:flex-1"
              >
                <ChevronLeft className="size-4" />
                Voltar
              </Button>
              {isReviewStep ? (
                <Button type="submit" variant="hero" size="lg" className="gap-2 w-full sm:flex-1 shadow-hero">
                  Confirmar e Pagar via PIX
                  <ChevronRight className="size-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="hero"
                  size="lg"
                  onClick={() => canProceed() && setCurrentStep(currentStep + 1)}
                  className="gap-2 w-full sm:flex-1 shadow-hero"
                >
                  Próximo
                  <ChevronRight className="size-4" />
                </Button>
              )}
            </div>
          </form>
        </div>
      </section>
    </Layout>
  );
};

export default CertificateForm;
