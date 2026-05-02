/**
 * @file src/hooks/useGameEngine.ts
 * @description React hook that drives the Snake game loop.
 *
 * Responsibilities
 * ─────────────────────────────────────────────────────────────────────────────
 * • Initialises game state via `createInitialState`.
 * • Runs a `setInterval` game loop dispatching `TICK` actions while RUNNING.
 * • Adjusts tick speed dynamically as the score increases (`getTickInterval`).
 * • Exposes `start`, `pause`, `resume`, `reset`, and `changeDirection` actions.
 * • Prevents 180° direction reversals by delegating to `gameReducer`'s
 *   `CHANGE_DIRECTION` handler, which validates against `state.nextDirection`
 *   (the queued direction) rather than the committed `direction`.
 * • Cleans up the interval on unmount and on every pause/status change to
 *   avoid interval accumulation or post-unmount state updates.
 *
 * Game lifecycle
 * ─────────────────────────────────────────────────────────────────────────────
 * • `start()`  — IDLE → RUNNING: begins the game loop interval.
 * • `pause()`  — RUNNING → PAUSED: clears the interval.
 * • `resume()` — PAUSED → RUNNING: restarts the interval.
 * • `reset()`  — any → IDLE: calls `createInitialState()`, clears interval.
 *
 * Design decisions
 * ─────────────────────────────────────────────────────────────────────────────
 * • `useReducer` + `gameReducer` — single source of truth for state transitions,
 *   same pure reducer used in tests and (potentially) a Web Worker.
 * • `useEffect` owns the interval lifecycle; it re-runs whenever `isRunning`
 *   or the computed `tickMs` changes, ensuring the interval always reflects the
 *   current speed tier.  The returned cleanup tears down the previous interval
 *   before the next one is created — preventing accumulation across pause cycles.
 * • `useCallback` on all action callbacks so consumers can safely memoise
 *   child components that receive these as props.
 *
 * @example
 *   const { state, start, pause, changeDirection } = useGameEngine({ boardWidth: 15 });
 */

import { useCallback, useEffect, useReducer, useRef } from "react";
import type { Direction, GameConfig, GameState } from "@/types";
import { gameReducer, createInitialState, getTickInterval } from "@/lib/game-engine";

// ---------------------------------------------------------------------------
// Public return type
// ---------------------------------------------------------------------------

export interface UseGameEngineReturn {
  /** Current immutable game snapshot. */
  state: GameState;
  /** Transition IDLE → RUNNING and begin the game loop interval. */
  start: () => void;
  /** Transition RUNNING → PAUSED and clear the interval. */
  pause: () => void;
  /** Transition PAUSED → RUNNING and restart the interval. */
  resume: () => void;
  /** Transition any status → IDLE: calls createInitialState() and stops the loop. */
  reset: () => void;
  /**
   * Queue a direction change.
   *
   * Ignored when the requested direction is a 180° reversal of the currently
   * queued direction (validated against `state.nextDirection`, not the
   * committed `direction`, to close the rapid-key exploit).
   */
  changeDirection: (direction: Direction) => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * React hook that manages the full Snake game lifecycle.
 *
 * @param config - Optional game configuration; engine defaults are applied.
 * @returns Game state and action callbacks.
 */
export function useGameEngine(config: GameConfig = {}): UseGameEngineReturn {
  // Stable config ref — prevents unnecessary effect re-runs when the caller
  // passes an inline object literal on every render.
  const configRef = useRef<GameConfig>(config);
  configRef.current = config;

  // ------------------------------------------------------------------
  // State: driven by pure gameReducer
  // ------------------------------------------------------------------

  const [state, dispatch] = useReducer(
    (s: GameState, action: Parameters<typeof gameReducer>[1]) =>
      gameReducer(s, action, configRef.current),
    undefined,
    // Initialise with createInitialState so the rng-injectable version is
    // used — keeps state construction testable with seeded PRNGs.
    () => createInitialState(config)
  );

  // ------------------------------------------------------------------
  // Game loop: setInterval while RUNNING
  // ------------------------------------------------------------------

  const isRunning = state.status === "RUNNING";
  const tickMs = getTickInterval(state.score);

  useEffect(() => {
    if (!isRunning) return;

    const id = setInterval(() => {
      dispatch({ type: "TICK" });
    }, tickMs);

    // Cleanup: clear the interval when pausing, resuming at a different speed,
    // or unmounting.  This prevents interval accumulation across pause cycles.
    return () => {
      clearInterval(id);
    };
  }, [isRunning, tickMs]);

  // ------------------------------------------------------------------
  // Actions
  // ------------------------------------------------------------------

  /** IDLE → RUNNING: starts the game loop. */
  const start = useCallback(() => {
    dispatch({ type: "START" });
  }, []);

  /** RUNNING → PAUSED: clears the interval via the isRunning effect. */
  const pause = useCallback(() => {
    dispatch({ type: "PAUSE" });
  }, []);

  /** PAUSED → RUNNING: restarts the interval via the isRunning effect. */
  const resume = useCallback(() => {
    dispatch({ type: "RESUME" });
  }, []);

  /**
   * any → IDLE: resets state to a fresh createInitialState() snapshot.
   * High score is preserved inside the RESET reducer case.
   */
  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  const changeDirection = useCallback((direction: Direction) => {
    dispatch({ type: "CHANGE_DIRECTION", direction });
  }, []);

  return { state, start, pause, resume, reset, changeDirection };
}
