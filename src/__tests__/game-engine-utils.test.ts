/**
 * @file src/__tests__/game-engine-utils.test.ts
 * @description Unit tests for pure engine utility functions.
 *
 * All tests are synchronous and require no DOM — pure TypeScript.
 */

import { describe, it, expect } from "vitest";
import {
  coordinatesEqual,
  moveCoordinate,
  wrapCoordinate,
  isOppositeDirection,
  randomFreeCoordinate,
} from "@/lib/game-engine";

// ---------------------------------------------------------------------------
// coordinatesEqual
// ---------------------------------------------------------------------------

describe("coordinatesEqual", () => {
  it("returns true for identical coordinates", () => {
    expect(coordinatesEqual([3, 7], [3, 7])).toBe(true);
  });

  it("returns false when x differs", () => {
    expect(coordinatesEqual([1, 5], [2, 5])).toBe(false);
  });

  it("returns false when y differs", () => {
    expect(coordinatesEqual([4, 0], [4, 1])).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// moveCoordinate
// ---------------------------------------------------------------------------

describe("moveCoordinate", () => {
  it("moves UP by decrementing y", () => {
    expect(moveCoordinate([5, 5], "UP")).toEqual([5, 4]);
  });

  it("moves DOWN by incrementing y", () => {
    expect(moveCoordinate([5, 5], "DOWN")).toEqual([5, 6]);
  });

  it("moves LEFT by decrementing x", () => {
    expect(moveCoordinate([5, 5], "LEFT")).toEqual([4, 5]);
  });

  it("moves RIGHT by incrementing x", () => {
    expect(moveCoordinate([5, 5], "RIGHT")).toEqual([6, 5]);
  });
});

// ---------------------------------------------------------------------------
// wrapCoordinate
// ---------------------------------------------------------------------------

describe("wrapCoordinate", () => {
  it("wraps x past right edge to left", () => {
    expect(wrapCoordinate([20, 5], 20, 20)).toEqual([0, 5]);
  });

  it("wraps x past left edge to right", () => {
    expect(wrapCoordinate([-1, 5], 20, 20)).toEqual([19, 5]);
  });

  it("wraps y past bottom edge to top", () => {
    expect(wrapCoordinate([5, 20], 20, 20)).toEqual([5, 0]);
  });

  it("wraps y past top edge to bottom", () => {
    expect(wrapCoordinate([5, -1], 20, 20)).toEqual([5, 19]);
  });

  it("leaves coordinates within bounds unchanged", () => {
    expect(wrapCoordinate([10, 10], 20, 20)).toEqual([10, 10]);
  });
});

// ---------------------------------------------------------------------------
// isOppositeDirection
// ---------------------------------------------------------------------------

describe("isOppositeDirection", () => {
  it.each([
    ["UP", "DOWN"],
    ["DOWN", "UP"],
    ["LEFT", "RIGHT"],
    ["RIGHT", "LEFT"],
  ] as const)("%s and %s are opposite", (a, b) => {
    expect(isOppositeDirection(a, b)).toBe(true);
  });

  it.each([
    ["UP", "LEFT"],
    ["UP", "RIGHT"],
    ["DOWN", "LEFT"],
    ["DOWN", "RIGHT"],
  ] as const)("%s and %s are not opposite", (a, b) => {
    expect(isOppositeDirection(a, b)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// randomFreeCoordinate
// ---------------------------------------------------------------------------

describe("randomFreeCoordinate", () => {
  it("returns a coordinate within board bounds", () => {
    const coord = randomFreeCoordinate(5, 5, []);
    expect(coord).not.toBeNull();
    const [x, y] = coord!;
    expect(x).toBeGreaterThanOrEqual(0);
    expect(x).toBeLessThan(5);
    expect(y).toBeGreaterThanOrEqual(0);
    expect(y).toBeLessThan(5);
  });

  it("never returns a coordinate occupied by the snake", () => {
    // Fill all cells except [0, 0]
    const occupied = Array.from({ length: 25 }, (_, i) => [
      i % 5,
      Math.floor(i / 5),
    ]).filter(([x, y]) => !(x === 0 && y === 0)) as [number, number][];

    const coord = randomFreeCoordinate(5, 5, occupied);
    expect(coord).toEqual([0, 0]);
  });

  it("returns null when board is completely full", () => {
    const occupied = Array.from({ length: 4 }, (_, i) => [
      i % 2,
      Math.floor(i / 2),
    ]) as [number, number][];

    expect(randomFreeCoordinate(2, 2, occupied)).toBeNull();
  });
});
