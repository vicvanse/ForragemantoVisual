"use client";

import { useMemo, useState } from "react";
import { VekonButton } from "@/components/ui/vekon-button";
import { VekonCard } from "@/components/ui/vekon-card";
import {
  INSTRUCTIONS_PREVIEW_BOX_FILL,
  INSTRUCTIONS_PREVIEW_BOX_LINE,
  INSTRUCTIONS_PREVIEW_TARGET_GREEN,
  psychopyToCss,
} from "@/lib/experiment/constants";
import { buildInstructionExamplePanel } from "@/lib/experiment/panel-builder";
import { PythonRandom } from "@/lib/experiment/python-random";
import { studyConfig } from "@/lib/research/study-config";

interface InstructionStepsProps {
  onComplete: () => void;
}

interface InstructionStep {
  id: string;
  title: string;
  kicker: string;
  paragraphs: string[];
  tips?: string[];
  visual?: "panel" | "layout" | "score" | "decay";
}

const STEPS: InstructionStep[] = [
  {
    id: "objetivo",
    kicker: "Passo 1 de 5",
    title: "O que você vai fazer",
    paragraphs: [
      `Sua tarefa é ganhar o máximo de pontos possível, encontrando a letra **T** escondida entre várias letras **L** em cada área da tela.`,
      `A sessão dura cerca de **${studyConfig.taskDurationMinutes} minutos**. Você controla um **ponteiro branco** com o mouse — ele indica em qual região da tela você está observando. **Isto não é eye-tracking**: o cursor é a sua resposta de observação na tarefa.`,
      "Todas as letras aparecem em tons de cinza (sem cores de ajuda). O T muda de posição apenas quando você pontua na área visível.",
    ],
    tips: [
      "A tarefa deve ficar em tela cheia (F11). Se sair da tela cheia, trocar de aba ou minimizar, o experimento pausa até você voltar.",
    ],
    visual: "panel",
  },
  {
    id: "areas",
    kicker: "Passo 2 de 5",
    title: "Duas áreas, uma visível por vez",
    paragraphs: [
      "Existem **duas áreas** — esquerda e direita — mas **apenas uma fica visível** de cada vez (com letras L e T).",
      "No lado **inativo**, você verá apenas um **quadrado cinza**. Para trocar de área, **mova o ponteiro** até esse quadrado e **mantenha-o lá**. A tela piscará brevemente em cinza e a outra área passará a ficar visível.",
      "Em **cada área** há um T diferente. Você só pode pontuar na área que está visível no momento.",
    ],
    tips: [
      "Não é necessário clicar para trocar de área — basta levar o ponteiro ao quadrado inativo e aguardar.",
    ],
    visual: "layout",
  },
  {
    id: "pontuar",
    kicker: "Passo 3 de 5",
    title: "Como pontuar",
    paragraphs: [
      "Localize o **T** entre os L na área visível. Posicione o **ponteiro sobre o T** e mantenha-o lá.",
      "Então pressione a tecla **ESPAÇO**. Cada acerto vale **1 ponto** (contador no topo da tela).",
      "Se pressionar Espaço antes de o ponteiro estar estável sobre o T, **não haverá ponto**. Espere o ponteiro estabilizar sobre a letra antes de responder.",
    ],
    tips: [
      "O cursor fica oculto na tarefa; use o ponto branco como referência.",
    ],
    visual: "score",
  },
  {
    id: "decaimento",
    kicker: "Passo 4 de 5",
    title: "Letras que somem e reinício",
    paragraphs: [
      "Com o tempo, algumas letras **L desaparecem** aos poucos em **ambas** as áreas (mesmo a que não está visível). O **T não se move** até você pontuar.",
      "Quando você acerta na área visível, **só essa área** é reiniciada: os L voltam completos e o **T aparece em nova posição**. A outra área continua de onde estava (incluindo L já removidos).",
      "Tente ganhar o máximo de pontos possíveis.",
    ],
    visual: "decay",
  },
  {
    id: "resumo",
    kicker: "Passo 5 de 5",
    title: "Resumo antes de começar",
    paragraphs: [
      "**1. Buscar** — Encontre o T na área visível.",
      "**2. Trocar** — Leve o ponteiro ao quadrado inativo e aguarde para mudar de área.",
      "**3. Pontuar** — Mantenha o ponteiro sobre o T e pressione **ESPAÇO**.",
      "**4. Persistir** — Os L vão sumindo; após cada ponto, a área atual reinicia com T em novo lugar.",
    ],
    tips: [
      "Você pode parar a qualquer momento fechando a página, sem penalidade.",
      "Na próxima etapa, confirme que seu ambiente está adequado (mouse, tela, privacidade).",
    ],
  },
];

function renderInlineBold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-[#0f2847]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function ExamplePanelIllustration() {
  const letters = useMemo(() => {
    const rng = new PythonRandom(42);
    return buildInstructionExamplePanel(0, 0, 220, 200, rng);
  }, []);

  return (
    <div className="mx-auto w-full max-w-xs">
      <div
        className="relative flex h-52 w-full items-center justify-center rounded-xl border-2 shadow-inner"
        style={{
          backgroundColor: psychopyToCss(INSTRUCTIONS_PREVIEW_BOX_FILL),
          borderColor: psychopyToCss(INSTRUCTIONS_PREVIEW_BOX_LINE),
        }}
      >
        <svg viewBox="-130 -110 260 220" className="h-full w-full" aria-hidden>
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
      </div>
      <p className="mt-3 text-center text-xs text-[#5a6b82]">
        Exemplo ilustrativo — o{" "}
        <span
          className="font-semibold"
          style={{ color: psychopyToCss(INSTRUCTIONS_PREVIEW_TARGET_GREEN) }}
        >
          T verde
        </span>{" "}
        só aparece aqui; na tarefa, tudo é cinza
      </p>
    </div>
  );
}

