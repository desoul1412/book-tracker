/**
 * @file src/components/game/GameBoard.tsx
 * @description Canvas-based Snake game board renderer.
 *
 * Renders the game board onto an HTML5 <canvas> element using the Canvas 2D
 * API. Each frame is drawn imperatively with fillStyle / strokeStyle /
 * fillRect so the renderer is fully decoupled from Tailwind's JIT pass.
 *
 * Visual identity
 * ─────────────────────────────────────────────────────────────────────────────
 * • Grid lines: 1 px strokes at rgba(74,222,128,0.10) — 0.1-opacity green.
 * • Snake head: lime-300 (#bef264) filled circle with a bright neon halo.
 * • Snake body: green-500 (#22c55e) rounded rectangles with a soft glow.
 * • Food pellet: red-500 (#ef4444) circle that pulses (scale + brightness)
 *   via a requestAnimationFrame animation loop.
 *
 * Design decisions
 * ─────────────────────────────────────────────────────────────────────────────
 * • Canvas rendering bypasses React's virtual DOM reconciliation entirely,
 *   which is intentional — the board redraws on every game tick and doing so
 *   via 400–1 600 individual React elements adds unnecessary overhead.
 * • The outer <div> wrapper uses `aspect-ratio` CSS so the canvas stays square
 *   and scales responsively. The canvas pixel dimensions are snapped to the
 *   wrapper's clientWidth on mount and on window resize via ResizeObserver.
 * • The food pulse animation runs an independent rAF loop so it keeps
 *   animating during pause states without coupling to game-engine ticks.
 * • `aria-label` on the wrapper gives screen-reader users a meaningful
 *   description of the interactive region.
 */

import React, { useEffect, useRef, useCallback } from "react";
import type { Position, Snake, Direction } from "@/types/game";
import { useSwipeControls } from "@/hooks/useSwipeControls";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GameBoardProps {
  /** Ordered snake body segments; index 0 is the head. */
  snake: Snake;
  /** Current food pellet position. */
  food: Position;
  /** Number of columns on the board. */
  boardWidth: number;
  /** Number of rows on the board. */
  boardHeight: number;
  /**
   * @deprecated No longer used for layout — board is responsive via CSS.
   * Kept for API backward-compatibility.
   */
  cellSize?: number;
  /**
   * Called with the resolved Direction whenever a qualifying swipe gesture is
   * detected on the canvas. Pass `changeDirection` from `useGameEngine` here
   * to enable mobile touch controls.
   *
   * When omitted, touch events are not listened for (additive — no behaviour
   * change for callers that don't pass this prop).
   */
  onDirectionChange?: (direction: Direction) => void;
  /**
   * Whether swipe input is currently active. Defaults to `true` when
   * `onDirectionChange` is provided. Pass `false` to temporarily disable
   * swipe input (e.g. while game is paused or over).
   */
  swipeEnabled?: boolean;
}

// ---------------------------------------------------------------------------
// Design tokens (Canvas 2D colour strings)
// ---------------------------------------------------------------------------

const COLOR = {
  background: "#030712",   // gray-950
  gridLine:   "rgba(74,222,128,0.10)",  // green-400 @ 0.1 opacity
  head:       "#bef264",   // lime-300
  headGlow:   "rgba(74,222,128,0.55)",
  body:       "#22c55e",   // green-500
  bodyGlow:   "rgba(34,197,94,0.35)",
  food:       "#ef4444",   // red-500
  foodGlow:   "rgba(248,113,113,0.60)",
} as const;

// ---------------------------------------------------------------------------
// Canvas draw helpers
// ---------------------------------------------------------------------------

/** Draws one grid-line pass over the entire canvas. */
function drawGrid(
  ctx: CanvasRenderingContext2D,
  cols: number,
  rows: number,
  cellW: number,
  cellH: number,
): void {
  ctx.strokeStyle = COLOR.gridLine;
  ctx.lineWidth = 1;

  // Vertical lines
  for (let c = 0; c <= cols; c++) {
    const x = Math.round(c * cellW) + 0.5;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, rows * cellH);
    ctx.stroke();
  }

  // Horizontal lines
  for (let r = 0; r <= rows; r++) {
    const y = Math.round(r * cellH) + 0.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(cols * cellW, y);
    ctx.stroke();
  }
}

/** Draws a rounded rectangle path (no fill/stroke — caller decides). */
function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

