/**
 * @file src/components/game/index.ts
 * @description Barrel re-export for all game UI components.
 *
 * Consumers import from `@/components/game` rather than deep paths so internal
 * file reorganisation never breaks import sites.
 *
 * @example
 *   import { GameBoard } from "@/components/game";
 */

export { GameBoard } from "./GameBoard";
export type { GameBoardProps } from "./GameBoard";
