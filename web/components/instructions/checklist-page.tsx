"use client";

import { useState } from "react";
import { VekonButton } from "@/components/ui/vekon-button";
import { VekonCard } from "@/components/ui/vekon-card";
import { studyConfig } from "@/lib/research/study-config";

interface ChecklistPageProps {
  onReady: () => void;
}

const CHECKLIST = [
  {
    id: "desktop",
    label: "Estou usando computador com mouse (não celular ou tablet)",
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
    label: "Estou em ambiente silencioso, sem interrupções previstas",
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
    id: "time",
    label: `Tenho cerca de ${studyConfig.studyDurationMinutes} minutos livres`,
  },
  {
    id: "withdraw",
    label: "Sei que posso interromper a qualquer momento fechando esta página",
  },
];

export function ChecklistPage({ onReady }: ChecklistPageProps) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const allChecked = CHECKLIST.every((item) => checked[item.id]);

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
      kicker="Ambiente virtual"
      title="Preparação e privacidade"
      subtitle="Confirme os itens abaixo (orientações CONEP para coleta online)."
    >
      <ul className="space-y-3">
        {CHECKLIST.map((item) => (
          <li key={item.id}>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#cbd8e8] bg-white/50 p-4 transition hover:border-[#22d3ee]/35 hover:bg-white/80">
              <input
                type="checkbox"
                checked={!!checked[item.id]}
                onChange={() => toggle(item.id)}
                className="mt-0.5 h-4 w-4 rounded accent-[#0891b2]"
              />
              <span className="text-sm text-[#0c1524]">{item.label}</span>
            </label>
          </li>
        ))}
      </ul>

      <div className="mt-6 rounded-xl border border-[#bae6fd] bg-[#ecfeff] p-4 text-sm text-[#0e7490]">
        <strong>Dica:</strong> O cursor será ocultado na tarefa. O ponto branco indica sua
        atenção. Pressione{" "}
        <kbd className="rounded bg-white px-1.5 py-0.5 font-mono text-xs">Espaço</kbd> sobre
        o T para pontuar. Não coletamos endereço IP.
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
