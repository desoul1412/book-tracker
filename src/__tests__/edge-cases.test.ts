/**
 * @file src/__tests__/edge-cases.test.ts
 * @description Comprehensive edge-case tests covering:
 *   1. Win condition — snake fills the entire board (placeFood returns null).
 *   2. Food placement when only 1 cell is free.
 *   3. Rapid direction changes within a single tick (queue semantics).
 *   4. Boundary positions on all 4 walls (nextTick wall-collision, reducer wrap).
 *
 * All tests read the SPEC, not the implementation.
 * Tests are fully deterministic via seeded PRNG.
 */

import { describe, it, expect } from "vitest";
import {
  placeFood,
  nextTick,
  buildInitialState,
  gameReducer,
  validateDirectionChange,
  queueDirection,
} from "@/lib/game-engine";
import type { GameState, Coordinate } from "@/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeLcgRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = Math.imul(1664525, s) + 1013904223;
    s = s >>> 0;
    return s / 2 ** 32;
  };
}

/** Builds a running GameState with sensible defaults for edge-case tests. */
function makeState(override: Partial<GameState> = {}): GameState {
  const base = buildInitialState({ boardWidth: 10, boardHeight: 10 });
  return { ...base, status: "RUNNING", ...override };
}

/** Generates every cell on a W×H board as an array of coordinates. */
function allCells(boardWidth: number, boardHeight: number): Coordinate[] {
  const cells: Coordinate[] = [];
  for (let y = 0; y < boardHeight; y++)
    for (let x = 0; x < boardWidth; x++)
      cells.push([x, y]);
  return cells;
}

// ---------------------------------------------------------------------------
// 1. WIN CONDITION — snake fills the entire board
// ---------------------------------------------------------------------------

describe("Win condition — board completely full", () => {
  it("placeFood returns null when snake occupies every cell", () => {
    const cells = allCells(4, 4); // 16-cell board
    const state = { snake: cells, boardWidth: 4, boardHeight: 4 };
    expect(placeFood(state, makeLcgRng(1))).toBeNull();
  });

  it("placeFood returns null on a 2×2 board with 4-cell snake", () => {
    const snake: Coordinate[] = [[0,0],[1,0],[1,1],[0,1]];
    const state = { snake, boardWidth: 2, boardHeight: 2 };
    expect(placeFood(state, makeLcgRng(99))).toBeNull();
  });

  it("placeFood returns null on a 1×1 board occupied by snake head", () => {
    const state = { snake: [[0, 0]] as Coordinate[], boardWidth: 1, boardHeight: 1 };
    expect(placeFood(state, makeLcgRng(7))).toBeNull();
  });

  it("nextTick falls back to existing food position when board is full after eating", () => {
    // 2×2 board. Snake length 3 (all cells except food). After eating, snake
    // grows to 4 — board is full — randomFreeCoordinate returns null so
    // nextTick keeps food at its original coordinate.
    const food: Coordinate = [1, 1];
    const snake: Coordinate[] = [[0, 1], [0, 0], [1, 0]]; // 3 of 4 cells
    const s = makeState({
      snake,
      food,
      boardWidth: 2,
      boardHeight: 2,
      direction: "RIGHT",
      nextDirection: "RIGHT",
    });
    // Head [0,1] moving RIGHT → [1,1] = food
    const next = nextTick(s, "RIGHT");
    expect(next.snake).toHaveLength(4);
    expect(next.score).toBe(10);
    // Board is full — food must remain at original position (fallback)
    expect(next.food).toEqual(food);
  });

  it("TICK action on reducer falls back to existing food when board is full after eating", () => {
    const food: Coordinate = [1, 1];
    const snake: Coordinate[] = [[0, 1], [0, 0], [1, 0]];
    const s: GameState = {
      ...buildInitialState({ boardWidth: 2, boardHeight: 2 }),
      status: "RUNNING",
      snake,
      food,
      direction: "RIGHT",
      nextDirection: "RIGHT",
    };
    const next = gameReducer(s, { type: "TICK" });
    expect(next.score).toBe(10);
    // Snake now occupies every cell; food stays where it was
    expect(next.food).toEqual(food);
  });
});

// ---------------------------------------------------------------------------
// 2. FOOD PLACEMENT WHEN ONLY 1 CELL IS FREE
// ---------------------------------------------------------------------------

