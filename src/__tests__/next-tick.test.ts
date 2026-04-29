/**
 * @file src/__tests__/next-tick.test.ts
 * @description Unit tests for the pure `nextTick` game-engine function.
 *
 * Coverage targets
 * ─────────────────────────────────────────────────────────────────────────────
 * • Normal movement (head advances, tail removed, length unchanged).
 * • Food consumption (snake grows, score increases, new food spawns).
 * • Wall collision on every edge (left, right, top, bottom) → GAME_OVER.
 * • Self collision → GAME_OVER.
 * • High-score update on GAME_OVER when current score exceeds stored best.
 * • Direction recorded on resulting state.
 * • State immutability (input object is not mutated).
 */

import { describe, it, expect } from "vitest";
import { nextTick } from "@/lib/game-engine";
import { buildInitialState } from "@/lib/game-engine";
import type { GameState } from "@/types";

// ---------------------------------------------------------------------------
// Helper — builds a minimal, deterministic GameState for testing.
// ---------------------------------------------------------------------------

function makeState(override: Partial<GameState> = {}): GameState {
  const base = buildInitialState({ boardWidth: 10, boardHeight: 10 });
  return { ...base, status: "RUNNING", ...override };
}

// ---------------------------------------------------------------------------
// Normal movement
// ---------------------------------------------------------------------------

describe("nextTick — normal movement", () => {
  it("advances the head one cell to the RIGHT", () => {
    const s = makeState({
      snake: [[5, 5], [4, 5], [3, 5]],
      food: [9, 9],
      direction: "RIGHT",
      nextDirection: "RIGHT",
    });
    const next = nextTick(s, "RIGHT");
    expect(next.snake[0]).toEqual([6, 5]);
  });

  it("advances the head one cell to the LEFT", () => {
    const s = makeState({
      snake: [[5, 5], [6, 5], [7, 5]],
      food: [9, 9],
      direction: "LEFT",
      nextDirection: "LEFT",
    });
    const next = nextTick(s, "LEFT");
    expect(next.snake[0]).toEqual([4, 5]);
  });

  it("advances the head one cell UP", () => {
    const s = makeState({
      snake: [[5, 5], [5, 6], [5, 7]],
      food: [9, 9],
      direction: "UP",
      nextDirection: "UP",
    });
    const next = nextTick(s, "UP");
    expect(next.snake[0]).toEqual([5, 4]);
  });

  it("advances the head one cell DOWN", () => {
    const s = makeState({
      snake: [[5, 5], [5, 4], [5, 3]],
      food: [9, 9],
      direction: "DOWN",
      nextDirection: "DOWN",
    });
    const next = nextTick(s, "DOWN");
    expect(next.snake[0]).toEqual([5, 6]);
  });

  it("removes the tail when no food is eaten (length stays constant)", () => {
    const s = makeState({
      snake: [[5, 5], [4, 5], [3, 5]],
      food: [9, 9],
    });
    const next = nextTick(s, "RIGHT");
    expect(next.snake).toHaveLength(3);
    // Old tail [3, 5] should no longer be present.
    expect(next.snake).not.toContainEqual([3, 5]);
  });

  it("records the supplied direction on the returned state", () => {
    const s = makeState({
      snake: [[5, 5], [4, 5], [3, 5]],
      food: [9, 9],
      direction: "RIGHT",
    });
    const next = nextTick(s, "UP");
    expect(next.direction).toBe("UP");
  });

  it("does not mutate the input state", () => {
    const s = makeState({
      snake: [[5, 5], [4, 5], [3, 5]],
      food: [9, 9],
    });
    const snakeBefore = [...s.snake];
    nextTick(s, "RIGHT");
    expect(s.snake).toEqual(snakeBefore);
  });
});

// ---------------------------------------------------------------------------
// Food consumption
// ---------------------------------------------------------------------------

describe("nextTick — food consumption", () => {
  it("grows the snake when the new head lands on food", () => {
    const s = makeState({
      snake: [[5, 5], [4, 5], [3, 5]],
      food: [6, 5], // one step RIGHT from head
      direction: "RIGHT",
      nextDirection: "RIGHT",
    });
    const next = nextTick(s, "RIGHT");
    expect(next.snake).toHaveLength(4);
    expect(next.snake[0]).toEqual([6, 5]);
    // Old tail [3, 5] must still be present.
    expect(next.snake).toContainEqual([3, 5]);
  });

  it("increases score by 10 when food is eaten", () => {
    const s = makeState({
      snake: [[5, 5], [4, 5], [3, 5]],
      food: [6, 5],
      score: 0,
    });
    const next = nextTick(s, "RIGHT");
    expect(next.score).toBe(10);
  });

  it("accumulates score across multiple food events", () => {
    let s = makeState({
      snake: [[5, 5], [4, 5], [3, 5]],
      food: [6, 5],
      score: 30,
    });
    s = nextTick(s, "RIGHT"); // eats food at [6,5]
    expect(s.score).toBe(40);
  });

  it("spawns new food not inside the grown snake after eating", () => {
    const s = makeState({
      snake: [[5, 5], [4, 5], [3, 5]],
      food: [6, 5],
    });
    const next = nextTick(s, "RIGHT");
    // New food must not overlap with the snake.
    const foodInSnake = next.snake.some(
      (seg) => seg[0] === next.food[0] && seg[1] === next.food[1]
    );
    expect(foodInSnake).toBe(false);
  });

  it("leaves food unchanged when no food is eaten", () => {
    const s = makeState({
      snake: [[5, 5], [4, 5], [3, 5]],
      food: [9, 9],
    });
    const next = nextTick(s, "RIGHT");
    expect(next.food).toEqual([9, 9]);
  });
});

