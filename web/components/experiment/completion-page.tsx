"use client";

import { VekonButton } from "@/components/ui/vekon-button";
import { VekonCard } from "@/components/ui/vekon-card";
import type { ConsentRecord, Exp2SummaryRow } from "@/lib/experiment/types";
import { downloadConsentCopy } from "@/lib/research/consent-export";
import { studyConfig } from "@/lib/research/study-config";

interface CompletionPageProps {
  summary: Exp2SummaryRow;
  consent: ConsentRecord;
  saved: boolean;
  saveError?: string;
  onRestart?: () => void;
}

export function CompletionPage({
  summary,
  consent,
  saved,
  saveError,
  onRestart,
}: CompletionPageProps) {
  return (
    <VekonCard
      kicker="Sessão encerrada"
      title="Obrigado pela participação!"
      subtitle="Sua colaboração é essencial para a pesquisa."
    >
      <div className="mb-6 flex flex-col items-center rounded-2xl bg-[#ecfdf5] py-8">
        <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#059669] text-3xl text-white">
          ✓
        </div>
        <p className="text-3xl font-bold text-[#059669]">{summary.points_total} pontos</p>
        <p className="mt-1 text-sm text-[#5a6b82]">
          Tempo: {Math.round(summary.duration_s_run)}s de {summary.duration_s_planned}s
        </p>
      </div>

      {saved ? (
        <p className="mb-4 rounded-xl bg-[#ecfdf5] px-4 py-3 text-sm text-[#059669]">
          Dados registrados com sucesso. Você já pode fechar esta página.
        </p>
      ) : (
        <p className="mb-4 rounded-xl bg-[#fffbeb] px-4 py-3 text-sm text-[#d97706]">
          {saveError ||
            "Houve um problema ao salvar os dados. Entre em contato com o pesquisador."}
        </p>
      )}

      <div className="space-y-2 text-sm leading-relaxed text-[#5a6b82]">
        <p>
          Código anônimo: <strong className="text-[#0c1524]">{summary.participant_id}</strong>
        </p>
        <p>
          Condição: {summary.ratio_label} (sessão {summary.session_condition})
        </p>
        <p className="text-xs">
          Dados mantidos por no mínimo {studyConfig.platform.dataRetentionYears} anos, conforme
          protocolo CEP. Dúvidas: {studyConfig.researcher.email} ou {studyConfig.cep.email}.
        </p>
      </div>

      <VekonButton
        type="button"
        variant="secondary"
        className="mt-6"
        onClick={() => downloadConsentCopy(consent)}
      >
        Baixar cópia do TCLE novamente
      </VekonButton>

      {onRestart && (
        <VekonButton type="button" variant="ghost" className="mt-3" onClick={onRestart}>
          Reiniciar (modo teste)
        </VekonButton>
      )}
    </VekonCard>
  );
}
