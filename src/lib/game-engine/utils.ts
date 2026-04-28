/**
 * @file src/lib/game-engine/utils.ts
 * @description Pure utility functions shared across the game engine.
 *
 * Every function here is:
 *   • Side-effect free — safe to call in tests without setup.
 *   • Referentially transparent — same inputs always produce same output.
 *   • Individually exportable — tree-shakeable; only used functions are bundled.
 */

import type { Coordinate, Direction } from "@/types";

// ---------------------------------------------------------------------------
// Coordinate helpers
// ---------------------------------------------------------------------------

/**
 * Returns true when two coordinates occupy the same cell.
 *
 * @example
 *   coordinatesEqual([2, 3], [2, 3]); // true
 *   coordinatesEqual([0, 1], [1, 0]); // false
 */
export function coordinatesEqual(a: Coordinate, b: Coordinate): boolean {
  return a[0] === b[0] && a[1] === b[1];
}

/**
 * Advances a coordinate one cell in the given direction.
 * Does NOT apply board wrapping — callers handle boundary logic.
 */
export function moveCoordinate(
  coord: Coordinate,
  direction: Direction
): Coordinate {
  const [x, y] = coord;
  switch (direction) {
    case "UP":
      return [x, y - 1];
    case "DOWN":
      return [x, y + 1];
    case "LEFT":
      return [x - 1, y];
    case "RIGHT":
      return [x + 1, y];
  }
}

/**
 * Wraps a coordinate that has moved off-board back to the opposite edge.
 * Produces a toroidal (pac-man style) board topology.
 */
export function wrapCoordinate(
  coord: Coordinate,
  boardWidth: number,
  boardHeight: number
): Coordinate {
  const x = ((coord[0] % boardWidth) + boardWidth) % boardWidth;
  const y = ((coord[1] % boardHeight) + boardHeight) % boardHeight;
  return [x, y];
}

// ---------------------------------------------------------------------------
// Direction helpers
// ---------------------------------------------------------------------------

/** Returns true when the new direction would reverse the snake (instant death). */
export function isOppositeDirection(a: Direction, b: Direction): boolean {
  return (
    (a === "UP" && b === "DOWN") ||
    (a === "DOWN" && b === "UP") ||
    (a === "LEFT" && b === "RIGHT") ||
    (a === "RIGHT" && b === "LEFT")
  );
}

// ---------------------------------------------------------------------------
// Random helpers
// ---------------------------------------------------------------------------

/**
 * Generates a random coordinate within the board boundaries.
 * Excludes cells occupied by the snake to avoid spawning food inside it.
 *
 * @param boardWidth  - Number of columns.
 * @param boardHeight - Number of rows.
 * @param occupied    - Cells that must not be chosen (e.g. current snake body).
 * @returns A free coordinate, or `null` if the board is completely full.
 */
export function randomFreeCoordinate(
  boardWidth: number,
  boardHeight: number,
  occupied: readonly Coordinate[]
): Coordinate | null {
  const totalCells = boardWidth * boardHeight;
  if (occupied.length >= totalCells) return null;

  let candidate: Coordinate;
  do {
    const x = Math.floor(Math.random() * boardWidth);
    const y = Math.floor(Math.random() * boardHeight);
    candidate = [x, y];
  } while (occupied.some((c) => coordinatesEqual(c, candidate)));

  return candidate;
}
