"use client";

/**
 * @file src/app/page.tsx
 * @description Root page that composes all Snake game UI components.
 *
 * Responsibilities
 * ─────────────────────────────────────────────────────────────────────────────
 * • Wires `useGameEngine` and distributes state/callbacks to leaf components.
 * • Persists the all-time high score to `localStorage` and passes it down as
 *   a prop, keeping child components pure and easily testable.
 * • Conditionally renders `GameOverOverlay` so it appears only on GAME_OVER.
 * • Adds `"use client"` directive — required for hooks in Next.js App Router.
 *
 * Design decisions
 * ─────────────────────────────────────────────────────────────────────────────
 * • High score is owned here (not inside child components) so there is a
 *   single source of truth. `useGameEngine` tracks in-session high score;
 *   this page syncs it to `localStorage` whenever it improves.
 * • `useEffect` initialises the persisted value client-side only (safe for
 *   SSR: the server renders with 0, the client hydrates the real value on
 *   mount without a mismatch visible to users).
 * • `handlePlayAgain` is memoised with `useCallback` so it is stable across
 *   renders and won't unnecessarily re-render `GameOverOverlay`.
 */

import { useCallback, useEffect, useState } from "react";
import { useGameEngine } from "@/hooks/useGameEngine";
import { GameBoard } from "@/components/game/GameBoard";
import { ScoreBoard } from "@/components/game/ScoreBoard";
import { GameControls } from "@/components/game/GameControls";
import { GameOverOverlay } from "@/components/game/GameOverOverlay";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HIGH_SCORE_KEY = "snake_high_score";

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function Home() {
  const { state, start, pause, resume, reset, changeDirection } =
    useGameEngine();

  // ── Persisted high score ─────────────────────────────────────────────────

  const [persistedHighScore, setPersistedHighScore] = useState<number>(0);

  // Load from localStorage on mount (client-only — avoids SSR mismatch).
  useEffect(() => {
    const raw = localStorage.getItem(HIGH_SCORE_KEY);
    if (raw !== null) {
      const parsed = parseInt(raw, 10);
      if (!isNaN(parsed)) setPersistedHighScore(parsed);
    }
  }, []);

  // Persist whenever the in-session high score improves.
  useEffect(() => {
    if (state.highScore > persistedHighScore) {
      setPersistedHighScore(state.highScore);
      localStorage.setItem(HIGH_SCORE_KEY, String(state.highScore));
    }
  }, [state.highScore, persistedHighScore]);

  // ── Callbacks ────────────────────────────────────────────────────────────

  /** Resets then immediately starts a fresh game — wired to "Play Again". */
  const handlePlayAgain = useCallback(() => {
    reset();
    start();
  }, [reset, start]);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gray-950 p-4">
      {/* ── Title ─────────────────────────────────────────────────────────── */}
      <h1 className="text-4xl font-extrabold tracking-tight text-green-400">
        🐍 Snake
      </h1>

      {/* ── Score board ───────────────────────────────────────────────────── */}
      <ScoreBoard
        score={state.score}
        highScore={persistedHighScore}
        status={state.status}
      />

      {/* ── Game board + overlay wrapper ──────────────────────────────────── */}
      <div className="relative">
        <GameBoard
          snake={state.snake}
          food={state.food}
          boardWidth={state.boardWidth}
          boardHeight={state.boardHeight}
        />

        {/* GameOverOverlay renders null unless status === GAME_OVER */}
        <GameOverOverlay
          status={state.status}
          score={state.score}
          highScore={persistedHighScore}
          onPlayAgain={handlePlayAgain}
        />
      </div>

      {/* ── Game controls ─────────────────────────────────────────────────── */}
      <GameControls
        status={state.status}
        onStart={start}
        onPause={pause}
        onResume={resume}
        onReset={reset}
      />
    </main>
  );
}