describe("placeFood — exactly one free cell", () => {
  it("always returns the single free cell regardless of rng", () => {
    // 3×3 board, 8 of 9 cells occupied — only [2,2] is free
    const snake: Coordinate[] = [
      [0,0],[1,0],[2,0],
      [0,1],[1,1],[2,1],
      [0,2],[1,2],
    ];
    const state = { snake, boardWidth: 3, boardHeight: 3 };
    for (let seed = 0; seed < 20; seed++) {
      const pos = placeFood(state, makeLcgRng(seed));
      expect(pos).toEqual([2, 2]);
    }
  });

  it("always returns the single free cell on a 2×2 board with 3 occupied", () => {
    // Only [1,1] is free
    const snake: Coordinate[] = [[0,0],[1,0],[0,1]];
    const state = { snake, boardWidth: 2, boardHeight: 2 };
    for (let seed = 0; seed < 10; seed++) {
      expect(placeFood(state, makeLcgRng(seed))).toEqual([1, 1]);
    }
  });

  it("returns the only free corner cell when all others are occupied", () => {
    // 2×2 board, top-right [1,0] is the only free cell
    const snake: Coordinate[] = [[0,0],[0,1],[1,1]];
    const state = { snake, boardWidth: 2, boardHeight: 2 };
    expect(placeFood(state, makeLcgRng(42))).toEqual([1, 0]);
  });

  it("does not infinitely loop — terminates quickly with one free cell", () => {
    const snake: Coordinate[] = [
      [0,0],[1,0],[2,0],[3,0],
      [0,1],[1,1],[2,1],[3,1],
      [0,2],[1,2],[2,2],[3,2],
      [0,3],[1,3],[2,3],          // [3,3] free
    ];
    const state = { snake, boardWidth: 4, boardHeight: 4 };
    const pos = placeFood(state, makeLcgRng(0));
    expect(pos).toEqual([3, 3]);
  });
});

// ---------------------------------------------------------------------------
// 3. RAPID DIRECTION CHANGES WITHIN A SINGLE TICK
// ---------------------------------------------------------------------------

describe("Rapid direction changes — queue semantics (engine.ts)", () => {
  // Snake moving RIGHT. Player rapidly presses UP then DOWN before tick fires.
  // DOWN must be rejected because it is opposite to the queued UP.

  it("rejects a second rapid input that is opposite to the first queued turn", () => {
    const state = makeState({ direction: "RIGHT", nextDirection: "RIGHT" });
    // First input: UP accepted
    const afterUp = { ...state, nextDirection: "UP" as const };
    // Second input: DOWN should be rejected (opposite to queued UP)
    const result = validateDirectionChange(afterUp, "DOWN");
    expect(result).toBe("rejected_opposite");
  });

  it("accepts a second rapid input that is perpendicular to queued direction", () => {
    const state = makeState({ direction: "RIGHT", nextDirection: "UP" });
    // UP queued; pressing LEFT is perpendicular → accepted
    const result = validateDirectionChange(state, "LEFT");
    expect(result).toBe("accepted");
  });

  it("queueDirection: last-accepted direction wins if two non-conflicting inputs arrive", () => {
    // Snake going RIGHT; queue UP then LEFT (perpendicular chain)
    const s0 = makeState({ direction: "RIGHT", nextDirection: "RIGHT" });
    const s1 = { ...s0, nextDirection: "UP" as const };
    const s2 = queueDirection(s1, "LEFT");
    expect(s2.nextDirection).toBe("LEFT");
  });

  it("queueDirection: UP queued, DOWN pressed → same state reference returned (no change)", () => {
    const s = makeState({ direction: "RIGHT", nextDirection: "UP" });
    const result = queueDirection(s, "DOWN");
    expect(result).toBe(s); // same reference = no state update
  });

  it("validateDirectionChange: pressing the same direction as queued returns rejected_same", () => {
    const s = makeState({ nextDirection: "RIGHT" });
    expect(validateDirectionChange(s, "RIGHT")).toBe("rejected_same");
  });

  it("validateDirectionChange: all four 180° reversals are rejected", () => {
    const pairs: [import("@/types").Direction, import("@/types").Direction][] = [
      ["UP", "DOWN"], ["DOWN", "UP"], ["LEFT", "RIGHT"], ["RIGHT", "LEFT"],
    ];
    for (const [queued, pressed] of pairs) {
      const s = makeState({ nextDirection: queued });
      expect(validateDirectionChange(s, pressed)).toBe("rejected_opposite");
    }
  });

  it("reducer CHANGE_DIRECTION checks queued direction, not committed direction", () => {
    // committed=RIGHT, queued=UP; pressing DOWN must be rejected
    const s = makeState({ direction: "RIGHT", nextDirection: "UP" });
    const next = gameReducer(s, { type: "CHANGE_DIRECTION", direction: "DOWN" });
    expect(next.nextDirection).toBe("UP"); // unchanged
    expect(next).toBe(s); // same reference
  });

  it("rapid presses: RIGHT→UP→DOWN in sequence; final queued direction is UP", () => {
    // Simulates three keystrokes before the tick fires:
    //  1. Start: committed=RIGHT, queued=RIGHT
    //  2. Press UP → queued=UP   (accepted; not opposite to RIGHT)
    //  3. Press DOWN → rejected  (opposite to queued UP)
    const s0 = makeState({ direction: "RIGHT", nextDirection: "RIGHT" });
    const s1 = gameReducer(s0, { type: "CHANGE_DIRECTION", direction: "UP" });
    const s2 = gameReducer(s1, { type: "CHANGE_DIRECTION", direction: "DOWN" });
    expect(s1.nextDirection).toBe("UP");
    expect(s2.nextDirection).toBe("UP"); // DOWN was rejected
  });
});

