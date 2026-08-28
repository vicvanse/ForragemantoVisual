import type { Exp2SessionRow } from "./constants";
import { pickSessionIndex } from "./seeds";
import { studyConfig } from "@/lib/research/study-config";

/** Condições únicas do Exp. 2 (templates). */
export const EXP2_CONDITION_TEMPLATES: Omit<Exp2SessionRow, "session" | "duration_s">[] = [
  { ratio_label: "60vs60", w_esq: 60, w_dir: 60, n_L_left: 75, n_L_right: 75, correctkey: "Right" },
  { ratio_label: "20vs60", w_esq: 20, w_dir: 60, n_L_left: 38, n_L_right: 112, correctkey: "Right" },
  { ratio_label: "40vs60", w_esq: 40, w_dir: 60, n_L_left: 60, n_L_right: 90, correctkey: "Right" },
  { ratio_label: "60vs40", w_esq: 60, w_dir: 40, n_L_left: 90, n_L_right: 60, correctkey: "Left" },
  { ratio_label: "60vs20", w_esq: 60, w_dir: 20, n_L_left: 112, n_L_right: 38, correctkey: "Left" },
];

export const EQUAL_RATIO_LABEL = "60vs60";

function templateByRatio(ratio: string) {
  const t = EXP2_CONDITION_TEMPLATES.find((c) => c.ratio_label === ratio);
  if (!t) throw new Error(`Unknown ratio: ${ratio}`);
  return t;
}

function unequalRatios(): string[] {
  return EXP2_CONDITION_TEMPLATES.filter((c) => c.ratio_label !== EQUAL_RATIO_LABEL).map(
    (c) => c.ratio_label,
  );
}

/** Shuffle determinístico Fisher–Yates a partir de um seed string. */
export function seededShuffle<T>(items: T[], seed: string): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = pickSessionIndex(`${seed}|${i}`, i + 1);
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

export interface PlannedSession extends Exp2SessionRow {
  /** Índice 0-based na sequência do participante. */
  sequenceIndex: number;
  /** Repetição desta ratio_label na sequência (1, 2, …). */
  sessionRun: number;
}

function sessionRunAt(labels: string[], index: number): number {
  const label = labels[index];
  if (!label) return 1;
  let run = 0;
  for (let i = 0; i <= index; i++) {
    if (labels[i] === label) run++;
  }
  return run;
}

export function getTemplateForRatio(ratio: string): Omit<Exp2SessionRow, "session" | "duration_s"> {
  return templateByRatio(ratio);
}

/**
 * Sequência experimental:
 * - Começa com 60vs60 (reps iguais no início)
 * - Depois cada condição desigual, em ordem sorteada por participante, repetida N vezes em bloco
 * - Termina com 60vs60
 *
 * Modo teste (reps=1): [eq, A, B, C, D, eq] — 6 sessões
 * Modo ideal (reps=2): [eq, eq, A, A, B, B, C, C, D, D] — 10 sessões
 *   (com endWithEqual=true e reps=2 ficaria 11; no ideal 10 usamos só o bloco inicial duplo)
 */
export function buildParticipantSessionSequence(
  participantSeed: string,
  options?: {
    repsPerCondition?: number;
    /** Se true e reps=1, acrescenta 60vs60 no fim (obrigatório no teste). */
    endWithEqual?: boolean;
    durationS?: number;
  },
): PlannedSession[] {
  const reps = options?.repsPerCondition ?? studyConfig.sessionPlan.repsPerCondition;
  const endWithEqual = options?.endWithEqual ?? studyConfig.sessionPlan.endWithEqual;
  const durationS = options?.durationS ?? studyConfig.sessionPlan.durationS;

  const order = seededShuffle(unequalRatios(), `seq|${participantSeed}`);
  const labels: string[] = [];

  for (let i = 0; i < reps; i++) labels.push(EQUAL_RATIO_LABEL);
  for (const ratio of order) {
    for (let i = 0; i < reps; i++) labels.push(ratio);
  }
  // No modo teste (1×), garantir início e fim com mesma quantidade.
  if (endWithEqual && reps === 1) labels.push(EQUAL_RATIO_LABEL);
  // No modo ideal (2× / 10 sessões), o CSV original não termina em eq;
  // se endWithEqual && reps===2, seria 11 — mantemos 10 a menos que configurado.
  if (endWithEqual && reps > 1 && studyConfig.sessionPlan.forceTerminalEqual) {
    labels.push(EQUAL_RATIO_LABEL);
  }

  return labels.map((ratio_label, sequenceIndex) => {
    const t = templateByRatio(ratio_label);
    return {
      sequenceIndex,
      sessionRun: sessionRunAt(labels, sequenceIndex),
      session: sequenceIndex + 1,
      ratio_label: t.ratio_label,
      w_esq: t.w_esq,
      w_dir: t.w_dir,
      n_L_left: t.n_L_left,
      n_L_right: t.n_L_right,
      correctkey: t.correctkey,
      duration_s: durationS,
    };
  });
}

export function isSessionValidCompletion(
  durationSRun: number,
  durationSPlanned: number,
  aborted: number,
): boolean {
  if (aborted) return false;
  // Aceita ≥95% da duração planejada (tolerância de clock / frames).
  return durationSRun >= durationSPlanned * 0.95;
}
