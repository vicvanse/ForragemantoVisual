import type { ConsentRecord } from "@/lib/experiment/types";
import type { PlannedSession } from "@/lib/experiment/session-sequence";
import { isSessionValidCompletion } from "@/lib/experiment/session-sequence";

export interface CompletedSessionRecord {
  sequenceIndex: number;
  session: number;
  ratio_label: string;
  completedAt: string;
  duration_s_run: number;
  duration_s_planned: number;
  points_total: number;
  aborted?: number;
  saved: boolean;
  valid: boolean;
  baseName?: string;
}

/** Sessão conta para avançar só se válida e salva (≥95% da duração, não abortada). */
export function isCompletedSessionRecordValid(
  entry: Pick<
    CompletedSessionRecord,
    "duration_s_run" | "duration_s_planned" | "aborted" | "valid" | "saved"
  >,
): boolean {
  if (!entry.saved) return false;
  return isSessionValidCompletion(
    entry.duration_s_run,
    entry.duration_s_planned,
    entry.aborted ?? 0,
  );
}

export function validCompletedSessions(record: ParticipantRecord): CompletedSessionRecord[] {
  return record.completedSessions.filter((s) => isCompletedSessionRecordValid(s));
}

export interface ParticipantRecord {
  email: string;
  participantId: string;
  fullName: string;
  consentSigned: boolean;
  /** Consentimento sem signatureDataUrl grande (assinatura em arquivo separado no servidor). */
  consent?: Omit<ConsentRecord, "signatureDataUrl"> & { hasSignature: boolean };
  sequence: PlannedSession[];
  completedSessions: CompletedSessionRecord[];
  /** Próximo índice a executar (pula inválidos / incompletos). */
  nextSequenceIndex: number;
  lastSessionCompletedAt?: string;
  createdAt: string;
  updatedAt: string;
  studyComplete: boolean;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function nextPendingIndex(record: ParticipantRecord): number {
  const done = new Set(
    record.completedSessions
      .filter((s) => isCompletedSessionRecordValid(s))
      .map((s) => s.sequenceIndex),
  );
  for (let i = 0; i < record.sequence.length; i++) {
    if (!done.has(i)) return i;
  }
  return record.sequence.length;
}

export function isStudyComplete(record: ParticipantRecord): boolean {
  return nextPendingIndex(record) >= record.sequence.length;
}
