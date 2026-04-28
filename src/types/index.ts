/**
 * @file src/types/index.ts
 * @description Barrel re-export for all shared game types.
 *
 * Consumers import from `@/types` rather than deep paths so internal
 * file reorganisation never breaks import sites.
 *
 * @example
 *   import type { GameState, Direction } from "@/types";
 */

export type {
  Coordinate,
  Direction,
  GameStatus,
  GameState,
  GameConfig,
  GameAction,
} from "./game";
