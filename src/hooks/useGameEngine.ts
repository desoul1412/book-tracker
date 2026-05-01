/**
 * @file src/hooks/useGameEngine.ts
 * @description React hook that wires the pure game-engine reducer to browser
 * input (keyboard) and the game loop (setInterval).
 *
 * Responsibilities
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. Initialise game state via `useReducer` + `buildInitialState`.
 * 2. Listen for Arrow keys + WASD, map to `Direction`, dispatch
 *    `CHANGE_DIRECTION` — the reducer handles 180° reversal prevention by
 *    validating against `state.nextDirection` (the queued heading).
 * 3. Run a `setInterval` tick loop when `status === "RUNNING"`, dispatching
 *    `{ type: "TICK" }` each cycle. Interval dynamically shortens via
 *    `getTickInterval(score)` as the player scores.
 * 4. Expose stable callback handles (`start`, `pause`, `resume`, `reset`,
 *    `changeDirection`) so consumers never cause unnecessary re-renders.
 *
 * Design decisions
 * ─────────────────────────────────────────────────────────────────────────────
 * • Direction input is buffered via the reducer's `nextDirection` field — the
 *   change is queued immediately on keypress but only committed on the next
 *   TICK. This prevents the rapid-key 180° reversal exploit.
 * • `useCallback` wraps every action creator; deps are stable (dispatch never
 *   changes) so references are referentially stable across renders.
 * • The tick effect tears down and re-creates the interval whenever `isRunning`
 *   or `tickMs` changes, which naturally handles speed increases.
 * • Keyboard listener is attached to `window` and calls `preventDefault` on
 *   matched keys to stop arrow-key page scrolling during gameplay.
 *
 * @example
 *   const { state, start, pause, resume, reset } = useGameEngine();
 *   // Keyboard handling is automatic — no extra wiring needed.
 */

import { useReducer, useEffect, useCallback, useMemo } from "react";
import type { Direction, GameConfig, GameState, GameEvent } from "@/types";
import { gameReducer, buildInitialState, getTickInterval } from "@/lib/game-engine";

// ---------------------------------------------------------------------------
// Key-to-Direction mapping
// ---------------------------------------------------------------------------

/**
 * Maps keyboard event `key` values to game directions.
 *
 * Supports both Arrow keys and WASD (case-insensitive via the lookup using
 * `event.key`). The map is defined outside the component so it is created
 * once and shared across all hook instances.
 */
const KEY_TO_DIRECTION: Readonly<Record<string, Direction>> = {
  ArrowUp: "UP",
  ArrowDown: "DOWN",
  ArrowLeft: "LEFT",
  ArrowRight: "RIGHT",
  w: "UP",
  W: "UP",
  a: "LEFT",
  A: "LEFT",
  s: "DOWN",
  S: "DOWN",
  d: "RIGHT",
  D: "RIGHT",
};

// ---------------------------------------------------------------------------
// Hook return type
// ---------------------------------------------------------------------------

export interface UseGameEngineReturn {
  /** Current immutable game state snapshot. */
  readonly state: GameState;
  /** Transition from IDLE → RUNNING. */
  readonly start: () => void;
  /** Transition from RUNNING → PAUSED. */
  readonly pause: () => void;
  /** Transition from PAUSED → RUNNING. */
  readonly resume: () => void;
  /** Reset the game back to IDLE with a fresh board. */
  readonly reset: () => void;
  /** Queue a direction change (validated by the reducer). */
  readonly changeDirection: (direction: Direction) => void;
}

// ---------------------------------------------------------------------------
// Hook implementation
// ---------------------------------------------------------------------------

/**
 * Core game-engine hook.
 *
 * Manages game state, tick loop, and keyboard input. Drop into any component
 * to get a fully functional Snake game engine.
 *
 * @param config - Optional game configuration (board size, tick speed, etc.).
 * @returns Game state and stable action callbacks.
 *
 * @example
 *   function Game() {
 *     const { state, start, pause, resume, reset } = useGameEngine();
 *     return (
 *       <div>
 *         <p>Score: {state.score}</p>
 *         <button onClick={start}>Start</button>
 *       </div>
 *     );
 *   }
 */
export function useGameEngine(config?: GameConfig): UseGameEngineReturn {
  // Memoise the initial state so it's only computed once per config reference.
  const initialState = useMemo(() => buildInitialState(config), [config]);

  const [state, dispatch] = useReducer(
    (s: GameState, action: GameEvent) => gameReducer(s, action, config),
    initialState,
  );

  // -----------------------------------------------------------------------
  // Action creators (stable references — dispatch identity never changes)
  // -----------------------------------------------------------------------

  const start = useCallback(() => dispatch({ type: "START" }), []);
  const pause = useCallback(() => dispatch({ type: "PAUSE" }), []);
  const resume = useCallback(() => dispatch({ type: "RESUME" }), []);
  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  const changeDirection = useCallback(
    (direction: Direction) => dispatch({ type: "CHANGE_DIRECTION", direction }),
    [],
  );

  // -----------------------------------------------------------------------
  // Keyboard input handler
  // -----------------------------------------------------------------------

  useEffect(() => {
    /**
     * Handles keydown events and dispatches CHANGE_DIRECTION when the key
     * maps to a valid direction.
     *
     * 180° reversal prevention is NOT done here — it is the reducer's job.
     * The hook simply translates raw keyboard input into domain commands.
     * This keeps the hook thin and the validation logic testable without
     * a DOM.
     */
    function handleKeyDown(event: KeyboardEvent): void {
      const direction = KEY_TO_DIRECTION[event.key];
      if (direction) {
        // Prevent page scroll when arrow keys are pressed during gameplay.
        event.preventDefault();
        dispatch({ type: "CHANGE_DIRECTION", direction });
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // -----------------------------------------------------------------------
  // Game tick loop
  // -----------------------------------------------------------------------

  const isRunning = state.status === "RUNNING";
  const tickMs = getTickInterval(state.score);

  useEffect(() => {
    if (!isRunning) return;

    const id = setInterval(() => dispatch({ type: "TICK" }), tickMs);
    return () => clearInterval(id);
  }, [isRunning, tickMs]);

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  return { state, start, pause, resume, reset, changeDirection };
}
