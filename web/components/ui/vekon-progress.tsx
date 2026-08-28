const STEP_LABELS = [
  "Boas-vindas",
  "TCLE",
  "Instruções",
  "Preparação",
  "Tarefa",
  "Conclusão",
];

interface VekonProgressProps {
  currentStep: number;
}

export function VekonProgress({ currentStep }: VekonProgressProps) {
  const pct = ((currentStep + 1) / STEP_LABELS.length) * 100;
  return (
    <div className="w-full">
      <div className="mb-2 flex justify-between text-xs font-semibold text-[#5a6b82]">
        <span>Progresso</span>
        <span>
          {currentStep + 1} / {STEP_LABELS.length}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#dbe4ef]">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, #0891b2, #22d3ee)",
            boxShadow: "0 0 12px rgba(34, 211, 238, 0.45)",
          }}
        />
      </div>
      <p className="mt-2 text-sm font-semibold text-[#0f2847]">{STEP_LABELS[currentStep]}</p>
    </div>
  );
}
