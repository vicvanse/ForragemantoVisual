import {
  GRAYS_FOR_L,
  TARGET_T_AOI_HALF_H_FRAC,
  TARGET_T_AOI_HALF_W_FRAC,
  TARGET_T_AOI_MIN_HALF_PX,
  psychopyToCss,
} from "./constants";
import { PythonRandom } from "./python-random";

export interface LetterStim {
  char: "L" | "T";
  x: number;
  y: number;
  letterH: number;
  color: readonly [number, number, number];
  /** Cor CSS pré-calculada (evita alocação no loop de desenho). */
  colorCss: string;
  orientation: number;
  /** Orientação em radianos, já convertida para canvas. */
  oriRad: number;
  visible: boolean;
}

function makeLetter(
  char: "L" | "T",
  x: number,
  y: number,
  letterH: number,
  color: readonly [number, number, number],
  orientation: number,
): LetterStim {
  return {
    char,
    x,
    y,
    letterH,
    color,
    colorCss: psychopyToCss(color),
    orientation,
    oriRad: (-orientation * Math.PI) / 180,
    visible: true,
  };
}

export interface PanelState {
  cx: number;
  cy: number;
  panelW: number;
  panelH: number;
  letters: LetterStim[];
  lLetters: LetterStim[];
  tLetter: LetterStim | null;
  targetAoi: [number, number, number, number] | null;
}

function scatterPositionsInRect(
  cx: number,
  cy: number,
  panelW: number,
  panelH: number,
  nPoints: number,
  minDist: number,
  margin: number,
  rng: PythonRandom,
): [number, number][] {
  const halfW = panelW / 2 - margin;
  const halfH = panelH / 2 - margin;
  if (halfW <= 1 || halfH <= 1 || nPoints <= 0) return [];

  let md = minDist;
  let best: [number, number][] = [];

  for (let relax = 0; relax < 18; relax++) {
    const out: [number, number][] = [];
    const minD2 = md * md;
    // Cap attempts to keep panel rebuilds fluid in the browser.
    const maxAttempts = Math.max(4000, nPoints * 80);
    let attempts = 0;

    while (out.length < nPoints && attempts < maxAttempts) {
      attempts++;
      const x = cx + rng.uniform(-halfW, halfW);
      const y = cy + rng.uniform(-halfH, halfH);
      let ok = true;
      // Check recent points first (cheaper early reject for dense packs).
      for (let j = out.length - 1; j >= 0; j--) {
        const [ox, oy] = out[j]!;
        const dx = x - ox;
        const dy = y - oy;
        if (dx * dx + dy * dy < minD2) {
          ok = false;
          break;
        }
      }
      if (ok) out.push([x, y]);
    }

    if (out.length >= nPoints) return out.slice(0, nPoints);
    if (out.length > best.length) best = out;
    md *= 0.9;
  }

  return best.length >= nPoints ? best.slice(0, nPoints) : best;
}

