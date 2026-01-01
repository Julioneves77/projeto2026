import { useState, useMemo } from "react";
import { useParams, useSearchParams, Link, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import FormWizard from "@/components/forms/FormWizard";
import FormField from "@/components/forms/FormField";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
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

const CertificateForm = () => {
  const { category } = useParams<{ category: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const type = searchParams.get("type") || "";
  
  const [selectedState, setSelectedState] = useState<string>("");
  const [currentStep, setCurrentStep] = useState(0);
  
  // Pre-fill tipoCertidao based on URL type parameter for federais
  const getInitialFormData = (): Record<string, string | boolean> => {
    if (category === "federais" && type) {
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
      return getFormConfig(category, selectedState);
    }
    return getFormConfig(category || "", type);
  }, [category, type, selectedState]);

  const getCertificateTitle = () => {
    switch (category) {
      case "estaduais":
        return "Certidão Criminal Estadual";
      case "federais":
        return `Certidão Federal - ${type?.toUpperCase() || ""}`;
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

  const currentStepConfig = formConfig.steps[currentStep];

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

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};
    const stepFields = currentStepConfig.fields;

    stepFields.forEach((field) => {
      // Skip validation for hidden conditional fields
      if (field.showWhen) {
        const conditionValue = formData[field.showWhen.field];
        if (conditionValue !== field.showWhen.value) {
          return; // Skip this field, it's not visible
        }
      }

      const value = formData[field.name];

      if (field.required && (!value || (typeof value === "string" && !value.trim()))) {
        newErrors[field.name] = `${field.label} é obrigatório`;
        return;
      }

      if (value && typeof value === "string" && value.trim()) {
        switch (field.name) {
          case "cpf":
            if (!validateCPF(value)) newErrors[field.name] = "CPF inválido";
            break;
          case "cnpj":
            if (!validateCNPJ(value)) newErrors[field.name] = "CNPJ inválido";
            break;
          case "cpfOuCnpj":
          case "documento":
            const clean = value.replace(/\D/g, "");
            if (clean.length <= 11) {
              if (!validateCPF(value)) newErrors[field.name] = "CPF inválido";
            } else {
              if (!validateCNPJ(value)) newErrors[field.name] = "CNPJ inválido";
            }
            break;
          case "email":
            if (!validateEmail(value)) newErrors[field.name] = "E-mail inválido";
            break;
          case "telefone":
            if (!validatePhone(value)) newErrors[field.name] = "Telefone inválido";
            break;
          case "dataNascimento":
            if (!validateDate(value)) newErrors[field.name] = "Data inválida (DD/MM/AAAA)";
            break;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, formConfig.steps.length - 1));
    }
  };

  const handleBack = () => {
    if (currentStep === 0 && category === "estaduais") {
      setSelectedState("");
    } else {
      setCurrentStep((prev) => Math.max(prev - 1, 0));
    }
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    // Check terms acceptance
    if (!formData.termos) {
      setErrors((prev) => ({ ...prev, termos: "Você deve aceitar os termos" }));
      return;
    }

    // Navigate to service selection
    navigate("/selecionar-servico", {
      state: {
        formData,
        certificateType: getCertificateTitle(),
        state: selectedState,
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

  const renderField = (field: FormConfig["steps"][0]["fields"][0]) => {
    const value = formData[field.name] || "";

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
            key={field.name}
            label={field.label}
            required={field.required}
            error={errors[field.name]}
          >
            <Select
              value={value as string}
              onValueChange={(val) => updateField(field.name, val)}
            >
              <SelectTrigger className="bg-card">
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
          <div key={field.name} className="flex items-start gap-3">
            <Checkbox
              id={field.name}
              checked={value as boolean}
              onCheckedChange={(checked) => updateField(field.name, checked as boolean)}
            />
            <div>
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
            key={field.name}
            label={field.label}
            required={field.required}
            error={errors[field.name]}
          >
            <Input
              value={value as string}
              onChange={(e) => updateField(field.name, formatField(field.name, e.target.value))}
              placeholder={field.placeholder}
            />
          </FormField>
        );
    }
  };

  const isLastStep = currentStep === formConfig.steps.length - 1;
  const hasAllRequiredFilled = currentStepConfig.fields
    .filter((f) => f.required)
    .every((f) => {
      if (f.showWhen) {
        const conditionValue = formData[f.showWhen.field];
        if (conditionValue !== f.showWhen.value) return true;
      }
      const val = formData[f.name];
      if (typeof val === "boolean") return val;
      return val && (val as string).trim();
    });

  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden hero-gradient py-10 lg:py-12">
        <div className="container relative">
          <button
            onClick={() => {
              if (currentStep === 0 && category === "estaduais") {
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
              {formConfig.title}
            </h1>
            <p className="mt-1 text-primary-foreground/80">{formConfig.description}</p>
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="py-10">
        <div className="container">
          <FormWizard
            steps={formConfig.steps.map((s) => ({ title: s.title, description: s.description }))}
            currentStep={currentStep}
            onNext={handleNext}
            onBack={handleBack}
            onSubmit={handleSubmit}
            isNextDisabled={!hasAllRequiredFilled}
            isSubmitting={false}
          >
            <div className="space-y-5">
              {currentStepConfig.fields.map(renderField)}
            </div>
          </FormWizard>
        </div>
      </section>
    </Layout>
  );
};

export default CertificateForm;
