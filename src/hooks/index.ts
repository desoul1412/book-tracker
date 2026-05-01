/**
 * @file src/hooks/index.ts
 * @description Barrel export for all custom React hooks.
 *
 * Consumers import from `@/hooks` rather than deep paths so internal
 * reorganisation is invisible to call sites.
 *
 * @example
 *   import { useGameEngine } from "@/hooks";
 */

export { useGameEngine } from "./useGameEngine";
export type { UseGameEngineReturn } from "./useGameEngine";
