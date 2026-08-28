/**
 * Port de forrageamento_analysis_export.py — mesmas colunas e fórmulas.
 */
import type { Exp2EventRow, Exp2SummaryRow } from "./types";
import type { Exp2SessionRow } from "./constants";

export const EXP2_SUMMARY_ANALYSIS_FIELDNAMES = [
  "participant_id",
  "experiment",
  "session_condition",
  "session_run",
  "ratio_label",
  "w_left_design",
  "w_right_design",
  "prop_L_left_design",
  "prop_L_right_design",
  "initial_n_L_left",
  "initial_n_L_right",
  "forage_time_left_s",
  "forage_time_right_s",
  "forage_time_total_s",
  "prop_forage_left",
  "prop_forage_right",
  "points_total",
  "duration_s_run",
  "duration_s_planned",
  "rate_reinforcement_per_min",
  "n_reinforcement_left",
  "n_reinforcement_right",
  "prop_reinforcement_left",
  "matching_log_B",
  "matching_log_R_design",
  "matching_log_R_obtained",
  "k_decay_per_panel",
  "aborted",
  "ended_by_t_esc",
  "correctkey_csv",
] as const;

export const EXP2_DWELL_BIN_FIELDNAMES = [
  "participant_id",
  "experiment",
  "session_condition",
  "session_run",
  "ratio_label",
  "bin_index",
  "bin_start_s",
  "bin_end_s",
  "dwell_left_s",
  "dwell_right_s",
  "dwell_total_s",
  "prop_dwell_left",
  "points_total_end_bin",
  "n_reinforcement_left_cum",
  "n_reinforcement_right_cum",
] as const;

export const EXP2_REINFORCEMENT_FIELDNAMES = [
  "participant_id",
  "experiment",
  "session_condition",
  "session_run",
  "reinforcement_index",
  "t_session_s",
  "reinforced_side",
  "reinforced_is_left",
  "points_total_after",
  "n_L_left",
  "n_L_right",
  "active_side",
  "ratio_label",
] as const;

function safeFloat(v: unknown, defaultVal = 0): number {
  if (v === null || v === undefined || v === "") return defaultVal;
  const n = Number(v);
  return Number.isFinite(n) ? n : defaultVal;
}

function prop(num: number, den: number): string {
  if (den <= 0) return "";
  return String(Math.round((num / den) * 1e6) / 1e6);
}

function safeLogRatio(num: number, den: number): string {
  if (num <= 0 || den <= 0) return "";
  return String(Math.round(Math.log(num / den) * 1e6) / 1e6);
}

export function parseRatioLabel(ratioLabel: string): [number | null, number | null] {
  const s = (ratioLabel || "").trim().toLowerCase().replace(/\s/g, "");
  if (!s.includes("vs")) return [null, null];
  const parts = s.split("vs");
  if (parts.length !== 2) return [null, null];
  const a = parseInt(parts[0]!, 10);
  const b = parseInt(parts[1]!, 10);
  return [Number.isFinite(a) ? a : null, Number.isFinite(b) ? b : null];
}

function sideIsLeft(side: string): string {
  return (side || "").trim().toLowerCase() === "left" ? "1" : "0";
}

function parseReinforcedSide(detail: string): string {
  const d = (detail || "").trim().toLowerCase();
  if (d.includes("reinforced_side=left")) return "left";
  if (d.includes("reinforced_side=right")) return "right";
  return "";
}

