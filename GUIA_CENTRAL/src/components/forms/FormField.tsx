import { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
  className?: string;
}

const FormField = ({ label, required = false, error, children, className }: FormFieldProps) => {
  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {children}
      {error && (
        <p className="text-xs text-destructive animate-fade-in">{error}</p>
      )}
    </div>
  );
};

export default FormField;
