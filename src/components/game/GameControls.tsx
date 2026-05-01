/**
 * @file src/components/game/GameControls.tsx
 * @description Start, Pause/Resume toggle, and Reset control buttons for the
 * Snake game. Buttons are enabled/disabled based on the current `GameStatus`.
 *
 * Design decisions
 * ─────────────────────────────────────────────────────────────────────────────
 * • Pure presentational component — no internal state, no hook calls.
 *   The parent (or the consuming page) wires up `useGameEngine` callbacks.
 * • Disabled logic is co-located with the component so that the rule "can't
 *   pause when idle" lives in one place and is trivially testable without
 *   mocking any hooks.
 * • Pause and Resume share a single button (toggle) so the UI surface stays
 *   minimal and keyboard focus doesn't jump between elements.
 * • Tailwind utility classes inline; no CSS modules needed at this scale.
 * • `aria-label` on the container and descriptive button labels keep the
 *   component screen-reader friendly without extra wrappers.
 */

import React from "react";
import { GameStatus } from "../../types/game";
import type { GameStatus as GameStatusType } from "../../types/game";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GameControlsProps {
  /** Current lifecycle status — drives which buttons are enabled. */
  status: GameStatusType;
  /** Called when the user clicks Start (only enabled while IDLE). */
  onStart: () => void;
  /** Called when the user clicks Pause (only enabled while RUNNING). */
  onPause: () => void;
  /** Called when the user clicks Resume (only enabled while PAUSED). */
  onResume: () => void;
  /** Called when the user clicks Reset (enabled while PAUSED, RUNNING, or GAME_OVER). */
  onReset: () => void;
}

// ---------------------------------------------------------------------------
// Disabled-state derivations
// ---------------------------------------------------------------------------

/**
 * Returns true when the Start button should accept interaction.
 * Start is only meaningful in the initial IDLE state.
 */
const canStart = (status: GameStatusType): boolean =>
  status === GameStatus.idle;

/**
 * Returns true when the Pause button should accept interaction.
 * Pausing only makes sense while the game loop is RUNNING.
 */
const canPause = (status: GameStatusType): boolean =>
  status === GameStatus.playing;

/**
 * Returns true when the Resume button should accept interaction.
 * Resuming only makes sense while the game is PAUSED.
 */
const canResume = (status: GameStatusType): boolean =>
  status === GameStatus.paused;

/**
 * Returns true when the Reset button should accept interaction.
 * Reset is allowed during RUNNING, PAUSED, or GAME_OVER — not IDLE
 * (there's nothing to reset when the game hasn't started).
 */
const canReset = (status: GameStatusType): boolean =>
  status === GameStatus.playing ||
  status === GameStatus.paused ||
  status === GameStatus.game_over;

// ---------------------------------------------------------------------------
// Shared button style helpers
// ---------------------------------------------------------------------------

const BASE_BTN =
  "rounded-lg px-5 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40";

const PRIMARY_BTN = `${BASE_BTN} bg-green-500 text-white hover:bg-green-600 focus-visible:ring-green-500`;
const WARNING_BTN = `${BASE_BTN} bg-yellow-400 text-black hover:bg-yellow-500 focus-visible:ring-yellow-400`;
const INFO_BTN    = `${BASE_BTN} bg-blue-500 text-white hover:bg-blue-600 focus-visible:ring-blue-500`;
const DANGER_BTN  = `${BASE_BTN} bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500`;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * GameControls — a pure presentational component.
 *
 * @example
 * const { state, start, pause, resume, reset } = useGameEngine();
 * <GameControls
 *   status={state.status}
 *   onStart={start}
 *   onPause={pause}
 *   onResume={resume}
 *   onReset={reset}
 * />
 */
export const GameControls: React.FC<GameControlsProps> = ({
  status,
  onStart,
  onPause,
  onResume,
  onReset,
}) => {
  const isPaused  = status === GameStatus.paused;
  const isPlaying = status === GameStatus.playing;

  return (
    <div
      className="flex items-center justify-center gap-3"
      role="group"
      aria-label="Game controls"
    >
      {/* ── Start ─────────────────────────────────────────────────────────── */}
      <button
        type="button"
        className={PRIMARY_BTN}
        onClick={onStart}
        disabled={!canStart(status)}
        data-testid="btn-start"
        aria-label="Start game"
      >
        Start
      </button>

      {/* ── Pause / Resume toggle ─────────────────────────────────────────── */}
      {isPaused ? (
        <button
          type="button"
          className={INFO_BTN}
          onClick={onResume}
          disabled={!canResume(status)}
          data-testid="btn-resume"
          aria-label="Resume game"
        >
          Resume
        </button>
      ) : (
        <button
          type="button"
          className={WARNING_BTN}
          onClick={onPause}
          disabled={!canPause(status)}
          data-testid="btn-pause"
          aria-label={isPlaying ? "Pause game" : "Pause game"}
        >
          Pause
        </button>
      )}

      {/* ── Reset ─────────────────────────────────────────────────────────── */}
      <button
        type="button"
        className={DANGER_BTN}
        onClick={onReset}
        disabled={!canReset(status)}
        data-testid="btn-reset"
        aria-label="Reset game"
      >
        Reset
      </button>
    </div>
  );
};

export default GameControls;
