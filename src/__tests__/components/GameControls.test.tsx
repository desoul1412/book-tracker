/**
 * @file src/__tests__/components/GameControls.test.tsx
 * @description Unit tests for the GameControls presentational component.
 *
 * Strategy
 * ─────────────────────────────────────────────────────────────────────────────
 * • For each GameStatus variant, verify which buttons are enabled/disabled.
 * • Verify that clicking an enabled button calls the correct callback exactly
 *   once and does not call sibling callbacks.
 * • Verify the Pause/Resume toggle: the Resume button is shown while paused,
 *   the Pause button is shown otherwise.
 * • Verify the group has the expected ARIA attributes.
 * • No mocks required for rendering — vi.fn() is used for callbacks.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GameControls } from "@/components/game/GameControls";
import { GameStatus } from "@/types/game";
import type { GameControlsProps } from "@/components/game/GameControls";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeProps(overrides?: Partial<GameControlsProps>): GameControlsProps {
  return {
    status: GameStatus.idle,
    onStart: vi.fn(),
    onPause: vi.fn(),
    onResume: vi.fn(),
    onReset: vi.fn(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GameControls", () => {
  describe("accessibility", () => {
    it("renders a group with aria-label 'Game controls'", () => {
      render(<GameControls {...makeProps()} />);
      expect(
        screen.getByRole("group", { name: /game controls/i }),
      ).toBeInTheDocument();
    });
  });

  describe("button visibility", () => {
    it("shows Start, Pause, and Reset buttons when idle", () => {
      render(<GameControls {...makeProps({ status: GameStatus.idle })} />);
      expect(screen.getByTestId("btn-start")).toBeInTheDocument();
      expect(screen.getByTestId("btn-pause")).toBeInTheDocument();
      expect(screen.getByTestId("btn-reset")).toBeInTheDocument();
    });

    it("shows Resume button (not Pause) when paused", () => {
      render(<GameControls {...makeProps({ status: GameStatus.paused })} />);
      expect(screen.getByTestId("btn-resume")).toBeInTheDocument();
      expect(screen.queryByTestId("btn-pause")).not.toBeInTheDocument();
    });

    it("shows Pause button (not Resume) when playing", () => {
      render(<GameControls {...makeProps({ status: GameStatus.playing })} />);
      expect(screen.getByTestId("btn-pause")).toBeInTheDocument();
      expect(screen.queryByTestId("btn-resume")).not.toBeInTheDocument();
    });
  });

  describe("button enabled/disabled state — IDLE", () => {
    it("Start is enabled when idle", () => {
      render(<GameControls {...makeProps({ status: GameStatus.idle })} />);
      expect(screen.getByTestId("btn-start")).toBeEnabled();
    });

    it("Pause is disabled when idle", () => {
      render(<GameControls {...makeProps({ status: GameStatus.idle })} />);
      expect(screen.getByTestId("btn-pause")).toBeDisabled();
    });

    it("Reset is disabled when idle", () => {
      render(<GameControls {...makeProps({ status: GameStatus.idle })} />);
      expect(screen.getByTestId("btn-reset")).toBeDisabled();
    });
  });

  describe("button enabled/disabled state — PLAYING", () => {
    it("Start is disabled when playing", () => {
      render(<GameControls {...makeProps({ status: GameStatus.playing })} />);
      expect(screen.getByTestId("btn-start")).toBeDisabled();
    });

    it("Pause is enabled when playing", () => {
      render(<GameControls {...makeProps({ status: GameStatus.playing })} />);
      expect(screen.getByTestId("btn-pause")).toBeEnabled();
    });

    it("Reset is enabled when playing", () => {
      render(<GameControls {...makeProps({ status: GameStatus.playing })} />);
      expect(screen.getByTestId("btn-reset")).toBeEnabled();
    });
  });

  describe("button enabled/disabled state — PAUSED", () => {
    it("Start is disabled when paused", () => {
      render(<GameControls {...makeProps({ status: GameStatus.paused })} />);
      expect(screen.getByTestId("btn-start")).toBeDisabled();
    });

    it("Resume is enabled when paused", () => {
      render(<GameControls {...makeProps({ status: GameStatus.paused })} />);
      expect(screen.getByTestId("btn-resume")).toBeEnabled();
    });

    it("Reset is enabled when paused", () => {
      render(<GameControls {...makeProps({ status: GameStatus.paused })} />);
      expect(screen.getByTestId("btn-reset")).toBeEnabled();
    });
  });

  describe("button enabled/disabled state — GAME_OVER", () => {
    it("Start is disabled when game_over", () => {
      render(<GameControls {...makeProps({ status: GameStatus.game_over })} />);
      expect(screen.getByTestId("btn-start")).toBeDisabled();
    });

    it("Reset is enabled when game_over", () => {
      render(<GameControls {...makeProps({ status: GameStatus.game_over })} />);
      expect(screen.getByTestId("btn-reset")).toBeEnabled();
    });
  });

  describe("callback invocation", () => {
    it("calls onStart when Start is clicked in IDLE state", async () => {
      const user = userEvent.setup();
      const props = makeProps({ status: GameStatus.idle });
      render(<GameControls {...props} />);
      await user.click(screen.getByTestId("btn-start"));
      expect(props.onStart).toHaveBeenCalledOnce();
      expect(props.onPause).not.toHaveBeenCalled();
      expect(props.onReset).not.toHaveBeenCalled();
    });

    it("calls onPause when Pause is clicked in PLAYING state", async () => {
      const user = userEvent.setup();
      const props = makeProps({ status: GameStatus.playing });
      render(<GameControls {...props} />);
      await user.click(screen.getByTestId("btn-pause"));
      expect(props.onPause).toHaveBeenCalledOnce();
      expect(props.onStart).not.toHaveBeenCalled();
      expect(props.onReset).not.toHaveBeenCalled();
    });

    it("calls onResume when Resume is clicked in PAUSED state", async () => {
      const user = userEvent.setup();
      const props = makeProps({ status: GameStatus.paused });
      render(<GameControls {...props} />);
      await user.click(screen.getByTestId("btn-resume"));
      expect(props.onResume).toHaveBeenCalledOnce();
      expect(props.onStart).not.toHaveBeenCalled();
      expect(props.onReset).not.toHaveBeenCalled();
    });

    it("calls onReset when Reset is clicked in PLAYING state", async () => {
      const user = userEvent.setup();
      const props = makeProps({ status: GameStatus.playing });
      render(<GameControls {...props} />);
      await user.click(screen.getByTestId("btn-reset"));
      expect(props.onReset).toHaveBeenCalledOnce();
      expect(props.onPause).not.toHaveBeenCalled();
      expect(props.onStart).not.toHaveBeenCalled();
    });

    it("calls onReset when Reset is clicked in GAME_OVER state", async () => {
      const user = userEvent.setup();
      const props = makeProps({ status: GameStatus.game_over });
      render(<GameControls {...props} />);
      await user.click(screen.getByTestId("btn-reset"));
      expect(props.onReset).toHaveBeenCalledOnce();
    });

    it("does NOT call onStart when Start is clicked while disabled (non-idle)", async () => {
      const user = userEvent.setup();
      const props = makeProps({ status: GameStatus.playing });
      render(<GameControls {...props} />);
      // Button is disabled — userEvent should NOT fire the handler
      await user.click(screen.getByTestId("btn-start"));
      expect(props.onStart).not.toHaveBeenCalled();
    });
  });
});