function LayoutDiagram() {
  return (
    <div
      className="mx-auto grid max-w-md grid-cols-2 gap-3 rounded-xl border border-[#cbd8e8] bg-[#f8fafc] p-4"
      aria-hidden
    >
      <div className="rounded-lg border-2 border-[#0f2847]/30 bg-[#666] p-3">
        <p className="mb-2 text-center text-[10px] font-bold uppercase tracking-wide text-white/80">
          Visível
        </p>
        <div className="flex h-20 items-center justify-center rounded border border-white/20 bg-[#555]">
          <span className="text-lg font-bold text-white/90">L L T L</span>
        </div>
        <p className="mt-2 text-center text-[10px] text-white/70">Painel com letras</p>
      </div>
      <div className="rounded-lg border-2 border-dashed border-[#94a3b8] bg-[#525252] p-3">
        <p className="mb-2 text-center text-[10px] font-bold uppercase tracking-wide text-white/60">
          Inativo
        </p>
        <div className="flex h-20 items-center justify-center">
          <div className="h-10 w-10 rounded border-2 border-[#888] bg-[#484848]" />
        </div>
        <p className="mt-2 text-center text-[10px] text-white/60">
          Leve o ponteiro aqui e aguarde
        </p>
      </div>
    </div>
  );
}

function ScoreDiagram() {
  return (
    <div className="mx-auto max-w-sm space-y-3 rounded-xl border border-[#cbd8e8] bg-[#f8fafc] p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0f2847] text-xs font-bold text-white">
          1
        </span>
        <p className="text-sm text-[#334155]">
          Mova o ponteiro até cobrir o <strong>T</strong>
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0f2847] text-xs font-bold text-white">
          2
        </span>
        <p className="text-sm text-[#334155]">
          Mantenha o ponteiro sobre a letra
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0891b2] text-xs font-bold text-white">
          3
        </span>
        <p className="text-sm text-[#334155]">
          Pressione{" "}
          <kbd className="rounded border border-[#cbd8e8] bg-white px-2 py-0.5 font-mono text-xs shadow-sm">
            Espaço
          </kbd>
        </p>
      </div>
    </div>
  );
}

function DecayDiagram() {
  return (
    <div className="mx-auto max-w-md space-y-2 rounded-xl border border-[#cbd8e8] bg-[#f8fafc] p-4 text-sm text-[#334155]">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 text-[#0891b2]">●</span>
        <p>
          <strong>L</strong> somem gradualmente · <strong>T</strong> fica fixo até você pontuar
        </p>
      </div>
      <div className="flex items-start gap-2">
        <span className="mt-0.5 text-[#0891b2]">●</span>
        <p>Após acertar: painel atual reinicia (L cheios + T novo)</p>
      </div>
      <div className="flex items-start gap-2">
        <span className="mt-0.5 text-[#94a3b8]">○</span>
        <p className="text-[#5a6b82]">O outro painel não reinicia — continua como estava</p>
      </div>
    </div>
  );
}

function StepVisual({ type }: { type: InstructionStep["visual"] }) {
  if (type === "panel") return <ExamplePanelIllustration />;
  if (type === "layout") return <LayoutDiagram />;
  if (type === "score") return <ScoreDiagram />;
  if (type === "decay") return <DecayDiagram />;
  return null;
}

export function InstructionSteps({ onComplete }: InstructionStepsProps) {
  const [step, setStep] = useState(0);
  const current = STEPS[step]!;
  const isLast = step === STEPS.length - 1;

  return (
    <VekonCard kicker={current.kicker} title={current.title}>
      <div className="mb-6 space-y-4">
        {current.paragraphs.map((p, i) => (
          <p key={i} className="text-base leading-relaxed text-[#334155]">
            {renderInlineBold(p)}
          </p>
        ))}
      </div>

      {current.visual && (
        <div className="mb-6">
          <StepVisual type={current.visual} />
        </div>
      )}

      {current.tips && current.tips.length > 0 && (
        <div className="mb-6 rounded-xl border border-[#bae6fd] bg-[#ecfeff] px-4 py-3 text-sm leading-relaxed text-[#0e7490]">
          {current.tips.map((tip, i) => (
            <p key={i}>{tip}</p>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-4 border-t border-[#e2e8f0] pt-6">
        <VekonButton
          type="button"
          variant="secondary"
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
        >
          Voltar
        </VekonButton>

        <div className="flex flex-col items-center gap-1">
          <div className="flex gap-1.5">
            {STEPS.map((s, i) => (
              <span
                key={s.id}
                title={s.title}
                className="h-2 w-2 rounded-full transition-colors"
                style={{
                  backgroundColor: i === step ? "#22d3ee" : i < step ? "#94a3b8" : "#cbd8e8",
                }}
              />
            ))}
          </div>
          <span className="text-[10px] text-[#94a3b8]">
            {step + 1} / {STEPS.length}
          </span>
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
