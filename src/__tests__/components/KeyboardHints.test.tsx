/**
 * @file src/__tests__/components/KeyboardHints.test.tsx
 * @description Unit tests for the KeyboardHints presentational component.
 *
 * Strategy
 * ─────────────────────────────────────────────────────────────────────────────
 * - Verify hints render only when status === "IDLE".
 * - Verify hints are hidden for RUNNING, PAUSED, and GAME_OVER statuses.
 * - Verify all three shortcut groups are present in the DOM.
 * - Verify <kbd> elements are used for semantic key labels.
 * - Verify ARIA attributes for accessibility.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { KeyboardHints } from "@/components/game/KeyboardHints";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type Status = "IDLE" | "RUNNING" | "PAUSED" | "GAME_OVER";

function renderHints(status: Status) {
  return render(<KeyboardHints status={status} />);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("KeyboardHints", () => {
  describe("visibility", () => {
    it("renders when status is IDLE", () => {
      renderHints("IDLE");
      expect(screen.getByTestId("keyboard-hints")).toBeInTheDocument();
    });

    it("returns null when status is RUNNING", () => {
      const { container } = renderHints("RUNNING");
      expect(container.firstChild).toBeNull();
    });

    it("returns null when status is PAUSED", () => {
      const { container } = renderHints("PAUSED");
      expect(container.firstChild).toBeNull();
    });

    it("returns null when status is GAME_OVER", () => {
      const { container } = renderHints("GAME_OVER");
      expect(container.firstChild).toBeNull();
    });
  });

  describe("content", () => {
    it("shows arrow/WASD movement hint", () => {
      renderHints("IDLE");
      expect(screen.getByText(/WASD to move/i)).toBeInTheDocument();
    });

    it("shows Space pause hint", () => {
      renderHints("IDLE");
      expect(screen.getByText(/to pause/i)).toBeInTheDocument();
    });

    it("shows Enter start hint", () => {
      renderHints("IDLE");
      expect(screen.getByText(/to start/i)).toBeInTheDocument();
    });

    it("renders kbd elements for key labels", () => {
      const { container } = renderHints("IDLE");
      const kbds = container.querySelectorAll("kbd");
      expect(kbds.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("accessibility", () => {
    it("has role='note' on the container", () => {
      renderHints("IDLE");
      expect(screen.getByRole("note")).toBeInTheDocument();
    });

    it("has aria-label 'Keyboard shortcuts'", () => {
      renderHints("IDLE");
      expect(
        screen.getByRole("note", { name: /keyboard shortcuts/i }),
      ).toBeInTheDocument();
    });
  });
});
