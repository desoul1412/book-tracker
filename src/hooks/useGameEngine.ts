/**
 * @file src/hooks/useGameEngine.ts
 * @description React hook that drives the Snake game loop.
 *
 * Architecture
 * ─────────────────────────────────────────────────────────────────────────────
 * • State is held in React `useState` — a single `GameState` snapshot.
 * • A `useRef` mirror keeps the interval callback always reading the latest
 *   state without becoming a stale closure (avoids double-render from a
 *   second `useEffect` dependency).
 * • The game loop is a `setInterval` that calls the pure `nextTick()` engine
 *   function directly.  This keeps the hook as the only time-aware layer —
 *   the engine itself has zero knowledge of timers.
 * • Tick speed is derived from `state.score` via `getTickInterval()`.  When
 *   score rises (food eaten), `state.score` changes → the loop `useEffect`
 *   re-runs → old interval is cleared → new interval is created at the faster
 *   cadence.  No separate speed-tracking state needed.
 * • Lifecycle transitions (IDLE → RUNNING → PAUSED → GAME_OVER → IDLE) are
 *   managed inside each action callback via `setState` functional updates so
 *   they are always based on the latest committed state.
 *
 * Relationships
 * ─────────────────────────────────────────────────────────────────────────────
 * • `createInitialState`  (engine.ts)   — initialises the first GameState.
 * • `nextTick`            (next-tick.ts) — advances the board one frame.
 * • `getTickInterval`     (engine.ts)   — maps score → ms between ticks.
 * • `GameStatus`          (types/game.ts) — lifecycle enum used in guards.
 *
 * Scaling note
 * ─────────────────────────────────────────────────────────────────────────────
 * For boards larger than 40 × 40 cells, move `nextTick` into a Web Worker and
 * post messages back via `BroadcastChannel` to keep the main thread free for
 * rendering.  The hook API surface would remain identical.
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Direction, GameConfig, GameState } from "@/types";
import { GameStatus } from "@/types";
import {
  createInitialState,
  getTickInterval,
  nextTick,
} from "@/lib/game-engine";

// ---------------------------------------------------------------------------
// Public API types
// ---------------------------------------------------------------------------

export interface UseGameEngineReturn {
  /** Full immutable game snapshot. Contains `snake`, `food`, `direction`, etc. */
  state: GameState;
  /** Convenience alias for `state.score`. */
  score: number;
  /** Convenience alias for `state.status`. */
  status: GameStatus;
  /** Transition from IDLE → RUNNING and start the game loop. */
  start: () => void;
  /** Suspend the game loop (RUNNING → PAUSED). No-op if not RUNNING. */
  pause: () => void;
  /** Resume a paused game (PAUSED → RUNNING). No-op if not PAUSED. */
  resume: () => void;
  /** Stop the loop and reinitialise state (preserves `highScore`). */
  reset: () => void;
  /**
   * Queue a direction change for the next tick.
   * 180° reversals and duplicate directions are silently ignored by the engine.
   */
  changeDirection: (direction: Direction) => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Manages game lifecycle and drives the tick loop for the Snake game.
 *
 * @param config - Static board/speed configuration applied at initialisation.
 *                 Changing `config` after mount has no effect; call `reset()`
 *                 to apply new config values.
 */
