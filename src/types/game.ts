/**
 * @file src/types/game.ts
 * @description Shared domain types for the Snake game.
 *
 * All game-engine modules, React hooks, and UI components import from this
 * single source of truth so type changes propagate everywhere at compile time.
 *
 * Design decisions
 * ─────────────────────────────────────────────────────────────────────────────
 * • Pure value types (no classes) — safe to freeze, clone, and serialise to
 *   localStorage for persistence without any ceremony.
 * • Readonly tuples for coordinates — prevents accidental mutation in the
 *   engine loop, which is pure-functional by design.
 * • Discriminated union for GameStatus — exhaustive switch statements in the
 *   engine and UI will get a compile error if a new status is added without
 *   being handled.
 */

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

/** A cell on the board expressed as [column, row] (zero-indexed). */
export type Coordinate = readonly [x: number, y: number];

/** Cardinal movement directions. */
export type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";

// ---------------------------------------------------------------------------
// Game state
// ---------------------------------------------------------------------------

/** Lifecycle states of a game session. */
export type GameStatus = "IDLE" | "RUNNING" | "PAUSED" | "GAME_OVER";

/**
 * Immutable snapshot of all game state at a single tick.
 * The engine produces a new snapshot each frame rather than mutating in place,
 * making debugging (time-travel, replay) trivial.
 */
export interface GameState {
  /** Ordered list of snake body segments; index 0 is the head. */
  readonly snake: readonly Coordinate[];
  /** Current position of the food pellet. */
  readonly food: Coordinate;
  /** Player's current score (number of food pellets consumed). */
  readonly score: number;
  /** Direction the snake is currently travelling. */
  readonly direction: Direction;
  /** Queued direction change (applied at next tick to prevent 180° reversal). */
  readonly nextDirection: Direction;
  /** Width of the board in cells. */
  readonly boardWidth: number;
  /** Height of the board in cells. */
  readonly boardHeight: number;
  /** Current lifecycle status. */
  readonly status: GameStatus;
  /** Highest score achieved in this browser session. */
  readonly highScore: number;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/**
 * Tunable parameters passed to the game engine at initialisation.
 * All fields are optional; the engine provides sensible defaults.
 */
export interface GameConfig {
  /** Board width in cells. Default: 20. */
  boardWidth?: number;
  /** Board height in cells. Default: 20. */
  boardHeight?: number;
  /** Milliseconds between engine ticks at the start of the game. Default: 150. */
  initialTickMs?: number;
  /** Minimum tick interval after speed increases. Default: 60. */
  minTickMs?: number;
  /** Score increment per pellet consumed. Default: 10. */
  scorePerPellet?: number;
}

// ---------------------------------------------------------------------------
// Engine actions (command objects sent to the reducer)
// ---------------------------------------------------------------------------

export type GameAction =
  | { type: "START" }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "RESET" }
  | { type: "TICK" }
  | { type: "CHANGE_DIRECTION"; direction: Direction };
