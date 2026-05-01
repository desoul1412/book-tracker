/**
 * @file src/hooks/index.ts
 * @description Barrel re-export for all custom React hooks.
 *
 * Consumers import from `@/hooks` rather than deep paths so internal
 * file reorganisation never breaks import sites.
 *
 * @example
 *   import { useGameEngine } from "@/hooks";
 */

export { useGameEngine } from "./useGameEngine";
export type { UseGameEngineReturn } from "./useGameEngine";
export { useSwipeControls } from "./useSwipeControls";
