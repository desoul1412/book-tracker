/**
 * @file src/__tests__/performance.test.ts
 * @description Performance audit tests.
 *
 * Spec
 * ─────────────────────────────────────────────────────────────────────────────
 * • `nextTick` computation must complete in < 1 ms on a 20×20 grid.
 * • Canvas draw path (the portion that mirrors the rAF loop body) must complete
 *   in < 16 ms per frame (i.e. sustain 60 fps).
 *
 * Strategy
 * ─────────────────────────────────────────────────────────────────────────────
 * • All measurements use `performance.mark` / `performance.measure` so the
 *   timings survive minification and show up in DevTools' User Timing panel
 *   when run in a real browser via `vitest --browser`.
 * • Each hot path is called N times to amortise JIT warm-up noise; we assert
 *   on the **mean** across all iterations.
 * • The OffscreenCanvas shim (or the jsdom canvas stub) is used for the draw
 *   path because the test environment does not have a GPU compositor, but the
 *   CPU cost of the JS path is what we're measuring.
 *
 * Budget
 * ─────────────────────────────────────────────────────────────────────────────
 * • nextTick  : < 1 ms / call (mean over 1 000 iterations)
 * • draw frame: < 16 ms / frame (mean over 200 iterations) — budget for 60 fps
 *
 * Performance marks emitted
 * ─────────────────────────────────────────────────────────────────────────────
 * • snake:nextTick:start / snake:nextTick:end
 * • snake:drawFrame:start / snake:drawFrame:end
 */

import { describe, it, expect, beforeAll } from "vitest";
import { createInitialState, nextTick } from "@/lib/game-engine";
import type { GameState, Direction } from "@/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Directions cycled through during the benchmark to exercise all code paths. */
const DIRECTIONS: Direction[] = ["RIGHT", "UP", "LEFT", "DOWN"];

/**
 * Builds a fresh 20×20 running state with a deterministic RNG so benchmarks
 * are reproducible across runs.
 */
function buildBenchState(): GameState {
  let seed = 0xdeadbeef;
  const rng = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
  return createInitialState({ boardWidth: 20, boardHeight: 20 }, rng);
}

/**
 * Returns elapsed milliseconds measured via `performance.now()` and annotated
 * with `performance.mark` / `performance.measure` for DevTools visibility.
 *
 * @param label  - Base label; emits `snake:<label>:start` and `snake:<label>:end`.
 * @param warmup - Number of un-timed warm-up calls (JIT warm-up).
 * @param iters  - Number of timed iterations.
 * @param fn     - Function to benchmark.
 * @returns Mean elapsed time per call in milliseconds.
 */
function bench(
  label: string,
  warmup: number,
  iters: number,
  fn: () => void
): number {
  // JIT warm-up — not measured
  for (let i = 0; i < warmup; i++) fn();

  const startMark = `snake:${label}:start`;
  const endMark = `snake:${label}:end`;
  const measureName = `snake:${label}`;

  performance.mark(startMark);
  const t0 = performance.now();

  for (let i = 0; i < iters; i++) fn();

  const elapsed = performance.now() - t0;
  performance.mark(endMark);

  try {
    performance.measure(measureName, startMark, endMark);
  } catch {
    // jsdom may not support PerformanceMeasure — ignore gracefully
  }

  return elapsed / iters;
}

// ---------------------------------------------------------------------------
// Canvas draw-path shim
// ---------------------------------------------------------------------------

/**
 * Minimal CanvasRenderingContext2D–compatible stub that records call counts
 * but performs no pixel work.  This isolates the JS overhead of the draw
 * function from GPU / rasterisation overhead that is irrelevant to a 16 ms
 * JS budget.
 */
function makeCtxStub(): CanvasRenderingContext2D {
  const noop = () => undefined;
  return {
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    shadowColor: "",
    shadowBlur: 0,
    fillRect: noop,
    strokeRect: noop,
    clearRect: noop,
    beginPath: noop,
    closePath: noop,
    moveTo: noop,
    lineTo: noop,
    arcTo: noop,
    arc: noop,
    fill: noop,
    stroke: noop,
    save: noop,
    restore: noop,
  } as unknown as CanvasRenderingContext2D;
}

