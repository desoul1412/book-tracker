/**
 * @file src/hooks/useKeyboardControls.ts
 * @description Attaches global keyboard listeners and maps arrow/WASD keys to
 *              game actions.
 *
 * Design decisions
 * ─────────────────────────────────────────────────────────────────────────────
 * • Attaches to `window` — avoids focus management on the canvas element.
 * • Debounce-like guard: only one direction change is processed per animation
 *   frame to prevent diagonal movement from rapid key presses.
 * • `Space` toggles pause/resume so the game is playable one-handed.
 * • The hook is a thin adapter — it calls the stable callbacks provided by
 *   `useGameEngine` and introduces no state of its own.
 *
 * @param handlers - Callbacks from `useGameEngine`.
 * @param enabled  - When false the listeners are not attached (e.g. game over).
 */

"use client";

import { useEffect, useRef } from "react";
import type { Direction, GameStatus } from "@/types";

interface KeyboardHandlers {
  changeDirection: (d: Direction) => void;
  pause: () => void;
  resume: () => void;
  status: GameStatus;
}

const KEY_TO_DIRECTION: Record<string, Direction> = {
  ArrowUp: "UP",
  ArrowDown: "DOWN",
  ArrowLeft: "LEFT",
  ArrowRight: "RIGHT",
  w: "UP",
  s: "DOWN",
  a: "LEFT",
  d: "RIGHT",
  W: "UP",
  S: "DOWN",
  A: "LEFT",
  D: "RIGHT",
};

export function useKeyboardControls({
  changeDirection,
  pause,
  resume,
  status,
}: KeyboardHandlers): void {
  // Track whether we've already dispatched a direction this frame.
  const movedThisFrameRef = useRef(false);

  useEffect(() => {
    if (status === "IDLE" || status === "GAME_OVER") return;

    function handleKeyDown(e: KeyboardEvent): void {
      // Prevent arrow keys from scrolling the page.
      if (KEY_TO_DIRECTION[e.key]) e.preventDefault();

      if (e.key === " ") {
        e.preventDefault();
        if (status === "RUNNING") pause();
        else if (status === "PAUSED") resume();
        return;
      }

      const direction = KEY_TO_DIRECTION[e.key];
      if (!direction) return;

      // One direction change per animation frame max.
      if (movedThisFrameRef.current) return;
      movedThisFrameRef.current = true;
      requestAnimationFrame(() => {
        movedThisFrameRef.current = false;
      });

      changeDirection(direction);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [status, changeDirection, pause, resume]);
}
