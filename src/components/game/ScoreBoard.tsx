/**
 * @file src/components/game/ScoreBoard.tsx
 * @description Displays the current score, high score (persisted in
 * localStorage), and current game status with appropriate Tailwind styling.
 *
 * Design decisions
 * ─────────────────────────────────────────────────────────────────────────────
 * • High score is READ from localStorage via a prop so the parent controls
 *   persistence — this keeps the component pure and easy to unit-test without
 *   mocking localStorage.
 * • `GameStatus` labels are derived from the canonical const object so any
 *   future status additions are caught at compile-time in the switch.
 * • Tailwind classes are kept inline; no CSS modules needed at this scale.
 */

import React from "react";
import { GameStatus } from "../../types/game";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ScoreBoardProps {
  /** Player's current score for this game session. */
  score: number;
  /** All-time high score, already read from (and written to) localStorage. */
  highScore: number;
  /** Current game status — controls the status badge colour and label. */
  status: GameStatus;
}

// ---------------------------------------------------------------------------
// Status display helpers
// ---------------------------------------------------------------------------

const STATUS_LABEL: Record<GameStatus, string> = {
  [GameStatus.idle]: "Ready",
  [GameStatus.playing]: "Playing",
  [GameStatus.paused]: "Paused",
  [GameStatus.game_over]: "Game Over",
};

const STATUS_CLASS: Record<GameStatus, string> = {
  [GameStatus.idle]: "bg-gray-500 text-white",
  [GameStatus.playing]: "bg-green-500 text-white",
  [GameStatus.paused]: "bg-yellow-400 text-black",
  [GameStatus.game_over]: "bg-red-600 text-white",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * ScoreBoard — a pure display component.
 *
 * @example
 * <ScoreBoard score={42} highScore={100} status={GameStatus.playing} />
 */
export const ScoreBoard: React.FC<ScoreBoardProps> = ({
  score,
  highScore,
  status,
}) => {
  const statusLabel = STATUS_LABEL[status];
  const statusClass = STATUS_CLASS[status];

  return (
    <div
      className="flex items-center justify-between gap-4 rounded-lg bg-gray-800 px-6 py-3 text-white shadow"
      role="status"
      aria-label="Score board"
    >
      {/* Current score */}
      <div className="flex flex-col items-center">
        <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          Score
        </span>
        <span
          className="text-2xl font-bold tabular-nums"
          data-testid="current-score"
        >
          {score}
        </span>
      </div>

      {/* Game status badge */}
      <div className="flex flex-col items-center gap-1">
        <span
          className={`rounded-full px-3 py-0.5 text-xs font-semibold uppercase tracking-wide ${statusClass}`}
          data-testid="game-status"
        >
          {statusLabel}
        </span>
      </div>

      {/* High score */}
      <div className="flex flex-col items-center">
        <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          Best
        </span>
        <span
          className="text-2xl font-bold tabular-nums"
          data-testid="high-score"
        >
          {highScore}
        </span>
      </div>
    </div>
  );
};

export default ScoreBoard;
