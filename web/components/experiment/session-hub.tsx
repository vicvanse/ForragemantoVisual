"use client";

import { BreakCountdown, useBreakRemainingMs } from "@/components/experiment/break-countdown";
import { ParticipantSessionHistory } from "@/components/experiment/participant-session-history";
import { VekonButton } from "@/components/ui/vekon-button";
import { VekonCard } from "@/components/ui/vekon-card";
import type { PlannedSession } from "@/lib/experiment/session-sequence";
import type { ParticipantRecord } from "@/lib/research/participant-record";
import { validCompletedSessions } from "@/lib/research/participant-record";
import { studyConfig } from "@/lib/research/study-config";

interface SessionHubProps {
  record: ParticipantRecord;
  nextSession: PlannedSession | null;
  onStartNext: () => void;
  onNeedConsent: () => void;
  lastSessionCompletedAt?: string;
}

export function SessionHub({
  record,
  nextSession,
  onStartNext,
  onNeedConsent,
  lastSessionCompletedAt,
}: SessionHubProps) {
  const done = validCompletedSessions(record).length;
  const total = record.sequence.length;
  const breakRemainingMs = useBreakRemainingMs(lastSessionCompletedAt);
  const breakReady = breakRemainingMs <= 0;

  if (record.studyComplete || !nextSession) {
    return (
      <VekonCard
        kicker="Estudo concluído"
        title="Todas as sessões foram concluídas"
        subtitle="Obrigado pela sua participação."
      >
        <p className="text-sm text-[#5a6b82]">
          Você completou {done} sessões válidas. Código anônimo:{" "}
          <strong className="text-[#0c1524]">{record.participantId}</strong>
        </p>
        <p className="mt-4 text-xs text-[#5a6b82]">
          Dúvidas: {studyConfig.researcher.email}
        </p>
      </VekonCard>
    );
  }

  return (
    <VekonCard
      kicker={`Sessão ${nextSession.sequenceIndex + 1} de ${total}`}
      title={breakReady || done === 0 ? "Pronto para a próxima tarefa?" : "Intervalo entre sessões"}
      subtitle={
        breakReady || done === 0
          ? `~${Math.round(nextSession.duration_s / 60)} min`
          : `Aguarde antes de iniciar a próxima sessão.`
      }
    >
      <div className="mb-6 space-y-3 text-sm text-[#334155]">
        <ParticipantSessionHistory
          record={record}
          nextSequenceIndex={nextSession.sequenceIndex}
        />
        {!breakReady && done > 0 && (
          <>
            <BreakCountdown lastSessionCompletedAt={lastSessionCompletedAt} />
            <p className="rounded-xl border border-[#fcd34d] bg-[#fffbeb] px-4 py-3 text-sm text-[#92400e]">
              Intervalo obrigatório ainda em andamento. Aguarde o tempo acima ou volte mais tarde.
            </p>
          </>
        )}
      </div>

      {!record.consentSigned ? (
        <VekonButton type="button" variant="accent" size="lg" className="w-full" onClick={onNeedConsent}>
          Ir para o TCLE
        </VekonButton>
      ) : (
        <VekonButton
          type="button"
          variant="accent"
          size="lg"
          className="w-full"
          disabled={!breakReady && done > 0}
          onClick={onStartNext}
        >
          {done === 0 ? "Começar primeira sessão" : breakReady ? "Continuar" : "Aguarde o intervalo…"}
        </VekonButton>
      )}
    </VekonCard>
  );
}