export function useGameEngine(config: GameConfig = {}): UseGameEngineReturn {
  // ── Stable config ref — prevents re-initialising when caller re-renders ───
  const configRef = useRef<GameConfig>(config);

  // ── Core game state ───────────────────────────────────────────────────────
  const [state, setState] = useState<GameState>(() =>
    createInitialState(configRef.current)
  );

  /**
   * Always-current mirror of `state` for use inside the interval callback.
   *
   * Why: `setInterval` captures its callback at creation time.  Without a ref,
   * every tick would call `nextTick` with the state snapshot from the render
   * cycle in which the interval was created, not the latest one.  Reading from
   * `stateRef.current` inside the `setState` functional updater is safe because
   * `setState(prev => …)` guarantees `prev` is always the latest committed state.
   */
  const stateRef = useRef<GameState>(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // ── Interval management ───────────────────────────────────────────────────
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /** Clears any active interval.  Safe to call when no interval exists. */
  const clearLoop = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  /**
   * Restart the game loop at the speed appropriate for the current score.
   *
   * Runs whenever `state.status` or `state.score` changes:
   * - Status change:  start/pause/resume/game-over → loop starts or stops.
   * - Score change:   food eaten → speed may increase → loop restarts faster.
   */
  useEffect(() => {
    if (state.status !== GameStatus.playing) {
      clearLoop();
      return;
    }

    const ms = getTickInterval(state.score);

    intervalRef.current = setInterval(() => {
      // Use the functional updater form so we always operate on the latest
      // state even if multiple ticks fire before React flushes renders.
      setState((prev) => {
        if (prev.status !== GameStatus.playing) return prev;
        return nextTick(prev, prev.nextDirection);
      });
    }, ms);

    return clearLoop; // cleanup: clear when status/score changes or component unmounts
  }, [state.status, state.score, clearLoop]);

  // Guarantee cleanup on unmount regardless of status.
  useEffect(() => clearLoop, [clearLoop]);

  // ── Action callbacks ──────────────────────────────────────────────────────

  /**
   * Start the game.  Only effective when status is IDLE.
   * Transitions: IDLE → RUNNING.
   */
  const start = useCallback(() => {
    setState((prev) =>
      prev.status === GameStatus.idle
        ? { ...prev, status: GameStatus.playing }
        : prev
    );
  }, []);

  /**
   * Pause the running game.  Only effective when status is RUNNING.
   * Transitions: RUNNING → PAUSED.
   */
  const pause = useCallback(() => {
    setState((prev) =>
      prev.status === GameStatus.playing
        ? { ...prev, status: GameStatus.paused }
        : prev
    );
  }, []);

  /**
   * Resume a paused game.  Only effective when status is PAUSED.
   * Transitions: PAUSED → RUNNING.
   */
  const resume = useCallback(() => {
    setState((prev) =>
      prev.status === GameStatus.paused
        ? { ...prev, status: GameStatus.playing }
        : prev
    );
  }, []);

  /**
   * Reset to a fresh game, preserving the session `highScore`.
   * Clears the active loop immediately (not waiting for the next `useEffect`
   * cycle) to avoid a spurious tick on the old state after reset.
   * Transitions: any → IDLE.
   */
  const reset = useCallback(() => {
    clearLoop();
    setState((prev) => {
      const fresh = createInitialState(configRef.current);
      // Carry forward the best score from this session.
      return { ...fresh, highScore: Math.max(fresh.highScore, prev.highScore) };
    });
  }, [clearLoop]);

  /**
   * Queue a direction change for the next engine tick.
   *
   * The engine (`nextTick`) uses `state.nextDirection`, so we update that
   * field.  The engine's own `isOppositeDirection` guard means 180° reversals
   * submitted here will be silently discarded on the next tick; the hook does
   * not need to duplicate that logic.
   *
   * Only applied when the game is RUNNING — direction changes while paused
   * or idle are discarded to avoid confusing state after a resume.
   */
  const changeDirection = useCallback((direction: Direction) => {
    setState((prev) => {
      if (prev.status !== GameStatus.playing) return prev;
      // Guard against 180° reversal and duplicate queuing.
      // Mirror the logic from engine.ts `isOppositeDirection`.
      const opposites: Record<Direction, Direction> = {
        UP: "DOWN",
        DOWN: "UP",
        LEFT: "RIGHT",
        RIGHT: "LEFT",
      };
      if (
        direction === prev.nextDirection ||
        direction === opposites[prev.nextDirection]
      ) {
        return prev;
      }
      return { ...prev, nextDirection: direction };
    });
  }, []);

  // ── Return ─────────────────────────────────────────────────────────────────
  return {
    state,
    score: state.score,
    status: state.status,
    start,
    pause,
    resume,
    reset,
    changeDirection,
  };
}
