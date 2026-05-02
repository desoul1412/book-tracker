"use client";

/**
 * @file src/app/page.tsx
 * @description Root page that composes all Snake game UI components.
 *
 * Responsibilities
 * ─────────────────────────────────────────────────────────────────────────────
 * - Wires `useGameEngine` and distributes state/callbacks to leaf components.
 * - Persists the all-time high score to `localStorage` and passes it down as
 *   a prop, keeping child components pure and easily testable.
 * - Tracks the pre-game high score via a ref so `GameOverOverlay` can
 *   accurately determine "New High Score!" against the value *before* the
 *   current session updated it.
 * - Wires keyboard input (arrow keys + WASD) to `changeDirection`.
 * - Conditionally renders `GameOverOverlay` (it returns null when not
 *   GAME_OVER).
 * - Adds `"use client"` directive — required for hooks in Next.js App Router.
 *
 * Design decisions
 * ─────────────────────────────────────────────────────────────────────────────
 * - High score is owned here (not inside child components) so there is a
 *   single source of truth. `useGameEngine` tracks in-session high score;
 *   this page syncs it to `localStorage` whenever it improves.
 * - `useEffect` initialises the persisted value client-side only (safe for
 *   SSR: the server renders with 0, the client hydrates the real value on
 *   mount without a mismatch visible to users).
 * - `sessionStartHighScoreRef` snapshots the high score when a new game
 *   starts (IDLE -> RUNNING) so `GameOverOverlay` compares `score` against
 *   the pre-game value, not the eagerly-updated `persistedHighScore`.
 * - `handlePlayAgain` is memoised with `useCallback` so it is stable across
 *   renders and won't unnecessarily re-render `GameOverOverlay`.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useGameEngine } from "@/hooks/useGameEngine";
import { GameBoard } from "@/components/game/GameBoard";
import { ScoreBoard } from "@/components/game/ScoreBoard";
import { GameControls } from "@/components/game/GameControls";
import { GameOverOverlay } from "@/components/game/GameOverOverlay";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HIGH_SCORE_KEY = "snake_high_score";

/** Maps keyboard keys to snake Direction values. */
const KEY_DIRECTION_MAP: Record<string, "UP" | "DOWN" | "LEFT" | "RIGHT"> = {
  ArrowUp: "UP",
  ArrowDown: "DOWN",
  ArrowLeft: "LEFT",
  ArrowRight: "RIGHT",
  w: "UP",
  W: "UP",
  s: "DOWN",
  S: "DOWN",
  a: "LEFT",
  A: "LEFT",
  d: "RIGHT",
  D: "RIGHT",
};

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function Home() {
  const { state, start, pause, resume, reset, changeDirection } =
    useGameEngine();

  // ── Persisted high score ─────────────────────────────────────────────────

  const [persistedHighScore, setPersistedHighScore] = useState<number>(0);

  // Snapshot of the high score at the start of the current game session.
  // `persistedHighScore` is updated eagerly during gameplay (whenever
  // `state.highScore` improves), so by the time GAME_OVER fires it would
  // already equal the new score — making `score > highScore` always false
  // and "New High Score!" invisible. This ref captures the pre-game value.
  const sessionStartHighScoreRef = useRef<number>(0);

  // Load from localStorage on mount (client-only — avoids SSR mismatch).
  useEffect(() => {
    const raw = localStorage.getItem(HIGH_SCORE_KEY);
    if (raw !== null) {
      const parsed = parseInt(raw, 10);
      if (!isNaN(parsed)) {
        setPersistedHighScore(parsed);
        sessionStartHighScoreRef.current = parsed;
      }
    }
  }, []);

  // Persist whenever the in-session high score improves.
  useEffect(() => {
    if (state.highScore > persistedHighScore) {
      setPersistedHighScore(state.highScore);
      localStorage.setItem(HIGH_SCORE_KEY, String(state.highScore));
    }
  }, [state.highScore, persistedHighScore]);

  // Snapshot the high score when a new game session begins (IDLE -> RUNNING)
  // so GameOverOverlay always compares against the pre-game value.
  const prevStatusRef = useRef(state.status);
  useEffect(() => {
    if (state.status === "RUNNING" && prevStatusRef.current === "IDLE") {
      sessionStartHighScoreRef.current = persistedHighScore;
    }
    prevStatusRef.current = state.status;
  }, [state.status, persistedHighScore]);

  // ── Keyboard input ──────────────────────────────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const direction = KEY_DIRECTION_MAP[e.key];
      if (direction) {
        e.preventDefault();
        changeDirection(direction);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [changeDirection]);

  // ── Callbacks ────────────────────────────────────────────────────────────

  /** Resets then immediately starts a fresh game — wired to "Play Again". */
  const handlePlayAgain = useCallback(() => {
    reset();
    start();
  }, [reset, start]);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-gray-950 p-4 selection:bg-green-400/20">
      {/* ── Title ─────────────────────────────────────────────────────────── */}
      <h1
        className="select-none text-4xl font-extrabold tracking-tight text-green-400"
        style={{ textShadow: "0 0 16px rgba(74,222,128,0.6)" }}
      >
        🐍 Snake
      </h1>

      {/* ── Score board ───────────────────────────────────────────────────── */}
      <ScoreBoard
        score={state.score}
        highScore={persistedHighScore}
        status={state.status}
      />

      {/* ── Game board + overlay wrapper — max 600 px, fills viewport on mobile */}
      <div className="relative w-full max-w-[600px]">
        <GameBoard
          snake={state.snake}
          food={state.food}
          boardWidth={state.boardWidth}
          boardHeight={state.boardHeight}
        />

        {/* GameOverOverlay renders null unless status === "GAME_OVER".
            Receives pre-game high score so "New High Score!" is accurate. */}
        <GameOverOverlay
          status={state.status}
          score={state.score}
          highScore={sessionStartHighScoreRef.current}
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

      {/* ── Keyboard hint ─────────────────────────────────────────────────── */}
      <p className="select-none text-xs text-gray-600">
        Arrow keys / WASD to move
      </p>
    </main>
  );
}
