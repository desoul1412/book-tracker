/**
 * @file src/components/game/GameBoard.tsx
 * @description Canvas-based Snake game board renderer.
 *
 * Responsibilities
 * ─────────────────────────────────────────────────────────────────────────────
 * • Renders the game grid background, snake body (with distinct head colour),
 *   and food pellet onto a <canvas> element via the 2D rendering context.
 * • Re-draws on every `gameState` change via a `useEffect` draw cycle.
 * • Derives canvas pixel dimensions from `config` (or `gameState` board size)
 *   and a fixed cell size constant, keeping the layout declarative.
 *
 * Design decisions
 * ─────────────────────────────────────────────────────────────────────────────
 * • Pure canvas 2D API — no third-party rendering libraries.  This keeps the
 *   bundle small and gives full control over draw order and pixel alignment.
 * • Cell size is defined as a local constant (`CELL_SIZE`) rather than a prop
 *   so the board always renders at a predictable scale.  If responsive sizing
 *   is needed later it can be promoted to a prop without breaking consumers.
 * • The component is intentionally stateless: all game logic lives in
 *   `useGameEngine`; GameBoard is purely a view.
 * • `useRef` holds the canvas DOM reference; React never needs to re-render
 *   the component for draw updates — only the canvas pixels change.
 * • The draw cycle clears the entire canvas before each frame to avoid ghost
 *   pixels from previous frames.
 * • Colours follow a minimal design token approach — they are co-located
 *   constants easy to replace with Tailwind CSS variables later.
 *
 * Accessibility
 * ─────────────────────────────────────────────────────────────────────────────
 * • `role="img"` and `aria-label` expose a meaningful description to screen
 *   readers, since canvas content is otherwise invisible to the accessibility
 *   tree.
 *
 * @example
 *   <GameBoard gameState={state} config={{ boardWidth: 20, boardHeight: 20 }} />
 */

import { useEffect, useRef } from "react";
import type { GameState, GameConfig } from "../../types/game";

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------

/** Width/height of each board cell in CSS pixels. */
const CELL_SIZE = 24;

/** 1-pixel gap between cells for a subtle grid effect. */
const CELL_GAP = 1;

const COLORS = {
  /** Board background. */
  background: "#1a1a2e",
  /** Grid line / cell background. */
  gridCell: "#16213e",
  /** Snake body segments (all except head). */
  snakeBody: "#4ade80", // green-400
  /** Snake head — visually distinct so the player tracks it easily. */
  snakeHead: "#86efac", // green-300 (lighter)
  /** Snake segment border/shadow for depth. */
  snakeStroke: "#166534", // green-900
  /** Food pellet fill. */
  food: "#f87171", // red-400
  /** Food pellet border. */
  foodStroke: "#991b1b", // red-800
} as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns the effective board dimensions, preferring `config` values over the
 * runtime values stored in `gameState` (which may lag one tick).
 */
function resolveBoardDimensions(
  gameState: GameState,
  config: GameConfig
): { boardWidth: number; boardHeight: number } {
  return {
    boardWidth: config.boardWidth ?? gameState.boardWidth,
    boardHeight: config.boardHeight ?? gameState.boardHeight,
  };
}

/** Converts a cell coordinate to the top-left canvas pixel of that cell. */
function cellToPixel(index: number): number {
  return index * (CELL_SIZE + CELL_GAP);
}

// ---------------------------------------------------------------------------
// Draw helpers
// ---------------------------------------------------------------------------

function drawGrid(
  ctx: CanvasRenderingContext2D,
  boardWidth: number,
  boardHeight: number
): void {
  ctx.fillStyle = COLORS.gridCell;
  for (let x = 0; x < boardWidth; x++) {
    for (let y = 0; y < boardHeight; y++) {
      ctx.fillRect(cellToPixel(x), cellToPixel(y), CELL_SIZE, CELL_SIZE);
    }
  }
}

function drawSnake(
  ctx: CanvasRenderingContext2D,
  snake: GameState["snake"]
): void {
  snake.forEach(([x, y], index) => {
    const isHead = index === 0;

    ctx.fillStyle = isHead ? COLORS.snakeHead : COLORS.snakeBody;
    ctx.strokeStyle = COLORS.snakeStroke;
    ctx.lineWidth = 1;

    const px = cellToPixel(x);
    const py = cellToPixel(y);

    // Slightly inset each segment for a bevelled appearance.
    const inset = 1;
    ctx.fillRect(px + inset, py + inset, CELL_SIZE - inset * 2, CELL_SIZE - inset * 2);
    ctx.strokeRect(px + inset, py + inset, CELL_SIZE - inset * 2, CELL_SIZE - inset * 2);

    // Draw two white pupils on the head to make it immediately recognisable.
    if (isHead) {
      ctx.fillStyle = "#ffffff";
      const eyeSize = Math.max(2, CELL_SIZE / 8);
      const eyeOffset = CELL_SIZE / 4;
      ctx.fillRect(px + eyeOffset, py + eyeOffset, eyeSize, eyeSize);
      ctx.fillRect(
        px + CELL_SIZE - eyeOffset - eyeSize,
        py + eyeOffset,
        eyeSize,
        eyeSize
      );
    }
  });
}

function drawFood(
  ctx: CanvasRenderingContext2D,
  food: GameState["food"]
): void {
  const [x, y] = food;
  const px = cellToPixel(x);
  const py = cellToPixel(y);
  const radius = (CELL_SIZE - 2) / 2;
  const cx = px + CELL_SIZE / 2;
  const cy = py + CELL_SIZE / 2;

  ctx.fillStyle = COLORS.food;
  ctx.strokeStyle = COLORS.foodStroke;
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Small specular highlight for a "pellet" feel.
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.beginPath();
  ctx.arc(cx - radius * 0.25, cy - radius * 0.25, radius * 0.3, 0, Math.PI * 2);
  ctx.fill();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface GameBoardProps {
  /** Immutable game snapshot produced by `useGameEngine`. */
  gameState: GameState;
  /** Configuration forwarded from the host component (determines board size). */
  config: GameConfig;
}

/**
 * Pure canvas renderer for the Snake game board.
 *
 * Accepts `gameState` and `config` as props and redraws the canvas on every
 * state change via a `useEffect` draw cycle.  Contains no game logic.
 */
export function GameBoard({ gameState, config }: GameBoardProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { boardWidth, boardHeight } = resolveBoardDimensions(gameState, config);

  // Canvas pixel dimensions — account for the gap between cells.
  const canvasWidth = boardWidth * CELL_SIZE + (boardWidth - 1) * CELL_GAP;
  const canvasHeight = boardHeight * CELL_SIZE + (boardHeight - 1) * CELL_GAP;

  // ------------------------------------------------------------------
  // Draw cycle — runs on every gameState change
  // ------------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 1. Clear previous frame.
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // 2. Board background.
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // 3. Grid cells.
    drawGrid(ctx, boardWidth, boardHeight);

    // 4. Food pellet (drawn before snake so the snake overlaps it when on top).
    drawFood(ctx, gameState.food);

    // 5. Snake body then head (forEach iterates tail → head in reverse
    //    so later draws paint over earlier ones, making head always visible).
    drawSnake(ctx, gameState.snake);
  }, [gameState, boardWidth, boardHeight, canvasWidth, canvasHeight]);

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      role="img"
      aria-label={`Snake game board — ${boardWidth} × ${boardHeight} cells`}
      style={{ display: "block" }}
      data-testid="game-board"
    />
  );
}

export default GameBoard;
