"use client";

import { BreakCountdown, useBreakRemainingMs } from "@/components/experiment/break-countdown";
import { ParticipantSessionHistory } from "@/components/experiment/participant-session-history";
import { VekonButton } from "@/components/ui/vekon-button";
import { VekonCard } from "@/components/ui/vekon-card";
import type { ParticipantRecord } from "@/lib/research/participant-record";
import { validCompletedSessions } from "@/lib/research/participant-record";
import { studyConfig } from "@/lib/research/study-config";

interface IntermissionPageProps {
  record: ParticipantRecord;
  justCompleted?: {
    points: number;
  };
  onContinue: () => void;
  onLeave: () => void;
}

export function IntermissionPage({
  record,
  justCompleted,
  onContinue,
  onLeave,
}: IntermissionPageProps) {
  const leftMs = useBreakRemainingMs(record.lastSessionCompletedAt);
  const ready = leftMs <= 0;
  const total = record.sequence.length;
  const done = validCompletedSessions(record).length;

  return (
    <VekonCard
      kicker={`Sessão ${done} de ${total} concluída`}
      title={ready ? "Intervalo concluído" : "Intervalo entre sessões"}
      subtitle={
        ready
          ? "Você pode iniciar a próxima sessão quando quiser."
          : `Aguarde ${Math.round(studyConfig.sessionPlan.interSessionBreakS / 60)} minutos antes da próxima sessão (ou volte depois com o mesmo e-mail).`
      }
    >
      {justCompleted && (
        <div className="mb-6 rounded-xl bg-[#ecfdf5] px-4 py-4 text-center">
          <p className="text-2xl font-bold text-[#059669]">{justCompleted.points} pontos</p>
        </div>
      )}

      <div className="mb-6 space-y-4">
        <ParticipantSessionHistory
          record={record}
          nextSequenceIndex={record.nextSequenceIndex}
        />

        <p className="rounded-xl border border-[#cbd8e8] bg-[#f8fafc] px-4 py-3 text-sm text-[#334155]">
          Se a tarefa estiver em tela cheia, pressione{" "}
          <kbd className="rounded border border-[#cbd8e8] bg-white px-1.5 py-0.5 font-mono text-xs shadow-sm">
            F11
          </kbd>{" "}
          para sair durante o intervalo.
        </p>
        {!ready && <BreakCountdown lastSessionCompletedAt={record.lastSessionCompletedAt} />}
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
