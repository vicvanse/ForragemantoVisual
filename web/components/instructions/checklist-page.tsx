"use client";

import { useEffect, useState } from "react";
import { VekonButton } from "@/components/ui/vekon-button";
import { VekonCard } from "@/components/ui/vekon-card";
import { cursorMethodologyNote } from "@/lib/research/online-research-supplement";
import { studyConfig } from "@/lib/research/study-config";

interface ChecklistPageProps {
  onReady: () => void;
}

function buildChecklist() {
  const { minViewportWidth, minViewportHeight, supportedBrowsers } = studyConfig.technical;
  return [
    {
      id: "desktop",
      label: "Estou usando computador ou notebook com mouse (não celular nem tablet)",
    },
    {
      id: "browser",
      label: `Uso navegador compatível (${supportedBrowsers})`,
    },
    {
      id: "resolution",
      label: `Minha janela tem pelo menos ${minViewportWidth}×${minViewportHeight} pixels`,
    },
    {
      id: "age",
      label: `Confirmo ter ${studyConfig.minAge} anos ou mais`,
    },
    {
      id: "private",
      label: "Estou em local privado, onde ninguém verá minha tela sem meu consentimento",
    },
    {
      id: "quiet",
      label: "Estou em ambiente adequado, sem interrupções previstas",
    },
    {
      id: "fullscreen",
      label: "Posso maximizar a janela do navegador durante a tarefa",
    },
    {
      id: "keyboard",
      label: "Tenho teclado com barra de Espaço funcionando",
    },
    {
      id: "cursor-understood",
      label:
        "Entendo que o ponteiro na tela segue meu cursor (não é eye-tracking nem gravação de webcam)",
    },
    {
      id: "time",
      label: `Tenho cerca de ${studyConfig.studyDurationMinutes} minutos livres`,
    },
    {
      id: "withdraw",
      label:
        "Sei que posso interromper a qualquer momento fechando esta página; sessões incompletas não são salvas automaticamente",
    },
  ];
}

export function ChecklistPage({ onReady }: ChecklistPageProps) {
  const checklist = buildChecklist();
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [viewportOk, setViewportOk] = useState<boolean | null>(null);
  const allChecked = checklist.every((item) => checked[item.id]);

  useEffect(() => {
    const ok =
      window.innerWidth >= studyConfig.technical.minViewportWidth &&
      window.innerHeight >= studyConfig.technical.minViewportHeight;
    setViewportOk(ok);
  }, []);

  function toggle(id: string) {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  async function handleStart() {
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      // Tela cheia opcional
    }
    onReady();
  }

  return (
    <VekonCard
      kicker="Ambiente virtual · CONEP"
      title="Preparação técnica e privacidade"
      subtitle="Confirme os itens abaixo antes de iniciar a tarefa."
    >
      {viewportOk === false && (
        <div className="mb-4 rounded-xl border border-[#fcd34d] bg-[#fffbeb] px-4 py-3 text-sm text-[#92400e]">
          Sua janela atual ({typeof window !== "undefined" ? window.innerWidth : "?"}×
          {typeof window !== "undefined" ? window.innerHeight : "?"}) pode ser pequena demais.
          Maximize o navegador ou use uma tela maior.
        </div>
      )}

      <ul className="space-y-3">
        {checklist.map((item) => (
          <li key={item.id}>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#cbd8e8] bg-white/50 p-4 transition hover:border-[#22d3ee]/35 hover:bg-white/80">
              <input
                type="checkbox"
                checked={!!checked[item.id]}
                onChange={() => toggle(item.id)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded accent-[#0891b2]"
              />
              <span className="text-sm text-[#0c1524]">{item.label}</span>
            </label>
          </li>
        ))}
      </ul>

      <div className="mt-6 space-y-3 rounded-xl border border-[#bae6fd] bg-[#ecfeff] p-4 text-sm text-[#0e7490]">
        <p>
          <strong>Na tarefa:</strong> o cursor controla um ponteiro na tela (resposta de
          observação). Pressione{" "}
          <kbd className="rounded bg-white px-1.5 py-0.5 font-mono text-xs">Espaço</kbd>{" "}
          sobre o T para pontuar.
        </p>
        <p className="text-xs leading-relaxed opacity-90">{cursorMethodologyNote}</p>
      </div>

      <VekonButton
        type="button"
        variant="accent"
        size="lg"
        className="mt-6 w-full"
        disabled={!allChecked}
        onClick={handleStart}
      >
        Iniciar experimento
      </VekonButton>
    </VekonCard>
  );
}