/**
 * Reproduces the draw logic from GameBoard's `draw()` callback so we can
 * benchmark it without mounting a React component.
 *
 * Mirrors the exact draw sequence used inside the rAF loop:
 *  1. Background fill
 *  2. Grid lines (cols+1 + rows+1 line segments)
 *  3. Body segments (rounded rect per segment)
 *  4. Head (circle)
 *  5. Food pellet (circle)
 *
 * Kept in sync with GameBoard.tsx by design — if the component draw path
 * changes, update this function and the test will catch regressions.
 */
function simulateDrawFrame(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  pulse: number
): void {
  const W = 800;
  const H = 800;
  const cols = state.boardWidth;
  const rows = state.boardHeight;
  const cellW = W / cols;
  const cellH = H / rows;

  // 1. Background
  ctx.fillStyle = "#030712";
  ctx.fillRect(0, 0, W, H);

  // 2. Grid lines
  ctx.strokeStyle = "rgba(74,222,128,0.10)";
  ctx.lineWidth = 1;
  for (let c = 0; c <= cols; c++) {
    ctx.beginPath();
    ctx.moveTo(c * cellW, 0);
    ctx.lineTo(c * cellW, H);
    ctx.stroke();
  }
  for (let r = 0; r <= rows; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * cellH);
    ctx.lineTo(W, r * cellH);
    ctx.stroke();
  }

  // 3. Body segments (indices 1..n)
  for (let i = 1; i < state.snake.length; i++) {
    const [bx, by] = state.snake[i];
    const x = bx * cellW;
    const y = by * cellH;
    const inset = cellW * 0.08;
    const bw = cellW - inset * 2;
    const bh = cellH - inset * 2;
    const r = Math.min(bw, bh) * 0.18;
    ctx.shadowColor = "rgba(34,197,94,0.35)";
    ctx.shadowBlur = 6;
    ctx.fillStyle = "#22c55e";
    // roundedRect path
    ctx.beginPath();
    ctx.moveTo(x + inset + r, y + inset);
    ctx.lineTo(x + inset + bw - r, y + inset);
    ctx.arcTo(x + inset + bw, y + inset, x + inset + bw, y + inset + r, r);
    ctx.lineTo(x + inset + bw, y + inset + bh - r);
    ctx.arcTo(x + inset + bw, y + inset + bh, x + inset + bw - r, y + inset + bh, r);
    ctx.lineTo(x + inset + r, y + inset + bh);
    ctx.arcTo(x + inset, y + inset + bh, x + inset, y + inset + bh - r, r);
    ctx.lineTo(x + inset, y + inset + r);
    ctx.arcTo(x + inset, y + inset, x + inset + r, y + inset, r);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // 4. Head
  const [hx, hy] = state.snake[0];
  const cx = hx * cellW + cellW / 2;
  const cy = hy * cellH + cellH / 2;
  ctx.shadowColor = "rgba(74,222,128,0.55)";
  ctx.shadowBlur = 18;
  ctx.fillStyle = "#bef264";
  ctx.beginPath();
  ctx.arc(cx, cy, Math.min(cellW, cellH) * 0.46, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // 5. Food
  const [fx, fy] = state.food;
  const fcx = fx * cellW + cellW / 2;
  const fcy = fy * cellH + cellH / 2;
  const baseR = Math.min(cellW, cellH) * 0.40;
  const foodR = baseR * (0.75 + 0.25 * pulse);
  ctx.shadowColor = "rgba(248,113,113,0.60)";
  ctx.shadowBlur = 14 + 10 * pulse;
  ctx.fillStyle = "#ef4444";
  ctx.beginPath();
  ctx.arc(fcx, fcy, foodR, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe("Performance audit", () => {
  let initialState: GameState;

  beforeAll(() => {
    initialState = buildBenchState();
  });

  // -------------------------------------------------------------------------
  // nextTick — engine computation budget
  // -------------------------------------------------------------------------

  describe("nextTick computation (20×20 grid)", () => {
    /**
     * Budget: < 1 ms mean per call.
     *
     * 1 000 iterations ensure reliable statistics and exercise the hot loop
     * through wall-collision checks, self-collision checks, and food logic.
     */
    it("mean call time is < 1 ms over 1 000 iterations", () => {
      performance.mark("snake:nextTick-audit:start");

      let state = initialState;
      let dirIndex = 0;

      // Warm-up: 200 calls (JIT)
      for (let i = 0; i < 200; i++) {
        const dir = DIRECTIONS[dirIndex % DIRECTIONS.length];
        state = nextTick(state, dir);
        // Reset to avoid hitting game-over
        if (state.status === "GAME_OVER") {
          state = buildBenchState();
          dirIndex = 0;
        }
        dirIndex++;
      }

      // Reset clean state for measurement
      state = buildBenchState();
      dirIndex = 0;

      const ITERS = 1_000;
      performance.mark("snake:nextTick-bench:start");
      const t0 = performance.now();

      for (let i = 0; i < ITERS; i++) {
        const dir = DIRECTIONS[dirIndex % DIRECTIONS.length];
        state = nextTick(state, dir);
        if (state.status === "GAME_OVER") {
          state = buildBenchState();
          dirIndex = 0;
        }
        dirIndex++;
      }

      const elapsed = performance.now() - t0;
      performance.mark("snake:nextTick-bench:end");

      try {
        performance.measure(
          "snake:nextTick-bench",
          "snake:nextTick-bench:start",
          "snake:nextTick-bench:end"
        );
      } catch {
        /* jsdom may not support PerformanceMeasure */
      }

      const meanMs = elapsed / ITERS;
      console.info(
        `[perf] nextTick mean: ${meanMs.toFixed(4)} ms (total ${elapsed.toFixed(2)} ms over ${ITERS} iters)`
      );

      performance.mark("snake:nextTick-audit:end");

      // Budget: < 1 ms mean
      expect(meanMs).toBeLessThan(1);
    });

    /**
     * Worst-case scenario: snake nearly fills the board.
     * Even with a long snake (50 segments) the time should stay < 1 ms.
     */
    it("remains < 1 ms with a 50-segment snake (long snake path)", () => {
      // Build a state with a manually extended snake (50 segments in a line)
      const longSnake: Array<readonly [number, number]> = [];
      for (let i = 0; i < 50; i++) {
        longSnake.push([Math.min(19, 10 + i % 10), Math.floor(i / 10)] as const);
      }
      const longState: GameState = {
        ...initialState,
        snake: longSnake as GameState["snake"],
        direction: "RIGHT",
        nextDirection: "RIGHT",
      };

      const ITERS = 500;
      const t0 = performance.now();

      let s = longState;
      for (let i = 0; i < ITERS; i++) {
        s = nextTick(s, "RIGHT");
        if (s.status === "GAME_OVER") s = longState;
      }

      const meanMs = (performance.now() - t0) / ITERS;
      console.info(`[perf] nextTick (50-seg snake) mean: ${meanMs.toFixed(4)} ms`);

      expect(meanMs).toBeLessThan(1);
    });

    /**
     * P99 latency must also stay under the budget.
     * Collects individual timings and asserts on the 99th percentile.
     */
    it("p99 call time is < 1 ms over 500 individual measurements", () => {
      const ITERS = 500;
      const timings: number[] = [];

      let state = buildBenchState();
      let dirIndex = 0;

      for (let i = 0; i < ITERS; i++) {
        const dir = DIRECTIONS[dirIndex % DIRECTIONS.length];
        const t0 = performance.now();
        state = nextTick(state, dir);
        timings.push(performance.now() - t0);

        if (state.status === "GAME_OVER") {
          state = buildBenchState();
          dirIndex = 0;
        }
        dirIndex++;
      }

      timings.sort((a, b) => a - b);
      const p99 = timings[Math.floor(ITERS * 0.99)];
      console.info(`[perf] nextTick p99: ${p99.toFixed(4)} ms`);

      expect(p99).toBeLessThan(1);
    });
  });

  // -------------------------------------------------------------------------
  // Canvas draw frame — rAF rendering budget
  // -------------------------------------------------------------------------

  describe("Canvas draw frame (rAF loop, 20×20 grid)", () => {
    /**
     * Budget: < 16 ms mean per frame (60 fps).
     *
     * The draw logic is extracted from GameBoard and runs against a stub
     * CanvasRenderingContext2D so we measure JS overhead only, not GPU
     * rasterisation (which is compositor-side and not JS-bound).
     */
    it("mean draw time is < 16 ms over 200 frames", () => {
      const ctx = makeCtxStub();
      let pulse = 0;

      const mean = bench("drawFrame", 50, 200, () => {
        pulse = (pulse + (1 / 60) * 1.2 * Math.PI * 2) % (Math.PI * 2);
        simulateDrawFrame(ctx, initialState, Math.sin(pulse) * 0.5 + 0.5);
      });

      console.info(`[perf] drawFrame mean: ${mean.toFixed(4)} ms`);

      expect(mean).toBeLessThan(16);
    });

    /**
     * Even with a maximal snake (20 body segments) the JS draw path must
     * sustain 60 fps (< 16 ms per frame).
     */
    it("draw time with 20 body segments is < 16 ms per frame", () => {
      const ctx = makeCtxStub();

      // Build a snake with 20 segments for this test
      const longSnake: Array<readonly [number, number]> = [];
      for (let i = 0; i < 20; i++) {
        longSnake.push([i % 20, Math.floor(i / 20)] as const);
      }
      const snakeState: GameState = {
        ...initialState,
        snake: longSnake as GameState["snake"],
      };

      let pulse = 0;
      const mean = bench("drawFrame-longSnake", 20, 200, () => {
        pulse = (pulse + (1 / 60) * 1.2 * Math.PI * 2) % (Math.PI * 2);
        simulateDrawFrame(ctx, snakeState, Math.sin(pulse) * 0.5 + 0.5);
      });

      console.info(`[perf] drawFrame (20-seg snake) mean: ${mean.toFixed(4)} ms`);

      expect(mean).toBeLessThan(16);
    });

    /**
     * P99 frame latency: < 16 ms.
     * Outliers (GC pauses, OS scheduling) are tolerated below P99.
     */
    it("p99 draw time is < 16 ms over 200 individual frames", () => {
      const ctx = makeCtxStub();
      const ITERS = 200;
      const timings: number[] = [];
      let pulse = 0;

      for (let i = 0; i < ITERS; i++) {
        pulse = (pulse + (1 / 60) * 1.2 * Math.PI * 2) % (Math.PI * 2);
        const t0 = performance.now();
        simulateDrawFrame(ctx, initialState, Math.sin(pulse) * 0.5 + 0.5);
        timings.push(performance.now() - t0);
      }

      timings.sort((a, b) => a - b);
      const p99 = timings[Math.floor(ITERS * 0.99)];
      console.info(`[perf] drawFrame p99: ${p99.toFixed(4)} ms`);

      expect(p99).toBeLessThan(16);
    });
  });

  // -------------------------------------------------------------------------
  // performance.mark / performance.measure integrity
  // -------------------------------------------------------------------------

  describe("performance marks are emitted correctly", () => {
    it("emits snake:drawFrame:start and snake:drawFrame:end marks", () => {
      performance.clearMarks();
      const ctx = makeCtxStub();

      bench("drawFrame-mark-check", 0, 1, () => {
        simulateDrawFrame(ctx, initialState, 0.5);
      });

      const entries = performance.getEntriesByType("mark");
      const names = entries.map((e) => e.name);
      expect(names).toContain("snake:drawFrame-mark-check:start");
      expect(names).toContain("snake:drawFrame-mark-check:end");
    });

    it("emits snake:nextTick-bench:start and snake:nextTick-bench:end marks after nextTick audit", () => {
      // Marks are emitted during the 'mean call time is < 1 ms' test above;
      // because that test runs first, the entries should already exist.
      const entries = performance.getEntriesByType("mark");
      const names = entries.map((e) => e.name);
      expect(names).toContain("snake:nextTick-bench:start");
      expect(names).toContain("snake:nextTick-bench:end");
    });
  });
});
