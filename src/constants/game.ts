/**
 * @file src/constants/game.ts
 * @description Static game constants consumed by the engine, hooks, and UI.
 *
 * Keeping constants in one file prevents magic numbers from scattering across
 * the codebase and makes tuning (e.g. changing default board size) a one-line
 * change.
 *
 * NOTE: This file is also imported by the Vitest infrastructure smoke test
 * (`src/test/setup.test.ts`) to verify the `@/*` path alias works correctly.
 * Keep at least `GRID_SIZE` exported here.
 */

/** Default board dimension (cells). Applies to both width and height. */
export const GRID_SIZE = 20;

/** Milliseconds between engine ticks at game start. */
export const INITIAL_TICK_MS = 150;

/** Minimum tick interval after progressive speed increases. */
export const MIN_TICK_MS = 80;

/** Score increment per food pellet consumed. */
export const SCORE_PER_PELLET = 10;

/** Points scored between each speed increase step. */
export const SPEED_INCREMENT_EVERY = 50;

/** Milliseconds reduced per speed increment. */
export const SPEED_STEP_MS = 10;

/** Initial snake length in cells. */
export const INITIAL_SNAKE_LENGTH = 3;
