interface FormStepsProps {
  currentStep: number;
  steps: string[];
}

const FormSteps = ({ currentStep, steps }: FormStepsProps) => {
  return (
    <div className="flex gap-2 mb-8">
      {steps.map((step, i) => (
        <div
          key={i}
          className={`flex-1 py-2.5 rounded-full text-center text-sm font-semibold transition-colors ${
            i <= currentStep
              ? i < currentStep
                ? "bg-accent text-accent-foreground"
                : "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {step}
        </div>
      ))}
    </div>
  );
};

export default FormSteps;
