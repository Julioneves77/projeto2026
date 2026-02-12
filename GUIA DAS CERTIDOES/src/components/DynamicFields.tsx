import { formatCPF, formatDate, formatCNPJ, formatCEP } from "@/lib/validators";
import type { FieldConfig } from "@/lib/serviceConfigs";

interface Props {
  fields: FieldConfig[];
  data: Record<string, string>;
  onChange: (field: string, value: string) => void;
  errors?: Record<string, string>;
}

const DynamicFields = ({ fields, data, onChange, errors = {} }: Props) => {
  const visibleFields = fields.filter((f) => {
    if (!f.dependsOn) return true;
    return data[f.dependsOn.field] === f.dependsOn.value;
  });

  const handleChange = (field: FieldConfig, value: string) => {
    let formatted = value;
    if (field.type === "cpf") formatted = formatCPF(value);
    else if (field.type === "cnpj") formatted = formatCNPJ(value);
    else if (field.type === "date") formatted = formatDate(value);
    else if (field.type === "cep") formatted = formatCEP(value);
    else if (field.type === "cpfOrCnpj") {
      const isCnpj = data.tipoDocumento === "cnpj" || data.tipoPessoa === "pj";
      formatted = isCnpj ? formatCNPJ(value) : formatCPF(value);
    }
    onChange(field.name, formatted);
  };

  const inputClass = (name: string) =>
    `w-full px-4 py-3 rounded-lg border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow ${
      errors[name] ? "border-destructive" : ""
    }`;

  return (
    <div className="space-y-4">
      {visibleFields.map((field) => (
        <div key={field.name}>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            {field.label} {field.required && <span className="text-destructive">*</span>}
          </label>

          {field.type === "select" && (
            <select
              value={data[field.name] || ""}
              onChange={(e) => onChange(field.name, e.target.value)}
              className={inputClass(field.name)}
            >
              <option value="">Selecione...</option>
              {field.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}

          {field.type === "radio" && (
            <div className="flex gap-6 pt-1">
              {field.options?.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name={field.name}
                    value={opt.value}
                    checked={data[field.name] === opt.value}
                    onChange={(e) => onChange(field.name, e.target.value)}
                    className="w-4 h-4 accent-primary"
                  />
                  <span className="text-sm text-foreground">{opt.label}</span>
                </label>
              ))}
            </div>
          )}

          {["text", "cpf", "cnpj", "date", "cpfOrCnpj", "cep"].includes(field.type) && (
            <input
              type="text"
              placeholder={
                field.type === "cpfOrCnpj"
                  ? (data.tipoDocumento === "cnpj" || data.tipoPessoa === "pj")
                    ? "00.000.000/0000-00"
                    : "000.000.000-00"
                  : field.placeholder || ""
              }
              value={data[field.name] || ""}
              onChange={(e) => handleChange(field, e.target.value)}
              className={inputClass(field.name)}
            />
          )}

          {errors[field.name] && (
            <p className="text-xs text-destructive mt-1">{errors[field.name]}</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default DynamicFields;
