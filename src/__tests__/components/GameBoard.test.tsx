/**
 * @file src/__tests__/components/GameBoard.test.tsx
 * @description Unit tests for the GameBoard presentational component.
 *
 * Strategy
 * ─────────────────────────────────────────────────────────────────────────────
 * • Verify the board root element is rendered with the correct ARIA role/label.
 * • Verify snake head, body, and food cells are tagged with the expected
 *   data-testid attributes so other tests (E2E, visual) can target them.
 * • Verify empty cells have NO data-testid (keeps the DOM clean).
 * • Verify that different cellSize values propagate correctly to the grid.
 * • No mocks required — the component is purely presentational.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { GameBoard } from "@/components/game/GameBoard";
import type { GameBoardProps } from "@/components/game/GameBoard";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const DEFAULT_PROPS: GameBoardProps = {
  snake: [
    [2, 2], // head
    [1, 2], // body
    [0, 2], // body
  ],
  food: [4, 4],
  boardWidth: 6,
  boardHeight: 6,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GameBoard", () => {
  describe("root element", () => {
    it("renders a game board container", () => {
      render(<GameBoard {...DEFAULT_PROPS} />);
      expect(screen.getByTestId("game-board")).toBeInTheDocument();
    });

    it("has role='img' on the board container", () => {
      render(<GameBoard {...DEFAULT_PROPS} />);
      expect(screen.getByRole("img")).toBeInTheDocument();
    });

    it("has an aria-label describing the board dimensions", () => {
      render(<GameBoard {...DEFAULT_PROPS} />);
      const board = screen.getByRole("img");
      expect(board).toHaveAttribute(
        "aria-label",
        expect.stringContaining("6 columns by 6 rows"),
      );
    });
  });

  describe("snake head cell", () => {
    it("tags the head cell with data-testid cell-head-x-y", () => {
      render(<GameBoard {...DEFAULT_PROPS} />);
      // head is at [2,2] — testid format is cell-head-{x}-{y}
      expect(screen.getByTestId("cell-head-2-2")).toBeInTheDocument();
    });
  });

  describe("snake body cells", () => {
    it("tags the first body segment with the correct data-testid", () => {
      render(<GameBoard {...DEFAULT_PROPS} />);
      expect(screen.getByTestId("cell-body-1-2")).toBeInTheDocument();
    });

    it("tags all body segments", () => {
      render(<GameBoard {...DEFAULT_PROPS} />);
      expect(screen.getByTestId("cell-body-0-2")).toBeInTheDocument();
    });
  });

  describe("food cell", () => {
    it("tags the food cell with the correct data-testid", () => {
      render(<GameBoard {...DEFAULT_PROPS} />);
      // food is at [4,4]
      expect(screen.getByTestId("cell-food-4-4")).toBeInTheDocument();
    });
  });

  describe("empty cells", () => {
    it("does NOT render data-testid on empty cells", () => {
      const { container } = render(<GameBoard {...DEFAULT_PROPS} />);
      // On a 6×6 board we have head(1) + body(2) + food(1) = 4 tagged cells
      const taggedCells = container.querySelectorAll("[data-testid^='cell-']");
      expect(taggedCells.length).toBe(4);
    });
  });

  describe("cell count", () => {
    it("renders boardWidth × boardHeight total cells", () => {
      const { container } = render(
        <GameBoard {...DEFAULT_PROPS} boardWidth={5} boardHeight={4} />,
      );
      // The board container itself + 5×4 = 20 cell divs inside
      const boardEl = screen.getByTestId("game-board");
      // Children of the board div are the cells
      expect(boardEl.children.length).toBe(5 * 4);
    });
  });

  describe("cellSize prop", () => {
    it("applies default cellSize of 24 when not supplied", () => {
      render(<GameBoard {...DEFAULT_PROPS} />);
      const board = screen.getByTestId("game-board");
      // gridTemplateColumns should reference 24px
      expect(board).toHaveStyle({
        gridTemplateColumns: `repeat(6, 24px)`,
      });
    });

    it("applies custom cellSize when provided", () => {
      render(<GameBoard {...DEFAULT_PROPS} cellSize={32} />);
      const board = screen.getByTestId("game-board");
      expect(board).toHaveStyle({
        gridTemplateColumns: `repeat(6, 32px)`,
      });
    });
  });
});
