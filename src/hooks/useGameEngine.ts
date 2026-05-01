/**
 * @file src/hooks/useGameEngine.ts
 * @description React hook that wires the pure game reducer to a live game loop.
 *
 * Responsibilities
 * ─────────────────────────────────────────────────────────────────────────────
 * • Holds GameState in a useReducer (single source of truth).
 * • Drives the game loop via setInterval, clearing it on pause / game-over / unmount.
 * • Adjusts tick speed as the score rises (speed increase = higher difficulty).
 * • Provides a stable `dispatch` function so child components never need to
 *   import the reducer or action types directly.
 *
 * Design decisions
 * ─────────────────────────────────────────────────────────────────────────────
 * • The hook is the only place that knows about time (setInterval).  The
 *   reducer itself is pure and testable without timers.
 * • `useCallback` on `dispatch` wrappers stabilises references so components
 *   can safely list them in dependency arrays.
 * • Tick interval is recalculated each render based on score — no separate
 *   useEffect watching score needed.
 *
 * Scaling note
 * ─────────────────────────────────────────────────────────────────────────────
 * For very large boards (>40×40) consider moving the TICK dispatch into a
 * Web Worker via a BroadcastChannel so the main thread stays free for rendering.
 */

"use client";

import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
} from "react";
import { GameStatus } from "@/types";
import type { GameAction, GameConfig, GameState } from "@/types";
import { buildInitialState, gameReducer } from "@/lib/game-engine";
import {
  INITIAL_TICK_MS,
  MIN_TICK_MS,
  SCORE_PER_PELLET,
  SPEED_INCREMENT_EVERY,
  SPEED_STEP_MS,
} from "@/constants/game";

// ---------------------------------------------------------------------------
// Tick-speed curve
// ---------------------------------------------------------------------------

/**
 * Compute the current tick interval (ms) based on score.
 *
 * Speed curve:
 *   - A "level" increases every SPEED_INCREMENT_EVERY score points.
 *   - Each level reduces the interval by SPEED_STEP_MS (default 10 ms).
 *   - The interval is floored at MIN_TICK_MS (default 80 ms) to keep the game
 *     challenging but humanly playable.
 *
 * With defaults (SCORE_PER_PELLET = 10, SPEED_INCREMENT_EVERY = 50):
 *   - A level boundary is reached every 5 food pellets eaten.
 *   - Level 0 →  0 pts : 150 ms
 *   - Level 1 → 50 pts : 140 ms   (5 foods)
 *   - Level 2 →100 pts : 130 ms   (10 foods)
 *   - ...
 *   - Level 7 →350 pts :  80 ms   (35 foods) — capped at minimum
 *
 * @param score - Current player score.
 * @returns Milliseconds between engine ticks.
 */
export function tickInterval(score: number): number {
  const levels = Math.floor(score / SPEED_INCREMENT_EVERY);
  return Math.max(MIN_TICK_MS, INITIAL_TICK_MS - levels * SPEED_STEP_MS);
}

// Re-export for consumers that want to show level info in the UI.
export { SCORE_PER_PELLET, SPEED_INCREMENT_EVERY, SPEED_STEP_MS, MIN_TICK_MS, INITIAL_TICK_MS };

// ---------------------------------------------------------------------------
// Hook return type
// ---------------------------------------------------------------------------

export interface UseGameEngineReturn {
  state: GameState;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  changeDirection: (direction: GameState["direction"]) => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * @param config - Optional static configuration (board size, score per pellet…).
 *                 Passed through to the engine reducer.  Changing these values
 *                 after mount has no effect — call `reset()` to apply new config.
 */
export function useGameEngine(config: GameConfig = {}): UseGameEngineReturn {
  const configRef = useRef(config);

  const [state, dispatch] = useReducer(
    (s: GameState, a: GameAction) => gameReducer(s, a, configRef.current),
    undefined,
    () => buildInitialState(config)
  );

  // ── Game loop ─────────────────────────────────────────────────────────────
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearLoop = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (state.status !== GameStatus.playing) {
      clearLoop();
      return;
    }

    const ms = tickInterval(state.score);
    intervalRef.current = setInterval(() => dispatch({ type: "TICK" }), ms);

    return clearLoop;
  }, [state.status, state.score, clearLoop]);

  // Ensure the interval is cleared on unmount regardless of state.
  useEffect(() => clearLoop, [clearLoop]);

  // ── Stable action dispatchers ─────────────────────────────────────────────

  const start = useCallback(() => dispatch({ type: "START" }), []);
  const pause = useCallback(() => dispatch({ type: "PAUSE" }), []);
  const resume = useCallback(() => dispatch({ type: "RESUME" }), []);
  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  const changeDirection = useCallback(
    (direction: GameState["direction"]) =>
      dispatch({ type: "CHANGE_DIRECTION", direction }),
    []
  );

  return { state, start, pause, resume, reset, changeDirection };
}
