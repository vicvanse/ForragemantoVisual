import type { ParticipantRecord } from "@/lib/research/participant-record";
import { validCompletedSessions } from "@/lib/research/participant-record";

interface ParticipantSessionHistoryProps {
  record: ParticipantRecord;
  /** Índice da próxima sessão (0-based), se houver. */
  nextSequenceIndex?: number;
}

export function ParticipantSessionHistory({
  record,
  nextSequenceIndex,
}: ParticipantSessionHistoryProps) {
  const validSessions = validCompletedSessions(record);
  const done = validSessions.length;
  const total = record.sequence.length;
  const bestPoints = validSessions.reduce(
    (max, s) => Math.max(max, s.points_total),
    0,
  );
  const totalPoints = validSessions.reduce((sum, s) => sum + s.points_total, 0);

  return (
    <div className="space-y-3 text-sm text-[#334155]">
      <div className="flex flex-wrap gap-3">
        <div className="min-w-[7rem] flex-1 rounded-xl border border-[#cbd8e8] bg-white/60 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#5a6b82]">Você</p>
          <p className="mt-1 text-lg font-bold text-[#0c1524]">
            {done}/{total} sessões
          </p>
        </div>
        {bestPoints > 0 && (
          <div className="min-w-[7rem] flex-1 rounded-xl border border-[#cbd8e8] bg-white/60 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#5a6b82]">
              Seu melhor
            </p>
            <p className="mt-1 text-lg font-bold text-[#059669]">{bestPoints} pts</p>
          </div>
        )}
        {done > 1 && (
          <div className="min-w-[7rem] flex-1 rounded-xl border border-[#cbd8e8] bg-white/60 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#5a6b82]">
              Total acumulado
            </p>
            <p className="mt-1 text-lg font-bold text-[#0c1524]">{totalPoints} pts</p>
          </div>
        )}
      </div>

      {done > 0 && (
        <ol className="max-h-44 space-y-1 overflow-y-auto rounded-xl border border-[#cbd8e8] bg-white/60 p-3 text-xs text-[#5a6b82]">
          {record.sequence.map((s) => {
            const c = validCompletedSessions(record).find(
              (x) => x.sequenceIndex === s.sequenceIndex,
            );
            const isNext = nextSequenceIndex === s.sequenceIndex;
            return (
              <li key={s.sequenceIndex}>
                {c ? "✓" : isNext ? "→" : "·"} Sessão {s.sequenceIndex + 1}
                {c ? `: ${c.points_total} pts` : isNext ? " (próxima)" : ""}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
