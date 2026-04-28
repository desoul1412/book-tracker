/**
 * @file src/lib/game-engine/reducer.ts
 * @description Pure reducer that drives all game-state transitions.
 *
 * Design decisions
 * ─────────────────────────────────────────────────────────────────────────────
 * • Pure function — no side effects, no randomness injected directly (food
 *   placement is delegated to `randomFreeCoordinate` which can be seeded in
 *   tests via dependency injection).
 * • Immutable snapshots — every action returns a brand-new GameState object;
 *   the previous snapshot is never mutated.
 * • Discriminated union on `action.type` — TypeScript enforces exhaustive
 *   handling; adding a new action without a case is a compile error.
 *
 * Scaling note
 * ─────────────────────────────────────────────────────────────────────────────
 * The reducer is intentionally framework-agnostic (no React imports).
 * It can be lifted into a Web Worker for heavier boards without refactoring.
 */

import type { GameState, GameAction, GameConfig } from "@/types";
import {
  coordinatesEqual,
  isOppositeDirection,
  moveCoordinate,
  randomFreeCoordinate,
  wrapCoordinate,
} from "./utils";

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_CONFIG: Required<GameConfig> = {
  boardWidth: 20,
  boardHeight: 20,
  initialTickMs: 150,
  minTickMs: 60,
  scorePerPellet: 10,
};

// ---------------------------------------------------------------------------
// Initial state factory
// ---------------------------------------------------------------------------

/**
 * Builds the starting GameState for a new game session.
 * Snake begins in the middle of the board, heading RIGHT with length 3.
 */
export function buildInitialState(config: GameConfig = {}): GameState {
  const { boardWidth, boardHeight, scorePerPellet } = {
    ...DEFAULT_CONFIG,
    ...config,
  };
  void scorePerPellet; // referenced in reducer, not needed here

  const midX = Math.floor(boardWidth / 2);
  const midY = Math.floor(boardHeight / 2);

  const snake = [
    [midX, midY],
    [midX - 1, midY],
    [midX - 2, midY],
  ] as const satisfies readonly [number, number][];

  // Guaranteed non-null: board is large and snake only occupies 3 cells.
  const food = randomFreeCoordinate(boardWidth, boardHeight, snake)!;

  return {
    snake,
    food,
    score: 0,
    direction: "RIGHT",
    nextDirection: "RIGHT",
    boardWidth,
    boardHeight,
    status: "IDLE",
    highScore: 0,
  };
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

/**
 * Computes the next GameState given the current state and a dispatched action.
 *
 * @param state  - Current immutable game snapshot.
 * @param action - Command describing the requested state transition.
 * @param config - Static game configuration (defaults applied if omitted).
 * @returns A new GameState snapshot; the input `state` is never mutated.
 */
export function gameReducer(
  state: GameState,
  action: GameAction,
  config: GameConfig = {}
): GameState {
  const { scorePerPellet } = { ...DEFAULT_CONFIG, ...config };

  switch (action.type) {
    case "START":
      return { ...state, status: "RUNNING" };

    case "PAUSE":
      if (state.status !== "RUNNING") return state;
      return { ...state, status: "PAUSED" };

    case "RESUME":
      if (state.status !== "PAUSED") return state;
      return { ...state, status: "RUNNING" };

    case "RESET":
      return {
        ...buildInitialState(config),
        highScore: state.highScore, // persist high score across resets
      };

    case "CHANGE_DIRECTION": {
      // Ignore if it would reverse the snake or is the same direction.
      if (isOppositeDirection(state.direction, action.direction)) return state;
      if (state.direction === action.direction) return state;
      return { ...state, nextDirection: action.direction };
    }

    case "TICK": {
      if (state.status !== "RUNNING") return state;

      const direction = state.nextDirection;
      const rawHead = moveCoordinate(state.snake[0], direction);
      const newHead = wrapCoordinate(
        rawHead,
        state.boardWidth,
        state.boardHeight
      );

      // Collision with own body (skip tail — it moves away this tick).
      const body = state.snake.slice(0, -1);
      if (body.some((seg) => coordinatesEqual(seg, newHead))) {
        const highScore = Math.max(state.score, state.highScore);
        return { ...state, status: "GAME_OVER", highScore };
      }

      const ateFood = coordinatesEqual(newHead, state.food);

      const newSnake = ateFood
        ? [newHead, ...state.snake] // grow: keep tail
        : [newHead, ...state.snake.slice(0, -1)]; // move: discard tail

      const newScore = ateFood ? state.score + scorePerPellet : state.score;
      const highScore = Math.max(newScore, state.highScore);

      const newFood = ateFood
        ? (randomFreeCoordinate(
            state.boardWidth,
            state.boardHeight,
            newSnake
          ) ?? state.food)
        : state.food;

      return {
        ...state,
        snake: newSnake,
        food: newFood,
        score: newScore,
        highScore,
        direction,
      };
    }

    default:
      // Exhaustiveness guard — TypeScript will error if a case is missed.
      return state satisfies GameState;
  }
}
