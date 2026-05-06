interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {steps.map((item, index) => (
        <div
          key={item}
          className={`rounded-md border px-3 py-2 text-sm ${
            index === currentStep
              ? "border-[#2f80ed] bg-[#2f80ed] text-white"
              : index < currentStep
                ? "border-[#22c55e] bg-[#22c55e] text-white"
                : "border-[#e5e7eb] bg-[#f8f9fa] text-[#6b7280]"
          }`}
        >
          <span className="mr-2 font-semibold">Step {index + 1}</span>
          {item}
        </div>
      ))}
    </div>
  );
}

