/**
 * @file src/lib/game-engine/engine.ts
 * @description Core direction-validation and direction-queuing logic.
 *
 * Why this file exists
 * ─────────────────────────────────────────────────────────────────────────────
 * Snake has one subtle physics rule: the player cannot instantly reverse the
 * snake's heading.  Moving RIGHT and pressing LEFT in the same tick would place
 * the new head on top of the snake's neck — an instant self-collision.  This
 * module centralises that guard and the "next-direction queue" pattern that
 * safely decouples user input from the game clock.
 *
 * Design decisions
 * ─────────────────────────────────────────────────────────────────────────────
 * • Pure functions — no side effects, deterministic, safe to unit-test without
 *   any React or browser setup.
 * • The queue validates against `nextDirection` (the *queued* heading) rather
 *   than `direction` (the *committed* heading).  This closes the rapid-key
 *   exploit: if the player presses UP then immediately DOWN before the next
 *   tick fires, checking only `direction` (RIGHT) would accept DOWN and erase
 *   the UP command, creating an apparent 180° reversal one tick later.
 * • No mutation — every function that touches state returns a new object spread.
 *
 * Relationships
 * ─────────────────────────────────────────────────────────────────────────────
 * • `isOppositeDirection` (utils.ts)  — low-level geometric predicate.
 * • `gameReducer`         (reducer.ts) — calls `validateDirectionChange` inside
 *   the `CHANGE_DIRECTION` case so the guard is enforced for every dispatch.
 * • `nextTick`            (next-tick.ts) — reads `state.direction` directly;
 *   the caller is responsible for passing only validated directions.
 */

import type { Direction, GameState, GameConfig } from "@/types";
import { GameStatus } from "@/types";
import { isOppositeDirection, placeFood } from "./utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Result of validating a requested direction change.
 *
 * - `"accepted"` — the direction was queued; callers should apply it to state.
 * - `"rejected_opposite"` — the requested direction is a 180° reversal of the
 *   currently queued direction; the input is silently dropped.
 * - `"rejected_same"` — the requested direction is identical to the queued
 *   direction; a no-op that avoids an unnecessary state update.
 */
export type DirectionValidationResult =
  | "accepted"
  | "rejected_opposite"
  | "rejected_same";

// ---------------------------------------------------------------------------
// validateDirectionChange
// ---------------------------------------------------------------------------

/**
 * Validates whether a player-requested direction change should be accepted.
 *
 * The function checks the proposed `requested` direction against
 * `state.nextDirection` (the queued direction, not the committed one).
 * Validating against the queue prevents the following rapid-input exploit:
 *
 * ```
 * committed direction → RIGHT
 * tick N (not yet fired):
 *   keypress 1: UP   → nextDirection = UP   ✓  (not opposite to RIGHT)
 *   keypress 2: DOWN → should be REJECTED   ✗  (opposite to UP queue)
 * ```
 *
 * Without queue-based validation, keypress 2 would be accepted (DOWN is not
 * opposite to RIGHT) and would silently overwrite UP, causing a 180° reversal
 * on the next tick.
 *
 * @param state     - Current immutable game snapshot; reads `state.nextDirection`.
 * @param requested - The direction the player wants to move next.
 * @returns A {@link DirectionValidationResult} describing the outcome.
 *
 * @example
 *   // Snake moving right, player presses left — rejected.
 *   validateDirectionChange({ nextDirection: "RIGHT", …rest }, "LEFT");
 *   // → "rejected_opposite"
 *
 *   // Snake moving right, player presses up — accepted.
 *   validateDirectionChange({ nextDirection: "RIGHT", …rest }, "UP");
 *   // → "accepted"
 *
 *   // Player presses the same direction twice — no-op.
 *   validateDirectionChange({ nextDirection: "UP", …rest }, "UP");
 *   // → "rejected_same"
 */
export function validateDirectionChange(
  state: Pick<GameState, "nextDirection">,
  requested: Direction
): DirectionValidationResult {
  if (isOppositeDirection(state.nextDirection, requested)) {
    return "rejected_opposite";
  }
  if (state.nextDirection === requested) {
    return "rejected_same";
  }
  return "accepted";
}

