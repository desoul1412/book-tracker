/**
 * @file src/__tests__/place-food.test.ts
 * @description Unit tests for `placeFood` — the food placement utility.
 *
 * Design goals
 * ─────────────────────────────────────────────────────────────────────────────
 * • All tests use a seeded PRNG so results are fully deterministic.
 * • Tests read the SPEC (what placeFood should do), not the implementation.
 * • No DOM, no side effects — runs in Node with Vitest.
 */

import { describe, it, expect, vi } from "vitest";
import { placeFood } from "@/lib/game-engine";
import type { GameState, Coordinate } from "@/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Minimal LCG seeded PRNG — gives a deterministic sequence in [0, 1).
 * Same algorithm used in many game engines; good enough for test fixtures.
 */
function makeLcgRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = Math.imul(1664525, s) + 1013904223;
    s = s >>> 0;
    return s / 2 ** 32;
  };
}

/** Produces a partial GameState with only the fields placeFood cares about. */
function makeState(
  snake: Coordinate[],
  boardWidth = 5,
  boardHeight = 5
): Pick<GameState, "snake" | "boardWidth" | "boardHeight"> {
  return { snake, boardWidth, boardHeight };
}

// ---------------------------------------------------------------------------
// Spec: return type & board bounds
// ---------------------------------------------------------------------------

describe("placeFood — return type and board bounds", () => {
  it("returns a coordinate (tuple of two numbers)", () => {
    const state = makeState([]);
    const pos = placeFood(state, makeLcgRng(1));
    expect(Array.isArray(pos)).toBe(true);
    expect(pos).toHaveLength(2);
    expect(typeof pos![0]).toBe("number");
    expect(typeof pos![1]).toBe("number");
  });

  it("returns x within [0, boardWidth)", () => {
    const state = makeState([], 10, 10);
    for (let seed = 0; seed < 20; seed++) {
      const pos = placeFood(state, makeLcgRng(seed));
      expect(pos![0]).toBeGreaterThanOrEqual(0);
      expect(pos![0]).toBeLessThan(10);
    }
  });

  it("returns y within [0, boardHeight)", () => {
    const state = makeState([], 10, 10);
    for (let seed = 0; seed < 20; seed++) {
      const pos = placeFood(state, makeLcgRng(seed));
      expect(pos![1]).toBeGreaterThanOrEqual(0);
      expect(pos![1]).toBeLessThan(10);
    }
  });

  it("respects non-square boards (wide)", () => {
    const state = makeState([], 20, 5);
    const pos = placeFood(state, makeLcgRng(99));
    expect(pos![0]).toBeLessThan(20);
    expect(pos![1]).toBeLessThan(5);
  });

  it("respects non-square boards (tall)", () => {
    const state = makeState([], 5, 20);
    const pos = placeFood(state, makeLcgRng(99));
    expect(pos![0]).toBeLessThan(5);
    expect(pos![1]).toBeLessThan(20);
  });
});

// ---------------------------------------------------------------------------
// Spec: avoids snake body (occupied cells)
// ---------------------------------------------------------------------------

describe("placeFood — avoids snake body", () => {
  it("never returns a cell occupied by the snake", () => {
    const snake: Coordinate[] = [
      [0, 0], [1, 0], [2, 0], [3, 0], [4, 0],
      [0, 1], [1, 1], [2, 1], [3, 1], [4, 1],
      [0, 2], [1, 2], [2, 2], [3, 2], [4, 2],
      [0, 3], [1, 3], [2, 3], [3, 3], [4, 3],
      // Row 4 is free except [0,4] and [1,4]
      [0, 4], [1, 4],
    ];
    const state = makeState(snake, 5, 5);

    // Only [2,4], [3,4], [4,4] are free — run many seeds and check
    for (let seed = 0; seed < 50; seed++) {
      const pos = placeFood(state, makeLcgRng(seed));
      expect(pos).not.toBeNull();
      const isOccupied = snake.some(([sx, sy]) => sx === pos![0] && sy === pos![1]);
      expect(isOccupied).toBe(false);
    }
  });

  it("returns the single remaining free cell when board is almost full", () => {
    // 2×2 board; snake occupies 3 of 4 cells — only [1,1] is free
    const snake: Coordinate[] = [[0, 0], [1, 0], [0, 1]];
    const state = makeState(snake, 2, 2);
    const pos = placeFood(state, makeLcgRng(42));
    expect(pos).toEqual([1, 1]);
  });

  it("works with an empty snake (full board available)", () => {
    const state = makeState([], 3, 3);
    const pos = placeFood(state, makeLcgRng(7));
    expect(pos).not.toBeNull();
    expect(pos![0]).toBeGreaterThanOrEqual(0);
    expect(pos![0]).toBeLessThan(3);
    expect(pos![1]).toBeGreaterThanOrEqual(0);
    expect(pos![1]).toBeLessThan(3);
  });
});

