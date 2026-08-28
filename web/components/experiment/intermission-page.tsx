"use client";

import { useEffect, useState } from "react";
import { VekonButton } from "@/components/ui/vekon-button";
import { VekonCard } from "@/components/ui/vekon-card";
import type { PlannedSession } from "@/lib/experiment/session-sequence";
import type { ParticipantRecord } from "@/lib/research/participant-record";
import { studyConfig } from "@/lib/research/study-config";

interface IntermissionPageProps {
  record: ParticipantRecord;
  nextSession: PlannedSession;
  justCompleted?: {
    points: number;
    durationS: number;
    ratioLabel: string;
    sequenceIndex: number;
  };
  onContinue: () => void;
  onLeave: () => void;
}

function remainingBreakMs(lastCompletedAt?: string): number {
  if (!lastCompletedAt) return 0;
  const elapsed = Date.now() - new Date(lastCompletedAt).getTime();
  const need = studyConfig.sessionPlan.interSessionBreakS * 1000;
  return Math.max(0, need - elapsed);
}

export function IntermissionPage({
  record,
  nextSession,
  justCompleted,
  onContinue,
  onLeave,
}: IntermissionPageProps) {
  const [leftMs, setLeftMs] = useState(() => remainingBreakMs(record.lastSessionCompletedAt));

  useEffect(() => {
    setLeftMs(remainingBreakMs(record.lastSessionCompletedAt));
    const id = setInterval(() => {
      setLeftMs(remainingBreakMs(record.lastSessionCompletedAt));
    }, 250);
    return () => clearInterval(id);
  }, [record.lastSessionCompletedAt]);

  const ready = leftMs <= 0;
  const total = record.sequence.length;
  const done = record.completedSessions.filter((s) => s.valid && s.saved).length;
  const mins = Math.floor(leftMs / 60000);
  const secs = Math.floor((leftMs % 60000) / 1000);

  return (
    <VekonCard
      kicker={`Sessão ${done} de ${total} concluída`}
      title={ready ? "Intervalo concluído" : "Intervalo entre sessões"}
      subtitle={
        ready
          ? "Você pode iniciar a próxima condição quando quiser."
          : `Aguarde ${Math.round(studyConfig.sessionPlan.interSessionBreakS / 60)} minutos antes da próxima sessão (ou volte depois com o mesmo e-mail).`
      }
    >
      {justCompleted && (
        <div className="mb-6 rounded-xl bg-[#ecfdf5] px-4 py-4 text-center">
          <p className="text-2xl font-bold text-[#059669]">{justCompleted.points} pontos</p>
          <p className="mt-1 text-sm text-[#5a6b82]">
            Condição {justCompleted.ratioLabel} · {Math.round(justCompleted.durationS)}s
          </p>
        </div>
      )}

      <div className="mb-6 space-y-2 text-sm text-[#334155]">
        <p>
          Progresso: <strong>{done}/{total}</strong> sessões válidas
        </p>
        <p>
          Próxima: sessão {nextSession.sequenceIndex + 1} · condição{" "}
          <strong>{nextSession.ratio_label}</strong>
        </p>
        {!ready && (
          <p className="rounded-xl border border-[#bae6fd] bg-[#ecfeff] px-4 py-3 text-center text-lg font-bold tabular-nums text-[#0e7490]">
            {mins}:{secs.toString().padStart(2, "0")}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <VekonButton
          type="button"
          variant="accent"
          size="lg"
          className="w-full"
          disabled={!ready}
          onClick={onContinue}
        >
          {ready ? "Iniciar próxima sessão" : "Aguarde o intervalo…"}
        </VekonButton>
        <VekonButton type="button" variant="secondary" className="w-full" onClick={onLeave}>
          Sair e continuar depois
        </VekonButton>
      </div>
      <p className="mt-4 text-xs text-[#5a6b82]">
        Ao voltar, use o e-mail <strong>{record.email}</strong>. Código: {record.participantId}
      </p>
    </VekonCard>
  );
}
