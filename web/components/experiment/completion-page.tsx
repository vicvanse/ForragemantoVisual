"use client";

import { VekonButton } from "@/components/ui/vekon-button";
import { VekonCard } from "@/components/ui/vekon-card";
import type { Exp2SummaryRow } from "@/lib/experiment/types";
import { vekon } from "@/lib/vekon/tokens";

interface CompletionPageProps {
  summary: Exp2SummaryRow;
  saved: boolean;
  saveError?: string;
  onRestart?: () => void;
}

export function CompletionPage({
  summary,
  saved,
  saveError,
  onRestart,
}: CompletionPageProps) {
  return (
    <VekonCard
      title="Obrigado pela participação!"
      subtitle="Sua sessão foi concluída com sucesso."
    >
      <div
        className="mb-6 flex flex-col items-center rounded-2xl py-8"
        style={{ backgroundColor: vekon.colors.successBg }}
      >
        <div
          className="mb-3 flex h-16 w-16 items-center justify-center rounded-full text-3xl"
          style={{ backgroundColor: vekon.colors.success, color: "white" }}
        >
          ✓
        </div>
        <p className="text-3xl font-bold" style={{ color: vekon.colors.success }}>
          {summary.points_total} pontos
        </p>
        <p className="mt-1 text-sm" style={{ color: vekon.colors.textMuted }}>
          Tempo: {Math.round(summary.duration_s_run)}s de {summary.duration_s_planned}s
        </p>
      </div>

      {saved ? (
        <p
          className="mb-4 rounded-xl px-4 py-3 text-sm"
          style={{ backgroundColor: vekon.colors.successBg, color: vekon.colors.success }}
        >
          Seus dados foram registrados com sucesso. Você já pode fechar esta página.
        </p>
      ) : (
        <p
          className="mb-4 rounded-xl px-4 py-3 text-sm"
          style={{ backgroundColor: vekon.colors.warningBg, color: vekon.colors.warning }}
        >
          {saveError ||
            "Houve um problema ao salvar os dados. Entre em contato com o pesquisador."}
        </p>
      )}

      <p className="text-sm leading-relaxed" style={{ color: vekon.colors.textMuted }}>
        Código de participação: <strong>{summary.participant_id}</strong>
        <br />
        Condição: {summary.ratio_label} (sessão {summary.session_condition})
      </p>

      {onRestart && (
        <VekonButton type="button" variant="secondary" className="mt-6" onClick={onRestart}>
          Reiniciar (modo teste)
        </VekonButton>
      )}
    </VekonCard>
  );
}
