/**
 * @file src/hooks/index.ts
 * @description Barrel re-export for React hooks.
 *
 * Consumers import from `@/hooks` rather than deep paths.
 *
 * @example
 *   import { useGameEngine } from "@/hooks";
 */

export { useGameEngine } from "./useGameEngine";
export type { UseGameEngineReturn } from "./useGameEngine";
