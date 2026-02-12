import { formatPhone } from "@/lib/validators";

interface Props {
  data: Record<string, string>;
  onChange: (field: string, value: string) => void;
  errors?: Record<string, string>;
}

const StepContato = ({ data, onChange, errors = {} }: Props) => {
  const inputClass = (name: string) =>
    `w-full px-4 py-3 rounded-lg border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow ${
      errors[name] ? "border-destructive" : ""
    }`;

  return (
    <div>
      <h3 className="text-lg font-bold text-foreground mb-6">Contato</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Telefone / Celular <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            placeholder="(00) 0 0000-0000"
            value={data.celular || ""}
            onChange={(e) => onChange("celular", formatPhone(e.target.value))}
            className={inputClass("celular")}
          />
          {errors.celular && <p className="text-xs text-destructive mt-1">{errors.celular}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            E-mail <span className="text-destructive">*</span>
          </label>
          <input
            type="email"
            placeholder="seu@email.com"
            value={data.email || ""}
            onChange={(e) => onChange("email", e.target.value)}
            className={inputClass("email")}
          />
          {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
        </div>
      </div>
    </div>
  );
};

export default StepContato;
