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
  studyComplete?: boolean;
  progressLabel?: string;
  onContinueLater?: () => void;
  onRetrySession?: () => void;
  onRestart?: () => void;
}

export function CompletionPage({
  summary,
  consent,
  saved,
  saveError,
  studyComplete,
  progressLabel,
  onContinueLater,
  onRetrySession,
  onRestart,
}: CompletionPageProps) {
  return (
    <VekonCard
      kicker={studyComplete ? "Estudo concluído" : "Sessão encerrada"}
      title={
        studyComplete
          ? "Obrigado pela participação!"
          : saveError
            ? "Sessão incompleta"
            : "Sessão registrada"
      }
      subtitle={
        studyComplete
          ? "Sua colaboração é essencial para a pesquisa."
          : progressLabel
            ? `Progresso: ${progressLabel}`
            : undefined
      }
    >
      {summary.session_condition > 0 && (
        <div className="mb-6 flex flex-col items-center rounded-2xl bg-[#ecfdf5] py-8">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#059669] text-3xl text-white">
            ✓
          </div>
          <p className="text-3xl font-bold text-[#059669]">{summary.points_total} pontos</p>
          <p className="mt-1 text-sm text-[#5a6b82]">
            Tempo: {Math.round(summary.duration_s_run)}s de {summary.duration_s_planned}s
          </p>
        </div>
      )}

      {saved && !saveError ? (
        <p className="mb-4 rounded-xl bg-[#ecfdf5] px-4 py-3 text-sm text-[#059669]">
          {studyComplete
            ? "Todas as sessões válidas foram registradas. Você já pode fechar esta página."
            : "Dados desta sessão registrados. Use o mesmo e-mail para continuar depois."}
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
        {summary.ratio_label !== "—" && (
          <p>
            Condição: {summary.ratio_label} (sessão {summary.session_condition})
          </p>
        )}
        <p className="text-xs">
          Dados mantidos por no mínimo {studyConfig.platform.dataRetentionYears} anos, conforme
          protocolo CEP. Dúvidas: {studyConfig.researcher.email} ou {studyConfig.cep.email}.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {onRetrySession && (
          <VekonButton type="button" variant="accent" onClick={onRetrySession}>
            Refazer esta sessão
          </VekonButton>
        )}
        {onContinueLater && !studyComplete && (
          <VekonButton type="button" variant="secondary" onClick={onContinueLater}>
            Sair (continuar depois com o mesmo e-mail)
          </VekonButton>
        )}
        <VekonButton
          type="button"
          variant="secondary"
          onClick={() => downloadConsentCopy(consent)}
        >
          Baixar cópia do TCLE novamente
        </VekonButton>
        {onRestart && (
          <VekonButton type="button" variant="ghost" onClick={onRestart}>
            Reiniciar (modo teste)
          </VekonButton>
        )}
      </div>
    </VekonCard>
  );
}