// ---------------------------------------------------------------------------
// 4. BOUNDARY POSITIONS ON ALL 4 WALLS
// ---------------------------------------------------------------------------

describe("nextTick — wall-collision on boundary positions", () => {
  // nextTick is LETHAL on wall hit (no wrapping).

  it("GAME_OVER when head is at x=boardWidth-1 moving RIGHT", () => {
    const s = makeState({ snake: [[9, 5], [8, 5], [7, 5]], food: [0, 0] });
    expect(nextTick(s, "RIGHT").status).toBe("GAME_OVER");
  });

  it("GAME_OVER when head is at x=0 moving LEFT", () => {
    const s = makeState({ snake: [[0, 5], [1, 5], [2, 5]], food: [9, 9] });
    expect(nextTick(s, "LEFT").status).toBe("GAME_OVER");
  });

  it("GAME_OVER when head is at y=0 moving UP", () => {
    const s = makeState({ snake: [[5, 0], [5, 1], [5, 2]], food: [9, 9] });
    expect(nextTick(s, "UP").status).toBe("GAME_OVER");
  });

  it("GAME_OVER when head is at y=boardHeight-1 moving DOWN", () => {
    const s = makeState({ snake: [[5, 9], [5, 8], [5, 7]], food: [0, 0] });
    expect(nextTick(s, "DOWN").status).toBe("GAME_OVER");
  });

  it("GAME_OVER at exact corner [0,0] moving UP", () => {
    const s = makeState({ snake: [[0, 0], [0, 1], [0, 2]], food: [9, 9] });
    expect(nextTick(s, "UP").status).toBe("GAME_OVER");
  });

  it("GAME_OVER at exact corner [0,0] moving LEFT", () => {
    const s = makeState({ snake: [[0, 0], [1, 0], [2, 0]], food: [9, 9] });
    expect(nextTick(s, "LEFT").status).toBe("GAME_OVER");
  });

  it("GAME_OVER at corner [boardWidth-1, boardHeight-1] moving RIGHT", () => {
    const s = makeState({ snake: [[9, 9], [8, 9], [7, 9]], food: [0, 0] });
    expect(nextTick(s, "RIGHT").status).toBe("GAME_OVER");
  });

  it("GAME_OVER at corner [boardWidth-1, boardHeight-1] moving DOWN", () => {
    const s = makeState({ snake: [[9, 9], [9, 8], [9, 7]], food: [0, 0] });
    expect(nextTick(s, "DOWN").status).toBe("GAME_OVER");
  });

  it("does NOT trigger GAME_OVER one cell away from right wall moving RIGHT", () => {
    // Head at [8,5]; moving RIGHT → [9,5] which is still inside 10-wide board
    const s = makeState({ snake: [[8, 5], [7, 5], [6, 5]], food: [0, 0] });
    const next = nextTick(s, "RIGHT");
    expect(next.status).toBe("RUNNING");
    expect(next.snake[0]).toEqual([9, 5]);
  });

  it("does NOT trigger GAME_OVER one cell away from top wall moving UP", () => {
    // Head at [5,1]; UP → [5,0] still inside board
    const s = makeState({ snake: [[5, 1], [5, 2], [5, 3]], food: [9, 9] });
    const next = nextTick(s, "UP");
    expect(next.status).toBe("RUNNING");
    expect(next.snake[0]).toEqual([5, 0]);
  });
});

