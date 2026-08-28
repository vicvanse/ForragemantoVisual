"use client";

import { VekonButton } from "@/components/ui/vekon-button";
import { VekonCard } from "@/components/ui/vekon-card";
import type { PlannedSession } from "@/lib/experiment/session-sequence";
import type { ParticipantRecord } from "@/lib/research/participant-record";
import { studyConfig } from "@/lib/research/study-config";

interface SessionHubProps {
  record: ParticipantRecord;
  nextSession: PlannedSession | null;
  onStartNext: () => void;
  onNeedConsent: () => void;
  breakRemainingMs: number;
}

export function SessionHub({
  record,
  nextSession,
  onStartNext,
  onNeedConsent,
  breakRemainingMs,
}: SessionHubProps) {
  const done = record.completedSessions.filter((s) => s.valid && s.saved).length;
  const total = record.sequence.length;
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
      title="Pronto para a próxima tarefa?"
      subtitle={`Condição ${nextSession.ratio_label} · ~${Math.round(nextSession.duration_s / 60)} min`}
    >
      <div className="mb-6 space-y-3 text-sm text-[#334155]">
        <p>
          Progresso salvo: <strong>{done}/{total}</strong>
        </p>
        <ol className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-[#cbd8e8] bg-white/60 p-3 text-xs text-[#5a6b82]">
          {record.sequence.map((s) => {
            const c = record.completedSessions.find(
              (x) => x.sequenceIndex === s.sequenceIndex && x.valid && x.saved,
            );
            return (
              <li key={s.sequenceIndex}>
                {c ? "✓" : s.sequenceIndex === nextSession.sequenceIndex ? "→" : "·"} Sessão{" "}
                {s.sequenceIndex + 1}: {s.ratio_label}
                {c ? ` (${c.points_total} pts)` : ""}
              </li>
            );
          })}
        </ol>
        {!breakReady && (
          <p className="rounded-xl border border-[#fcd34d] bg-[#fffbeb] px-4 py-3 text-[#92400e]">
            Intervalo obrigatório ainda em andamento. Aguarde ou volte mais tarde.
          </p>
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
          {done === 0 ? "Começar primeira sessão" : "Continuar"}
        </VekonButton>
      )}
    </VekonCard>
  );
}
