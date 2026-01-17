import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { maskCPF, maskCNPJ } from "@/lib/masks";
import { validateCPF, validateCNPJ } from "@/lib/validators";
import { createTicket } from "@/lib/ticketService";

const maskPhone = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .replace(/(-\d{4})\d+?$/, "$1");
};

const ESTADOS_BRASILEIROS = [
  { value: "AC", label: "Acre" },
  { value: "AL", label: "Alagoas" },
  { value: "AP", label: "Amapá" },
  { value: "AM", label: "Amazonas" },
  { value: "BA", label: "Bahia" },
  { value: "CE", label: "Ceará" },
  { value: "DF", label: "Distrito Federal" },
  { value: "ES", label: "Espírito Santo" },
  { value: "GO", label: "Goiás" },
  { value: "MA", label: "Maranhão" },
  { value: "MT", label: "Mato Grosso" },
  { value: "MS", label: "Mato Grosso do Sul" },
  { value: "MG", label: "Minas Gerais" },
  { value: "PA", label: "Pará" },
  { value: "PB", label: "Paraíba" },
  { value: "PR", label: "Paraná" },
  { value: "PE", label: "Pernambuco" },
  { value: "PI", label: "Piauí" },
  { value: "RJ", label: "Rio de Janeiro" },
  { value: "RN", label: "Rio Grande do Norte" },
  { value: "RS", label: "Rio Grande do Sul" },
  { value: "RO", label: "Rondônia" },
  { value: "RR", label: "Roraima" },
  { value: "SC", label: "Santa Catarina" },
  { value: "SP", label: "São Paulo" },
  { value: "SE", label: "Sergipe" },
  { value: "TO", label: "Tocantins" },
];

export function ContactForm() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documentError, setDocumentError] = useState("");
  const [formData, setFormData] = useState({
    tipoPessoa: "fisica" as "fisica" | "juridica",
    nome: "",
    cpfCnpj: "",
    telefone: "",
    email: "",
    estado: ""
  });

  const handleTipoPessoaChange = (value: "fisica" | "juridica") => {
    setFormData(prev => ({ 
      ...prev, 
      tipoPessoa: value,
      cpfCnpj: "" // Limpa o campo ao trocar o tipo
    }));
    setDocumentError("");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === "cpfCnpj") {
      const maskedValue = formData.tipoPessoa === "fisica" 
        ? maskCPF(value) 
        : maskCNPJ(value);
      setFormData(prev => ({ ...prev, cpfCnpj: maskedValue }));
      setDocumentError(""); // Limpa erro ao digitar
    } else if (name === "telefone") {
      setFormData(prev => ({ ...prev, telefone: maskPhone(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const validateDocument = (): boolean => {
    if (!formData.cpfCnpj) {
      setDocumentError("Este campo é obrigatório");
      return false;
    }

    const isValid = formData.tipoPessoa === "fisica" 
      ? validateCPF(formData.cpfCnpj)
      : validateCNPJ(formData.cpfCnpj);

    if (!isValid) {
      const documentType = formData.tipoPessoa === "fisica" ? "CPF" : "CNPJ";
      setDocumentError(`${documentType} inválido. Por favor, verifique os dados informados.`);
      return false;
    }

    setDocumentError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Valida documento antes de submeter
    if (!validateDocument()) {
      return;
    }

    // Validar estado antes de submeter
    if (!formData.estado) {
      setDocumentError("Por favor, selecione o estado da solicitação");
      return;
    }

    setIsSubmitting(true);

    try {
      // Criar ticket na plataforma
      const ticket = await createTicket({
        tipoPessoa: formData.tipoPessoa,
        nome: formData.nome,
        cpfCnpj: formData.cpfCnpj,
        telefone: formData.telefone,
        email: formData.email,
        estado: formData.estado,
      });

      if (!ticket) {
        throw new Error('Erro ao criar ticket. Tente novamente.');
      }

      console.log('✅ [ContactForm] Ticket criado:', ticket.id);

      // Redirecionar para página PIX com dados do ticket e formulário
      navigate("/pix", {
        state: {
          ticketId: ticket.id,
          ticketCode: ticket.codigo,
          formData: formData,
        },
      });
    } catch (error) {
      console.error('❌ [ContactForm] Erro ao processar formulário:', error);
      setDocumentError(
        error instanceof Error 
          ? error.message 
          : 'Erro ao processar solicitação. Tente novamente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="formulario" className="py-20 bg-muted">
      <div className="container">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Solicite Assistência para Consultar
            </h2>
            <p className="text-muted-foreground">
              Suas informações são tratadas com sigilo e segurança
            </p>
          </div>

          <div className="bg-card rounded-xl p-6 md:p-8 shadow-sm border border-border">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="estado">Estado da Solicitação *</Label>
                <Select
                  value={formData.estado}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, estado: value }))}
                  required
                >
                  <SelectTrigger id="estado" className="h-12">
                    <SelectValue placeholder="Selecione o estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS_BRASILEIROS.map((estado) => (
                      <SelectItem key={estado.value} value={estado.value}>
                        {estado.label} ({estado.value})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipoPessoa">Tipo de Pessoa *</Label>
                <Select
                  value={formData.tipoPessoa}
                  onValueChange={handleTipoPessoaChange}
                  required
                >
                  <SelectTrigger id="tipoPessoa" className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fisica">Pessoa Física</SelectItem>
                    <SelectItem value="juridica">Pessoa Jurídica</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nome">Nome completo *</Label>
                <Input
                  id="nome"
                  name="nome"
                  type="text"
                  placeholder={formData.tipoPessoa === "fisica" ? "Digite seu nome completo" : "Digite a razão social"}
                  value={formData.nome}
                  onChange={handleChange}
                  required
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpfCnpj">
                  {formData.tipoPessoa === "fisica" ? "CPF" : "CNPJ"} *
                </Label>
                <Input
                  id="cpfCnpj"
                  name="cpfCnpj"
                  type="text"
                  placeholder={formData.tipoPessoa === "fisica" ? "000.000.000-00" : "00.000.000/0000-00"}
                  value={formData.cpfCnpj}
                  onChange={handleChange}
                  required
                  maxLength={formData.tipoPessoa === "fisica" ? 14 : 18}
                  className="h-12"
                  onBlur={validateDocument}
                />
                {documentError && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{documentError}</AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone / WhatsApp</Label>
                <Input
                  id="telefone"
                  name="telefone"
                  type="text"
                  placeholder="(00) 00000-0000"
                  value={formData.telefone}
                  onChange={handleChange}
                  required
                  maxLength={15}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="h-12"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-base"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Iniciar atendimento"
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
