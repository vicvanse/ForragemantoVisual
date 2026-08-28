/**
 * Amostragem do cursor (equivalente operacional ao gaze no dummy/EyeLink).
 * Regiões alinhadas às IAs do Data Viewer (metades, painéis, alvo T).
 */
import { halfLeftBounds, halfRightBounds, inRect, type Exp2SessionRow } from "./constants";
import type { PanelState } from "./panel-builder";

export const CURSOR_SAMPLE_FIELDNAMES = [
  "participant_id",
  "experiment",
  "session_condition",
  "session_run",
  "sample_index",
  "t_session_s",
  "cursor_x",
  "cursor_y",
  "active_side",
  "half_region",
  "panel_visible_side",
  "in_target_aoi",
  "target_side",
  "in_inactive_half",
  "in_cod_grey",
  "ratio_label",
  "mode",
] as const;

export const REGION_TRANSITION_FIELDNAMES = [
  "participant_id",
  "experiment",
  "session_condition",
  "session_run",
  "transition_index",
  "t_session_s",
  "from_region",
  "to_region",
  "active_side",
  "ratio_label",
] as const;

export interface CursorSampleRow {
  participant_id: string;
  experiment: number;
  session_condition: number;
  session_run: number;
  sample_index: number;
  t_session_s: number;
  cursor_x: number;
  cursor_y: number;
  active_side: string;
  half_region: string;
  panel_visible_side: string;
  in_target_aoi: number;
  target_side: string;
  in_inactive_half: number;
  in_cod_grey: number;
  ratio_label: string;
  mode: string;
}

export interface RegionTransitionRow {
  participant_id: string;
  experiment: number;
  session_condition: number;
  session_run: number;
  transition_index: number;
  t_session_s: number;
  from_region: string;
  to_region: string;
  active_side: string;
  ratio_label: string;
}

export interface CursorRegionState {
  regionKey: string;
  halfRegion: "left" | "right" | "none";
  panelVisibleSide: "left" | "right" | "grey";
  inTargetAoi: boolean;
  targetSide: "left" | "right" | "none";
  inInactiveHalf: boolean;
}

export function classifyCursorRegions(
  gx: number,
  gy: number,
  sw: number,
  sh: number,
  activeSide: "left" | "right",
  leftPanel: PanelState,
  rightPanel: PanelState,
  inCodGrey: boolean,
): CursorRegionState {
  if (inCodGrey) {
    return {
      regionKey: "cod_grey",
      halfRegion: "none",
      panelVisibleSide: "grey",
      inTargetAoi: false,
      targetSide: "none",
      inInactiveHalf: false,
    };
  }

  const [lcx, lcy, lhw, lhh] = halfLeftBounds(sw, sh);
  const [rcx, rcy, rhw, rhh] = halfRightBounds(sw, sh);
  const inLeftHalf = Number.isFinite(gx) && inRect(gx, gy, lcx, lcy, lhw, lhh);
  const inRightHalf = Number.isFinite(gx) && inRect(gx, gy, rcx, rcy, rhw, rhh);

  let halfRegion: "left" | "right" | "none" = "none";
  if (inLeftHalf && !inRightHalf) halfRegion = "left";
  else if (inRightHalf && !inLeftHalf) halfRegion = "right";
  else if (inLeftHalf && inRightHalf) halfRegion = gx < 0 ? "left" : "right";

  const inactive = activeSide === "left" ? "right" : "left";
  const inInactiveHalf =
    inactive === "left"
      ? inRect(gx, gy, lcx, lcy, lhw, lhh)
      : inRect(gx, gy, rcx, rcy, rhw, rhh);

  const activePanel = activeSide === "left" ? leftPanel : rightPanel;
  const leftAoi = leftPanel.targetAoi;
  const rightAoi = rightPanel.targetAoi;

  let inLeftTarget =
    leftAoi !== null && inRect(gx, gy, leftAoi[0], leftAoi[1], leftAoi[2], leftAoi[3]);
  let inRightTarget =
    rightAoi !== null && inRect(gx, gy, rightAoi[0], rightAoi[1], rightAoi[2], rightAoi[3]);

  if (inLeftTarget && inRightTarget) {
    if (gx < 0) inRightTarget = false;
    else inLeftTarget = false;
  }
  if (activeSide === "left") inRightTarget = false;
  else inLeftTarget = false;

  let targetSide: "left" | "right" | "none" = "none";
  if (inLeftTarget) targetSide = "left";
  else if (inRightTarget) targetSide = "right";

  const inTargetAoi = inLeftTarget || inRightTarget;

  let regionKey = `half_${halfRegion}`;
  if (inTargetAoi) regionKey = `target_${targetSide}`;
  else if (inInactiveHalf) regionKey = `inactive_${inactive}`;

  return {
    regionKey,
    halfRegion,
    panelVisibleSide: activeSide,
    inTargetAoi,
    targetSide,
    inInactiveHalf,
  };
}

export function cursorSamplesToCsv(rows: CursorSampleRow[]): string {
  const escape = (v: string) =>
    v.includes(",") ? `"${v.replace(/"/g, '""')}"` : v;
  const lines = [CURSOR_SAMPLE_FIELDNAMES.join(",")];
  for (const r of rows) {
    lines.push(
      CURSOR_SAMPLE_FIELDNAMES.map((h) =>
        escape(String(r[h as keyof CursorSampleRow] ?? "")),
      ).join(","),
    );
  }
  return lines.join("\n");
}

export function regionTransitionsToCsv(rows: RegionTransitionRow[]): string {
  const escape = (v: string) =>
    v.includes(",") ? `"${v.replace(/"/g, '""')}"` : v;
  const lines = [REGION_TRANSITION_FIELDNAMES.join(",")];
  for (const r of rows) {
    lines.push(
      REGION_TRANSITION_FIELDNAMES.map((h) =>
        escape(String(r[h as keyof RegionTransitionRow] ?? "")),
      ).join(","),
    );
  }
  return lines.join("\n");
}

export function sessionRunForSequence(
  sequence: Pick<Exp2SessionRow, "ratio_label">[],
  sequenceIndex: number,
): number {
  const label = sequence[sequenceIndex]?.ratio_label;
  if (!label) return 1;
  let run = 0;
  for (let i = 0; i <= sequenceIndex; i++) {
    if (sequence[i]?.ratio_label === label) run++;
  }
  return run;
}