export function buildExp2FixedLtPanel(
  cx: number,
  cy: number,
  panelW: number,
  panelH: number,
  nLDistractors: number,
  includeTarget: boolean,
  rng: PythonRandom,
): PanelState {
  const density = Math.min(panelW, panelH) / 10;
  const cellBase = Math.max(36, Math.min(56, density));
  const nCols = Math.max(5, Math.floor(panelW / cellBase));
  const nRows = Math.max(6, Math.floor(panelH / (cellBase * 1.05)));
  const cellW = panelW / nCols;
  const cellH = panelH / nRows;
  const letterH = Math.min(cellW, cellH) * 0.68;

  let nL = Math.max(0, Math.floor(nLDistractors));
  const nSlots = nL + (includeTarget ? 1 : 0);
  const letters: LetterStim[] = [];
  const lLetters: LetterStim[] = [];
  let tLetter: LetterStim | null = null;
  let targetAoi: [number, number, number, number] | null = null;

  if (nSlots < 1) {
    return { cx, cy, panelW, panelH, letters, lLetters, tLetter, targetAoi };
  }

  const minCenterDist = letterH * 0.82;
  const inset = Math.max(letterH * 0.38, 6);
  let positions = scatterPositionsInRect(
    cx,
    cy,
    panelW,
    panelH,
    nSlots,
    minCenterDist,
    inset,
    rng,
  );

  if (!positions.length) {
    const hw = Math.max(panelW / 2 - inset, 8);
    const hh = Math.max(panelH / 2 - inset, 8);
    for (let i = 0; i < Math.min(nSlots, 96); i++) {
      positions.push([cx + rng.uniform(-hw, hw), cy + rng.uniform(-hh, hh)]);
    }
  }

  while (positions.length < nSlots) {
    const hw = Math.max(panelW / 2 - inset, 8);
    const hh = Math.max(panelH / 2 - inset, 8);
    positions.push([cx + rng.uniform(-hw, hw), cy + rng.uniform(-hh, hh)]);
  }

  const tSlot = includeTarget ? rng.randrange(nSlots) : -1;
  const hwT = Math.max(TARGET_T_AOI_MIN_HALF_PX, letterH * TARGET_T_AOI_HALF_W_FRAC);
  const hhT = Math.max(TARGET_T_AOI_MIN_HALF_PX, letterH * TARGET_T_AOI_HALF_H_FRAC);
  const orientations = [0, 90, 180, 270] as const;

  for (let i = 0; i < nSlots; i++) {
    const [x, y] = positions[i]!;
    const ori = rng.choice(orientations);
    const col = rng.choice(GRAYS_FOR_L);

    if (includeTarget && i === tSlot) {
      const stim = makeLetter("T", x, y, letterH, col, ori);
      tLetter = stim;
      letters.push(stim);
      targetAoi = [x, y, hwT, hhT];
    } else {
      const stim = makeLetter("L", x, y, letterH, col, ori);
      lLetters.push(stim);
      letters.push(stim);
    }
  }

  return { cx, cy, panelW, panelH, letters, lLetters, tLetter, targetAoi };
}

export function buildInstructionExamplePanel(
  cx: number,
  cy: number,
  panelW: number,
  panelH: number,
  rng: PythonRandom,
): LetterStim[] {
  const density = Math.min(panelW, panelH) / 10;
  const cellBase = Math.max(36, Math.min(56, density));
  const nCols = Math.max(5, Math.floor(panelW / cellBase));
  const nRows = Math.max(6, Math.floor(panelH / (cellBase * 1.05)));
  const cellW = panelW / nCols;
  const cellH = panelH / nRows;
  const letterH = Math.min(cellW, cellH) * 0.68;
  const nItems = 8;
  const minCenterDist = letterH * 0.82;
  const inset = Math.max(letterH * 0.38, 6);

  let positions = scatterPositionsInRect(
    cx,
    cy,
    panelW,
    panelH,
    nItems,
    minCenterDist,
    inset,
    rng,
  );

  if (!positions.length) {
    positions = [[cx, cy]];
  }

  rng.shuffle(positions);
  const tIndex = rng.randrange(positions.length);
  const orientations = [0, 90, 180, 270] as const;
  const result: LetterStim[] = [];

  positions.slice(0, nItems).forEach(([x, y], i) => {
    const isT = i === tIndex;
    const color = isT
      ? ([-0.92, 0.62, -0.55] as const)
      : rng.choice(GRAYS_FOR_L);
    result.push(makeLetter(isT ? "T" : "L", x, y, letterH, color, rng.choice(orientations)));
  });

  return result;
}

export function visibleLLetters(panel: PanelState): LetterStim[] {
  return panel.lLetters.filter((l) => l.visible);
}

export function removeKLetters(
  panel: PanelState,
  k: number,
  rng: PythonRandom,
): number {
  const vis = visibleLLetters(panel);
  if (k <= 0 || !vis.length) return 0;
  const shuffled = [...vis];
  rng.shuffle(shuffled);
  let n = 0;
  for (const s of shuffled.slice(0, Math.min(k, shuffled.length))) {
    s.visible = false;
    n++;
  }
  return n;
}