// ---------------------------------------------------------------------------
// Wall collision — GAME_OVER
// ---------------------------------------------------------------------------

describe("nextTick — wall collision", () => {
  it("ends the game when snake hits the RIGHT wall", () => {
    // Head at [9, 5] on a 10-wide board; moving RIGHT goes to [10, 5].
    const s = makeState({
      snake: [[9, 5], [8, 5], [7, 5]],
      food: [0, 0],
    });
    const next = nextTick(s, "RIGHT");
    expect(next.status).toBe("GAME_OVER");
  });

  it("ends the game when snake hits the LEFT wall", () => {
    const s = makeState({
      snake: [[0, 5], [1, 5], [2, 5]],
      food: [9, 9],
    });
    const next = nextTick(s, "LEFT");
    expect(next.status).toBe("GAME_OVER");
  });

  it("ends the game when snake hits the TOP wall", () => {
    const s = makeState({
      snake: [[5, 0], [5, 1], [5, 2]],
      food: [9, 9],
    });
    const next = nextTick(s, "UP");
    expect(next.status).toBe("GAME_OVER");
  });

  it("ends the game when snake hits the BOTTOM wall", () => {
    const s = makeState({
      snake: [[5, 9], [5, 8], [5, 7]],
      food: [0, 0],
    });
    const next = nextTick(s, "DOWN");
    expect(next.status).toBe("GAME_OVER");
  });

  it("does NOT wrap around on wall hit (differs from reducer toroidal mode)", () => {
    // If wrapping were applied, [9,5] moving RIGHT → [0,5]; status stays RUNNING.
    const s = makeState({
      snake: [[9, 5], [8, 5], [7, 5]],
      food: [0, 0],
    });
    const next = nextTick(s, "RIGHT");
    // nextTick is lethal — must be GAME_OVER, not RUNNING with head at [0,5].
    expect(next.status).toBe("GAME_OVER");
    expect(next.snake[0]).not.toEqual([0, 5]);
  });
});

// ---------------------------------------------------------------------------
// Self collision — GAME_OVER
// ---------------------------------------------------------------------------

describe("nextTick — self collision", () => {
  it("ends the game when the head moves into its own body", () => {
    // Snake coiled: head [1,0] moving RIGHT → [2,0] = snake[5] (not tail).
    const s = makeState({
      snake: [
        [1, 0], // head → moves RIGHT → [2, 0]
        [0, 0],
        [0, 1],
        [1, 1],
        [2, 1],
        [2, 0], // body cell the head will collide with
        [3, 0], // tail — vacates its cell this tick
      ],
      food: [9, 9],
      direction: "RIGHT",
      nextDirection: "RIGHT",
    });
    const next = nextTick(s, "RIGHT");
    expect(next.status).toBe("GAME_OVER");
  });

  it("does NOT end the game when head occupies what was the tail cell", () => {
    // Straight snake [3,5],[2,5],[1,5] moving RIGHT.
    // The old tail [1,5] vacates so [2,5] is safe (head → [4,5]).
    // Here we test the inverse: moving into the cell the tail just left.
    // Snake [2,5],[3,5],[4,5] moving LEFT → head [1,5].
    // The tail [4,5] vacates — body is [[2,5],[3,5]] → no collision.
    const s = makeState({
      snake: [[2, 5], [3, 5], [4, 5]],
      food: [9, 9],
      direction: "LEFT",
      nextDirection: "LEFT",
    });
    const next = nextTick(s, "LEFT");
    expect(next.status).toBe("RUNNING");
  });
});

// ---------------------------------------------------------------------------
// High-score tracking
// ---------------------------------------------------------------------------

describe("nextTick — high-score tracking", () => {
  it("updates highScore on GAME_OVER when current score exceeds stored best", () => {
    const s = makeState({
      snake: [
        [1, 0],
        [0, 0],
        [0, 1],
        [1, 1],
        [2, 1],
        [2, 0],
        [3, 0],
      ],
      food: [9, 9],
      score: 150,
      highScore: 100,
      direction: "RIGHT",
      nextDirection: "RIGHT",
    });
    const next = nextTick(s, "RIGHT");
    expect(next.status).toBe("GAME_OVER");
    expect(next.highScore).toBe(150);
  });

  it("keeps existing highScore when it is already higher on GAME_OVER", () => {
    const s = makeState({
      snake: [
        [1, 0],
        [0, 0],
        [0, 1],
        [1, 1],
        [2, 1],
        [2, 0],
        [3, 0],
      ],
      food: [9, 9],
      score: 50,
      highScore: 200,
      direction: "RIGHT",
      nextDirection: "RIGHT",
    });
    const next = nextTick(s, "RIGHT");
    expect(next.highScore).toBe(200);
  });

  it("updates highScore on food consumption", () => {
    const s = makeState({
      snake: [[5, 5], [4, 5], [3, 5]],
      food: [6, 5],
      score: 90,
      highScore: 80,
    });
    const next = nextTick(s, "RIGHT");
    expect(next.highScore).toBe(100); // 90 + 10 = 100 > 80
  });
});
