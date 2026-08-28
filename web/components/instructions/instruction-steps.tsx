"use client";

import { useMemo, useState } from "react";
import { VekonButton } from "@/components/ui/vekon-button";
import { VekonCard } from "@/components/ui/vekon-card";
import {
  INSTRUCTIONS_PREVIEW_BOX_FILL,
  INSTRUCTIONS_PREVIEW_BOX_LINE,
  psychopyToCss,
} from "@/lib/experiment/constants";
import { buildInstructionExamplePanel } from "@/lib/experiment/panel-builder";
import { PythonRandom } from "@/lib/experiment/python-random";

interface InstructionStepsProps {
  onComplete: () => void;
}

const STEPS = [
  {
    title: "Bem-vindo à tarefa",
    body: "Sua missão é ganhar pontos encontrando a letra T entre várias letras L. O experimento dura cerca de 7 minutos e usa o mouse para indicar onde você está olhando.",
    icon: "🎯",
  },
  {
    title: "Duas áreas, uma visível",
    body: "Há duas áreas na tela — esquerda e direita — mas apenas uma fica visível por vez. Para trocar de área, mova o ponto branco (seu “olhar”) para o lado vazio e aguarde cerca de meio segundo.",
    icon: "↔️",
  },
  {
    title: "Como pontuar",
    body: "Em cada área existe um T escondido entre os L. Posicione o ponto sobre o T por cerca de meio segundo e pressione a barra de ESPAÇO. Cada acerto vale 1 ponto.",
    icon: "⭐",
  },
  {
    title: "Letras desaparecem",
    body: "As letras L vão desaparecendo aos poucos com o tempo. Quando você pontua, somente a área em que pontuou é reiniciada; a outra continua como estava. Tente maximizar sua pontuação!",
    icon: "⏳",
  },
];

function ExamplePanelIllustration() {
  const letters = useMemo(() => {
    const rng = new PythonRandom(42);
    return buildInstructionExamplePanel(0, 0, 220, 200, rng);
  }, []);

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center">
      <div
        className="relative flex h-52 w-56 items-center justify-center rounded-xl border-2"
        style={{
          backgroundColor: psychopyToCss(INSTRUCTIONS_PREVIEW_BOX_FILL),
          borderColor: psychopyToCss(INSTRUCTIONS_PREVIEW_BOX_LINE),
        }}
      >
        <svg viewBox="-130 -110 260 220" className="h-full w-full">
          {letters.map((l, i) => (
            <text
              key={i}
              x={l.x}
              y={-l.y}
              fill={psychopyToCss(l.color)}
              fontSize={l.letterH}
              fontWeight="bold"
              fontFamily="Arial, sans-serif"
              textAnchor="middle"
              dominantBaseline="middle"
              transform={`rotate(${-l.orientation} ${l.x} ${-l.y})`}
            >
              {l.char}
            </text>
          ))}
        </svg>
        <div className="absolute -bottom-3 rounded-full bg-[#0f2847] px-3 py-1 text-xs font-medium text-white">
          T verde = exemplo (na tarefa, tudo é cinza)
        </div>
      </div>
      <p className="mt-5 text-center text-xs leading-relaxed text-[#5a6b82]">
        O pequeno ponto branco segue seu mouse e representa sua atenção visual
      </p>
    </div>
  );
}

export function InstructionSteps({ onComplete }: InstructionStepsProps) {
  const [step, setStep] = useState(0);
  const current = STEPS[step]!;
  const isLast = step === STEPS.length - 1;

  return (
    <VekonCard kicker="Instruções" title={current.title}>
      <div className="mb-6 text-4xl">{current.icon}</div>
      <p className="mb-8 text-base leading-relaxed text-[#334155]">{current.body}</p>

      {step === 1 && (
        <div className="mb-8">
          <ExamplePanelIllustration />
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <VekonButton
          type="button"
          variant="secondary"
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
        >
          Voltar
        </VekonButton>

        <div className="flex gap-1.5">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className="h-2 w-2 rounded-full transition-colors"
              style={{
                backgroundColor: i === step ? "#22d3ee" : "#cbd8e8",
              }}
            />
          ))}
        </div>

        <VekonButton
          type="button"
          variant="accent"
          onClick={() => (isLast ? onComplete() : setStep((s) => s + 1))}
        >
          {isLast ? "Entendi, continuar" : "Próximo"}
        </VekonButton>
      </div>
    </VekonCard>
  );
}
