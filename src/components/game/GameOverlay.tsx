/**
 * @file src/components/game/GameOverlay.tsx
 * @description Semi-transparent overlay rendered on top of the board when
 *              the game is IDLE, PAUSED, or GAME_OVER.
 *
 * Design decisions
 * ─────────────────────────────────────────────────────────────────────────────
 * • Rendered as `position: absolute` child of a `relative` wrapper so it
 *   sits on top of <GameBoard> without affecting layout.
 * • `role="dialog"` with `aria-modal` — focuses assistive tech on the overlay
 *   message while the board is inactive.
 * • Null render when status is RUNNING — no DOM overhead during gameplay.
 */

import { GameStatus } from "@/types";

interface GameOverlayProps {
  status: GameStatus;
  score: number;
  onStart: () => void;
  onReset: () => void;
  onResume: () => void;
}

type InactiveStatus = GameStatus.idle | GameStatus.paused | GameStatus.game_over;

const STATUS_CONFIG: Record<
  InactiveStatus,
  { heading: string; sub: string; primaryLabel: string; primaryAction: "start" | "reset" | "resume" }
> = {
  [GameStatus.idle]: {
    heading: "Snake",
    sub: "Arrow keys or WASD to move · Space to pause",
    primaryLabel: "Start Game",
    primaryAction: "start",
  },
  [GameStatus.paused]: {
    heading: "Paused",
    sub: "Press Space or click Resume to continue",
    primaryLabel: "Resume",
    primaryAction: "resume",
  },
  [GameStatus.game_over]: {
    heading: "Game Over",
    sub: "Better luck next time!",
    primaryLabel: "Play Again",
    primaryAction: "reset",
  },
};

export function GameOverlay({
  status,
  score,
  onStart,
  onReset,
  onResume,
}: GameOverlayProps) {
  if (status === GameStatus.playing) return null;

  const { heading, sub, primaryLabel, primaryAction } =
    STATUS_CONFIG[status];

  function handlePrimary() {
    if (primaryAction === "start") onStart();
    else if (primaryAction === "reset") onReset();
    else onResume();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={heading}
      className="absolute inset-0 flex flex-col items-center justify-center gap-4
                 bg-gray-950/80 backdrop-blur-sm"
    >
      <h2 className="text-3xl font-bold tracking-tight text-white">
        {heading}
      </h2>

      {status === GameStatus.game_over && (
        <p className="text-xl text-emerald-400 font-mono">Score: {score}</p>
      )}

      <p className="text-sm text-gray-400 text-center max-w-xs">{sub}</p>

      <button
        onClick={handlePrimary}
        className="mt-2 rounded-md bg-emerald-500 px-6 py-2 text-sm font-semibold
                   text-gray-950 hover:bg-emerald-400 focus-visible:outline
                   focus-visible:outline-2 focus-visible:outline-emerald-400
                   transition-colors"
      >
        {primaryLabel}
      </button>
    </div>
  );
}
