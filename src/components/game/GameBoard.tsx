/**
 * @file src/components/game/GameBoard.tsx
 * @description Canvas-based Snake game board renderer with mobile touch controls.
 *
 * Renders the game board onto an HTML5 <canvas> element using the Canvas 2D
 * API. Each frame is drawn imperatively with fillStyle / strokeStyle /
 * fillRect so the renderer is fully decoupled from Tailwind's JIT pass.
 *
 * Mobile touch controls
 * ---------------------------------------------------------------------------
 * When an `onDirectionChange` callback is provided, the component attaches
 * native touchstart/touchend listeners to the board wrapper via the
 * `useSwipeControls` hook. Swipe gestures are translated into Direction
 * commands and forwarded to `onDirectionChange` (typically wired to
 * `useGameEngine().changeDirection`).
 *
 * The wrapper element uses CSS `touch-action: none` to prevent the browser
 * from intercepting touch events for scrolling or zooming while the player
 * is interacting with the game board.
 *
 * Visual identity
 * ---------------------------------------------------------------------------
 * - Grid lines   : 1 px strokes at rgba(74,222,128,0.10) -- 0.1-opacity green.
 * - Snake head   : lime-300 (#bef264) filled circle with a bright neon halo.
 * - Snake body   : green-500 (#22c55e) rounded rectangles with a soft glow.
 * - Food pellet  : red-500 (#ef4444) circle that pulses (scale + brightness)
 *                  via a requestAnimationFrame animation loop.
 */

import React, { useEffect, useRef, useCallback } from "react";
import type { Direction, Position, Snake } from "@/types/game";
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
   * Called when the player swipes on the game board. Wire this to
   * `useGameEngine().changeDirection` to translate touch input into
   * game state changes.
   */
  onDirectionChange?: (direction: Direction) => void;
  /**
   * @deprecated No longer used for layout -- board is responsive via CSS.
   * Kept for API backward-compatibility.
   */
  cellSize?: number;
}

// ---------------------------------------------------------------------------
// Design tokens (Canvas 2D colour strings)
// ---------------------------------------------------------------------------

const COLOR = {
  background: "#030712",               // gray-950
  gridLine:   "rgba(74,222,128,0.10)", // green-400 @ 0.1 opacity
  head:       "#bef264",               // lime-300 -- distinct from body
  headGlow:   "rgba(190,242,100,0.55)",
  body:       "#22c55e",               // green-500
  bodyGlow:   "rgba(34,197,94,0.35)",
  food:       "#ef4444",               // red-500
  foodGlow:   "rgba(248,113,113,0.60)",
} as const;

// ---------------------------------------------------------------------------
// Canvas draw helpers
// ---------------------------------------------------------------------------

function drawGrid(
  ctx: CanvasRenderingContext2D,
  cols: number,
  rows: number,
  cellW: number,
  cellH: number,
): void {
  ctx.strokeStyle = COLOR.gridLine;
  ctx.lineWidth = 1;

  for (let c = 0; c <= cols; c++) {
    const x = Math.round(c * cellW) + 0.5;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, rows * cellH);
    ctx.stroke();
  }

  for (let r = 0; r <= rows; r++) {
    const y = Math.round(r * cellH) + 0.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(cols * cellW, y);
    ctx.stroke();
  }
}

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
  ctx.arcTo(x + w, y,     x + w, y + r,     r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x,      y + h, x,      y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x,      y,     x + r,  y,          r);
  ctx.closePath();
}

