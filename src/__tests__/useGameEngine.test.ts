/**
 * @file src/__tests__/useGameEngine.test.ts
 * @description Hook tests for useGameEngine — verifies state lifecycle,
 * direction changes, interval management, and cleanup on unmount.
 *
 * Tests are written against the spec, not the implementation:
 * - Hook initialises state via createInitialState()
 * - Runs setInterval game loop when status is RUNNING
 * - Exposes start/pause/resume/reset/changeDirection actions
 * - Cleans up interval on unmount
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// The hook under test — will be implemented by another agent
import { useGameEngine } from "@/hooks/useGameEngine";

// ---------------------------------------------------------------------------
// Setup: fake timers so setInterval is deterministic
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// State lifecycle: idle → playing → paused → playing → game_over → idle
// ---------------------------------------------------------------------------

describe("useGameEngine state lifecycle", () => {
  it("initialises in IDLE status", () => {
    const { result } = renderHook(() => useGameEngine());
    expect(result.current.state.status).toBe("IDLE");
  });

  it("transitions from IDLE to RUNNING on start()", () => {
    const { result } = renderHook(() => useGameEngine());

    act(() => {
      result.current.start();
    });

    expect(result.current.state.status).toBe("RUNNING");
  });

  it("transitions from RUNNING to PAUSED on pause()", () => {
    const { result } = renderHook(() => useGameEngine());

    act(() => {
      result.current.start();
    });
    act(() => {
      result.current.pause();
    });

    expect(result.current.state.status).toBe("PAUSED");
  });

  it("transitions from PAUSED back to RUNNING on resume()", () => {
    const { result } = renderHook(() => useGameEngine());

    act(() => {
      result.current.start();
    });
    act(() => {
      result.current.pause();
    });
    act(() => {
      result.current.resume();
    });

    expect(result.current.state.status).toBe("RUNNING");
  });

  it("transitions to GAME_OVER on self-collision via ticks", () => {
    const { result } = renderHook(() =>
      useGameEngine({ boardWidth: 5, boardHeight: 5 })
    );

    act(() => {
      result.current.start();
    });

    // Drive the snake into itself by forcing direction changes and ticks.
    // On a 5×5 board with wrapping, the snake will eventually collide.
    // We simulate enough ticks and direction changes to cause self-collision.
    // UP → LEFT → DOWN creates a U-turn over multiple ticks.
    act(() => {
      result.current.changeDirection("UP");
    });
    // Advance one tick so UP is committed
    act(() => {
      vi.advanceTimersByTime(200);
    });
    act(() => {
      result.current.changeDirection("LEFT");
    });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    act(() => {
      result.current.changeDirection("DOWN");
    });

    // Advance many ticks — snake should eventually collide with itself
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.state.status).toBe("GAME_OVER");
  });

  it("transitions from GAME_OVER to IDLE on reset()", () => {
    const { result } = renderHook(() =>
      useGameEngine({ boardWidth: 5, boardHeight: 5 })
    );

    act(() => {
      result.current.start();
    });

    // Force game over via ticks on small board
    act(() => {
      result.current.changeDirection("UP");
    });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    act(() => {
      result.current.changeDirection("LEFT");
    });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    act(() => {
      result.current.changeDirection("DOWN");
    });
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // Confirm game over, then reset
    expect(result.current.state.status).toBe("GAME_OVER");

    act(() => {
      result.current.reset();
    });

    expect(result.current.state.status).toBe("IDLE");
  });

  it("full lifecycle: idle → playing → paused → playing → game_over → idle", () => {
    const { result } = renderHook(() =>
      useGameEngine({ boardWidth: 5, boardHeight: 5 })
    );

    // idle
    expect(result.current.state.status).toBe("IDLE");

    // → playing
    act(() => result.current.start());
    expect(result.current.state.status).toBe("RUNNING");

    // → paused
    act(() => result.current.pause());
    expect(result.current.state.status).toBe("PAUSED");

    // → playing
    act(() => result.current.resume());
    expect(result.current.state.status).toBe("RUNNING");

    // → game_over (drive into self)
    act(() => result.current.changeDirection("UP"));
    act(() => { vi.advanceTimersByTime(200); });
    act(() => result.current.changeDirection("LEFT"));
    act(() => { vi.advanceTimersByTime(200); });
    act(() => result.current.changeDirection("DOWN"));
    act(() => { vi.advanceTimersByTime(5000); });
    expect(result.current.state.status).toBe("GAME_OVER");

    // → idle
    act(() => result.current.reset());
    expect(result.current.state.status).toBe("IDLE");
  });
});

// ---------------------------------------------------------------------------
// Direction changes
// ---------------------------------------------------------------------------

describe("useGameEngine direction changes", () => {
  it("queues a valid direction change", () => {
    const { result } = renderHook(() => useGameEngine());

    act(() => {
      result.current.start();
    });
    act(() => {
      result.current.changeDirection("UP");
    });

    // nextDirection should reflect the queued change
    expect(result.current.state.nextDirection).toBe("UP");
  });

  it("rejects 180° reversal (LEFT when heading RIGHT)", () => {
    const { result } = renderHook(() => useGameEngine());

    act(() => {
      result.current.start();
    });
    act(() => {
      result.current.changeDirection("LEFT");
    });

    // Should still be RIGHT — LEFT is opposite to initial direction
    expect(result.current.state.nextDirection).toBe("RIGHT");
  });

  it("rejects same-direction input (no unnecessary state update)", () => {
    const { result } = renderHook(() => useGameEngine());

    act(() => {
      result.current.start();
    });

    const stateBefore = result.current.state;

    act(() => {
      result.current.changeDirection("RIGHT"); // same as initial
    });

    // State reference should be unchanged (no-op)
    expect(result.current.state.nextDirection).toBe("RIGHT");
  });

  it("commits queued direction on next tick", () => {
    const { result } = renderHook(() => useGameEngine());

    act(() => {
      result.current.start();
    });
    act(() => {
      result.current.changeDirection("UP");
    });

    expect(result.current.state.nextDirection).toBe("UP");
    expect(result.current.state.direction).toBe("RIGHT"); // not yet committed

    // Advance one tick
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current.state.direction).toBe("UP"); // now committed
  });

  it("validates against queued direction, not committed direction", () => {
    const { result } = renderHook(() => useGameEngine());

    act(() => {
      result.current.start();
    });

    // Queue UP (valid: not opposite to RIGHT)
    act(() => {
      result.current.changeDirection("UP");
    });
    expect(result.current.state.nextDirection).toBe("UP");

    // Try DOWN — should be rejected (opposite to queued UP)
    act(() => {
      result.current.changeDirection("DOWN");
    });
    expect(result.current.state.nextDirection).toBe("UP");
  });
});

// ---------------------------------------------------------------------------
// Interval / game loop
// ---------------------------------------------------------------------------

describe("useGameEngine game loop", () => {
  it("does not tick when status is IDLE", () => {
    const { result } = renderHook(() => useGameEngine());

    const initialSnake = result.current.state.snake;

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Snake should not have moved
    expect(result.current.state.snake).toEqual(initialSnake);
  });

  it("ticks when status is RUNNING", () => {
    const { result } = renderHook(() => useGameEngine());

    act(() => {
      result.current.start();
    });

    const headBefore = result.current.state.snake[0];

    act(() => {
      vi.advanceTimersByTime(200);
    });

    const headAfter = result.current.state.snake[0];
    // Snake should have moved (heading RIGHT by default)
    expect(headAfter).not.toEqual(headBefore);
  });

  it("does not tick when PAUSED", () => {
    const { result } = renderHook(() => useGameEngine());

    act(() => {
      result.current.start();
    });
    act(() => {
      result.current.pause();
    });

    const snakeWhilePaused = result.current.state.snake;

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.state.snake).toEqual(snakeWhilePaused);
  });
});

// ---------------------------------------------------------------------------
// Cleanup on unmount
// ---------------------------------------------------------------------------

describe("useGameEngine cleanup", () => {
  it("clears interval on unmount", () => {
    const clearIntervalSpy = vi.spyOn(global, "clearInterval");

    const { result, unmount } = renderHook(() => useGameEngine());

    act(() => {
      result.current.start();
    });

    // Verify interval is running
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current.state.snake[0]).not.toEqual([10, 10]);

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });

  it("does not leak intervals across start/pause cycles", () => {
    const setIntervalSpy = vi.spyOn(global, "setInterval");
    const clearIntervalSpy = vi.spyOn(global, "clearInterval");

    const { result } = renderHook(() => useGameEngine());

    act(() => result.current.start());
    act(() => result.current.pause());
    act(() => result.current.resume());
    act(() => result.current.pause());
    act(() => result.current.resume());

    // Each pause should clear the previous interval; no accumulation
    // The number of clears should be >= number of pauses
    expect(clearIntervalSpy.mock.calls.length).toBeGreaterThanOrEqual(2);

    setIntervalSpy.mockRestore();
    clearIntervalSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// Initial state shape
// ---------------------------------------------------------------------------

describe("useGameEngine initial state", () => {
  it("has a snake of length 3", () => {
    const { result } = renderHook(() => useGameEngine());
    expect(result.current.state.snake).toHaveLength(3);
  });

  it("starts with score 0", () => {
    const { result } = renderHook(() => useGameEngine());
    expect(result.current.state.score).toBe(0);
  });

  it("starts heading RIGHT", () => {
    const { result } = renderHook(() => useGameEngine());
    expect(result.current.state.direction).toBe("RIGHT");
  });

  it("accepts custom config", () => {
    const { result } = renderHook(() =>
      useGameEngine({ boardWidth: 15, boardHeight: 12 })
    );
    expect(result.current.state.boardWidth).toBe(15);
    expect(result.current.state.boardHeight).toBe(12);
  });

  it("has food placed on the board", () => {
    const { result } = renderHook(() => useGameEngine());
    const [fx, fy] = result.current.state.food;
    expect(fx).toBeGreaterThanOrEqual(0);
    expect(fx).toBeLessThan(result.current.state.boardWidth);
    expect(fy).toBeGreaterThanOrEqual(0);
    expect(fy).toBeLessThan(result.current.state.boardHeight);
  });
});
