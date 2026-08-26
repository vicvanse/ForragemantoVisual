import { vekon } from "@/lib/vekon/tokens";

const STEP_LABELS = ["Boas-vindas", "TCLE", "Instruções", "Preparação", "Tarefa", "Conclusão"];

interface VekonProgressProps {
  currentStep: number;
}

export function VekonProgress({ currentStep }: VekonProgressProps) {
  return (
    <div className="w-full">
      <div className="mb-2 flex justify-between text-xs font-medium" style={{ color: vekon.colors.textMuted }}>
        <span>Progresso</span>
        <span>
          {currentStep + 1} / {STEP_LABELS.length}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#e8eef5]">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${((currentStep + 1) / STEP_LABELS.length) * 100}%`,
            backgroundColor: vekon.colors.accent,
          }}
        />
      </div>
      <p className="mt-2 text-sm font-semibold" style={{ color: vekon.colors.primary }}>
        {STEP_LABELS[currentStep]}
      </p>
    </div>
  );
}
