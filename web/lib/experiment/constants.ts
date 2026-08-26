import { pickSessionIndex } from "./seeds";

export const BACKGROUND_COLOR = [-0.4, -0.4, -0.4] as const;
export const EXP2_INACTIVE_SIDE_FILL = [-0.52, -0.52, -0.52] as const;
export const EXP2_INACTIVE_SIDE_LINE = [-0.64, -0.64, -0.64] as const;
export const GAZE_DOT_RADIUS_PX = 4.0;
export const GAZE_DOT_FILL = [0.92, 0.92, 0.92] as const;
export const GAZE_DOT_LINE = [-0.72, -0.72, -0.72] as const;

export const LAYOUT_MARGIN_X = 16;
export const LAYOUT_MARGIN_Y = 24;
export const PANEL_NAT_FALLBACK = [630, 800] as const;
export const REF_LAYOUT_W = 1280;
export const REF_LAYOUT_H = 768;

export const COD_FIX_MS = 600;
export const DEFAULT_COD_GREY_MS = 400;
export const TARGET_FIX_MS = 500;
export const DEFAULT_EXP2_DURATION_S = 420;

export const EXP2_N_DISTRACTOR_TOTAL = 150;
export const EXP2_DECAY_REF_PER_S = 5;
export const EXP2_DECAY_REF_MAX_PER_SIDE = 60;

export const TARGET_T_AOI_HALF_W_FRAC = 2.1294819;
export const TARGET_T_AOI_HALF_H_FRAC = 2.4024924;
export const TARGET_T_AOI_MIN_HALF_PX = 60.06231;

export const GRAYS_FOR_L: readonly [number, number, number][] = [
  [-0.22, -0.22, -0.22],
  [-0.12, -0.12, -0.12],
  [-0.02, -0.02, -0.02],
  [0.08, 0.08, 0.08],
  [0.18, 0.18, 0.18],
  [0.28, 0.28, 0.28],
  [0.38, 0.38, 0.38],
];

export const INSTRUCTIONS_PREVIEW_TARGET_GREEN = [-0.92, 0.62, -0.55] as const;
export const INSTRUCTIONS_PREVIEW_BOX_FILL = [-0.28, -0.28, -0.28] as const;
export const INSTRUCTIONS_PREVIEW_BOX_LINE = [-0.75, -0.75, -0.75] as const;

export function exp2DecayKPerPanel(): number {
  return Math.max(
    1,
    Math.round(
      (EXP2_DECAY_REF_PER_S * (EXP2_N_DISTRACTOR_TOTAL / 2)) /
        EXP2_DECAY_REF_MAX_PER_SIDE,
    ),
  );
}

export function psychopyToCss(rgb: readonly [number, number, number]): string {
  const [r, g, b] = rgb.map((v) => Math.round(((v + 1) / 2) * 255));
  return `rgb(${r}, ${g}, ${b})`;
}

export function layoutScale(sw: number, sh: number): number {
  return Math.min(sw / REF_LAYOUT_W, sh / REF_LAYOUT_H);
}

export function fitSizeContain(
  natW: number,
  natH: number,
  boxW: number,
  boxH: number,
): [number, number] {
  if (natW <= 0 || natH <= 0 || boxW <= 0 || boxH <= 0) return [boxW, boxH];
  const s = Math.min(boxW / natW, boxH / natH);
  return [Math.max(1, natW * s), Math.max(1, natH * s)];
}

export function proceduralPanelSize(boxW: number, boxH: number): [number, number] {
  return fitSizeContain(PANEL_NAT_FALLBACK[0], PANEL_NAT_FALLBACK[1], boxW, boxH);
}

export function inRect(
  gx: number,
  gy: number,
  cx: number,
  cy: number,
  halfW: number,
  halfH: number,
): boolean {
  return Math.abs(gx - cx) <= halfW && Math.abs(gy - cy) <= halfH;
}

export function halfLeftBounds(sw: number, sh: number): [number, number, number, number] {
  return [-sw / 4, 0, sw / 4, sh / 2];
}

export function halfRightBounds(sw: number, sh: number): [number, number, number, number] {
  return [sw / 4, 0, sw / 4, sh / 2];
}

export function sanitizeParticipantId(raw: string): string {
  let s = raw.trim();
  const bad = '<>:"/\\|?*';
  s = [...s].map((c) => (bad.includes(c) ? "_" : c)).join("");
  s = [...s]
    .map((c) => (c.match(/[a-zA-Z0-9_\- ]/) ? c : "_"))
    .join("");
  s = s.split(/\s+/).filter(Boolean).join("_");
  s = s.replace(/^_+|_+$/g, "") || "SEMID";
  return s.slice(0, 64);
}

export interface Exp2SessionRow {
  session: number;
  ratio_label: string;
  w_esq: number;
  w_dir: number;
  n_L_left: number;
  n_L_right: number;
  correctkey: string;
  duration_s: number;
}

export const EXP2_SESSIONS: Exp2SessionRow[] = [
  { session: 1, ratio_label: "20vs60", w_esq: 20, w_dir: 60, n_L_left: 38, n_L_right: 112, correctkey: "Right", duration_s: 420 },
  { session: 2, ratio_label: "40vs60", w_esq: 40, w_dir: 60, n_L_left: 60, n_L_right: 90, correctkey: "Right", duration_s: 420 },
  { session: 3, ratio_label: "60vs60", w_esq: 60, w_dir: 60, n_L_left: 75, n_L_right: 75, correctkey: "Right", duration_s: 420 },
  { session: 4, ratio_label: "60vs40", w_esq: 60, w_dir: 40, n_L_left: 90, n_L_right: 60, correctkey: "Left", duration_s: 420 },
  { session: 5, ratio_label: "60vs20", w_esq: 60, w_dir: 20, n_L_left: 112, n_L_right: 38, correctkey: "Left", duration_s: 420 },
  { session: 6, ratio_label: "20vs60", w_esq: 20, w_dir: 60, n_L_left: 38, n_L_right: 112, correctkey: "Right", duration_s: 420 },
  { session: 7, ratio_label: "40vs60", w_esq: 40, w_dir: 60, n_L_left: 60, n_L_right: 90, correctkey: "Right", duration_s: 420 },
  { session: 8, ratio_label: "60vs60", w_esq: 60, w_dir: 60, n_L_left: 75, n_L_right: 75, correctkey: "Right", duration_s: 420 },
  { session: 9, ratio_label: "60vs40", w_esq: 60, w_dir: 40, n_L_left: 90, n_L_right: 60, correctkey: "Left", duration_s: 420 },
  { session: 10, ratio_label: "60vs20", w_esq: 60, w_dir: 20, n_L_left: 112, n_L_right: 38, correctkey: "Left", duration_s: 420 },
];

export function pickSessionCondition(seed: string): Exp2SessionRow {
  const idx = pickSessionIndex(seed, EXP2_SESSIONS.length);
  return EXP2_SESSIONS[idx]!;
}
