/**
 * @file src/__tests__/components/ScoreBoard.test.tsx
 * @description Unit tests for the ScoreBoard presentational component.
 *
 * Strategy
 * ─────────────────────────────────────────────────────────────────────────────
 * • Verify current score and high score values render with correct data-testid.
 * • Verify the status badge shows the correct human-readable label for every
 *   GameStatus variant.
 * • No mocks required — the component is purely presentational.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ScoreBoard } from "@/components/game/ScoreBoard";
import { GameStatus } from "@/types/game";
import type { ScoreBoardProps } from "@/components/game/ScoreBoard";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const DEFAULT_PROPS: ScoreBoardProps = {
  score: 0,
  highScore: 0,
  status: GameStatus.idle,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ScoreBoard", () => {
  describe("score display", () => {
    it("renders the current score", () => {
      render(<ScoreBoard {...DEFAULT_PROPS} score={42} />);
      expect(screen.getByTestId("current-score")).toHaveTextContent("42");
    });

    it("renders a score of 0 correctly", () => {
      render(<ScoreBoard {...DEFAULT_PROPS} score={0} />);
      expect(screen.getByTestId("current-score")).toHaveTextContent("0");
    });

    it("renders a large score correctly", () => {
      render(<ScoreBoard {...DEFAULT_PROPS} score={9999} />);
      expect(screen.getByTestId("current-score")).toHaveTextContent("9999");
    });
  });

  describe("high score display", () => {
    it("renders the high score", () => {
      render(<ScoreBoard {...DEFAULT_PROPS} highScore={100} />);
      expect(screen.getByTestId("high-score")).toHaveTextContent("100");
    });

    it("renders a high score of 0 correctly", () => {
      render(<ScoreBoard {...DEFAULT_PROPS} highScore={0} />);
      expect(screen.getByTestId("high-score")).toHaveTextContent("0");
    });
  });

  describe("status badge", () => {
    it.each([
      [GameStatus.idle, "Ready"],
      [GameStatus.playing, "Playing"],
      [GameStatus.paused, "Paused"],
      [GameStatus.game_over, "Game Over"],
    ] as const)(
      "shows label '%s' for status %s",
      (status, expectedLabel) => {
        render(<ScoreBoard {...DEFAULT_PROPS} status={status} />);
        expect(screen.getByTestId("game-status")).toHaveTextContent(expectedLabel);
      },
    );
  });

  describe("accessibility", () => {
    it("has role='status' on the container", () => {
      render(<ScoreBoard {...DEFAULT_PROPS} />);
      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("has an aria-label describing it as a score board", () => {
      render(<ScoreBoard {...DEFAULT_PROPS} />);
      expect(screen.getByRole("status")).toHaveAttribute(
        "aria-label",
        "Score board",
      );
    });
  });
});
