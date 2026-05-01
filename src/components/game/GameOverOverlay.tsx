/**
 * @file src/components/game/GameOverOverlay.tsx
 * @description Semi-transparent overlay displayed when `status === 'GAME_OVER'`.
 * Shows the final score, high score, a "New High Score!" banner when the
 * player beats their personal best, and a "Play Again" button that resets
 * then starts a new game session.
 *
 * Design decisions
 * ─────────────────────────────────────────────────────────────────────────────
 * • Pure presentational component — no internal state, no hook calls.
 *   The parent wires up `onPlayAgain` so the component stays testable in
 *   isolation without mocking `useGameEngine`.
 * • The overlay uses `role="dialog"` with `aria-modal="true"` and
 *   `aria-labelledby` so screen readers announce it as a modal dialog when
 *   it appears.
 * • Rendering is gated: returns `null` unless status is GAME_OVER, which
 *   keeps the DOM clean and avoids hidden-but-present invisible elements.
 * • "New High Score!" banner is only rendered when score > previous high
 *   score. We receive both as props so the parent (persisted state) owns
 *   the source of truth.
 * • Tailwind utility classes inline; no CSS modules needed at this scale.
 */

import React from "react";
import { GameStatus } from "../../types/game";
import type { GameStatus as GameStatusType } from "../../types/game";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GameOverOverlayProps {
  /** Current game lifecycle status — overlay only renders on GAME_OVER. */
  status: GameStatusType;
  /** Final score achieved in the completed game session. */
  score: number;
  /**
   * All-time high score **before** this session's score is factored in.
   * The parent is responsible for persisting the new high score if beaten.
   * Passing the pre-session high score lets this component render
   * "New High Score!" accurately without timing side effects.
   */
  highScore: number;
  /**
   * Called when the "Play Again" button is clicked.
   * Typically: `() => { reset(); start(); }`
   */
  onPlayAgain: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * GameOverOverlay — renders a modal overlay when the game ends.
 *
 * @example
 * const { state, start, reset } = useGameEngine();
 * <GameOverOverlay
 *   status={state.status}
 *   score={state.score}
 *   highScore={state.highScore}
 *   onPlayAgain={() => { reset(); start(); }}
 * />
 */
export const GameOverOverlay: React.FC<GameOverOverlayProps> = ({
  status,
  score,
  highScore,
  onPlayAgain,
}) => {
  if (status !== GameStatus.game_over) {
    return null;
  }

  const isNewHighScore = score > highScore;

  return (
    <div
      className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-over-title"
      data-testid="game-over-overlay"
    >
      <div className="flex flex-col items-center gap-6 rounded-2xl bg-gray-900 px-10 py-8 shadow-2xl ring-1 ring-white/10">
        {/* ── Title ──────────────────────────────────────────────────────── */}
        <h2
          id="game-over-title"
          className="text-4xl font-extrabold tracking-tight text-red-500"
        >
          Game Over
        </h2>

        {/* ── New High Score banner ───────────────────────────────────────── */}
        {isNewHighScore && (
          <p
            className="rounded-full bg-yellow-400 px-4 py-1 text-sm font-bold uppercase tracking-widest text-black"
            data-testid="new-high-score-banner"
            role="status"
            aria-live="polite"
          >
            🏆 New High Score!
          </p>
        )}

        {/* ── Score display ──────────────────────────────────────────────── */}
        <div className="flex gap-10 text-center text-white">
          <div className="flex flex-col items-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              Score
            </span>
            <span
              className="text-3xl font-bold tabular-nums"
              data-testid="final-score"
            >
              {score}
            </span>
          </div>

          <div className="w-px self-stretch bg-white/10" aria-hidden="true" />

          <div className="flex flex-col items-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              Best
            </span>
            <span
              className="text-3xl font-bold tabular-nums"
              data-testid="best-score"
            >
              {/* Show the new high score if it was beaten, otherwise existing best */}
              {isNewHighScore ? score : highScore}
            </span>
          </div>
        </div>

        {/* ── Play Again ─────────────────────────────────────────────────── */}
        <button
          type="button"
          className="mt-2 rounded-lg bg-green-500 px-8 py-3 text-base font-bold text-white transition-colors hover:bg-green-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
          onClick={onPlayAgain}
          data-testid="btn-play-again"
          autoFocus
        >
          Play Again
        </button>
      </div>
    </div>
  );
};

export default GameOverOverlay;
