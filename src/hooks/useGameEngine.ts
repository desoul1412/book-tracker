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

// ---------------------------------------------------------------------------
// Tick-speed curve
// ---------------------------------------------------------------------------

const INITIAL_TICK_MS = 150;
const MIN_TICK_MS = 60;
const SPEED_INCREMENT_EVERY = 50; // score points between speed increases
const SPEED_STEP_MS = 10; // ms reduction per increment

function tickInterval(score: number): number {
  const increments = Math.floor(score / SPEED_INCREMENT_EVERY);
  return Math.max(MIN_TICK_MS, INITIAL_TICK_MS - increments * SPEED_STEP_MS);
}

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
