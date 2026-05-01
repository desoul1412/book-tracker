/**
 * @file src/__tests__/GameOverOverlay.test.tsx
 * @description Unit tests for the GameOverOverlay presentational component.
 *
 * Strategy
 * ─────────────────────────────────────────────────────────────────────────────
 * - Render with status = GAME_OVER to assert the overlay is visible.
 * - Render with non-GAME_OVER statuses to assert nothing is rendered.
 * - Assert "New High Score!" banner visibility when score > highScore.
 * - Assert "New High Score!" banner is absent when score <= highScore.
 * - Assert "Play Again" button invokes `onPlayAgain` callback.
 * - Assert score and best-score values render correctly.
 *
 * The component is purely presentational, so no hook mocking is required.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  GameOverOverlay,
  type GameOverOverlayProps,
} from "../components/game/GameOverOverlay";

// ---------------------------------------------------------------------------
// GameStatus values (mirrors the component's local definition)
//
// Defined locally here so the test compiles independently. When the full
// type system and path aliases are merged, swap to:
//   import { GameStatus } from "@/types";
// ---------------------------------------------------------------------------

const GameStatus = {
  idle: "IDLE",
  playing: "RUNNING",
  paused: "PAUSED",
  game_over: "GAME_OVER",
} as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DEFAULT_PROPS: GameOverOverlayProps = {
  status: GameStatus.game_over,
  score: 50,
  highScore: 30,
  onPlayAgain: vi.fn(),
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GameOverOverlay", () => {
  describe("visibility gating", () => {
    it("renders the overlay when status is GAME_OVER", () => {
      render(<GameOverOverlay {...DEFAULT_PROPS} />);
      expect(screen.getByTestId("game-over-overlay")).toBeInTheDocument();
    });

    it.each([GameStatus.idle, GameStatus.playing, GameStatus.paused])(
      "renders nothing when status is %s",
      (status) => {
        const { container } = render(
          <GameOverOverlay {...DEFAULT_PROPS} status={status} />,
        );
        expect(container).toBeEmptyDOMElement();
      },
    );
  });

  describe("score display", () => {
    it("shows the final score", () => {
      render(<GameOverOverlay {...DEFAULT_PROPS} score={42} highScore={10} />);
      expect(screen.getByTestId("final-score")).toHaveTextContent("42");
    });

    it("shows the high score when score does not beat it", () => {
      render(<GameOverOverlay {...DEFAULT_PROPS} score={10} highScore={80} />);
      expect(screen.getByTestId("best-score")).toHaveTextContent("80");
    });

    it("shows the new (current) score as the best when it beats the high score", () => {
      render(<GameOverOverlay {...DEFAULT_PROPS} score={90} highScore={50} />);
      expect(screen.getByTestId("best-score")).toHaveTextContent("90");
    });
  });

  describe("New High Score banner", () => {
    it("shows the banner when score strictly exceeds highScore", () => {
      render(<GameOverOverlay {...DEFAULT_PROPS} score={100} highScore={99} />);
      expect(screen.getByTestId("new-high-score-banner")).toBeInTheDocument();
    });

    it("does not show the banner when score equals highScore", () => {
      render(<GameOverOverlay {...DEFAULT_PROPS} score={50} highScore={50} />);
      expect(
        screen.queryByTestId("new-high-score-banner"),
      ).not.toBeInTheDocument();
    });

    it("does not show the banner when score is below highScore", () => {
      render(<GameOverOverlay {...DEFAULT_PROPS} score={20} highScore={50} />);
      expect(
        screen.queryByTestId("new-high-score-banner"),
      ).not.toBeInTheDocument();
    });
  });

  describe("Play Again button", () => {
    it("renders a Play Again button", () => {
      render(<GameOverOverlay {...DEFAULT_PROPS} />);
      expect(
        screen.getByRole("button", { name: /play again/i }),
      ).toBeInTheDocument();
    });

    it("calls onPlayAgain when the button is clicked", async () => {
      const user = userEvent.setup();
      const onPlayAgain = vi.fn();
      render(<GameOverOverlay {...DEFAULT_PROPS} onPlayAgain={onPlayAgain} />);
      await user.click(screen.getByTestId("btn-play-again"));
      expect(onPlayAgain).toHaveBeenCalledOnce();
    });
  });

  describe("accessibility", () => {
    it("renders as a dialog with aria-modal", () => {
      render(<GameOverOverlay {...DEFAULT_PROPS} />);
      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("aria-modal", "true");
    });

    it("has an accessible title that labels the dialog", () => {
      render(<GameOverOverlay {...DEFAULT_PROPS} />);
      const title = screen.getByText(/game over/i, { selector: "h2" });
      expect(title).toBeInTheDocument();
      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("aria-labelledby", title.id);
    });
  });
});
