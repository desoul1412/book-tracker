/**
 * @file src/components/game/GameBoard.tsx
 * @description Grid-based Snake game board renderer with visual juice.
 *
 * Renders a responsive grid where each cell is coloured according to its
 * occupant: snake head (lime, circular, glowing), snake body (green),
 * food (red, pulsing), or empty (dark). The board scales to fill its
 * container up to a max of 600 px, maintaining a perfect square
 * aspect-ratio regardless of viewport width.
 *
 * Visual juice enhancements
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. **Snake head** — lime-300 bg, rounded-full (circle vs body square),
 *    scale-90 so it reads as a filled dot, neon lime glow via boxShadow.
 *    Lime-300 (#bef264) is 30 deg warmer on the hue wheel than green-600
 *    body (#16a34a), creating instant perceptual separation. The circle vs
 *    rounded-square silhouette difference works even in peripheral vision.
 * 2. **Food pulse** — CSS `animate-food-pulse` class applies a subtle
 *    scale + opacity oscillation (0.78-0.96 range, 1.1 s period).
 *    Scale stays within cell bounds to avoid overlap with adjacent segments.
 * 3. **Grid lines** — CSS `backgroundImage` with repeating linear gradients
 *    at rgba(255,255,255, 0.1) opacity. Lines are 1 px wide, spaced by
 *    cell size (100%/boardWidth and 100%/boardHeight). Applied to the grid
 *    container so they sit behind cell content.
 *
 * Design decisions
 * ─────────────────────────────────────────────────────────────────────────────
 * • Pure presentational component — receives snake, food, and board dimensions
 *   as props; performs no logic or side effects.
 * • Responsive layout: the outer wrapper uses CSS `aspect-ratio` so the board
 *   stays square at any container width. CSS Grid `1fr` columns/rows fill the
 *   available space, making a fixed `cellSize` prop unnecessary for layout.
 *   `cellSize` is kept for backward-compat but no longer used for sizing.
 * • Neon-glow effects are applied via inline `boxShadow` rather than arbitrary
 *   Tailwind values to keep the JIT-safe class list clean.
 * • Cell identity is determined by a Set lookup for O(1) membership tests so
 *   large boards don't penalise rendering performance.
 * • `aria-label` on the board gives screen readers a meaningful description.
 * • All glow colours meet WCAG 1.4.11 (Non-text Contrast) with >3:1 ratio
 *   against the gray-950 background.
 */

import React, { useMemo } from "react";
import type { Position, Snake } from "../../types/game";

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
}

// ---------------------------------------------------------------------------
// Cell type
// ---------------------------------------------------------------------------

type CellType = "head" | "body" | "food" | "empty";

// ---------------------------------------------------------------------------
// Neon glow helpers (inline style so no arbitrary Tailwind values needed)
// ---------------------------------------------------------------------------

/**
 * Neon-lime glow — snake head.
 * Uses lime-400 (#a3e635) for the halo to match the lime-300 bg.
 * Two-layer shadow: tight inner (6 px) + diffuse outer (14 px) for depth.
 */
const NEON_LIME_HEAD: React.CSSProperties = {
  boxShadow: "0 0 6px rgba(163,230,53,0.8), 0 0 14px rgba(163,230,53,0.5)",
};

/** Softer green glow — snake body */
const NEON_GREEN_SOFT: React.CSSProperties = {
  boxShadow: "0 0 4px #16a34a",
};

/** Neon-red glow — food */
const NEON_RED: React.CSSProperties = {
  boxShadow: "0 0 6px #ef4444, 0 0 14px #f87171",
};

const CELL_GLOW: Partial<Record<CellType, React.CSSProperties>> = {
  head: NEON_LIME_HEAD,
  body: NEON_GREEN_SOFT,
  food: NEON_RED,
};

/**
 * Base Tailwind classes per cell type.
 *
 * Head: lime-300 bg + rounded-full (circle) + scale-90 (dot within cell).
 * Body: green-600 bg + rounded-sm (subtle rounding, still reads as square).
 * Food: red-500 bg + rounded-full + animate-food-pulse (CSS scale/opacity).
 * Empty: gray-900 bg (dark, no glow).
 */
const CELL_CLASSES: Record<CellType, string> = {
  head: "bg-lime-300 rounded-full scale-90",
  body: "bg-green-600 rounded-sm",
  food: "bg-red-500 rounded-full animate-food-pulse",
  empty: "bg-gray-900",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * GameBoard — a pure responsive grid renderer for the Snake game.
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
}) => {
  // Build a lookup set for snake body cells (excluding head) for O(1) tests.
  const bodySet = useMemo(() => {
    const set = new Set<string>();
    for (let i = 1; i < snake.length; i++) {
      set.add(`${snake[i][0]},${snake[i][1]}`);
    }
    return set;
  }, [snake]);

  const head = snake[0];
  const foodKey = `${food[0]},${food[1]}`;
  const headKey = head ? `${head[0]},${head[1]}` : null;

  const getCellType = (x: number, y: number): CellType => {
    const key = `${x},${y}`;
    if (key === headKey) return "head";
    if (bodySet.has(key)) return "body";
    if (key === foodKey) return "food";
    return "empty";
  };

  /**
   * Grid-line overlay using CSS background-image.
   * Two repeating-linear-gradient layers (vertical + horizontal) produce
   * 1 px white lines at 0.1 opacity, spaced evenly per cell.
   *
   * The grid gap is already 1 px (#030712 / gray-950), so these lines
   * overlay on top with a subtle white tint that makes the grid structure
   * visible without overpowering the game content.
   */
  const gridLineStyle: React.CSSProperties = useMemo(
    () => ({
      display: "grid",
      gridTemplateColumns: `repeat(${boardWidth}, 1fr)`,
      gridTemplateRows: `repeat(${boardHeight}, 1fr)`,
      gap: "1px",
      width: "100%",
      height: "100%",
      backgroundColor: "#030712" /* gap colour — gray-950 */,
      backgroundImage: [
        `repeating-linear-gradient(90deg, rgba(255,255,255,0.1) 0px, rgba(255,255,255,0.1) 1px, transparent 1px, transparent calc(100% / ${boardWidth}))`,
        `repeating-linear-gradient(0deg, rgba(255,255,255,0.1) 0px, rgba(255,255,255,0.1) 1px, transparent 1px, transparent calc(100% / ${boardHeight}))`,
      ].join(", "),
      backgroundSize: "100% 100%",
    }),
    [boardWidth, boardHeight]
  );

  return (
    /**
     * Outer wrapper: `aspect-ratio` keeps the board square; width is set by
     * the parent (e.g. `w-full max-w-[600px]`).
     */
    <div
      role="img"
      aria-label={`Snake game board, ${boardWidth} columns by ${boardHeight} rows`}
      data-testid="game-board"
      className="w-full overflow-hidden rounded-lg border border-green-900/50 bg-gray-950 animate-board-shimmer"
      style={{
        aspectRatio: `${boardWidth} / ${boardHeight}`,
      }}
    >
      {/* Inner grid fills 100% of the outer wrapper */}
      <div style={gridLineStyle}>
        {Array.from({ length: boardHeight }, (_, y) =>
          Array.from({ length: boardWidth }, (_, x) => {
            const type = getCellType(x, y);
            return (
              <div
                key={`${x}-${y}`}
                className={CELL_CLASSES[type]}
                style={CELL_GLOW[type]}
                data-testid={
                  type !== "empty" ? `cell-${type}-${x}-${y}` : undefined
                }
              />
            );
          })
        )}
      </div>
    </div>
  );
};

export default GameBoard;
