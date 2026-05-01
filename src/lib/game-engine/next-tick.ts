/**
 * @file src/lib/game-engine/next-tick.ts
 * @description Pure `nextTick` function — the frame-by-frame engine step.
 *
 * Differences from the `TICK` action in `gameReducer`
 * ─────────────────────────────────────────────────────────────────────────────
 * • Direction is supplied explicitly at call-site (no `nextDirection` queue).
 * • Wall collision is lethal (out-of-bounds → GAME_OVER) rather than toroidal.
 * • No game-status guard — callers decide when to drive the loop.
 *
 * Design
 * ─────────────────────────────────────────────────────────────────────────────
 * • Pure function — zero side effects, deterministic given the same inputs.
 * • Never mutates `state` — every branch returns a new object spread.
 * • Food placement delegates to `randomFreeCoordinate`; falls back to the
 *   current food position if the board is completely full (shouldn't happen in
 *   practice but avoids a nullable return type).
 */

import type { Coordinate, Direction, GameState } from "@/types";
import { GameStatus } from "@/types";
import { coordinatesEqual, moveCoordinate, randomFreeCoordinate } from "./utils";
import { isWallCollision, isSelfCollision } from "./engine";

// Score awarded per food pellet — mirrors the engine's DEFAULT_CONFIG.
const SCORE_PER_PELLET = 10;

// ---------------------------------------------------------------------------
// nextTick
// ---------------------------------------------------------------------------

/**
 * Advances the game by exactly one frame in the given `direction`.
 *
 * Sequence of operations:
 *  1. Compute the new head position by moving one cell in `direction`.
 *  2. Wall collision → return GAME_OVER snapshot.
 *  3. Self collision (head vs. body excluding the outgoing tail) → GAME_OVER.
 *  4. Food check → if eaten, grow snake + spawn new food + increment score.
 *  5. Otherwise move (prepend new head, drop tail).
 *
 * @param state     - Current immutable game snapshot.
 * @param direction - Cardinal direction to move the snake this tick.
 * @returns A new `GameState` snapshot; `state` is never mutated.
 */
export function nextTick(state: GameState, direction: Direction): GameState {
  const newHead = moveCoordinate(state.snake[0], direction);

  // ── 1. Wall collision ────────────────────────────────────────────────────
  if (isWallCollision(newHead, state.boardWidth, state.boardHeight)) {
    const highScore = Math.max(state.score, state.highScore);
    return { ...state, direction, status: GameStatus.game_over, highScore };
  }

  // ── 2. Self collision ────────────────────────────────────────────────────
  // isSelfCollision excludes the outgoing tail internally (snake.slice(0, -1)),
  // so the full snake array is passed — the tail vacates its cell this tick.
  if (isSelfCollision(newHead, state.snake)) {
    const highScore = Math.max(state.score, state.highScore);
    return { ...state, direction, status: GameStatus.game_over, highScore };
  }

  // ── 3. Food consumption ──────────────────────────────────────────────────
  const ateFood = coordinatesEqual(newHead, state.food);

  const newSnake: readonly Coordinate[] = ateFood
    ? [newHead, ...state.snake]           // grow: keep existing tail
    : [newHead, ...state.snake.slice(0, -1)]; // move: drop tail

  const newScore = ateFood ? state.score + SCORE_PER_PELLET : state.score;
  const highScore = Math.max(newScore, state.highScore);

  const newFood: Coordinate = ateFood
    ? (randomFreeCoordinate(state.boardWidth, state.boardHeight, newSnake) ??
        state.food) // fallback: board full (shouldn't occur during normal play)
    : state.food;

  // ── 4. Return next snapshot ──────────────────────────────────────────────
  return {
    ...state,
    snake: newSnake,
    food: newFood,
    score: newScore,
    highScore,
    direction,
  };
}
