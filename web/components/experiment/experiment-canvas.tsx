"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  COD_FIX_MS,
  DEFAULT_COD_GREY_MS,
  EXP2_INACTIVE_SIDE_FILL,
  EXP2_INACTIVE_SIDE_LINE,
  GAZE_DOT_FILL,
  GAZE_DOT_RADIUS_PX,
  LAYOUT_MARGIN_X,
  LAYOUT_MARGIN_Y,
  TARGET_FIX_MS,
  exp2DecayKPerPanel,
  halfLeftBounds,
  halfRightBounds,
  inRect,
  layoutScale,
  proceduralPanelSize,
  psychopyToCss,
  type Exp2SessionRow,
} from "@/lib/experiment/constants";
import { stimulusLayoutRngSeed } from "@/lib/experiment/seeds";
import {
  buildExp2FixedLtPanel,
  removeKLetters,
  visibleLLetters,
  type LetterStim,
  type PanelState,
} from "@/lib/experiment/panel-builder";
import { PythonRandom } from "@/lib/experiment/python-random";
import type {
  Exp2EventRow,
  Exp2SummaryRow,
  ExperimentCompletePayload,
} from "@/lib/experiment/types";
import {
  classifyCursorRegions,
  type CursorSampleRow,
  type RegionTransitionRow,
} from "@/lib/experiment/cursor-sampling";

interface ExperimentCanvasProps {
  participantId: string;
  sessionCondition: number;
  sessionRun: number;
  sessionRow: Exp2SessionRow;
  durationS?: number;
  onComplete: (payload: ExperimentCompletePayload) => void;
}

const BG_CSS = psychopyToCss([-0.4, -0.4, -0.4]);
const BORDER_CSS = psychopyToCss([0.12, 0.12, 0.12]);
const INACTIVE_FILL_CSS = psychopyToCss(EXP2_INACTIVE_SIDE_FILL);
const INACTIVE_LINE_CSS = psychopyToCss(EXP2_INACTIVE_SIDE_LINE);
const DOT_FILL_CSS = psychopyToCss(GAZE_DOT_FILL);
const FIX_THR_S = TARGET_FIX_MS / 1000;
const COD_GREY_S = DEFAULT_COD_GREY_MS / 1000;
const CURSOR_SAMPLE_INTERVAL_S = 0.05;
const MAX_DPR = 1;

function canvasToPsychopy(
  canvasX: number,
  canvasY: number,
  sw: number,
  sh: number,
): [number, number] {
  return [canvasX - sw / 2, sh / 2 - canvasY];
}

function drawGazeDot(
  ctx: CanvasRenderingContext2D,
  gx: number,
  gy: number,
  sw: number,
  sh: number,
  dotR: number,
): void {
  if (!Number.isFinite(gx) || !Number.isFinite(gy)) return;
  const dotX = gx + sw / 2;
  const dotY = sh / 2 - gy;
  ctx.beginPath();
  ctx.arc(dotX, dotY, dotR, 0, Math.PI * 2);
  ctx.fillStyle = DOT_FILL_CSS;
  ctx.fill();
}

function paintBackgroundFrame(
  ctx: CanvasRenderingContext2D,
  s: {
    sw: number;
    sh: number;
    sc: number;
    activeSide: "left" | "right";
    leftCx: number;
    rightCx: number;
    leftPanel: PanelState;
    rightPanel: PanelState;
    pointsHud: string;
    hudText: string;
    hudFont: string;
    timerFont: string;
    inCodGrey: boolean;
  },
  panelCache: HTMLCanvasElement,
  panelDirty: boolean,
): void {
  if (s.inCodGrey) {
    ctx.fillStyle = BG_CSS;
    ctx.fillRect(0, 0, s.sw, s.sh);
    return;
  }

  const activePanel = s.activeSide === "left" ? s.leftPanel : s.rightPanel;
  if (panelDirty) {
    paintPanelCache(panelCache, activePanel, s.sw, s.sh);
  }

  ctx.drawImage(panelCache, 0, 0, s.sw, s.sh);

  const inactiveCx = s.activeSide === "left" ? s.rightCx : s.leftCx;
  drawInactiveMarker(ctx, inactiveCx, 0, s.sc, s.sw, s.sh);

  ctx.fillStyle = "rgb(242, 242, 140)";
  ctx.font = s.hudFont;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(s.pointsHud, s.sw / 2, s.sh * 0.08);

  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = s.timerFont;
  ctx.fillText(s.hudText, s.sw / 2, s.sh * 0.94);
}

