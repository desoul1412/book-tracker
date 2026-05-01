/**
 * @file src/__tests__/components/GameOverOverlay.test.tsx
 * @description Unit tests for the GameOverOverlay presentational component.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GameOverOverlay } from "@/components/game/GameOverOverlay";
import type { GameOverOverlayProps } from "@/components/game/GameOverOverlay";
import { GameStatus } from "@/types/game";

const DEFAULT_PROPS: GameOverOverlayProps = {
  status: GameStatus.game_over,
  score: 50,
  highScore: 100,
  onPlayAgain: vi.fn(),
};

describe("GameOverOverlay", () => {
  describe("visibility", () => {
    it("renders when status is game_over", () => {
      render(<GameOverOverlay {...DEFAULT_PROPS} />);
      expect(screen.getByTestId("game-over-overlay")).toBeInTheDocument();
    });

    it("does NOT render when status is idle", () => {
      render(<GameOverOverlay {...DEFAULT_PROPS} status={GameStatus.idle} />);
      expect(screen.queryByTestId("game-over-overlay")).not.toBeInTheDocument();
    });

    it("does NOT render when status is playing", () => {
      render(<GameOverOverlay {...DEFAULT_PROPS} status={GameStatus.playing} />);
      expect(screen.queryByTestId("game-over-overlay")).not.toBeInTheDocument();
    });

    it("does NOT render when status is paused", () => {
      render(<GameOverOverlay {...DEFAULT_PROPS} status={GameStatus.paused} />);
      expect(screen.queryByTestId("game-over-overlay")).not.toBeInTheDocument();
    });
  });

  describe("content", () => {
    it("displays 'Game Over' title", () => {
      render(<GameOverOverlay {...DEFAULT_PROPS} />);
      expect(screen.getByRole("heading", { name: /game over/i })).toBeInTheDocument();
    });

    it("displays the final score", () => {
      render(<GameOverOverlay {...DEFAULT_PROPS} score={42} />);
      expect(screen.getByTestId("final-score")).toHaveTextContent("42");
    });

    it("displays the high score when score does not beat it", () => {
      render(<GameOverOverlay {...DEFAULT_PROPS} score={30} highScore={100} />);
      expect(screen.getByTestId("best-score")).toHaveTextContent("100");
    });

    it("displays the new score as best when score beats high score", () => {
      render(<GameOverOverlay {...DEFAULT_PROPS} score={150} highScore={100} />);
      expect(screen.getByTestId("best-score")).toHaveTextContent("150");
    });
  });

  describe("new high score banner", () => {
    it("shows the banner when score > highScore", () => {
      render(<GameOverOverlay {...DEFAULT_PROPS} score={150} highScore={100} />);
      expect(screen.getByTestId("new-high-score-banner")).toBeInTheDocument();
    });

    it("does NOT show the banner when score <= highScore", () => {
      render(<GameOverOverlay {...DEFAULT_PROPS} score={50} highScore={100} />);
      expect(screen.queryByTestId("new-high-score-banner")).not.toBeInTheDocument();
    });

    it("does NOT show the banner when score equals highScore", () => {
      render(<GameOverOverlay {...DEFAULT_PROPS} score={100} highScore={100} />);
      expect(screen.queryByTestId("new-high-score-banner")).not.toBeInTheDocument();
    });
  });

  describe("Play Again button", () => {
    it("renders a Play Again button", () => {
      render(<GameOverOverlay {...DEFAULT_PROPS} />);
      expect(screen.getByTestId("btn-play-again")).toBeInTheDocument();
    });

    it("calls onPlayAgain when clicked", async () => {
      const onPlayAgain = vi.fn();
      render(<GameOverOverlay {...DEFAULT_PROPS} onPlayAgain={onPlayAgain} />);
      await userEvent.click(screen.getByTestId("btn-play-again"));
      expect(onPlayAgain).toHaveBeenCalledTimes(1);
    });
  });

  describe("accessibility", () => {
    it("has role='dialog' with aria-modal", () => {
      render(<GameOverOverlay {...DEFAULT_PROPS} />);
      const overlay = screen.getByRole("dialog");
      expect(overlay).toHaveAttribute("aria-modal", "true");
    });

    it("has aria-labelledby pointing to the title", () => {
      render(<GameOverOverlay {...DEFAULT_PROPS} />);
      const overlay = screen.getByRole("dialog");
      expect(overlay).toHaveAttribute("aria-labelledby", "game-over-title");
    });
  });
});