/** Draws the snake head as a lime-300 circle with a bright neon halo. */
function drawHead(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
): void {
  // Outer glow
  ctx.shadowColor = COLOR.headGlow;
  ctx.shadowBlur = 18;
  ctx.fillStyle = COLOR.head;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

/** Draws a snake body segment as a green-500 rounded rectangle with soft glow. */
function drawBodySegment(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  const inset = w * 0.08;
  const bx = x + inset;
  const by = y + inset;
  const bw = w - inset * 2;
  const bh = h - inset * 2;
  const radius = Math.min(bw, bh) * 0.18;

  ctx.shadowColor = COLOR.bodyGlow;
  ctx.shadowBlur = 6;
  ctx.fillStyle = COLOR.body;
  roundedRect(ctx, bx, by, bw, bh, radius);
  ctx.fill();
  ctx.shadowBlur = 0;
}

/**
 * Draws the food pellet as a red circle whose radius pulses between
 * `minR` and `maxR` based on the `pulse` value (0–1, sinusoidal).
 */
function drawFood(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  baseR: number,
  pulse: number,
): void {
  const r = baseR * (0.75 + 0.25 * pulse);

  // Outer glow
  ctx.shadowColor = COLOR.foodGlow;
  ctx.shadowBlur = 14 + 10 * pulse;
  ctx.fillStyle = COLOR.food;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * GameBoard — a canvas-based renderer for the Snake game board.
 *
 * @example
 * <GameBoard
 *   snake={state.snake}
 *   food={state.food}
 *   boardWidth={state.boardWidth}
 *   boardHeight={state.boardHeight}
 * />
 */
export const GameBoard: React.FC<GameBoardProps> = ({
  snake,
  food,
  boardWidth,
  boardHeight,
  onDirectionChange,
  swipeEnabled = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Wire up touch/swipe controls only when the consumer provides a callback.
  // `useSwipeControls` attaches native `touchstart` / `touchend` listeners so
  // the wrapper's `onTouchStart` React synthetic event is intentionally omitted
  // (passive:false requires the native addEventListener API).
  useSwipeControls(wrapperRef, {
    onDirection: onDirectionChange ?? (() => undefined),
    enabled: onDirectionChange !== undefined && swipeEnabled,
  });
  // Tracks canvas pixel size to avoid unnecessary resizes.
  const sizeRef = useRef({ w: 0, h: 0 });
  // Food pulse phase (0–2π), advanced by the rAF loop.
  const pulseRef = useRef(0);
  // Stable refs for latest props so the rAF closure never goes stale.
  const snakeRef = useRef(snake);
  const foodRef = useRef(food);
  // rAF handle for cleanup.
  const rafRef = useRef<number>(0);

  snakeRef.current = snake;
  foodRef.current = food;

  // -------------------------------------------------------------------------
  // Core draw function — called both imperatively (on prop change) and from
  // the rAF loop so the food keeps pulsing without waiting for a game tick.
  // -------------------------------------------------------------------------
  const draw = useCallback(
    (pulse: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const { width: W, height: H } = canvas;
      const cols = boardWidth;
      const rows = boardHeight;
      const cellW = W / cols;
      const cellH = H / rows;

      // 1. Clear background
      ctx.fillStyle = COLOR.background;
      ctx.fillRect(0, 0, W, H);

      // 2. Grid lines (strokeStyle, 0.1 opacity)
      drawGrid(ctx, cols, rows, cellW, cellH);

      // 3. Snake body (all segments except head)
      const currentSnake = snakeRef.current;
      for (let i = 1; i < currentSnake.length; i++) {
        const [bx, by] = currentSnake[i];
        drawBodySegment(ctx, bx * cellW, by * cellH, cellW, cellH);
      }

      // 4. Snake head (index 0)
      if (currentSnake.length > 0) {
        const [hx, hy] = currentSnake[0];
        const cx = hx * cellW + cellW / 2;
        const cy = hy * cellH + cellH / 2;
        drawHead(ctx, cx, cy, Math.min(cellW, cellH) * 0.46);
      }

      // 5. Food pellet with live pulse value
      const [fx, fy] = foodRef.current;
      const fcx = fx * cellW + cellW / 2;
      const fcy = fy * cellH + cellH / 2;
      drawFood(ctx, fcx, fcy, Math.min(cellW, cellH) * 0.40, pulse);
    },
    [boardWidth, boardHeight],
  );

  // -------------------------------------------------------------------------
  // rAF loop — advances food pulse and redraws every frame.
  // -------------------------------------------------------------------------
  useEffect(() => {
    let lastTs = 0;

    const loop = (ts: number) => {
      const dt = lastTs === 0 ? 0 : ts - lastTs;
      lastTs = ts;

      // Advance pulse phase at ~1.2 Hz
      pulseRef.current = (pulseRef.current + (dt / 1000) * 1.2 * Math.PI * 2) %
        (Math.PI * 2);

      draw(Math.sin(pulseRef.current) * 0.5 + 0.5);
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  // -------------------------------------------------------------------------
  // Resize observer — keeps canvas pixels = wrapper CSS pixels (1 : 1 on
  // standard displays, devicePixelRatio on retina where supported).
  // -------------------------------------------------------------------------
  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;

    const applySize = (w: number, h: number) => {
      if (sizeRef.current.w === w && sizeRef.current.h === h) return;
      canvas.width = w;
      canvas.height = h;
      sizeRef.current = { w, h };
    };

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        applySize(Math.round(width), Math.round(height));
      }
    });

    ro.observe(wrapper);
    applySize(wrapper.clientWidth, wrapper.clientHeight);

    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={wrapperRef}
      role="img"
      aria-label={`Snake game board, ${boardWidth} columns by ${boardHeight} rows`}
      data-testid="game-board"
      className="w-full overflow-hidden rounded-lg border border-green-900/50"
      style={{
        aspectRatio: `${boardWidth} / ${boardHeight}`,
        background: COLOR.background,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: "block", width: "100%", height: "100%" }}
        aria-hidden="true"
      />
    </div>
  );
};

export default GameBoard;