function appendEvent(
  rows: Exp2EventRow[],
  participantId: string,
  sessionCondition: number,
  sessionRun: number,
  tS: number,
  eventType: string,
  nLLeft: number,
  nLRight: number,
  pointsTotal: number,
  activeSide: string,
  ratioLabel: string,
  detail = "",
): void {
  rows.push({
    participant_id: participantId,
    experiment: 2,
    session_condition: sessionCondition,
    session_run: sessionRun,
    event_index: rows.length,
    t_session_s: Math.round(tS * 1e6) / 1e6,
    event_type: eventType,
    n_L_left: nLLeft,
    n_L_right: nLRight,
    points_total: pointsTotal,
    active_side: activeSide,
    ratio_label: ratioLabel,
    detail,
  });
}

function recordCursorSample(
  s: {
    sw: number;
    sh: number;
    activeSide: "left" | "right";
    leftPanel: PanelState;
    rightPanel: PanelState;
    inCodGrey: boolean;
    gazeX: number;
    gazeY: number;
    cursorSamples: CursorSampleRow[];
    regionTransitions: RegionTransitionRow[];
    lastSampleAt: number;
    lastRegionKey: string;
    sampleIndex: number;
    transitionIndex: number;
  },
  participantId: string,
  sessionCondition: number,
  sessionRun: number,
  ratioLabel: string,
  tSess: number,
  now: number,
): void {
  if (now - s.lastSampleAt < CURSOR_SAMPLE_INTERVAL_S) return;
  if (!Number.isFinite(s.gazeX) || !Number.isFinite(s.gazeY)) return;
  s.lastSampleAt = now;

  const regions = classifyCursorRegions(
    s.gazeX,
    s.gazeY,
    s.sw,
    s.sh,
    s.activeSide,
    s.leftPanel,
    s.rightPanel,
    s.inCodGrey,
  );

  if (regions.regionKey !== s.lastRegionKey) {
    if (s.lastRegionKey) {
      s.regionTransitions.push({
        participant_id: participantId,
        experiment: 2,
        session_condition: sessionCondition,
        session_run: sessionRun,
        transition_index: s.transitionIndex,
        t_session_s: Math.round(tSess * 1e6) / 1e6,
        from_region: s.lastRegionKey,
        to_region: regions.regionKey,
        active_side: s.activeSide,
        ratio_label: ratioLabel,
      });
      s.transitionIndex++;
    }
    s.lastRegionKey = regions.regionKey;
  }

  s.cursorSamples.push({
    participant_id: participantId,
    experiment: 2,
    session_condition: sessionCondition,
    session_run: sessionRun,
    sample_index: s.sampleIndex,
    t_session_s: Math.round(tSess * 1e6) / 1e6,
    cursor_x: Math.round(s.gazeX * 1000) / 1000,
    cursor_y: Math.round(s.gazeY * 1000) / 1000,
    active_side: s.activeSide,
    half_region: regions.halfRegion,
    panel_visible_side: regions.panelVisibleSide,
    in_target_aoi: regions.inTargetAoi ? 1 : 0,
    target_side: regions.targetSide,
    in_inactive_half: regions.inInactiveHalf ? 1 : 0,
    in_cod_grey: s.inCodGrey ? 1 : 0,
    ratio_label: ratioLabel,
    mode: "online_mouse",
  });
  s.sampleIndex++;
}

/** Desenha letras no buffer offscreen (só quando o painel muda). */
function paintPanelCache(
  cache: HTMLCanvasElement,
  panel: PanelState,
  sw: number,
  sh: number,
): void {
  if (cache.width !== sw || cache.height !== sh) {
    cache.width = sw;
    cache.height = sh;
  }
  const ctx = cache.getContext("2d", { alpha: false });
  if (!ctx) return;

  ctx.fillStyle = BG_CSS;
  ctx.fillRect(0, 0, sw, sh);

  const left = panel.cx - panel.panelW / 2 + sw / 2;
  const top = sh / 2 - (panel.cy + panel.panelH / 2);
  ctx.strokeStyle = BORDER_CSS;
  ctx.lineWidth = 2;
  ctx.strokeRect(left - 2, top - 2, panel.panelW + 4, panel.panelH + 4);

  const letters = panel.letters;
  for (let i = 0; i < letters.length; i++) {
    const letter = letters[i]!;
    if (!letter.visible) continue;
    drawLetterFast(ctx, letter, sw, sh);
  }
}

