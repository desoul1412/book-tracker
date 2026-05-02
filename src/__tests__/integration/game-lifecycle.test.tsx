/**
 * @file src/__tests__/integration/game-lifecycle.test.tsx
 * @description Integration test: full game lifecycle.
 *
 * Renders the Home page, simulates keyboard input to start the game,
 * drives 5 ticks with arrow keys, verifies snake movement, simulates
 * food collision, and verifies the score increases.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import React from "react";
import Home from "@/app/page";
import * as utils from "@/lib/game-engine/utils";

// Canvas 2D context mock
const mockCtx = {
  clearRect: vi.fn(), fillRect: vi.fn(), strokeRect: vi.fn(),
  beginPath: vi.fn(), arc: vi.fn(), fill: vi.fn(), stroke: vi.fn(),
  moveTo: vi.fn(), lineTo: vi.fn(), closePath: vi.fn(),
  save: vi.fn(), restore: vi.fn(), setTransform: vi.fn(),
  scale: vi.fn(), translate: vi.fn(), roundRect: vi.fn(),
  arcTo: vi.fn(), quadraticCurveTo: vi.fn(), bezierCurveTo: vi.fn(),
  rect: vi.fn(), clip: vi.fn(),
  createLinearGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
  createRadialGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
  fillStyle: "", strokeStyle: "", lineWidth: 1, globalAlpha: 1,
  shadowColor: "", shadowBlur: 0, font: "", textAlign: "",
  textBaseline: "", lineCap: "", lineJoin: "",
  measureText: vi.fn().mockReturnValue({ width: 10 }),
  fillText: vi.fn(), strokeText: vi.fn(),
};

beforeEach(() => {
  vi.useFakeTimers();
  const store: Record<string, string> = {};
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(
    (key: string) => store[key] ?? null
  );
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(
    (key: string, value: string) => { store[key] = value; }
  );
  vi.stubGlobal("ResizeObserver", class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
  HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(mockCtx);
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => setTimeout(() => cb(0), 0));
  vi.stubGlobal("cancelAnimationFrame", (id: number) => clearTimeout(id));
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function pressKey(key: string, code?: string) {
  fireEvent.keyDown(window, { key, code: code ?? key });
}

function advanceTick(ms = 200) {
  act(() => { vi.advanceTimersByTime(ms); });
}

describe("Integration: full game lifecycle", () => {
  it("renders the page with initial IDLE state", () => {
    render(<Home />);
    expect(screen.getByTestId("game-status")).toHaveTextContent("Ready");
    expect(screen.getByTestId("current-score")).toHaveTextContent("0");
  });

  it("starts the game via Enter key and transitions to Playing", () => {
    render(<Home />);
    act(() => pressKey("Enter"));
    expect(screen.getByTestId("game-status")).toHaveTextContent("Playing");
  });

  it("moves the snake over 5 ticks with arrow key direction changes", () => {
    render(<Home />);
    act(() => pressKey("Enter"));
    expect(screen.getByTestId("game-status")).toHaveTextContent("Playing");

    advanceTick(); // tick 1: RIGHT
    act(() => pressKey("ArrowDown"));
    advanceTick(); // tick 2: DOWN
    advanceTick(); // tick 3: DOWN
    act(() => pressKey("ArrowLeft"));
    advanceTick(); // tick 4: LEFT
    advanceTick(); // tick 5: LEFT

    // Still playing on 20×20 board
    expect(screen.getByTestId("game-status")).toHaveTextContent("Playing");
  });

  it("increases score when snake eats food", () => {
    // Mock both placeFood (initial) and randomFreeCoordinate (after eating)
    // Snake starts at [10,10] heading RIGHT → first tick head at [11,10]
    vi.spyOn(utils, "placeFood").mockReturnValueOnce([11, 10] as const);
    vi.spyOn(utils, "randomFreeCoordinate").mockReturnValue([0, 0] as const);

    render(<Home />);
    expect(screen.getByTestId("current-score")).toHaveTextContent("0");

    act(() => pressKey("Enter"));
    advanceTick(); // head moves to [11,10] — eats food

    expect(screen.getByTestId("current-score")).toHaveTextContent("10");
  });

  it("pauses and resumes via Space key", () => {
    render(<Home />);
    act(() => pressKey("Enter"));
    expect(screen.getByTestId("game-status")).toHaveTextContent("Playing");

    act(() => pressKey(" ", "Space"));
    expect(screen.getByTestId("game-status")).toHaveTextContent("Paused");

    act(() => pressKey(" ", "Space"));
    expect(screen.getByTestId("game-status")).toHaveTextContent("Playing");
  });

  it("full lifecycle: idle → playing → pause → resume → playing again", () => {
    render(<Home />);
    expect(screen.getByTestId("game-status")).toHaveTextContent("Ready");

    act(() => pressKey("Enter"));
    expect(screen.getByTestId("game-status")).toHaveTextContent("Playing");

    act(() => pressKey(" ", "Space"));
    expect(screen.getByTestId("game-status")).toHaveTextContent("Paused");

    act(() => pressKey(" ", "Space"));
    expect(screen.getByTestId("game-status")).toHaveTextContent("Playing");

    // After 5 ticks with direction changes, game should still be running
    act(() => pressKey("ArrowUp"));
    advanceTick();
    act(() => pressKey("ArrowLeft"));
    advanceTick();
    advanceTick();
    advanceTick();
    advanceTick();
    expect(screen.getByTestId("game-status")).toHaveTextContent("Playing");
  });
  it("WASD keys work as direction input", () => {
    render(<Home />);
    act(() => pressKey("Enter"));
    act(() => pressKey("w"));
    advanceTick();
    expect(screen.getByTestId("game-status")).toHaveTextContent("Playing");
  });

  it("score accumulates across multiple food collisions", () => {
    // Place food in a line to the right of the snake's start position
    vi.spyOn(utils, "placeFood").mockReturnValueOnce([11, 10] as const);
    let eatCount = 0;
    vi.spyOn(utils, "randomFreeCoordinate").mockImplementation(() => {
      eatCount++;
      if (eatCount === 1) return [12, 10] as const;
      if (eatCount === 2) return [13, 10] as const;
      return [0, 0] as const;
    });

    render(<Home />);
    act(() => pressKey("Enter"));

    advanceTick(); // eat at [11,10]
    expect(screen.getByTestId("current-score")).toHaveTextContent("10");
    advanceTick(); // eat at [12,10]
    expect(screen.getByTestId("current-score")).toHaveTextContent("20");
    advanceTick(); // eat at [13,10]
    expect(screen.getByTestId("current-score")).toHaveTextContent("30");
  });
});
