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
 * • `GameStatus` is a string enum so exhaustive switch statements in the
 *   engine and UI produce a compile error if a new status is added without
 *   being handled. String values preserve human-readable runtime output and
 *   keep localStorage snapshots stable across refactors.
 * • `GameEvent` is a discriminated union of command objects (the Command
 *   pattern) — one type per intent, making the reducer branch exhaustively
 *   checked by the compiler.
 */

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

/**
 * A cell on the board expressed as [column, row] (zero-indexed).
 *
 * Named `Position` to reflect domain language ("what position is the snake
 * head at?"). `Coordinate` is kept as a backward-compatible alias so
 * existing engine utilities and tests compile without changes.
 */
export type Position = readonly [x: number, y: number];

/** @deprecated Use `Position`. Kept for backward compatibility. */
export type Coordinate = Position;

/** Cardinal movement directions. */
export type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";

// ---------------------------------------------------------------------------
// Snake body
// ---------------------------------------------------------------------------

/**
 * An ordered, immutable list of board positions that make up the snake.
 * Index 0 is always the head; the last element is the tail.
 *
 * Using a named type (rather than inlining `readonly Position[]` everywhere)
 * makes signatures self-documenting and lets us tighten the constraint later
 * (e.g. `[Position, ...Position[]]` to enforce non-empty) without touching
 * call sites.
 */
export type Snake = readonly Position[];

// ---------------------------------------------------------------------------
// Game status
// ---------------------------------------------------------------------------

/**
 * Lifecycle states of a game session, expressed as a string enum.
 *
 * String values are intentionally SCREAMING_SNAKE_CASE so they are
 * recognisable in DevTools, localStorage, and log output without importing
 * the enum. Enum members follow the task-spec names (lowercase snake_case).
 *
 * Member → runtime value mapping:
 *   GameStatus.idle      → "IDLE"
 *   GameStatus.playing   → "RUNNING"
 *   GameStatus.paused    → "PAUSED"
 *   GameStatus.game_over → "GAME_OVER"
 */
export enum GameStatus {
  idle = "IDLE",
  playing = "RUNNING",
  paused = "PAUSED",
  game_over = "GAME_OVER",
}

// ---------------------------------------------------------------------------
// Game state
// ---------------------------------------------------------------------------

/**
 * Immutable snapshot of all game state at a single tick.
 * The engine produces a new snapshot each frame rather than mutating in place,
 * making debugging (time-travel, replay) trivial.
 */
export interface GameState {
  /** Ordered list of snake body segments; index 0 is the head. */
  readonly snake: Snake;
  /** Current position of the food pellet. */
  readonly food: Position;
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
// Game events (command objects dispatched to the reducer)
// ---------------------------------------------------------------------------

/**
 * Discriminated union of all commands that can be dispatched to `gameReducer`.
 *
 * Named `GameEvent` to align with domain language — an "event" captures what
 * the player or the game loop intends to happen. Each member is a narrow
 * object type so the compiler enforces exhaustive handling in switch statements.
 *
 * `GameAction` is kept as a backward-compatible alias.
 */
export type GameEvent =
  | { type: "START" }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "RESET" }
  | { type: "TICK" }
  | { type: "CHANGE_DIRECTION"; direction: Direction };

/** @deprecated Use `GameEvent`. Kept for backward compatibility. */
export type GameAction = GameEvent;