export function enrichExp2SummaryAnalysis(
  summary: Exp2SummaryRow,
  eventRows: Exp2EventRow[],
  sessionRow?: Exp2SessionRow,
): Record<string, string | number> {
  const ratio = (summary.ratio_label || "").trim();
  let [wL, wR] = parseRatioLabel(ratio);
  if (sessionRow) {
    if (wL === null) wL = sessionRow.w_esq;
    if (wR === null) wR = sessionRow.w_dir;
  }

  const fl = safeFloat(summary.forage_time_left_s);
  const fr = safeFloat(summary.forage_time_right_s);
  const fTotal = fl + fr;
  const duration = safeFloat(summary.duration_s_run);
  const points = safeFloat(summary.points_total);
  const initL = safeFloat(summary.initial_n_L_left);
  const initR = safeFloat(summary.initial_n_L_right);
  let lTotal = initL + initR;
  if (lTotal <= 0) lTotal = 150;

  let nReinfL = 0;
  let nReinfR = 0;
  for (const ev of eventRows) {
    if (ev.event_type !== "reinforcement") continue;
    const rs = parseReinforcedSide(ev.detail);
    if (rs === "left") nReinfL++;
    else if (rs === "right") nReinfR++;
  }

  const wLf = wL ?? 0;
  const wRf = wR ?? 0;

  return {
    participant_id: summary.participant_id,
    experiment: summary.experiment,
    session_condition: summary.session_condition,
    session_run: summary.session_run,
    ratio_label: ratio,
    w_left_design: wL ?? "",
    w_right_design: wR ?? "",
    prop_L_left_design: prop(initL, lTotal),
    prop_L_right_design: prop(initR, lTotal),
    initial_n_L_left: summary.initial_n_L_left,
    initial_n_L_right: summary.initial_n_L_right,
    forage_time_left_s: Math.round(fl * 1e6) / 1e6,
    forage_time_right_s: Math.round(fr * 1e6) / 1e6,
    forage_time_total_s: Math.round(fTotal * 1e6) / 1e6,
    prop_forage_left: prop(fl, fTotal),
    prop_forage_right: prop(fr, fTotal),
    points_total: Math.trunc(points),
    duration_s_run: Math.round(duration * 1e6) / 1e6,
    duration_s_planned: summary.duration_s_planned,
    rate_reinforcement_per_min: prop(points * 60, duration),
    n_reinforcement_left: nReinfL,
    n_reinforcement_right: nReinfR,
    prop_reinforcement_left: prop(nReinfL, nReinfL + nReinfR),
    matching_log_B: fTotal > 0 ? safeLogRatio(fl, fr) : "",
    matching_log_R_design: wLf > 0 && wRf > 0 ? safeLogRatio(wLf, wRf) : "",
    matching_log_R_obtained:
      nReinfL + nReinfR > 0 ? safeLogRatio(nReinfL, nReinfR) : "",
    k_decay_per_panel: summary.k_decay_per_panel,
    aborted: summary.aborted,
    ended_by_t_esc: summary.ended_by_t_esc,
    correctkey_csv: summary.correctkey_csv,
  };
}

export function buildExp2ReinforcementRows(
  eventRows: Exp2EventRow[],
): Record<string, string | number>[] {
  const out: Record<string, string | number>[] = [];
  let idx = 0;
  for (const ev of eventRows) {
    if (ev.event_type !== "reinforcement") continue;
    const rs = parseReinforcedSide(ev.detail);
    out.push({
      participant_id: ev.participant_id,
      experiment: ev.experiment,
      session_condition: ev.session_condition,
      session_run: ev.session_run,
      reinforcement_index: idx,
      t_session_s: ev.t_session_s,
      reinforced_side: rs,
      reinforced_is_left: sideIsLeft(rs),
      points_total_after: ev.points_total,
      n_L_left: ev.n_L_left,
      n_L_right: ev.n_L_right,
      active_side: ev.active_side,
      ratio_label: ev.ratio_label,
    });
    idx++;
  }
  return out;
}

function exp2DwellSegments(
  evs: Exp2EventRow[],
): Array<[number, number, string]> {
  if (!evs.length) return [];
  const segments: Array<[number, number, string]> = [];
  let tPrev = 0;
  let sidePrev = (evs[0]!.active_side || "left").trim().toLowerCase();
  for (let i = 1; i < evs.length; i++) {
    const ev = evs[i]!;
    const tEv = safeFloat(ev.t_session_s);
    segments.push([tPrev, tEv, sidePrev]);
    tPrev = tEv;
    sidePrev = (ev.active_side || sidePrev).trim().toLowerCase();
  }
  const tEnd = safeFloat(evs[evs.length - 1]!.t_session_s);
  segments.push([tPrev, tEnd, sidePrev]);
  return segments;
}

function overlapDwell(
  segStart: number,
  segEnd: number,
  side: string,
  binStart: number,
  binEnd: number,
): [number, number] {
  const a = Math.max(segStart, binStart);
  const b = Math.min(segEnd, binEnd);
  const dt = Math.max(0, b - a);
  if (side === "left") return [dt, 0];
  return [0, dt];
}

