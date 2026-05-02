/**
 * @file src/components/game/GameBoard.tsx
 * @description Grid-based Snake game board renderer.
 *
 * Renders a responsive grid where each cell is coloured according to its
 * occupant: snake head (neon-green), snake body (green), food (red), or
 * empty (dark). The board scales to fill its container up to a max of 600 px,
 * maintaining a perfect square aspect-ratio regardless of viewport width.
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
 */

import React, { useMemo } from "react";
import type { Position, Snake } from "@/types/game";

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
 * Snake head — lime-300 fill (much brighter than body) with a strong neon
 * halo and fully rounded corners so it reads as the "face" of the snake.
 */
const HEAD_STYLE: React.CSSProperties = {
  boxShadow: "0 0 8px #bef264, 0 0 20px #84cc16, 0 0 36px #4ade8066",
};

/** Snake body — green-500 with a soft ambient glow */
const BODY_STYLE: React.CSSProperties = {
  boxShadow: "0 0 4px #22c55e66",
};

/** Food — red-500 with a strong red halo (animation adds scale/brightness) */
const FOOD_STYLE: React.CSSProperties = {
  boxShadow: "0 0 8px #ef4444, 0 0 18px #f87171aa",
};

const CELL_GLOW: Partial<Record<CellType, React.CSSProperties>> = {
  head: HEAD_STYLE,
  body: BODY_STYLE,
  food: FOOD_STYLE,
};

/**
 * Base Tailwind classes per cell type.
 *
 * Head uses `rounded-full` + lime-300 to stand out visually from the
 * green-500 body segments. Food keeps `rounded-full` + CSS pulse animation.
 * Empty cells have no class so the grid background shows through.
 */
const CELL_CLASSES: Record<CellType, string> = {
  head: "bg-lime-300 rounded-full",
  body: "bg-green-500 rounded-sm",
  food: "bg-red-500 rounded-full animate-pulse-glow",
  empty: "bg-gray-950",
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
      {/* Inner grid fills 100% of the outer wrapper.
          Gap colour (rgba(74,222,128,0.1)) gives the grid lines their
          0.1-opacity green tint against the gray-950 cell background. */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${boardWidth}, 1fr)`,
          gridTemplateRows: `repeat(${boardHeight}, 1fr)`,
          gap: "1px",
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(74, 222, 128, 0.1)" /* grid-line colour */,
        }}
      >
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