describe("gameReducer TICK — toroidal wrapping on boundary positions", () => {
  // The reducer wraps the snake (pac-man style) instead of ending the game.

  it("wraps from right wall to x=0 on TICK", () => {
    const s: GameState = {
      ...buildInitialState({ boardWidth: 10, boardHeight: 10 }),
      status: "RUNNING",
      snake: [[9, 5], [8, 5], [7, 5]],
      food: [0, 0],
      direction: "RIGHT",
      nextDirection: "RIGHT",
    };
    const next = gameReducer(s, { type: "TICK" });
    expect(next.status).toBe("RUNNING");
    expect(next.snake[0]).toEqual([0, 5]);
  });

  it("wraps from left wall to x=boardWidth-1 on TICK", () => {
    const s: GameState = {
      ...buildInitialState({ boardWidth: 10, boardHeight: 10 }),
      status: "RUNNING",
      snake: [[0, 5], [1, 5], [2, 5]],
      food: [9, 9],
      direction: "LEFT",
      nextDirection: "LEFT",
    };
    const next = gameReducer(s, { type: "TICK" });
    expect(next.status).toBe("RUNNING");
    expect(next.snake[0]).toEqual([9, 5]);
  });

  it("wraps from top wall to y=boardHeight-1 on TICK", () => {
    const s: GameState = {
      ...buildInitialState({ boardWidth: 10, boardHeight: 10 }),
      status: "RUNNING",
      snake: [[5, 0], [5, 1], [5, 2]],
      food: [9, 9],
      direction: "UP",
      nextDirection: "UP",
    };
    const next = gameReducer(s, { type: "TICK" });
    expect(next.status).toBe("RUNNING");
    expect(next.snake[0]).toEqual([5, 9]);
  });

  it("wraps from bottom wall to y=0 on TICK", () => {
    const s: GameState = {
      ...buildInitialState({ boardWidth: 10, boardHeight: 10 }),
      status: "RUNNING",
      snake: [[5, 9], [5, 8], [5, 7]],
      food: [0, 0],
      direction: "DOWN",
      nextDirection: "DOWN",
    };
    const next = gameReducer(s, { type: "TICK" });
    expect(next.status).toBe("RUNNING");
    expect(next.snake[0]).toEqual([5, 0]);
  });

  it("wraps from corner [9,9] moving DOWN to [9,0]", () => {
    const s: GameState = {
      ...buildInitialState({ boardWidth: 10, boardHeight: 10 }),
      status: "RUNNING",
      snake: [[9, 9], [9, 8], [9, 7]],
      food: [0, 5],
      direction: "DOWN",
      nextDirection: "DOWN",
    };
    const next = gameReducer(s, { type: "TICK" });
    expect(next.snake[0]).toEqual([9, 0]);
  });

  it("wraps from corner [0,0] moving LEFT to [9,0]", () => {
    const s: GameState = {
      ...buildInitialState({ boardWidth: 10, boardHeight: 10 }),
      status: "RUNNING",
      snake: [[0, 0], [1, 0], [2, 0]],
      food: [5, 5],
      direction: "LEFT",
      nextDirection: "LEFT",
    };
    const next = gameReducer(s, { type: "TICK" });
    expect(next.snake[0]).toEqual([9, 0]);
  });

  it("wraps from corner [0,0] moving UP to [0,9]", () => {
    const s: GameState = {
      ...buildInitialState({ boardWidth: 10, boardHeight: 10 }),
      status: "RUNNING",
      snake: [[0, 0], [0, 1], [0, 2]],
      food: [5, 5],
      direction: "UP",
      nextDirection: "UP",
    };
    const next = gameReducer(s, { type: "TICK" });
    expect(next.snake[0]).toEqual([0, 9]);
  });
});
