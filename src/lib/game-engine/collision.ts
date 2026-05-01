/**
 * Collision detection for the snake game engine.
 *
 * Provides wall-boundary and self-intersection checks.
 * Both return `GameStatus.game_over` when a collision is detected.
 *
 * Created in a dedicated file to avoid merge conflicts with other
 * agents editing engine.ts, reducer.ts, and next-tick.ts.
 */

// ─── Local type definitions ────────────────────────────────────────
// Minimal types duplicated here so this module compiles independently
// of src/types/game.ts (which another agent owns). Once that file is
// merged, replace these with an import:
//   import { GameStatus, Position, Snake, GameState } from "@/types/game";

/** Possible states for the game lifecycle. */
export enum GameStatus {
  idle = "idle",
  running = "running",
  paused = "paused",
  game_over = "game_over",
}

/** A single (x, y) coordinate on the board grid. */
export interface Position {
  x: number;
  y: number;
}

/** The snake is an ordered list of positions; index 0 is the head. */
export type Snake = Position[];

/**
 * The subset of game state required by collision detection.
 * Using `Pick`-style narrowing so callers don't need the full state.
 */
export interface CollisionState {
  /** Ordered body segments; index 0 = head. */
  snake: Snake;
  /** Number of columns in the grid (0-indexed: valid x is 0..boardWidth-1). */
  boardWidth: number;
  /** Number of rows in the grid (0-indexed: valid y is 0..boardHeight-1). */
  boardHeight: number;
}

// ─── Collision detection ───────────────────────────────────────────

/**
 * Check whether the snake's head has collided with a wall or with
 * its own body.
 *
 * @param state - Minimal game state containing the snake and board dims.
 * @returns `GameStatus.game_over` if any collision is detected, `null` otherwise.
 *
 * @example
 * ```ts
 * const result = checkCollision({
 *   snake: [{ x: -1, y: 5 }, { x: 0, y: 5 }],
 *   boardWidth: 20,
 *   boardHeight: 20,
 * });
 * // result === GameStatus.game_over  (wall collision: x < 0)
 * ```
 */
export function checkCollision(state: CollisionState): GameStatus.game_over | null {
  const { snake, boardWidth, boardHeight } = state;

  // Guard: an empty snake cannot collide with anything.
  if (snake.length === 0) {
    return null;
  }

  const head = snake[0];

  // ── Wall collision ──────────────────────────────────────────────
  // The grid is 0-indexed: valid x in [0, boardWidth-1],
  //                        valid y in [0, boardHeight-1].
  if (
    head.x < 0 ||
    head.y < 0 ||
    head.x >= boardWidth ||
    head.y >= boardHeight
  ) {
    return GameStatus.game_over;
  }

  // ── Self collision ──────────────────────────────────────────────
  // Compare the head against every *other* segment (indices 1..n-1).
  // A snake of length 1 (head only) cannot self-collide, and the
  // loop naturally skips when snake.length <= 1.
  for (let i = 1; i < snake.length; i++) {
    if (head.x === snake[i].x && head.y === snake[i].y) {
      return GameStatus.game_over;
    }
  }

  return null;
}

/**
 * Boolean convenience wrapper around {@link checkCollision}.
 *
 * @param state - Minimal game state containing the snake and board dims.
 * @returns `true` when any collision (wall or self) is detected.
 */
export function isCollision(state: CollisionState): boolean {
  return checkCollision(state) !== null;
}