// ---------------------------------------------------------------------------
// queueDirection
// ---------------------------------------------------------------------------

/**
 * Returns a new `GameState` snapshot with `nextDirection` set to `requested`,
 * **only** when the direction change passes validation.
 *
 * If the direction is rejected (opposite or identical), the original `state`
 * reference is returned unchanged — React's `useReducer` and memoised
 * selectors can rely on referential equality to detect no-ops.
 *
 * This function is the single source of truth for queuing a direction.
 * `gameReducer`'s `CHANGE_DIRECTION` case delegates to it so validation is
 * never accidentally duplicated or omitted.
 *
 * @param state     - Current immutable game snapshot.
 * @param requested - The direction the player wants to move next.
 * @returns Either an updated snapshot (new reference) or the same `state`
 *          reference when the change would be rejected.
 *
 * @example
 *   const next = queueDirection(state, "UP");
 *   if (next !== state) {
 *     // A new direction was accepted — dispatch or re-render.
 *   }
 */
export function queueDirection(
  state: GameState,
  requested: Direction
): GameState {
  const result = validateDirectionChange(state, requested);
  if (result !== "accepted") return state;
  return { ...state, nextDirection: requested };
}

// ---------------------------------------------------------------------------
// applyQueuedDirection
// ---------------------------------------------------------------------------

/**
 * Commits the queued direction at the start of a game tick.
 *
 * At each tick the engine should call this to flush `nextDirection` into
 * `direction` before computing the new head position.  Keeping them separate
 * fields allows the reducer to distinguish "what the player last asked for"
 * (`nextDirection`) from "what direction the snake is actually travelling"
 * (`direction`).
 *
 * Called inside the `TICK` branch of `gameReducer` immediately before
 * computing the new head position.
 *
 * @param state - Current immutable game snapshot.
 * @returns A new snapshot where `direction === nextDirection`.
 *
 * @example
 *   // Inside the tick handler:
 *   const committed = applyQueuedDirection(state);
 *   const newHead   = moveCoordinate(committed.snake[0], committed.direction);
 */
export function applyQueuedDirection(state: GameState): GameState {
  if (state.direction === state.nextDirection) return state; // already in sync
  return { ...state, direction: state.nextDirection };
}

// ---------------------------------------------------------------------------
// createInitialState
// ---------------------------------------------------------------------------

const DEFAULT_CONFIG: Required<GameConfig> = {
  boardWidth: 20,
  boardHeight: 20,
  initialTickMs: 150,
  minTickMs: 60,
  scorePerPellet: 10,
};

/**
 * Creates the starting `GameState` for a new game session.
 *
 * - Snake starts centred on the board, length 3, heading RIGHT.
 * - Food is placed on a random cell that is not occupied by the snake.
 * - An injectable `rng` parameter (default `Math.random`) makes the result
 *   fully deterministic in tests when a seeded PRNG is supplied.
 *
 * @param config - Optional game configuration; engine defaults are applied.
 * @param rng    - Random number generator in [0, 1). Defaults to Math.random.
 * @returns A fresh, immutable `GameState` ready to be passed to `gameReducer`.
 *
 * @example
 *   const state = createInitialState({ boardWidth: 10, boardHeight: 10 });
 *
 * @example Deterministic usage in tests:
 *   let seed = 42;
 *   const seededRng = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2 ** 32; };
 *   const state = createInitialState({}, seededRng);
 */
export function createInitialState(
  config: GameConfig = {},
  rng: () => number = Math.random
): GameState {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const { boardWidth, boardHeight } = cfg;

  const midX = Math.floor(boardWidth / 2);
  const midY = Math.floor(boardHeight / 2);

  // Snake: head at centre, two body segments extending left, facing RIGHT.
  const snake: GameState["snake"] = [
    [midX, midY],
    [midX - 1, midY],
    [midX - 2, midY],
  ];

  // Food must not overlap the snake; guaranteed non-null on any reasonable board.
  const food = placeFood({ snake, boardWidth, boardHeight }, rng)!;

  return {
    snake,
    food,
    score: 0,
    direction: "RIGHT",
    nextDirection: "RIGHT",
    boardWidth,
    boardHeight,
    status: GameStatus.idle,
    highScore: 0,
  };
}