function drawHead(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
): void {
  ctx.shadowColor = COLOR.headGlow;
  ctx.shadowBlur  = 18;
  ctx.fillStyle   = COLOR.head;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawBodySegment(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  const inset  = w * 0.08;
  const bx     = x + inset;
  const by     = y + inset;
  const bw     = w - inset * 2;
  const bh     = h - inset * 2;
  const radius = Math.min(bw, bh) * 0.18;

  ctx.shadowColor = COLOR.bodyGlow;
  ctx.shadowBlur  = 6;
  ctx.fillStyle   = COLOR.body;
  roundedRect(ctx, bx, by, bw, bh, radius);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawFood(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  baseR: number,
  pulse: number,
): void {
  const r = baseR * (0.75 + 0.25 * pulse);

  ctx.shadowColor = COLOR.foodGlow;
  ctx.shadowBlur  = 14 + 10 * pulse;
  ctx.fillStyle   = COLOR.food;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

// ---------------------------------------------------------------------------
// Noop fallback for optional onDirectionChange prop
// ---------------------------------------------------------------------------
const noop = () => {};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const GameBoard: React.FC<GameBoardProps> = ({
  snake,
  food,
  boardWidth,
  boardHeight,
  onDirectionChange,
}) => {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const sizeRef    = useRef({ w: 0, h: 0 });
  const pulseRef   = useRef(0);
  const snakeRef   = useRef(snake);
  const foodRef    = useRef(food);
  const rafRef     = useRef<number>(0);

  snakeRef.current = snake;
  foodRef.current  = food;

  // -------------------------------------------------------------------------
  // Mobile touch controls — attach swipe detection to the board wrapper.
  // The useSwipeControls hook registers native touchstart/touchend listeners
  // on the wrapper element and calls onDirectionChange with the resolved
  // swipe Direction. Uses { passive: false } on touchstart to allow
  // preventDefault() for scroll suppression.
  // -------------------------------------------------------------------------
  useSwipeControls(wrapperRef, onDirectionChange ?? noop);

  // -------------------------------------------------------------------------
  // Core draw function
  // -------------------------------------------------------------------------
  const draw = useCallback(
    (pulse: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const { width: W, height: H } = canvas;
      const cols  = boardWidth;
      const rows  = boardHeight;
      const cellW = W / cols;
      const cellH = H / rows;

      ctx.fillStyle = COLOR.background;
      ctx.fillRect(0, 0, W, H);

      drawGrid(ctx, cols, rows, cellW, cellH);

      const currentSnake = snakeRef.current;
      for (let i = 1; i < currentSnake.length; i++) {
        const [bx, by] = currentSnake[i];
        drawBodySegment(ctx, bx * cellW, by * cellH, cellW, cellH);
      }

      if (currentSnake.length > 0) {
        const [hx, hy] = currentSnake[0];
        const cx = hx * cellW + cellW / 2;
        const cy = hy * cellH + cellH / 2;
        drawHead(ctx, cx, cy, Math.min(cellW, cellH) * 0.46);
      }

      const [fx, fy] = foodRef.current;
      const fcx = fx * cellW + cellW / 2;
      const fcy = fy * cellH + cellH / 2;
      drawFood(ctx, fcx, fcy, Math.min(cellW, cellH) * 0.40, pulse);
    },
    [boardWidth, boardHeight],
  );

  // -------------------------------------------------------------------------
  // rAF loop — food pulse animation
  // -------------------------------------------------------------------------
  useEffect(() => {
    let lastTs = 0;

    const loop = (ts: number) => {
      const dt = lastTs === 0 ? 0 : ts - lastTs;
      lastTs = ts;

      pulseRef.current =
        (pulseRef.current + (dt / 1000) * 1.2 * Math.PI * 2) % (Math.PI * 2);

      draw(Math.sin(pulseRef.current) * 0.5 + 0.5);
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  // -------------------------------------------------------------------------
  // ResizeObserver — keeps canvas pixels synced with CSS wrapper size
  // -------------------------------------------------------------------------
  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas  = canvasRef.current;
    if (!wrapper || !canvas) return;

    const applySize = (w: number, h: number) => {
      if (sizeRef.current.w === w && sizeRef.current.h === h) return;
      canvas.width  = w;
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
      className="w-full overflow-hidden rounded-lg border border-green-900/50 touch-none"
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
