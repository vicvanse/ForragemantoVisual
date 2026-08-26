"use client";

import { useState } from "react";
import { VekonButton } from "@/components/ui/vekon-button";
import { VekonCard } from "@/components/ui/vekon-card";
import { vekon } from "@/lib/vekon/tokens";

interface ChecklistPageProps {
  onReady: () => void;
}

const CHECKLIST = [
  {
    id: "desktop",
    label: "Estou usando um computador com mouse (não celular)",
  },
  {
    id: "quiet",
    label: "Estou em um ambiente silencioso, sem interrupções previstas",
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
    label: "Tenho cerca de 10 minutos livres (instruções + tarefa)",
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
      // Fullscreen optional — continue anyway
    }
    onReady();
  }

  return (
    <VekonCard
      title="Antes de começar"
      subtitle="Confirme os itens abaixo para garantir a qualidade dos dados."
    >
      <ul className="space-y-3">
        {CHECKLIST.map((item) => (
          <li key={item.id}>
            <label
              className="flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition hover:bg-[#f8fafc]"
              style={{ borderColor: vekon.colors.border }}
            >
              <input
                type="checkbox"
                checked={!!checked[item.id]}
                onChange={() => toggle(item.id)}
                className="mt-0.5 h-4 w-4 rounded"
              />
              <span className="text-sm" style={{ color: vekon.colors.text }}>
                {item.label}
              </span>
            </label>
          </li>
        ))}
      </ul>

      <div
        className="mt-6 rounded-xl p-4 text-sm"
        style={{ backgroundColor: vekon.colors.primaryLight, color: vekon.colors.primary }}
      >
        <strong>Dica:</strong> Durante a tarefa, o cursor será ocultado. Use o
        ponto branco na tela para indicar onde está olhando. Pressione{" "}
        <kbd className="rounded bg-white px-1.5 py-0.5 font-mono text-xs">Espaço</kbd>{" "}
        sobre o T para pontuar.
      </div>

      <VekonButton
        type="button"
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
