/**
 * @file src/hooks/useGameEngine.ts
 * @description React hook that drives the Snake game loop.
 *
 * Provides the full game lifecycle (start/pause/resume/reset) and exposes
 * `changeDirection` as the unified input handler for both keyboard and
 * touch swipe controls. Mobile touch events are handled by the companion
 * `useSwipeControls` hook, which calls `changeDirection` on valid swipes.
 *
 * Touch integration pattern:
 *   const { changeDirection } = useGameEngine();
 *   useSwipeControls(boardRef, changeDirection);  // wired in GameBoard
 */

"use client";

import { useCallback, useRef, useState } from "react";
import type { Direction, GameState } from "@/types";
import { GameStatus } from "@/types";

// ---------------------------------------------------------------------------
// Public API types
// ---------------------------------------------------------------------------

export interface UseGameEngineReturn {
  readonly state: GameState;
  readonly score: number;
  readonly status: GameStatus;
  readonly start: () => void;
  readonly pause: () => void;
  readonly resume: () => void;
  readonly reset: () => void;
  /**
   * Queue a direction change for the next tick. Used by both keyboard input
   * and touch swipe detection — `useSwipeControls` calls this with the
   * direction resolved from touchstart/touchend delta calculation.
   *
   * 180-degree reversals are silently ignored.
   */
  readonly changeDirection: (direction: Direction) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const OPPOSITE: Record<Direction, Direction> = {
  UP: "DOWN",
  DOWN: "UP",
  LEFT: "RIGHT",
  RIGHT: "LEFT",
};

function createInitialState(): GameState {
  return {
    snake: [[10, 10], [9, 10], [8, 10]] as const,
    food: [15, 15] as const,
    score: 0,
    direction: "RIGHT",
    nextDirection: "RIGHT",
    boardWidth: 20,
    boardHeight: 20,
    status: GameStatus.idle,
    highScore: 0,
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useGameEngine(): UseGameEngineReturn {
  const [state, setState] = useState<GameState>(createInitialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  const start = useCallback(() => {
    setState((prev) =>
      prev.status === GameStatus.idle
        ? { ...prev, status: GameStatus.playing }
        : prev,
    );
  }, []);

  const pause = useCallback(() => {
    setState((prev) =>
      prev.status === GameStatus.playing
        ? { ...prev, status: GameStatus.paused }
        : prev,
    );
  }, []);

  const resume = useCallback(() => {
    setState((prev) =>
      prev.status === GameStatus.paused
        ? { ...prev, status: GameStatus.playing }
        : prev,
    );
  }, []);

  const reset = useCallback(() => {
    setState((prev) => {
      const fresh = createInitialState();
      return { ...fresh, highScore: Math.max(fresh.highScore, prev.highScore) };
    });
  }, []);

  /**
   * Unified direction change handler for keyboard and touch swipe input.
   * When the player swipes on the game board, `useSwipeControls` resolves
   * the touchstart/touchend delta into a Direction and calls this function.
   */
  const changeDirection = useCallback((direction: Direction) => {
    setState((prev) => {
      if (prev.status !== GameStatus.playing) return prev;
      if (OPPOSITE[prev.nextDirection] === direction) return prev;
      if (prev.nextDirection === direction) return prev;
      return { ...prev, nextDirection: direction };
    });
  }, []);

  return {
    state,
    score: state.score,
    status: state.status,
    start,
    pause,
    resume,
    reset,
    changeDirection,
  };
}