export function buildExp2DwellBins(
  eventRows: Exp2EventRow[],
  binS = 10,
): Record<string, string | number>[] {
  if (!eventRows.length) return [];
  const evs = [...eventRows].sort(
    (a, b) => safeFloat(a.t_session_s) - safeFloat(b.t_session_s),
  );
  const meta = evs[0]!;
  const ratio = meta.ratio_label;
  const tEnd = safeFloat(evs[evs.length - 1]!.t_session_s);
  if (tEnd <= 0) return [];

  const segments = exp2DwellSegments(evs);
  const reinfByT: Array<[number, string]> = [];
  for (const ev of evs) {
    if (ev.event_type === "reinforcement") {
      reinfByT.push([safeFloat(ev.t_session_s), parseReinforcedSide(ev.detail)]);
    }
  }

  const pointsAtT: Array<[number, number]> = evs.map((ev) => [
    safeFloat(ev.t_session_s),
    Math.trunc(safeFloat(ev.points_total)),
  ]);

  const nBins = Math.max(1, Math.ceil(tEnd / binS));
  const rows: Record<string, string | number>[] = [];

  for (let b = 0; b < nBins; b++) {
    const binStart = b * binS;
    const binEnd = Math.min((b + 1) * binS, tEnd);
    let binLeft = 0;
    let binRight = 0;
    for (const [segStart, segEnd, side] of segments) {
      const [dl, dr] = overlapDwell(segStart, segEnd, side, binStart, binEnd);
      binLeft += dl;
      binRight += dr;
    }
    const nRl = reinfByT.filter(([t, s]) => s === "left" && t <= binEnd).length;
    const nRr = reinfByT.filter(([t, s]) => s === "right" && t <= binEnd).length;
    let pts = 0;
    for (const [tPt, pVal] of pointsAtT) {
      if (tPt <= binEnd) pts = pVal;
    }
    const bTotal = binLeft + binRight;

    rows.push({
      participant_id: meta.participant_id,
      experiment: meta.experiment,
      session_condition: meta.session_condition,
      session_run: meta.session_run,
      ratio_label: ratio,
      bin_index: b,
      bin_start_s: Math.round(binStart * 1000) / 1000,
      bin_end_s: Math.round(binEnd * 1000) / 1000,
      dwell_left_s: Math.round(binLeft * 1e6) / 1e6,
      dwell_right_s: Math.round(binRight * 1e6) / 1e6,
      dwell_total_s: Math.round(bTotal * 1e6) / 1e6,
      prop_dwell_left: prop(binLeft, bTotal),
      points_total_end_bin: pts,
      n_reinforcement_left_cum: nRl,
      n_reinforcement_right_cum: nRr,
    });
  }
  return rows;
}

export function rowsToCsv(
  rows: Record<string, string | number>[],
  fieldnames: readonly string[],
): string {
  const escape = (v: string) =>
    v.includes(",") || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v;
  const lines = [fieldnames.join(",")];
  for (const row of rows) {
    lines.push(
      fieldnames.map((h) => escape(String(row[h] ?? ""))).join(","),
    );
  }
  return lines.join("\n");
}

export function buildExp2TxtReport(opts: {
  participantId: string;
  sessionCondition: number;
  sessionRun: number;
  timestamp: string;
  mode: string;
  note?: string;
  summary: Exp2SummaryRow;
  eventRows: Exp2EventRow[];
}): string {
  const summaryKeys = Object.keys(opts.summary).sort();
  const lines = [
    "Forrageamento visual — Experimento 2 (sessão contínua)",
    `Participante: ${opts.participantId}`,
    `Sessão (CSV): ${opts.sessionCondition}`,
    `Repetição: ${opts.sessionRun}`,
    `Data/hora: ${opts.timestamp}`,
    `Modo: ${opts.mode}`,
    `Nota: ${opts.note || "—"}`,
    "",
    "Resumo:",
    summaryKeys
      .map((k) => `${k}\t${String((opts.summary as unknown as Record<string, unknown>)[k] ?? "")}`)
      .join("\n"),
    "",
    "--- Eventos (TSV) ---",
    [
      "t_session_s",
      "event_type",
      "active_side",
      "points_total",
      "n_L_left",
      "n_L_right",
      "detail",
    ].join("\t"),
    ...opts.eventRows.map((e) =>
      [
        e.t_session_s,
        e.event_type,
        e.active_side,
        e.points_total,
        e.n_L_left,
        e.n_L_right,
        e.detail,
      ].join("\t"),
    ),
  ];
  return lines.join("\n");
}

export interface Exp2AnalysisExports {
  analysisCsv: string;
  reinforcementsCsv: string;
  dwellBinsCsv: string;
}

export function buildExp2AnalysisExports(
  eventRows: Exp2EventRow[],
  summary: Exp2SummaryRow,
  sessionRow?: Exp2SessionRow,
  dwellBinS = 10,
): Exp2AnalysisExports {
  const summaryA = enrichExp2SummaryAnalysis(summary, eventRows, sessionRow);
  const reinfRows = buildExp2ReinforcementRows(eventRows);
  const dwellRows = buildExp2DwellBins(eventRows, dwellBinS);

  return {
    analysisCsv: rowsToCsv([summaryA], EXP2_SUMMARY_ANALYSIS_FIELDNAMES),
    reinforcementsCsv: rowsToCsv(reinfRows, EXP2_REINFORCEMENT_FIELDNAMES),
    dwellBinsCsv: rowsToCsv(dwellRows, EXP2_DWELL_BIN_FIELDNAMES),
  };
}
