/**
 * @file src/components/game/GameBoard.tsx
 * @description Grid-based Snake game board renderer.
 *
 * Renders a fixed-size grid where each cell is coloured according to its
 * occupant: snake head (bright green), snake body (green), food (red), or
 * empty (dark).
 *
 * Design decisions
 * ─────────────────────────────────────────────────────────────────────────────
 * • Pure presentational component — receives snake, food, and board dimensions
 *   as props; performs no logic or side effects.
 * • CSS Grid layout: a single `grid` div with `gridTemplateColumns` ensures
 *   the board is always correctly sized regardless of boardWidth/boardHeight.
 * • Cell identity is determined by a Set lookup for O(1) membership tests so
 *   large boards don't penalise rendering performance.
 * • `aria-label` on the board and a visually-hidden status region give screen
 *   readers a minimal but meaningful description of the game state.
 */

import React, { useMemo, useRef } from "react";
import type { Position, Snake } from "../../types/game";
import type { Direction } from "../../types/game";
import { useSwipeControls } from "../../hooks/useSwipeControls";

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
  /** Size of each cell in pixels. Defaults to 24. */
  cellSize?: number;
  /**
   * Called when the player swipes on the board (mobile touch).
   * When provided, swipe detection is activated on the board element.
   */
  onDirectionChange?: (direction: Direction) => void;
}

// ---------------------------------------------------------------------------
// Cell type helpers
// ---------------------------------------------------------------------------

type CellType = "head" | "body" | "food" | "empty";

const CELL_CLASSES: Record<CellType, string> = {
  head: "bg-green-400 rounded-sm",
  body: "bg-green-600 rounded-sm",
  food: "bg-red-500 rounded-full",
  empty: "bg-gray-800",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * GameBoard — a pure grid renderer for the Snake game.
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
  cellSize = 24,
  onDirectionChange,
}) => {
  // Ref attached to the board container; used by useSwipeControls for touch events.
  const boardRef = useRef<HTMLDivElement>(null);

  // Wire up swipe detection. The hook is a no-op when onDirectionChange is undefined.
  useSwipeControls(boardRef, onDirectionChange ?? (() => {}));

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
    <div
      ref={boardRef}
      role="img"
      aria-label={`Snake game board, ${boardWidth} columns by ${boardHeight} rows`}
      data-testid="game-board"
      className="border border-gray-700 bg-gray-900 p-1 shadow-lg touch-none"
      /* touch-none disables default browser scroll/zoom on the board element */
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${boardWidth}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${boardHeight}, ${cellSize}px)`,
        gap: "1px",
        width: boardWidth * cellSize + (boardWidth - 1) + 2 /* 1px gap + 2px padding */,
      }}
    >
      {Array.from({ length: boardHeight }, (_, y) =>
        Array.from({ length: boardWidth }, (_, x) => {
          const type = getCellType(x, y);
          return (
            <div
              key={`${x}-${y}`}
              className={CELL_CLASSES[type]}
              style={{ width: cellSize, height: cellSize }}
              data-testid={type !== "empty" ? `cell-${type}-${x}-${y}` : undefined}
            />
          );
        })
      )}
    </div>
  );
};

export default GameBoard;
