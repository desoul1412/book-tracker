/**
 * @file src/components/game/GameBoard.tsx
 * @description CSS-grid board that renders snake cells and the food pellet.
 *
 * Design decisions
 * ─────────────────────────────────────────────────────────────────────────────
 * • CSS grid (not canvas) — simpler accessibility tree, easier to style with
 *   Tailwind, and performant enough for a 20×20 board at 60 fps.
 * • Cell identity keyed by `x-y` string — avoids unnecessary DOM diffing when
 *   the snake moves (only head and tail cells change each tick).
 * • `aria-label` on the board container — screen readers announce the grid
 *   dimensions without reading out every cell.
 * • The component is purely presentational — it receives pre-computed data from
 *   the parent and dispatches no actions.
 */

import type { Coordinate } from "@/types";
import { coordinatesEqual } from "@/lib/game-engine";

// ---------------------------------------------------------------------------
// Cell type classification (drives Tailwind class selection)
// ---------------------------------------------------------------------------

type CellType = "head" | "body" | "food" | "empty";

function classifyCell(
  coord: Coordinate,
  snake: readonly Coordinate[],
  food: Coordinate
): CellType {
  if (coordinatesEqual(coord, snake[0])) return "head";
  if (snake.slice(1).some((s) => coordinatesEqual(s, coord))) return "body";
  if (coordinatesEqual(coord, food)) return "food";
  return "empty";
}

const CELL_CLASSES: Record<CellType, string> = {
  head: "bg-emerald-400 rounded-sm",
  body: "bg-emerald-600 rounded-sm",
  food: "bg-red-500 rounded-full scale-75",
  empty: "bg-transparent",
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface GameBoardProps {
  snake: readonly Coordinate[];
  food: Coordinate;
  boardWidth: number;
  boardHeight: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GameBoard({
  snake,
  food,
  boardWidth,
  boardHeight,
}: GameBoardProps) {
  const cells: Coordinate[] = [];
  for (let y = 0; y < boardHeight; y++) {
    for (let x = 0; x < boardWidth; x++) {
      cells.push([x, y]);
    }
  }

  return (
    <div
      role="grid"
      aria-label={`Snake game board, ${boardWidth} columns by ${boardHeight} rows`}
      className="border border-gray-700 bg-gray-900"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${boardWidth}, 1fr)`,
        gridTemplateRows: `repeat(${boardHeight}, 1fr)`,
        width: `min(90vw, ${boardWidth * 24}px)`,
        aspectRatio: `${boardWidth} / ${boardHeight}`,
      }}
    >
      {cells.map(([x, y]) => {
        const type = classifyCell([x, y], snake, food);
        return (
          <div
            key={`${x}-${y}`}
            role="gridcell"
            aria-label={type !== "empty" ? type : undefined}
            className={`transition-colors duration-75 ${CELL_CLASSES[type]}`}
          />
        );
      })}
    </div>
  );
}
