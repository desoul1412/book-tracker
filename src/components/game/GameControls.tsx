/**
 * @file src/components/game/GameControls.tsx
 * @description Start, Pause/Resume toggle, and Reset buttons for the Snake game.
 *
 * Architecture
 * ─────────────────────────────────────────────────────────────────────────────
 * Pure presentational component — zero internal state, zero hook calls.
 * The parent (e.g. a Game container) wires `useGameEngine` and passes the
 * returned `status` + action callbacks as props. This keeps the component
 * trivially unit-testable (render with props, assert on DOM) and reusable
 * in storybook / design-system previews without a running game engine.
 *
 * Button disabled rules
 * ─────────────────────────────────────────────────────────────────────────────
 * | Button  | Enabled when                          |
 * |---------|---------------------------------------|
 * | Start   | IDLE only                             |
 * | Pause   | RUNNING only                          |
 * | Resume  | PAUSED only                           |
 * | Reset   | RUNNING, PAUSED, or GAME_OVER         |
 *
 * Pause and Resume occupy the same slot — a toggle that shows the contextually
 * correct action. When idle or game-over neither is shown; the slot is empty.
 *
 * Accessibility
 * ─────────────────────────────────────────────────────────────────────────────
 * • `role="group"` + `aria-label` on the container for screen readers.
 * • Each button has an explicit `aria-label` describing its action.
 * • `focus-visible` ring styles for keyboard navigation.
 * • Disabled buttons use `aria-disabled` in addition to `disabled` so
 *   assistive tech announces the inactive state.
 *
 * Relationships
 * ─────────────────────────────────────────────────────────────────────────────
 * • `GameStatus`      (types/game.ts) — lifecycle enum driving disabled logic.
 * • `useGameEngine`   (hooks/useGameEngine.ts) — parent calls this hook and
 *   passes `status`, `start`, `pause`, `resume`, `reset` as props.
 */

import type { FC } from "react";

// ---------------------------------------------------------------------------
// GameStatus values (mirrors @/types/game.ts)
//
// Defined locally so this component compiles independently of the engine
// module. When the full type system is merged, swap to:
//   import { GameStatus } from "@/types";
// ---------------------------------------------------------------------------

const GameStatus = {
  idle: "IDLE",
  playing: "RUNNING",
  paused: "PAUSED",
  game_over: "GAME_OVER",
} as const;

type GameStatus = (typeof GameStatus)[keyof typeof GameStatus];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface GameControlsProps {
  /** Current game lifecycle status — drives all disabled logic. */
  status: GameStatus;
  /** Transition IDLE → RUNNING. Wired to `useGameEngine().start`. */
  onStart: () => void;
  /** Suspend the game loop (RUNNING → PAUSED). Wired to `useGameEngine().pause`. */
  onPause: () => void;
  /** Resume a paused game (PAUSED → RUNNING). Wired to `useGameEngine().resume`. */
  onResume: () => void;
  /** Stop loop and reinitialise state. Wired to `useGameEngine().reset`. */
  onReset: () => void;
}

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------

const BASE_BUTTON =
  "rounded-lg px-5 py-2.5 text-sm font-bold tracking-wide transition-all duration-150 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
  "focus-visible:ring-offset-gray-950 " +
  "disabled:cursor-not-allowed disabled:opacity-30 disabled:shadow-none";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Game control bar: Start, Pause/Resume toggle, and Reset.
 *
 * @example
 * ```tsx
 * const { status, start, pause, resume, reset } = useGameEngine();
 * <GameControls
 *   status={status}
 *   onStart={start}
 *   onPause={pause}
 *   onResume={resume}
 *   onReset={reset}
 * />
 * ```
 */
export const GameControls: FC<GameControlsProps> = ({
  status,
  onStart,
  onPause,
  onResume,
  onReset,
}) => {
  const isIdle = status === GameStatus.idle;
  const isRunning = status === GameStatus.playing;
  const isPaused = status === GameStatus.paused;

  return (
    <div
      role="group"
      aria-label="Game controls"
      className="flex items-center gap-3"
    >
      {/* ── Start ──────────────────────────────────────────────────────── */}
      <button
        data-testid="btn-start"
        type="button"
        disabled={!isIdle}
        aria-disabled={!isIdle}
        aria-label="Start game"
        onClick={onStart}
        className={`${BASE_BUTTON} bg-green-600 text-white hover:bg-green-500 focus-visible:ring-green-400`}
        style={{ boxShadow: isIdle ? "0 0 12px rgba(74,222,128,0.35)" : undefined }}
      >
        Start
      </button>

      {/* ── Pause / Resume toggle ──────────────────────────────────────── */}
      {isRunning && (
        <button
          data-testid="btn-pause"
          type="button"
          disabled={!isRunning}
          aria-disabled={!isRunning}
          aria-label="Pause game"
          onClick={onPause}
          className={`${BASE_BUTTON} bg-yellow-500 text-black hover:bg-yellow-400 focus-visible:ring-yellow-400`}
        >
          Pause
        </button>
      )}

      {isPaused && (
        <button
          data-testid="btn-resume"
          type="button"
          disabled={!isPaused}
          aria-disabled={!isPaused}
          aria-label="Resume game"
          onClick={onResume}
          className={`${BASE_BUTTON} bg-blue-500 text-white hover:bg-blue-400 focus-visible:ring-blue-400`}
          style={{ boxShadow: "0 0 12px rgba(59,130,246,0.35)" }}
        >
          Resume
        </button>
      )}

      {/* ── Reset ──────────────────────────────────────────────────────── */}
      <button
        data-testid="btn-reset"
        type="button"
        disabled={isIdle}
        aria-disabled={isIdle}
        aria-label="Reset game"
        onClick={onReset}
        className={`${BASE_BUTTON} bg-red-700 text-white hover:bg-red-600 focus-visible:ring-red-500`}
      >
        Reset
      </button>
    </div>
  );
};

export default GameControls;