function drawLetterFast(
  ctx: CanvasRenderingContext2D,
  letter: LetterStim,
  sw: number,
  sh: number,
): void {
  const cx = letter.x + sw / 2;
  const cy = sh / 2 - letter.y;
  ctx.save();
  ctx.translate(cx, cy);
  if (letter.oriRad !== 0) ctx.rotate(letter.oriRad);
  ctx.fillStyle = letter.colorCss;
  ctx.font = `bold ${letter.letterH | 0}px Arial,sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(letter.char, 0, 0);
  ctx.restore();
}

function drawInactiveMarker(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  sc: number,
  sw: number,
  sh: number,
): void {
  const side = Math.max(36, 52 * sc);
  const x = cx + sw / 2 - side / 2;
  const y = sh / 2 - cy - side / 2;
  ctx.fillStyle = INACTIVE_FILL_CSS;
  ctx.strokeStyle = INACTIVE_LINE_CSS;
  ctx.lineWidth = Math.max(1, 2 * sc);
  ctx.fillRect(x, y, side, side);
  ctx.strokeRect(x, y, side, side);
}

export function ExperimentCanvas({
  participantId,
  sessionCondition,
  sessionRun,
  sessionRow,
  durationS,
  onComplete,
}: ExperimentCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelCacheRef = useRef<HTMLCanvasElement | null>(null);
  const dotCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const containerRectRef = useRef({ left: 0, top: 0, width: 0, height: 0 });
  const dotRafRef = useRef(0);
  const bgDirtyRef = useRef(true);
  const [ready, setReady] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const stateRef = useRef<ReturnType<typeof createSessionState> | null>(null);
  const rafRef = useRef<number>(0);
  const completedRef = useRef(false);

  const plannedDuration =
    durationS && durationS > 0 ? durationS : sessionRow.duration_s;
  const ratioLabel = sessionRow.ratio_label;

  function createSessionState(sw: number, sh: number) {
    const sc = layoutScale(sw, sh);
    const marginX = Math.max(8, Math.floor(LAYOUT_MARGIN_X * sc));
    const marginY = Math.max(8, Math.floor(LAYOUT_MARGIN_Y * sc));
    const leftCx = -sw / 4;
    const rightCx = sw / 4;
    const halfInnerW = sw / 2 - 2 * marginX;
    const maxPanelH = sh - 2 * marginY;
    const [panelW, panelH] = proceduralPanelSize(halfInnerW, maxPanelH);

    const initialLeft = sessionRow.n_L_left;
    const initialRight = sessionRow.n_L_right;
    const kDecay = exp2DecayKPerPanel();

    const decaySeed = stimulusLayoutRngSeed(
      participantId,
      2,
      sessionCondition,
      sessionRun,
      999,
      `exp2_decay_shuffle|${ratioLabel}`,
    );

    const decayRng = new PythonRandom(decaySeed);
    const layoutPresIndex = { left: 0, right: 0 };

    function rebuildSide(side: "left" | "right", nL: number): PanelState {
      const presIdx = layoutPresIndex[side];
      const seed = stimulusLayoutRngSeed(
        participantId,
        2,
        sessionCondition,
        sessionRun,
        presIdx,
        side === "left" ? `exp2fixL|${ratioLabel}` : `exp2fixR|${ratioLabel}`,
      );
      const rng = new PythonRandom(seed);
      const cx = side === "left" ? leftCx : rightCx;
      return buildExp2FixedLtPanel(cx, 0, panelW, panelH, nL, true, rng);
    }

    let nLLeft = initialLeft;
    let nLRight = initialRight;
    let leftPanel = rebuildSide("left", nLLeft);
    let rightPanel = rebuildSide("right", nLRight);

    const events: Exp2EventRow[] = [];
    let pointsTotal = 0;
    let activeSide: "left" | "right" = "left";
    let sessionStart = 0;
    let nextDecayAt = 1;
    let timeLeftS = 0;
    let timeRightS = 0;
    let lastSplitT = 0;
    let codSwitchCount = 0;

    appendEvent(
      events,
      participantId,
      sessionCondition,
      sessionRun,
      0,
      "foraging_start",
      nLLeft,
      nLRight,
      pointsTotal,
      activeSide,
      ratioLabel,
      "single_visible_panel_cod_exp1_timing",
    );

    return {
      sw,
      sh,
      sc,
      leftCx,
      rightCx,
      panelW,
      panelH,
      initialLeft,
      initialRight,
      kDecay,
      decayRng,
      layoutPresIndex,
      rebuildSide,
      get leftPanel() {
        return leftPanel;
      },
      set leftPanel(v) {
        leftPanel = v;
      },
      get rightPanel() {
        return rightPanel;
      },
      set rightPanel(v) {
        rightPanel = v;
      },
      get nLLeft() {
        return nLLeft;
      },
      set nLLeft(v) {
        nLLeft = v;
      },
      get nLRight() {
        return nLRight;
      },
      set nLRight(v) {
        nLRight = v;
      },
      events,
      get pointsTotal() {
        return pointsTotal;
      },
      set pointsTotal(v) {
        pointsTotal = v;
      },
      get activeSide() {
        return activeSide;
      },
      set activeSide(v) {
        activeSide = v;
      },
      get sessionStart() {
        return sessionStart;
      },
      set sessionStart(v) {
        sessionStart = v;
      },
      get nextDecayAt() {
        return nextDecayAt;
      },
      set nextDecayAt(v) {
        nextDecayAt = v;
      },
      get timeLeftS() {
        return timeLeftS;
      },
      set timeLeftS(v) {
        timeLeftS = v;
      },
      get timeRightS() {
        return timeRightS;
      },
      set timeRightS(v) {
        timeRightS = v;
      },
      get lastSplitT() {
        return lastSplitT;
      },
      set lastSplitT(v) {
        lastSplitT = v;
      },
      targetFixLeft: 0,
      targetFixRight: 0,
      get codSwitchCount() {
        return codSwitchCount;
      },
      set codSwitchCount(v) {
        codSwitchCount = v;
      },
      inCodGrey: false,
      codGreyUntil: 0,
      inactiveDwellEntry: null as number | null,
      lastFrameT: 0,
      gazeX: 0,
      gazeY: 0,
      spacePressed: false,
      running: false,
      plannedDuration,
      panelDirty: true,
      lastHudSec: -1,
      hudText: "",
      pointsHud: "Pontos: 0",
      hudFont: "",
      timerFont: "",
      dotR: 4,
      inactiveSide: Math.max(36, 52 * sc),
      cursorSamples: [] as CursorSampleRow[],
      regionTransitions: [] as RegionTransitionRow[],
      lastSampleAt: 0,
      lastRegionKey: "",
      sampleIndex: 0,
      transitionIndex: 0,
    };
  }

  const finishSession = useCallback(
    (state: NonNullable<typeof stateRef.current>, aborted: boolean) => {
      if (completedRef.current) return;
      completedRef.current = true;

      const tRun = state.sessionStart
        ? Math.min(
            performance.now() / 1000 - state.sessionStart,
            state.plannedDuration,
          )
        : 0;

      appendEvent(
        state.events,
        participantId,
        sessionCondition,
        sessionRun,
        tRun,
        aborted ? "session_abort" : "session_end",
        visibleLLetters(state.leftPanel).length,
        visibleLLetters(state.rightPanel).length,
        state.pointsTotal,
        state.activeSide,
        ratioLabel,
        aborted ? "user_exit" : "time_complete",
      );

      const summary: Exp2SummaryRow = {
        participant_id: participantId,
        experiment: 2,
        session_condition: sessionCondition,
        session_run: sessionRun,
        ratio_label: ratioLabel,
        points_total: state.pointsTotal,
        duration_s_run:
          Math.round(Math.min(tRun, state.plannedDuration) * 1000) / 1000,
        duration_s_planned: state.plannedDuration,
        cod_switch_count: state.codSwitchCount,
        cod_grey_ms: DEFAULT_COD_GREY_MS,
        forage_time_left_s: Math.round(state.timeLeftS * 10000) / 10000,
        forage_time_right_s: Math.round(state.timeRightS * 10000) / 10000,
        aborted: aborted ? 1 : 0,
        ended_by_t_esc: 0,
        k_decay_per_panel: state.kDecay,
        initial_n_L_left: state.initialLeft,
        initial_n_L_right: state.initialRight,
        both_panels_visible: 0,
        single_visible_panel_by_gaze: 1,
        dual_target_scoring: 1,
        correctkey_csv: sessionRow.correctkey,
      };

      onComplete({
        events: state.events,
        summary,
        cursorSamples: state.cursorSamples,
        regionTransitions: state.regionTransitions,
      });
    },
    [
      onComplete,
      participantId,
      sessionCondition,
      sessionRun,
      ratioLabel,
      sessionRow.correctkey,
    ],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function resize() {
      const canvas = canvasRef.current;
      const dotCanvas = dotCanvasRef.current;
      if (!canvas || !dotCanvas || !container) return;
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const cssW = Math.max(1, Math.floor(rect.width));
      const cssH = Math.max(1, Math.floor(rect.height));

      containerRectRef.current = {
        left: rect.left,
        top: rect.top,
        width: cssW,
        height: cssH,
      };

      for (const c of [canvas, dotCanvas]) {
        c.style.width = `${cssW}px`;
        c.style.height = `${cssH}px`;
        c.width = Math.floor(cssW * dpr);
        c.height = Math.floor(cssH * dpr);
      }

      const ctx = canvas.getContext("2d", { alpha: false });
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.imageSmoothingEnabled = false;
      }

      const dotCtx = dotCanvas.getContext("2d", { alpha: true });
      if (dotCtx) {
        dotCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        dotCtx.imageSmoothingEnabled = false;
        dotCtxRef.current = dotCtx;
      }

      if (!panelCacheRef.current) {
        panelCacheRef.current = document.createElement("canvas");
      }

      if (!stateRef.current) {
        stateRef.current = createSessionState(cssW, cssH);
        stateRef.current.hudFont = `bold ${Math.max(18, 26 * stateRef.current.sc)}px Arial,sans-serif`;
        stateRef.current.timerFont = `${Math.max(12, 16 * stateRef.current.sc)}px Arial,sans-serif`;
        stateRef.current.dotR = Math.max(3, GAZE_DOT_RADIUS_PX * stateRef.current.sc);
        stateRef.current.panelDirty = true;
      } else {
        const s = stateRef.current;
        s.sw = cssW;
        s.sh = cssH;
        s.sc = layoutScale(cssW, cssH);
        s.hudFont = `bold ${Math.max(18, 26 * s.sc)}px Arial,sans-serif`;
        s.timerFont = `${Math.max(12, 16 * s.sc)}px Arial,sans-serif`;
        s.dotR = Math.max(3, GAZE_DOT_RADIUS_PX * s.sc);
        s.inactiveSide = Math.max(36, 52 * s.sc);
        s.panelDirty = true;
      }
      bgDirtyRef.current = true;
      setReady(true);
    }

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  useEffect(() => {
    if (!ready || countdown > 0) return;

    const canvas = canvasRef.current;
    const state = stateRef.current;
    if (!canvas || !state) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    if (!panelCacheRef.current) {
      panelCacheRef.current = document.createElement("canvas");
    }

    state.sessionStart = performance.now() / 1000;
    state.lastSplitT = state.sessionStart;
    state.lastFrameT = state.sessionStart;
    state.running = true;
    state.panelDirty = true;
    bgDirtyRef.current = true;

    const panelCache = panelCacheRef.current;

    function tick() {
      const s = stateRef.current;
      if (!s || !ctx || !panelCache) return;

      const now = performance.now() / 1000;
      const tSess = now - s.sessionStart;

      if (s.inCodGrey) {
        recordCursorSample(
          s,
          participantId,
          sessionCondition,
          sessionRun,
          ratioLabel,
          tSess,
          now,
        );
        if (now >= s.codGreyUntil) {
          s.inCodGrey = false;
          s.activeSide = s.activeSide === "left" ? "right" : "left";
          appendEvent(
            s.events,
            participantId,
            sessionCondition,
            sessionRun,
            now - s.sessionStart,
            "cod_end",
            s.nLLeft,
            s.nLRight,
            s.pointsTotal,
            s.activeSide,
            ratioLabel,
            "",
          );
          s.inactiveDwellEntry = null;
          s.lastSplitT = now;
          s.panelDirty = true;
          bgDirtyRef.current = true;
        } else {
          if (bgDirtyRef.current) {
            paintBackgroundFrame(ctx, s, panelCache, false);
            bgDirtyRef.current = false;
          }
          rafRef.current = requestAnimationFrame(tick);
          return;
        }
      }

      let decayed = false;
      while (s.nextDecayAt <= Math.min(tSess, s.plannedDuration)) {
        const remL = removeKLetters(s.leftPanel, s.kDecay, s.decayRng);
        const remR = removeKLetters(s.rightPanel, s.kDecay, s.decayRng);
        s.nLLeft = visibleLLetters(s.leftPanel).length;
        s.nLRight = visibleLLetters(s.rightPanel).length;
        appendEvent(
          s.events,
          participantId,
          sessionCondition,
          sessionRun,
          s.nextDecayAt,
          "decay_tick",
          s.nLLeft,
          s.nLRight,
          s.pointsTotal,
          s.activeSide,
          ratioLabel,
          `removed_L=${remL}/${remR}`,
        );
        s.nextDecayAt += 1;
        decayed = true;
      }
      if (decayed) {
        s.panelDirty = true;
        bgDirtyRef.current = true;
      }

      if (tSess >= s.plannedDuration) {
        finishSession(s, false);
        return;
      }

      const dtSplit = now - s.lastSplitT;
      s.lastSplitT = now;
      if (s.activeSide === "left") s.timeLeftS += dtSplit;
      else s.timeRightS += dtSplit;

      recordCursorSample(
        s,
        participantId,
        sessionCondition,
        sessionRun,
        ratioLabel,
        tSess,
        now,
      );

      const gx = s.gazeX;
      const gy = s.gazeY;
      const inactive = s.activeSide === "left" ? "right" : "left";
      const [icx, icy, ihw, ihh] =
        inactive === "left"
          ? halfLeftBounds(s.sw, s.sh)
          : halfRightBounds(s.sw, s.sh);

      if (inRect(gx, gy, icx, icy, ihw, ihh)) {
        if (s.inactiveDwellEntry === null) s.inactiveDwellEntry = now;
        else if ((now - s.inactiveDwellEntry) * 1000 >= COD_FIX_MS) {
          appendEvent(
            s.events,
            participantId,
            sessionCondition,
            sessionRun,
            now - s.sessionStart,
            "cod_start",
            s.nLLeft,
            s.nLRight,
            s.pointsTotal,
            s.activeSide,
            ratioLabel,
            inactive,
          );
          s.codSwitchCount++;
          s.inCodGrey = true;
          s.codGreyUntil = now + COD_GREY_S;
          s.inactiveDwellEntry = null;
          bgDirtyRef.current = true;
          paintBackgroundFrame(ctx, s, panelCache, false);
          bgDirtyRef.current = false;
          rafRef.current = requestAnimationFrame(tick);
          return;
        }
      } else {
        s.inactiveDwellEntry = null;
      }

      // Só testa AOI do lado ativo (menos trabalho por frame).
      const activePanel = s.activeSide === "left" ? s.leftPanel : s.rightPanel;
      const aoi = activePanel.targetAoi;
      const inTarget =
        aoi !== null && inRect(gx, gy, aoi[0], aoi[1], aoi[2], aoi[3]);

      const dt = Math.min(Math.max(now - s.lastFrameT, 0), 0.1) || 1 / 60;
      s.lastFrameT = now;

      if (s.activeSide === "left") {
        if (inTarget) s.targetFixLeft += dt;
        else s.targetFixLeft = 0;
        s.targetFixRight = 0;
      } else {
        if (inTarget) s.targetFixRight += dt;
        else s.targetFixRight = 0;
        s.targetFixLeft = 0;
      }

      if (s.spacePressed) {
        s.spacePressed = false;
        let reinforced: "left" | "right" | null = null;
        if (s.activeSide === "left" && inTarget && s.targetFixLeft >= FIX_THR_S) {
          reinforced = "left";
        } else if (
          s.activeSide === "right" &&
          inTarget &&
          s.targetFixRight >= FIX_THR_S
        ) {
          reinforced = "right";
        }

        if (reinforced) {
          s.pointsTotal++;
          s.pointsHud = `Pontos: ${s.pointsTotal}`;
          bgDirtyRef.current = true;
          if (reinforced === "left") {
            s.layoutPresIndex.left++;
            s.nLLeft = s.initialLeft;
            s.leftPanel = s.rebuildSide("left", s.nLLeft);
          } else {
            s.layoutPresIndex.right++;
            s.nLRight = s.initialRight;
            s.rightPanel = s.rebuildSide("right", s.nLRight);
          }
          s.targetFixLeft = 0;
          s.targetFixRight = 0;
          s.panelDirty = true;
          appendEvent(
            s.events,
            participantId,
            sessionCondition,
            sessionRun,
            tSess,
            "reinforcement",
            visibleLLetters(s.leftPanel).length,
            visibleLLetters(s.rightPanel).length,
            s.pointsTotal,
            s.activeSide,
            ratioLabel,
            `reinforced_side=${reinforced}`,
          );
        }
      }

      const remaining = Math.max(0, s.plannedDuration - tSess);
      const secFloor = remaining | 0;
      if (secFloor !== s.lastHudSec) {
        s.lastHudSec = secFloor;
        const mins = (secFloor / 60) | 0;
        const secs = secFloor % 60;
        s.hudText = `${mins}:${secs < 10 ? `0${secs}` : secs} restantes`;
        bgDirtyRef.current = true;
      }

      if (bgDirtyRef.current || s.panelDirty) {
        const panelNeedsPaint = s.panelDirty;
        paintBackgroundFrame(ctx, s, panelCache, panelNeedsPaint);
        s.panelDirty = false;
        bgDirtyRef.current = false;
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [
    ready,
    countdown,
    finishSession,
    participantId,
    sessionCondition,
    sessionRun,
    ratioLabel,
  ]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.code === "Space") {
        e.preventDefault();
        if (stateRef.current) stateRef.current.spacePressed = true;
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !ready) return;

    function renderDotOverlay() {
      dotRafRef.current = 0;
      const s = stateRef.current;
      const dotCtx = dotCtxRef.current;
      if (!s || !dotCtx) return;
      dotCtx.clearRect(0, 0, s.sw, s.sh);
      drawGazeDot(dotCtx, s.gazeX, s.gazeY, s.sw, s.sh, s.dotR);
    }

    function scheduleDotRender() {
      if (dotRafRef.current) return;
      dotRafRef.current = requestAnimationFrame(renderDotOverlay);
    }

    function updatePointerPosition(clientX: number, clientY: number) {
      const state = stateRef.current;
      if (!state) return;
      const rect = containerRectRef.current;
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
        state.gazeX = Infinity;
        state.gazeY = Infinity;
      } else {
        [state.gazeX, state.gazeY] = canvasToPsychopy(x, y, state.sw, state.sh);
      }
      scheduleDotRender();
    }

    function onPointerMove(e: PointerEvent) {
      const events = e.getCoalescedEvents?.() ?? [e];
      const last = events[events.length - 1]!;
      updatePointerPosition(last.clientX, last.clientY);
    }

    function onPointerLeave() {
      if (stateRef.current) {
        stateRef.current.gazeX = Infinity;
        stateRef.current.gazeY = Infinity;
      }
      const dotCtx = dotCtxRef.current;
      const s = stateRef.current;
      if (dotCtx && s) dotCtx.clearRect(0, 0, s.sw, s.sh);
    }

    container.addEventListener("pointermove", onPointerMove, { passive: true });
    container.addEventListener("pointerleave", onPointerLeave);
    return () => {
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerleave", onPointerLeave);
      if (dotRafRef.current) cancelAnimationFrame(dotRafRef.current);
    };
  }, [ready]);

  return (
    <div
      ref={containerRef}
      className="relative h-[100dvh] w-full cursor-none touch-none bg-[#666]"
    >
      {countdown > 0 && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/70 text-white">
          <p className="text-lg opacity-80">A sessão começa em</p>
          <p className="mt-2 text-6xl font-bold tabular-nums">{countdown}</p>
          <p className="mt-4 max-w-md px-6 text-center text-sm opacity-70">
            Mova o mouse para controlar o ponteiro na tela. Pressione Espaço sobre o T
            para pontuar.
          </p>
        </div>
      )}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <canvas ref={dotCanvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />
    </div>
  );
}
