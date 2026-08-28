import type { ConsentRecord } from "@/lib/experiment/types";
import type { PlannedSession } from "@/lib/experiment/session-sequence";

export interface CompletedSessionRecord {
  sequenceIndex: number;
  session: number;
  ratio_label: string;
  completedAt: string;
  duration_s_run: number;
  duration_s_planned: number;
  points_total: number;
  saved: boolean;
  valid: boolean;
  baseName?: string;
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
    record.completedSessions.filter((s) => s.valid && s.saved).map((s) => s.sequenceIndex),
  );
  for (let i = 0; i < record.sequence.length; i++) {
    if (!done.has(i)) return i;
  }
  return record.sequence.length;
}

export function isStudyComplete(record: ParticipantRecord): boolean {
  return nextPendingIndex(record) >= record.sequence.length;
}
