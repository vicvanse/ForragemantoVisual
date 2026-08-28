export interface Exp2EventRow {
  participant_id: string;
  experiment: number;
  session_condition: number;
  session_run: number;
  event_index: number;
  t_session_s: number;
  event_type: string;
  n_L_left: number;
  n_L_right: number;
  points_total: number;
  active_side: string;
  ratio_label: string;
  detail: string;
}

export interface Exp2SummaryRow {
  participant_id: string;
  experiment: number;
  session_condition: number;
  session_run: number;
  ratio_label: string;
  points_total: number;
  duration_s_run: number;
  duration_s_planned: number;
  cod_switch_count: number;
  cod_grey_ms: number;
  forage_time_left_s: number;
  forage_time_right_s: number;
  aborted: number;
  ended_by_t_esc: number;
  k_decay_per_panel: number;
  initial_n_L_left: number;
  initial_n_L_right: number;
  both_panels_visible: number;
  single_visible_panel_by_gaze: number;
  dual_target_scoring: number;
  correctkey_csv: string;
}

export interface ConsentRecord {
  tcleVersion: string;
  participantCode: string;
  fullName: string;
  email: string;
  minAge: number;
  minAgeConfirmed: boolean;
  agreed: boolean;
  lgpdAcknowledged: boolean;
  withdrawAcknowledged: boolean;
  consentCopyRequested: boolean;
  signatureDataUrl: string;
  signedAt: string;
  timezone: string;
  locale: string;
  userAgent: string;
}

export interface StudyMetadata {
  participantId: string;
  sessionCondition: number;
  sessionRun: number;
  sequenceIndex: number;
  ratioLabel: string;
  mode: "online_mouse";
  viewportW: number;
  viewportH: number;
  tcleVersion: string;
  submittedAt: string;
  platform: string;
  emailHashSkipped: true;
  /** IP não coletado — princípio de minimização (CONEP / LGPD). */
  ipCollected: false;
}

import type {
  CursorSampleRow,
  RegionTransitionRow,
} from "./cursor-sampling";

export interface ExperimentCompletePayload {
  events: Exp2EventRow[];
  summary: Exp2SummaryRow;
  cursorSamples: CursorSampleRow[];
  regionTransitions: RegionTransitionRow[];
}

export interface SubmissionPayload {
  consent: ConsentRecord;
  metadata: StudyMetadata;
  events: Exp2EventRow[];
  summary: Exp2SummaryRow;
  cursorSamples?: CursorSampleRow[];
  regionTransitions?: RegionTransitionRow[];
}

export type StudyStep =
  | "welcome"
  | "hub"
  | "consent"
  | "instructions"
  | "checklist"
  | "experiment"
  | "intermission"
  | "complete";

export function eventsToCsv(rows: Exp2EventRow[]): string {
  const headers = [
    "participant_id",
    "experiment",
    "session_condition",
    "session_run",
    "event_index",
    "t_session_s",
    "event_type",
    "n_L_left",
    "n_L_right",
    "points_total",
    "active_side",
    "ratio_label",
    "detail",
  ];
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(
      headers
        .map((h) => {
          const v = String(row[h as keyof Exp2EventRow] ?? "");
          return v.includes(",") ? `"${v.replace(/"/g, '""')}"` : v;
        })
        .join(","),
    );
  }
  return lines.join("\n");
}

export function summaryToCsv(row: Exp2SummaryRow): string {
  const headers = Object.keys(row) as (keyof Exp2SummaryRow)[];
  const lines = [headers.join(",")];
  lines.push(
    headers
      .map((h) => {
        const v = String(row[h] ?? "");
        return v.includes(",") ? `"${v.replace(/"/g, '""')}"` : v;
      })
      .join(","),
  );
  return lines.join("\n");
}