// ---------------------------------------------------------------------------
// Spec: returns null when board is full
// ---------------------------------------------------------------------------

describe("placeFood — full board edge case", () => {
  it("returns null when the snake fills the entire board", () => {
    const snake = Array.from({ length: 4 }, (_, i): Coordinate => [
      i % 2,
      Math.floor(i / 2),
    ]);
    const state = makeState(snake, 2, 2);
    expect(placeFood(state, makeLcgRng(1))).toBeNull();
  });

  it("returns null on a 1×1 board fully occupied", () => {
    const state = makeState([[0, 0]], 1, 1);
    expect(placeFood(state, makeLcgRng(1))).toBeNull();
  });

  it("returns non-null on a 1×1 board when snake is empty", () => {
    const state = makeState([], 1, 1);
    expect(placeFood(state, makeLcgRng(1))).toEqual([0, 0]);
  });
});

// ---------------------------------------------------------------------------
// Spec: seeded randomness for determinism
// ---------------------------------------------------------------------------

describe("placeFood — seeded RNG determinism", () => {
  it("produces the same result for the same seed", () => {
    const state = makeState([[2, 2]], 5, 5);
    const a = placeFood(state, makeLcgRng(123));
    const b = placeFood(state, makeLcgRng(123));
    expect(a).toEqual(b);
  });

  it("produces different results for different seeds (stochastic variety)", () => {
    const state = makeState([], 20, 20);
    const results = new Set<string>();
    for (let seed = 0; seed < 30; seed++) {
      const pos = placeFood(state, makeLcgRng(seed));
      results.add(JSON.stringify(pos));
    }
    // With a 20×20 board and 30 different seeds, expect at least 5 distinct outputs
    expect(results.size).toBeGreaterThan(5);
  });

  it("respects a custom rng that always returns 0 (top-left corner)", () => {
    // rng = () => 0 → x = floor(0 * W) = 0, y = floor(0 * H) = 0 → [0, 0]
    // snake occupies [0,0], so the loop must find next free cell
    const state = makeState([[0, 0]], 3, 3);
    const alwaysZero = () => 0;
    // With always-0 rng the loop would be infinite if avoidance wasn't working,
    // so we use a mock that returns 0 once then a valid free position.
    const rng = vi
      .fn()
      .mockReturnValueOnce(0) // first attempt x=0
      .mockReturnValueOnce(0) // first attempt y=0 → [0,0] occupied
      .mockReturnValueOnce(0.4) // second attempt x=1
      .mockReturnValueOnce(0.4); // second attempt y=1 → [1,1] free
    const pos = placeFood(state, rng);
    expect(pos).toEqual([1, 1]);
  });

  it("calls rng in pairs (x then y) per candidate attempt", () => {
    const state = makeState([], 5, 5);
    const calls: number[] = [];
    const trackingRng = () => {
      const v = 0.1;
      calls.push(v);
      return v;
    };
    placeFood(state, trackingRng);
    // Exactly 2 calls for one candidate (x, y) when board is not occupied
    expect(calls.length).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Spec: GameState contract (uses snake, boardWidth, boardHeight)
// ---------------------------------------------------------------------------

describe("placeFood — reads GameState correctly", () => {
  it("uses boardWidth from state to bound x coordinate", () => {
    const state = makeState([], 3, 100);
    for (let seed = 0; seed < 10; seed++) {
      const pos = placeFood(state, makeLcgRng(seed));
      expect(pos![0]).toBeLessThan(3);
    }
  });

  it("uses boardHeight from state to bound y coordinate", () => {
    const state = makeState([], 100, 3);
    for (let seed = 0; seed < 10; seed++) {
      const pos = placeFood(state, makeLcgRng(seed));
      expect(pos![1]).toBeLessThan(3);
    }
  });

  it("treats the entire snake array as occupied, including non-head segments", () => {
    // Snake head at [2,2], body at [2,3], [2,4] — all three must be avoided
    const snake: Coordinate[] = [[2, 2], [2, 3], [2, 4]];
    const state = makeState(snake, 3, 3);
    for (let seed = 0; seed < 30; seed++) {
      const pos = placeFood(state, makeLcgRng(seed));
      if (pos !== null) {
        expect(snake.some(([sx, sy]) => sx === pos[0] && sy === pos[1])).toBe(false);
      }
    }
  });

  it("uses Math.random by default (no rng argument) and returns a valid coord", () => {
    const state = makeState([[0, 0]], 5, 5);
    // Just verify it doesn't throw and returns something in bounds
    const pos = placeFood(state);
    expect(pos).not.toBeNull();
    expect(pos![0]).toBeGreaterThanOrEqual(0);
    expect(pos![0]).toBeLessThan(5);
    expect(pos![1]).toBeGreaterThanOrEqual(0);
    expect(pos![1]).toBeLessThan(5);
    // And it avoided the occupied cell
    expect(pos![0] === 0 && pos![1] === 0).toBe(false);
  });
});
