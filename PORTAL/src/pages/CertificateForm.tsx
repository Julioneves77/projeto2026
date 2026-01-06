import { useState, useMemo, useRef } from "react";
import { useParams, useSearchParams, Link, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import FormField from "@/components/forms/FormField";
import SEOHead from "@/components/SEOHead";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Info, AlertCircle } from "lucide-react";
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
const PRIORIDADE_ADDON = 19.90;
const PREMIUM_ADDON = 29.90;
// Forçar novo build
const BUILD_VERSION = "2026.01.05.2123";

const CertificateForm = () => {
  const { category } = useParams<{ category: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const type = searchParams.get("type") || "";
  const formRef = useRef<HTMLDivElement>(null);
  
  const [selectedState, setSelectedState] = useState<string>("");
  
  // Pre-fill tipoCertidao based on URL type parameter for federais and estaduais
  const getInitialFormData = (): Record<string, string | boolean> => {
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
  const [isPrioridade, setIsPrioridade] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  // Get available states for estaduais category
  const availableStates = useMemo(() => {
    if (category === "estaduais") {
      return getAvailableStates();
    }
    return [];
  }, [category]);

  // Get form config based on category and selected state
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

  // Show state selector for estaduais
  if (category === "estaduais" && !selectedState) {
    return (
      <Layout>
        <section className="relative overflow-hidden hero-gradient py-10 lg:py-12">
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
    setFormData((prev) => ({ ...prev, [field]: value }));
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

    if (isPremium) {
      finalPrice = BASE_PRICE + PREMIUM_ADDON; // 69.80
      planId = "premium";
      planName = "Certidão Premium WhatsApp";
      deliveryTime = "até 4 horas";
      features = ["Atendimento Urgente (à frente de todos)", "Envio por E-mail e WhatsApp"];
    } else if (isPrioridade) {
      finalPrice = BASE_PRICE + PRIORIDADE_ADDON; // 59.80
      planId = "prioridade";
      planName = "Certidão Atendimento Prioritário";
      deliveryTime = "até 24 horas";
      features = ["Atendimento Prioridade (frente da fila Normal)", "Envio por E-mail e WhatsApp"];
    }

    const selectedPlan = {
      id: planId,
      name: planName,
      price: finalPrice,
      deliveryTime,
      features,
    };

    // Navigate direto para pagamento
    navigate("/pagamento", {
      state: {
        formData: finalFormData,
        certificateType: getCertificateTitle(),
        state: selectedState,
        selectedPlan,
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

  const renderField = (field: FormConfig["steps"][0]["fields"][0], stepIndex: number) => {
    const value = formData[field.name] || "";
    const hasError = !!errors[field.name];

    // Check conditional visibility
    if (field.showWhen) {
      const conditionValue = formData[field.showWhen.field];
      if (conditionValue !== field.showWhen.value) {
        return null;
      }
    }

    switch (field.type) {
      case "select":
        const options = getSelectOptions(field.options);
        return (
          <FormField
            key={`${stepIndex}-${field.name}`}
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
          <div key={`${stepIndex}-${field.name}`} className="flex items-start gap-3" data-error={hasError ? "true" : undefined}>
            <Checkbox
              id={field.name}
              checked={value as boolean}
              onCheckedChange={(checked) => updateField(field.name, checked as boolean)}
            />
            <div className="flex-1">
              <label
                htmlFor={field.name}
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
            key={`${stepIndex}-${field.name}`}
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

  // Agrupar campos por step para manter organização visual
  const fieldsByStep = formConfig.steps.map((step, stepIndex) => ({
    step,
    stepIndex,
    fields: step.fields,
  }));

  return (
    <Layout>
      <SEOHead
        title={`${getCertificateTitle()} - Portal Certidão`}
        description={formConfig.description || "Preencha o formulário para solicitar sua certidão. Processo rápido, seguro e 100% online."}
      />
      {/* Hero */}
      <section className="relative overflow-hidden hero-gradient py-10 lg:py-12">
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

          {/* Formulário */}
          <div ref={formRef} className="rounded-xl border border-border bg-card p-6 card-shadow animate-fade-in space-y-8">
            {/* Renderizar campos agrupados por step */}
            {fieldsByStep.map(({ step, stepIndex, fields }) => (
              <div key={stepIndex} className="space-y-5">
                {/* Título da seção */}
                {step.title && (
                  <div className="border-b border-border pb-2 mb-4">
                    <h3 className="font-semibold text-foreground text-base">
                      {stepIndex === 0
                        ? `Formulário ${getCertificateTitle()}`
                        : step.title}
                    </h3>
                    {step.description && (
                      <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                    )}
                  </div>
                )}

                {/* Campos do step */}
                <div className="space-y-5">
                  {fields.map((field) => renderField(field, stepIndex))}
                </div>
              </div>
            ))}

            {/* Seção de Prioridade */}
            <div className="border-t border-border pt-6 mt-6">
              <h3 className="font-semibold text-foreground text-base mb-4">
                Opções de Atendimento (Opcional)
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Escolha uma opção adicional para receber sua certidão com mais rapidez:
              </p>
              
              <div className="space-y-3">
                {/* Checkbox Prioridade */}
                <div className="flex items-start gap-3 p-4 rounded-lg border border-border hover:border-primary/50 transition-colors">
                  <Checkbox
                    id="prioridade"
                    checked={isPrioridade}
                    onCheckedChange={(checked) => {
                      setIsPrioridade(checked as boolean);
                      if (checked) setIsPremium(false); // Desmarcar premium se prioridade for selecionada
                    }}
                  />
                  <div className="flex-1">
                    <label
                      htmlFor="prioridade"
                      className="text-sm font-medium text-foreground cursor-pointer flex items-center gap-2"
                    >
                      Atendimento Prioritário
                      <span className="text-xs font-semibold text-primary">
                        (+R$ {PRIORIDADE_ADDON.toFixed(2).replace(".", ",")})
                      </span>
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Atendimento prioritário - Baixe no Email e WhatsApp
                    </p>
                  </div>
                </div>

                {/* Checkbox Premium */}
                <div className="flex items-start gap-3 p-4 rounded-lg border border-border hover:border-primary/50 transition-colors">
                  <Checkbox
                    id="premium"
                    checked={isPremium}
                    onCheckedChange={(checked) => {
                      setIsPremium(checked as boolean);
                      if (checked) setIsPrioridade(false); // Desmarcar prioridade se premium for selecionada
                    }}
                  />
                  <div className="flex-1">
                    <label
                      htmlFor="premium"
                      className="text-sm font-medium text-foreground cursor-pointer flex items-center gap-2"
                    >
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded uppercase">
                        URGENTE
                      </span>
                      Atendimento Premium
                      <span className="text-xs font-semibold text-primary">
                        (+R$ {PREMIUM_ADDON.toFixed(2).replace(".", ",")})
                      </span>
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Atendimento urgente - Baixe no Email e WhatsApp
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Botão de Submeter */}
            <div className="pt-6 border-t border-border">
              <Button
                type="button"
                variant="success"
                size="lg"
                onClick={handleSubmit}
                className="w-full"
              >
                Emitir Certidão
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default CertificateForm;
