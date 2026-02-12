import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Lock, AlertTriangle, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import FormSteps from "@/components/FormSteps";
import DynamicFields from "@/components/DynamicFields";
import StepContato from "@/components/StepContato";
import StepRevisao from "@/components/StepRevisao";
import { Button } from "@/components/ui/button";
import { validateCPF, validateDate, validateEmail } from "@/lib/validators";
import { toast } from "sonner";
import { createTicket } from "@/lib/ticketService";
import {
  getServiceConfig,
  estadualUFConfigs,
  UF_LIST,
  type FieldConfig,
} from "@/lib/serviceConfigs";

const stepNames = ["Dados", "Contato", "Revisão e Pagamento"];

const Solicitar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const service =
    (location.state as any)?.service || "Certidão de Quitação Eleitoral";
  const config = getServiceConfig(service);
  const isEstadual = config.type === "estadual";

  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedUF, setSelectedUF] = useState("");
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      // Clear documento when tipoDocumento changes
      if (field === "tipoDocumento") next.documento = "";
      return next;
    });
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const getStep1Fields = (): FieldConfig[] => {
    if (isEstadual) {
      return estadualUFConfigs[selectedUF] || [];
    }
    return config.fields || [];
  };

  const isUFBlocked =
    isEstadual && selectedUF !== "" && !estadualUFConfigs[selectedUF];

  const validateStep0 = (): boolean => {
    if (isEstadual && !selectedUF) {
      toast.error("Selecione o estado");
      return false;
    }
    if (isUFBlocked) {
      toast.error("Estado não disponível no momento");
      return false;
    }

    const fields = getStep1Fields();
    const visibleFields = fields.filter((f) => {
      if (!f.dependsOn) return true;
      return formData[f.dependsOn.field] === f.dependsOn.value;
    });

    const errs: Record<string, string> = {};
    visibleFields.forEach((f) => {
      if (!f.required) return;
      const val = (formData[f.name] || "").trim();
      if (!val) {
        errs[f.name] = "Campo obrigatório";
        return;
      }
      if (f.type === "cpf" && !validateCPF(val)) errs[f.name] = "CPF inválido";
      if (f.type === "cnpj" && val.replace(/\D/g, "").length !== 14) errs[f.name] = "CNPJ inválido";
      if (f.type === "date" && !validateDate(val))
        errs[f.name] = "Data inválida";
      if (f.type === "cep" && val.replace(/\D/g, "").length !== 8)
        errs[f.name] = "CEP inválido";
      if (f.type === "cpfOrCnpj") {
        const isCnpj = formData.tipoDocumento === "cnpj" || formData.tipoPessoa === "pj";
        if (isCnpj && val.replace(/\D/g, "").length !== 14) {
          errs[f.name] = "CNPJ inválido";
        } else if (!isCnpj && !validateCPF(val)) {
          errs[f.name] = "CPF inválido";
        }
      }
    });

    setErrors(errs);
    if (Object.keys(errs).length > 0)
      toast.error("Preencha todos os campos corretamente");
    return Object.keys(errs).length === 0;
  };

  const validateStep1 = (): boolean => {
    const errs: Record<string, string> = {};
    if ((formData.celular || "").replace(/\D/g, "").length < 10)
      errs.celular = "Telefone inválido";
    if (!validateEmail(formData.email || "")) errs.email = "E-mail inválido";
    setErrors(errs);
    if (Object.keys(errs).length > 0)
      toast.error("Preencha todos os campos corretamente");
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (step === 0 && !validateStep0()) return;
    if (step === 1 && !validateStep1()) return;
    setStep(step + 1);
  };

  const handleFinalize = async () => {
    if (isCreatingTicket) return; // Prevenir múltiplos cliques
    
    setIsCreatingTicket(true);
    
    try {
      // Preparar dados do formulário incluindo UF selecionada
      const formDataWithUF = {
        ...formData,
        selectedUF: isEstadual ? selectedUF : undefined,
        service: service,
      };
      
      console.log('🔵 [Guia das Certidões] Criando ticket antes de redirecionar para pagamento...', {
        service,
        hasFormData: !!formData,
        selectedUF: isEstadual ? selectedUF : undefined
      });
      
      // Criar ticket na plataforma
      const ticket = await createTicket(formDataWithUF, service);
      
      if (!ticket) {
        console.error('❌ [Guia das Certidões] Ticket não foi criado (retornou null)');
        toast.error('Erro ao criar ticket. Verifique se o servidor está rodando e tente novamente.');
        setIsCreatingTicket(false);
        return;
      }
      
      console.log('✅ [Guia das Certidões] Ticket criado com sucesso:', {
        id: ticket.id,
        codigo: ticket.codigo
      });
      
      // Redirecionar para página de pagamento com dados do ticket
      navigate("/pagamento-pix", { 
        state: { 
          service, 
          formData: formDataWithUF,
          ticketId: ticket.id,
          ticketCode: ticket.codigo
        } 
      });
    } catch (error) {
      console.error('❌ [Guia das Certidões] Erro ao criar ticket:', error);
      toast.error('Erro ao criar ticket. Tente novamente.');
      setIsCreatingTicket(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 py-8">
        <div className="container max-w-3xl">
          <div className="bg-card rounded-xl border p-6 md:p-10">
            <h2 className="text-xl font-bold text-foreground text-center mb-6">
              {service}
            </h2>
            <FormSteps currentStep={step} steps={stepNames} />

            {step === 0 && (
              <div>
                <h3 className="text-lg font-bold text-foreground mb-6">
                  Dados do Documento
                </h3>

                {isEstadual && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Estado onde a certidão será emitida{" "}
                      <span className="text-destructive">*</span>
                    </label>
                    <select
                      value={selectedUF}
                      onChange={(e) => {
                        setSelectedUF(e.target.value);
                        setFormData({});
                        setErrors({});
                      }}
                      className="w-full px-4 py-3 rounded-lg border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="">Selecione o estado...</option>
                      {UF_LIST.map((uf) => (
                        <option key={uf} value={uf}>
                          {uf}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {isUFBlocked && (
                  <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Estado não disponível
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Este estado ainda não está disponível para emissão de
                        certidões estaduais pela nossa plataforma.
                      </p>
                    </div>
                  </div>
                )}

                {(!isEstadual || (selectedUF && !isUFBlocked)) && (
                  <DynamicFields
                    fields={getStep1Fields()}
                    data={formData}
                    onChange={handleChange}
                    errors={errors}
                  />
                )}
              </div>
            )}

            {step === 1 && (
              <StepContato
                data={formData}
                onChange={handleChange}
                errors={errors}
              />
            )}
            {step === 2 && <StepRevisao service={service} />}

            <div className="flex items-center justify-between mt-8">
              {step > 0 ? (
                <Button variant="outline" onClick={() => setStep(step - 1)}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Anterior
                </Button>
              ) : (
                <Button variant="outline" onClick={() => navigate("/")}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
                </Button>
              )}

              {step < 2 ? (
                <Button
                  onClick={handleNext}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Próximo <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleFinalize}
                  disabled={isCreatingTicket}
                  className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold disabled:opacity-50"
                >
                  {isCreatingTicket ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processando...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" /> Finalizar e Pagar com PIX
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Solicitar;
