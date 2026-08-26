"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import {
  COD_FIX_MS,
  DEFAULT_COD_GREY_MS,
  EXP2_INACTIVE_SIDE_FILL,
  EXP2_INACTIVE_SIDE_LINE,
  GAZE_DOT_FILL,
  GAZE_DOT_LINE,
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
import { stimulusLayoutSeed } from "@/lib/experiment/seeds";
import {
  buildExp2FixedLtPanel,
  removeKLetters,
  visibleLLetters,
  type PanelState,
} from "@/lib/experiment/panel-builder";
import { PythonRandom } from "@/lib/experiment/python-random";
import type { Exp2EventRow, Exp2SummaryRow } from "@/lib/experiment/types";

interface ExperimentCanvasProps {
  participantId: string;
  sessionCondition: number;
  sessionRun: number;
  sessionRow: Exp2SessionRow;
  durationS?: number;
  onComplete: (events: Exp2EventRow[], summary: Exp2SummaryRow) => void;
}

function canvasToPsychopy(
  canvasX: number,
  canvasY: number,
  sw: number,
  sh: number,
): [number, number] {
  return [canvasX - sw / 2, sh / 2 - canvasY];
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

function drawLetter(
  ctx: CanvasRenderingContext2D,
  letter: {
    char: string;
    x: number;
    y: number;
    letterH: number;
    color: readonly [number, number, number];
    orientation: number;
    visible: boolean;
  },
  sw: number,
  sh: number,
) {
  if (!letter.visible) return;
  const cx = letter.x + sw / 2;
  const cy = sh / 2 - letter.y;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((-letter.orientation * Math.PI) / 180);
  ctx.fillStyle = psychopyToCss(letter.color);
  ctx.font = `bold ${letter.letterH}px Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(letter.char, 0, 0);
  ctx.restore();
}

function drawPanelBorder(
  ctx: CanvasRenderingContext2D,
  panel: PanelState,
  sw: number,
  sh: number,
) {
  const left = panel.cx - panel.panelW / 2 + sw / 2;
  const top = sh / 2 - (panel.cy + panel.panelH / 2);
  ctx.strokeStyle = psychopyToCss([0.12, 0.12, 0.12]);
  ctx.lineWidth = 2;
  ctx.strokeRect(left - 2, top - 2, panel.panelW + 4, panel.panelH + 4);
}

function drawInactiveMarker(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  sc: number,
  sw: number,
  sh: number,
) {
  const side = Math.max(36, 52 * sc);
  const x = cx + sw / 2 - side / 2;
  const y = sh / 2 - cy - side / 2;
  ctx.fillStyle = psychopyToCss(EXP2_INACTIVE_SIDE_FILL);
  ctx.strokeStyle = psychopyToCss(EXP2_INACTIVE_SIDE_LINE);
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
  const containerRef = useRef<HTMLDivElement>(null);
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

    const decaySeed =
      stimulusLayoutSeed(
        participantId,
        2,
        sessionCondition,
        sessionRun,
        999,
        `exp2_decay_shuffle|${ratioLabel}`,
      ) & 0x7fffffffffffffff;

    const decayRng = new PythonRandom(decaySeed);
    const layoutPresIndex = { left: 0, right: 0 };

    function rebuildSide(side: "left" | "right", nL: number): PanelState {
      const presIdx = layoutPresIndex[side];
      const seed =
        stimulusLayoutSeed(
          participantId,
          2,
          sessionCondition,
          sessionRun,
          presIdx,
          side === "left" ? `exp2fixL|${ratioLabel}` : `exp2fixR|${ratioLabel}`,
        ) & 0x7fffffffffffffff;
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

      onComplete(state.events, summary);
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
      if (!canvas) return;
      const rect = container!.getBoundingClientRect();
      canvas.width = Math.floor(rect.width);
      canvas.height = Math.floor(rect.height);
      if (!stateRef.current) {
        stateRef.current = createSessionState(canvas.width, canvas.height);
      } else {
        stateRef.current.sw = canvas.width;
        stateRef.current.sh = canvas.height;
      }
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

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    state.sessionStart = performance.now() / 1000;
    state.lastSplitT = state.sessionStart;
    state.lastFrameT = state.sessionStart;
    state.running = true;

    function tick() {
      const s = stateRef.current;
      if (!s || !ctx) return;

      const now = performance.now() / 1000;
      const tSess = now - s.sessionStart;

      if (s.inCodGrey) {
        if (now >= s.codGreyUntil) {
          s.inCodGrey = false;
          s.activeSide = s.activeSide === "left" ? "right" : "left";
          s.inactiveDwellEntry = null;
          s.lastSplitT = now;
        } else {
          ctx.fillStyle = psychopyToCss([-0.4, -0.4, -0.4]);
          ctx.fillRect(0, 0, s.sw, s.sh);
          rafRef.current = requestAnimationFrame(tick);
          return;
        }
      }

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
      }

      if (tSess >= s.plannedDuration) {
        finishSession(s, false);
        return;
      }

      const dtSplit = now - s.lastSplitT;
      s.lastSplitT = now;
      if (s.activeSide === "left") s.timeLeftS += dtSplit;
      else s.timeRightS += dtSplit;

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
            now,
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
          s.codGreyUntil = now + DEFAULT_COD_GREY_MS / 1000;
          s.inactiveDwellEntry = null;
          ctx.fillStyle = psychopyToCss([-0.4, -0.4, -0.4]);
          ctx.fillRect(0, 0, s.sw, s.sh);
          rafRef.current = requestAnimationFrame(tick);
          return;
        }
      } else {
        s.inactiveDwellEntry = null;
      }

      let inLeft =
        s.leftPanel.targetAoi !== null &&
        inRect(
          gx,
          gy,
          s.leftPanel.targetAoi[0],
          s.leftPanel.targetAoi[1],
          s.leftPanel.targetAoi[2],
          s.leftPanel.targetAoi[3],
        );
      let inRight =
        s.rightPanel.targetAoi !== null &&
        inRect(
          gx,
          gy,
          s.rightPanel.targetAoi[0],
          s.rightPanel.targetAoi[1],
          s.rightPanel.targetAoi[2],
          s.rightPanel.targetAoi[3],
        );

      if (inLeft && inRight) {
        if (gx < 0) inRight = false;
        else inLeft = false;
      }
      if (s.activeSide === "left") inRight = false;
      else inLeft = false;

      const dt = Math.min(Math.max(now - s.lastFrameT, 0), 0.1) || 1 / 60;
      s.lastFrameT = now;

      if (inLeft) s.targetFixLeft += dt;
      else s.targetFixLeft = 0;
      if (inRight) s.targetFixRight += dt;
      else s.targetFixRight = 0;

      const fixThr = TARGET_FIX_MS / 1000;
      if (s.spacePressed) {
        s.spacePressed = false;
        let reinforced: "left" | "right" | null = null;
        if (inLeft && s.targetFixLeft >= fixThr) reinforced = "left";
        else if (inRight && s.targetFixRight >= fixThr) reinforced = "right";

        if (reinforced) {
          s.pointsTotal++;
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

      ctx.fillStyle = psychopyToCss([-0.4, -0.4, -0.4]);
      ctx.fillRect(0, 0, s.sw, s.sh);

      const activePanel = s.activeSide === "left" ? s.leftPanel : s.rightPanel;
      const inactiveCx = s.activeSide === "left" ? s.rightCx : s.leftCx;

      drawPanelBorder(ctx, activePanel, s.sw, s.sh);
      for (const letter of activePanel.letters) {
        drawLetter(ctx, letter, s.sw, s.sh);
      }
      drawInactiveMarker(ctx, inactiveCx, 0, s.sc, s.sw, s.sh);

      ctx.fillStyle = "rgb(242, 242, 140)";
      ctx.font = `bold ${Math.max(18, 26 * s.sc)}px Arial, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(`Pontos: ${s.pointsTotal}`, s.sw / 2, s.sh * 0.08);

      const remaining = Math.max(0, s.plannedDuration - tSess);
      const mins = Math.floor(remaining / 60);
      const secs = Math.floor(remaining % 60);
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.font = `${Math.max(12, 16 * s.sc)}px Arial, sans-serif`;
      ctx.fillText(
        `${mins}:${secs.toString().padStart(2, "0")} restantes`,
        s.sw / 2,
        s.sh * 0.94,
      );

      const dotR = Math.max(3, GAZE_DOT_RADIUS_PX * s.sc);
      const dotX = gx + s.sw / 2;
      const dotY = s.sh / 2 - gy;
      ctx.beginPath();
      ctx.arc(dotX, dotY, dotR, 0, Math.PI * 2);
      ctx.fillStyle = psychopyToCss(GAZE_DOT_FILL);
      ctx.fill();
      ctx.strokeStyle = psychopyToCss(GAZE_DOT_LINE);
      ctx.lineWidth = Math.max(1, 1.5 * s.sc);
      ctx.stroke();

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

  function handleMouseMove(e: ReactMouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const state = stateRef.current;
    if (!canvas || !state) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    [state.gazeX, state.gazeY] = canvasToPsychopy(x, y, state.sw, state.sh);
  }

  return (
    <div ref={containerRef} className="relative h-[100dvh] w-full bg-[#666]">
      {countdown > 0 && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/70 text-white">
          <p className="text-lg opacity-80">A sessão começa em</p>
          <p className="mt-2 text-6xl font-bold tabular-nums">{countdown}</p>
          <p className="mt-4 max-w-md px-6 text-center text-sm opacity-70">
            Mova o mouse para controlar o ponto branco. Pressione Espaço sobre o
            T para pontuar.
          </p>
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="h-full w-full cursor-none"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => {
          if (stateRef.current) {
            stateRef.current.gazeX = Infinity;
            stateRef.current.gazeY = Infinity;
          }
        }}
      />
    </div>
  );
}
