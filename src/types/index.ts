/**
 * @file src/types/index.ts
 * @description Barrel re-export for all shared game types.
 *
 * Consumers import from `@/types` rather than deep paths so internal
 * file reorganisation never breaks import sites.
 *
 * @example
 *   import type { GameState, Direction, GameStatus } from "@/types";
 *   import { GameStatus } from "@/types"; // enum — not `import type`
 */

// `GameStatus` is a runtime enum, so it must NOT use `export type`.
export { GameStatus } from "./game";

export type {
  // Canonical names (task spec)
  Position,
  Snake,
  GameEvent,
  // Stable names used across engine, hooks, and UI
  Direction,
  GameState,
  GameConfig,
  // Backward-compatible aliases
  Coordinate,
  GameAction,
} from "./game";
