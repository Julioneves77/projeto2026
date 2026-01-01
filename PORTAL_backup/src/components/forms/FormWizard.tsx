import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Check, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  title: string;
  description?: string;
}

interface FormWizardProps {
  steps: Step[];
  currentStep: number;
  children: ReactNode;
  onNext: () => void;
  onBack: () => void;
  onSubmit: () => void;
  isNextDisabled?: boolean;
  isSubmitting?: boolean;
}

const FormWizard = ({
  steps,
  currentStep,
  children,
  onNext,
  onBack,
  onSubmit,
  isNextDisabled = false,
  isSubmitting = false,
}: FormWizardProps) => {
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 font-semibold transition-all duration-300",
                    index < currentStep
                      ? "border-secondary bg-secondary text-secondary-foreground"
                      : index === currentStep
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted bg-muted text-muted-foreground"
                  )}
                >
                  {index < currentStep ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span
                  className={cn(
                    "mt-2 text-xs font-medium text-center max-w-[80px] hidden sm:block",
                    index <= currentStep ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 w-8 sm:w-16 lg:w-24 mx-2 transition-all duration-300",
                    index < currentStep ? "bg-secondary" : "bg-muted"
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Current Step Info */}
      <div className="mb-6 text-center">
        <h3 className="font-heading text-xl font-bold text-foreground">
          {steps[currentStep].title}
        </h3>
        {steps[currentStep].description && (
          <p className="mt-1 text-sm text-muted-foreground">
            {steps[currentStep].description}
          </p>
        )}
      </div>

      {/* Form Content */}
      <div className="rounded-xl border border-border bg-card p-6 card-shadow animate-fade-in">
        {children}
      </div>

      {/* Navigation Buttons */}
      <div className="mt-6 flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          disabled={isFirstStep}
          className={cn(isFirstStep && "invisible")}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Voltar
        </Button>

        {isLastStep ? (
          <Button
            type="button"
            variant="success"
            size="lg"
            onClick={onSubmit}
            disabled={isNextDisabled || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Enviando...
              </>
            ) : (
              "Solicitar Certidão"
            )}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={onNext}
            disabled={isNextDisabled}
            size="lg"
          >
            Continuar
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default FormWizard;
