/**
 * @file src/components/game/ScoreBoard.tsx
 * @description Displays the current score, high score (persisted in
 * localStorage), and current game status with appropriate Tailwind styling.
 *
 * Visual juice enhancement: score flash
 * ─────────────────────────────────────────────────────────────────────────────
 * When the score increases, the score number briefly scales up to 1.35x and
 * flashes lime-400 (#a3e635) before settling back. This is achieved with a
 * zero-dependency CSS animation trick:
 *
 *   1. `prevScoreRef` tracks the previous score value via useRef.
 *   2. When `score > prevScoreRef.current`, a `flashKey` counter increments.
 *   3. The score `<span>` uses `key={flashKey}` — React unmounts/remounts
 *      the element, restarting the CSS `animate-score-flash` animation from
 *      frame 0 on every point scored.
 *   4. `will-change: transform` promotes the element to its own compositor
 *      layer for smooth 60 fps animation.
 *
 * This approach avoids any JS animation library or requestAnimationFrame
 * overhead and is compatible with React strict mode (double-mount safe).
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

import React, { useEffect, useRef, useState } from "react";
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
 * ScoreBoard — a display component with score-flash animation.
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

  // ── Score flash animation ────────────────────────────────────────────────
  // `flashKey` increments whenever score increases, forcing React to remount
  // the score <span> and restart the CSS animation.
  const prevScoreRef = useRef<number>(score);
  const [flashKey, setFlashKey] = useState<number>(0);

  useEffect(() => {
    if (score > prevScoreRef.current) {
      setFlashKey((k) => k + 1);
    }
    prevScoreRef.current = score;
  }, [score]);

  return (
    <div
      className="flex w-full max-w-[600px] items-center justify-between gap-4 rounded-xl border border-green-900/30 bg-gray-900/80 px-6 py-3 text-white backdrop-blur-sm"
      style={{ boxShadow: "0 0 20px rgba(74,222,128,0.05)" }}
      role="status"
      aria-label="Score board"
    >
      {/* Current score */}
      <div className="flex flex-col items-center">
        <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">
          Score
        </span>
        <span
          key={flashKey}
          className="text-2xl font-bold tabular-nums text-green-300 animate-score-flash"
          style={{ willChange: "transform" }}
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
        <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">
          Best
        </span>
        <span
          className="text-2xl font-bold tabular-nums text-yellow-400"
          data-testid="high-score"
        >
          {highScore}
        </span>
      </div>
    </div>
  );
};

export default ScoreBoard;
