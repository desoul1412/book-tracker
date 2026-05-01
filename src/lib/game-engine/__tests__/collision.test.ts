import { describe, it, expect } from "vitest";
import {
  checkCollision,
  isCollision,
  GameStatus,
  type CollisionState,
} from "../collision";

// ─── Helpers ───────────────────────────────────────────────────────

/** Standard 20x20 board for most tests. */
const BOARD_WIDTH = 20;
const BOARD_HEIGHT = 20;

function makeState(
  snake: CollisionState["snake"],
  width = BOARD_WIDTH,
  height = BOARD_HEIGHT
): CollisionState {
  return { snake, boardWidth: width, boardHeight: height };
}

// ─── Wall collision ────────────────────────────────────────────────

describe("checkCollision — wall collision", () => {
  it("returns game_over when head x < 0", () => {
    const state = makeState([{ x: -1, y: 5 }]);
    expect(checkCollision(state)).toBe(GameStatus.game_over);
  });

  it("returns game_over when head y < 0", () => {
    const state = makeState([{ x: 5, y: -1 }]);
    expect(checkCollision(state)).toBe(GameStatus.game_over);
  });

  it("returns game_over when head x >= boardWidth", () => {
    const state = makeState([{ x: 20, y: 5 }]);
    expect(checkCollision(state)).toBe(GameStatus.game_over);
  });

  it("returns game_over when head y >= boardHeight", () => {
    const state = makeState([{ x: 5, y: 20 }]);
    expect(checkCollision(state)).toBe(GameStatus.game_over);
  });

  // Boundary conditions — head exactly at edges (valid positions)
  it("returns null when head is at (0, 0) — top-left corner", () => {
    const state = makeState([{ x: 0, y: 0 }]);
    expect(checkCollision(state)).toBeNull();
  });

  it("returns null when head is at (boardWidth-1, 0) — top-right corner", () => {
    const state = makeState([{ x: 19, y: 0 }]);
    expect(checkCollision(state)).toBeNull();
  });

  it("returns null when head is at (0, boardHeight-1) — bottom-left corner", () => {
    const state = makeState([{ x: 0, y: 19 }]);
    expect(checkCollision(state)).toBeNull();
  });

  it("returns null when head is at (boardWidth-1, boardHeight-1) — bottom-right corner", () => {
    const state = makeState([{ x: 19, y: 19 }]);
    expect(checkCollision(state)).toBeNull();
  });

  // Off-by-one checks at each boundary
  it("returns game_over at x = boardWidth (one past right edge)", () => {
    const state = makeState([{ x: BOARD_WIDTH, y: 10 }]);
    expect(checkCollision(state)).toBe(GameStatus.game_over);
  });

  it("returns game_over at y = boardHeight (one past bottom edge)", () => {
    const state = makeState([{ x: 10, y: BOARD_HEIGHT }]);
    expect(checkCollision(state)).toBe(GameStatus.game_over);
  });

  it("returns null at x = boardWidth-1 (right edge, valid)", () => {
    const state = makeState([{ x: BOARD_WIDTH - 1, y: 10 }]);
    expect(checkCollision(state)).toBeNull();
  });

  it("returns null at y = boardHeight-1 (bottom edge, valid)", () => {
    const state = makeState([{ x: 10, y: BOARD_HEIGHT - 1 }]);
    expect(checkCollision(state)).toBeNull();
  });
});

// ─── Self collision ────────────────────────────────────────────────

describe("checkCollision — self collision", () => {
  it("returns game_over when head overlaps a body segment", () => {
    const state = makeState([
      { x: 5, y: 5 }, // head
      { x: 6, y: 5 },
      { x: 7, y: 5 },
      { x: 7, y: 4 },
      { x: 6, y: 4 },
      { x: 5, y: 5 }, // tail overlaps head
    ]);
    expect(checkCollision(state)).toBe(GameStatus.game_over);
  });

  it("returns game_over when head overlaps segment at index 1", () => {
    const state = makeState([
      { x: 3, y: 3 }, // head
      { x: 3, y: 3 }, // immediate neighbor same position
      { x: 4, y: 3 },
    ]);
    expect(checkCollision(state)).toBe(GameStatus.game_over);
  });

  it("returns null when no body segments overlap the head", () => {
    const state = makeState([
      { x: 5, y: 5 }, // head
      { x: 6, y: 5 },
      { x: 7, y: 5 },
      { x: 8, y: 5 },
    ]);
    expect(checkCollision(state)).toBeNull();
  });

  it("returns null for a single-segment snake (head only)", () => {
    const state = makeState([{ x: 10, y: 10 }]);
    expect(checkCollision(state)).toBeNull();
  });
});

// ─── Edge cases ────────────────────────────────────────────────────

describe("checkCollision — edge cases", () => {
  it("returns null for an empty snake", () => {
    const state = makeState([]);
    expect(checkCollision(state)).toBeNull();
  });

  it("works with a 1x1 board — head at (0,0) is valid", () => {
    const state = makeState([{ x: 0, y: 0 }], 1, 1);
    expect(checkCollision(state)).toBeNull();
  });

  it("detects wall collision on a 1x1 board — head at (1,0)", () => {
    const state = makeState([{ x: 1, y: 0 }], 1, 1);
    expect(checkCollision(state)).toBe(GameStatus.game_over);
  });

  it("wall collision takes precedence when head is both OOB and overlaps body", () => {
    // Head is out of bounds AND matches a body segment position
    const state = makeState([
      { x: -1, y: 5 },
      { x: -1, y: 5 },
    ]);
    // Should return game_over (wall checked first)
    expect(checkCollision(state)).toBe(GameStatus.game_over);
  });
});

// ─── isCollision wrapper ───────────────────────────────────────────

describe("isCollision", () => {
  it("returns true when checkCollision returns game_over", () => {
    const state = makeState([{ x: -1, y: 5 }]);
    expect(isCollision(state)).toBe(true);
  });

  it("returns false when checkCollision returns null", () => {
    const state = makeState([{ x: 10, y: 10 }]);
    expect(isCollision(state)).toBe(false);
  });
});
