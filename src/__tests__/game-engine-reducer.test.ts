/**
 * @file src/__tests__/game-engine-reducer.test.ts
 * @description Unit tests for the pure game reducer.
 *
 * Strategy
 * ─────────────────────────────────────────────────────────────────────────────
 * • Build a deterministic starting state via `buildInitialState`.
 * • Exercise every action type and assert on the resulting snapshot.
 * • Food randomness is tested implicitly — we only assert structural invariants
 *   (food is within bounds, not inside snake) rather than exact coordinates.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { buildInitialState, gameReducer } from "@/lib/game-engine";
import type { GameState } from "@/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Advance state to RUNNING. */
function runningState(override?: Partial<GameState>): GameState {
  const s = buildInitialState({ boardWidth: 10, boardHeight: 10 });
  return gameReducer({ ...s, ...override }, { type: "START" });
}

// ---------------------------------------------------------------------------
// buildInitialState
// ---------------------------------------------------------------------------

describe("buildInitialState", () => {
  it("starts with status IDLE", () => {
    expect(buildInitialState().status).toBe("IDLE");
  });

  it("applies custom board dimensions", () => {
    const s = buildInitialState({ boardWidth: 15, boardHeight: 12 });
    expect(s.boardWidth).toBe(15);
    expect(s.boardHeight).toBe(12);
  });

  it("places food within board bounds", () => {
    const s = buildInitialState({ boardWidth: 10, boardHeight: 10 });
    expect(s.food[0]).toBeGreaterThanOrEqual(0);
    expect(s.food[0]).toBeLessThan(10);
    expect(s.food[1]).toBeGreaterThanOrEqual(0);
    expect(s.food[1]).toBeLessThan(10);
  });

  it("does not place food inside the snake", () => {
    const s = buildInitialState({ boardWidth: 10, boardHeight: 10 });
    const foodInSnake = s.snake.some(
      (seg) => seg[0] === s.food[0] && seg[1] === s.food[1]
    );
    expect(foodInSnake).toBe(false);
  });

  it("snake starts with length 3", () => {
    expect(buildInitialState().snake).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// START
// ---------------------------------------------------------------------------

describe("START action", () => {
  it("transitions status from IDLE to RUNNING", () => {
    const s = buildInitialState();
    expect(gameReducer(s, { type: "START" }).status).toBe("RUNNING");
  });
});

// ---------------------------------------------------------------------------
// PAUSE / RESUME
// ---------------------------------------------------------------------------

describe("PAUSE / RESUME actions", () => {
  it("pauses a running game", () => {
    const s = runningState();
    expect(gameReducer(s, { type: "PAUSE" }).status).toBe("PAUSED");
  });

  it("does not pause a non-running game", () => {
    const s = buildInitialState();
    expect(gameReducer(s, { type: "PAUSE" }).status).toBe("IDLE");
  });

  it("resumes a paused game", () => {
    const s = runningState();
    const paused = gameReducer(s, { type: "PAUSE" });
    expect(gameReducer(paused, { type: "RESUME" }).status).toBe("RUNNING");
  });
});

// ---------------------------------------------------------------------------
// RESET
// ---------------------------------------------------------------------------

describe("RESET action", () => {
  it("resets to IDLE status", () => {
    const s = runningState({ score: 100 });
    expect(gameReducer(s, { type: "RESET" }).status).toBe("IDLE");
  });

  it("preserves the high score across a reset", () => {
    const s = runningState({ score: 0, highScore: 200 });
    expect(gameReducer(s, { type: "RESET" }).highScore).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// CHANGE_DIRECTION
// ---------------------------------------------------------------------------

describe("CHANGE_DIRECTION action", () => {
  it("queues a valid direction change", () => {
    const s = runningState();
    // Initial direction is RIGHT; changing to UP is valid.
    const next = gameReducer(s, { type: "CHANGE_DIRECTION", direction: "UP" });
    expect(next.nextDirection).toBe("UP");
  });

  it("ignores a direction that would reverse the snake", () => {
    const s = runningState();
    const next = gameReducer(s, {
      type: "CHANGE_DIRECTION",
      direction: "LEFT",
    });
    expect(next.nextDirection).toBe("RIGHT"); // unchanged
  });
});

// ---------------------------------------------------------------------------
// TICK — movement
// ---------------------------------------------------------------------------

describe("TICK action — movement", () => {
  it("advances the snake head in the current direction", () => {
    // Snake starts heading RIGHT at midX.
    const s = runningState();
    const headX = s.snake[0][0];
    const headY = s.snake[0][1];

    const next = gameReducer(s, { type: "TICK" });
    expect(next.snake[0]).toEqual([headX + 1, headY]);
  });

  it("keeps snake length constant when no food eaten", () => {
    const s = runningState();
    const len = s.snake.length;
    const next = gameReducer(s, { type: "TICK" });
    expect(next.snake).toHaveLength(len);
  });

  it("applies queued direction change on tick", () => {
    const s = runningState();
    const turned = gameReducer(s, {
      type: "CHANGE_DIRECTION",
      direction: "UP",
    });
    const next = gameReducer(turned, { type: "TICK" });
    expect(next.direction).toBe("UP");
  });

  it("does nothing when game is not RUNNING", () => {
    const s = buildInitialState();
    expect(gameReducer(s, { type: "TICK" })).toBe(s);
  });
});

// ---------------------------------------------------------------------------
// TICK — food consumption
// ---------------------------------------------------------------------------

describe("TICK action — food consumption", () => {
  it("grows the snake when head reaches food", () => {
    // Craft a state where the snake head is one step from food.
    let s = buildInitialState({ boardWidth: 10, boardHeight: 10 });

    // Override so head is directly to the left of food.
    const foodX = 6;
    const foodY = 5;
    s = {
      ...s,
      snake: [
        [foodX - 1, foodY],
        [foodX - 2, foodY],
        [foodX - 3, foodY],
      ],
      food: [foodX, foodY],
      direction: "RIGHT",
      nextDirection: "RIGHT",
      status: "RUNNING",
    };

    const next = gameReducer(s, { type: "TICK" });
    expect(next.snake).toHaveLength(4);
    expect(next.score).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// TICK — collision
// ---------------------------------------------------------------------------

describe("TICK action — self collision", () => {
  it("ends game when head collides with body", () => {
    // Create a U-shaped snake pointing into itself.
    //  Head: [2,0] → moving LEFT → collides with body at [0,0]?
    // Actually craft a situation where the next move hits body.
    // Snake coiled so head [1,0] moves RIGHT into [2,0] which is snake[5].
    // A 7-segment snake is used so [2,0] is body (not the tail [3,0]),
    // meaning the tail does NOT vacate [2,0] before the collision check.
    const s: GameState = {
      ...buildInitialState({ boardWidth: 10, boardHeight: 10 }),
      snake: [
        [1, 0], // head — will move RIGHT → [2, 0]
        [0, 0],
        [0, 1],
        [1, 1],
        [2, 1],
        [2, 0], // snake[5] — body cell the head is moving into
        [3, 0], // tail — moves away, so only snake[5] stays occupied
      ],
      food: [9, 9],
      direction: "RIGHT",
      nextDirection: "RIGHT",
      status: "RUNNING",
    };

    // Tick: head moves RIGHT to [2, 0] = snake[5] (not the tail) → collision.
    const next = gameReducer(s, { type: "TICK" });
    expect(next.status).toBe("GAME_OVER");
  });

  it("updates highScore on game over if score exceeds previous best", () => {
    const s: GameState = {
      ...buildInitialState({ boardWidth: 10, boardHeight: 10 }),
      snake: [
        [1, 0], // head — moves RIGHT → [2, 0] = snake[5] → collision
        [0, 0],
        [0, 1],
        [1, 1],
        [2, 1],
        [2, 0], // body cell hit
        [3, 0], // tail (moves away)
      ],
      food: [9, 9],
      direction: "RIGHT",
      nextDirection: "RIGHT",
      status: "RUNNING",
      score: 150,
      highScore: 100,
    };

    const next = gameReducer(s, { type: "TICK" });
    expect(next.highScore).toBe(150);
  });
});
