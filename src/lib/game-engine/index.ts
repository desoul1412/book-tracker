/**
 * @file src/lib/game-engine/index.ts
 * @description Public API barrel for the game engine module.
 *
 * External consumers (hooks, components, tests) should import from
 * `@/lib/game-engine` rather than from deep internal paths.  This keeps
 * internal refactoring invisible to callers.
 *
 * @example
 *   import { gameReducer, buildInitialState } from "@/lib/game-engine";
 *   import { coordinatesEqual, randomFreeCoordinate } from "@/lib/game-engine";
 */

export { gameReducer, buildInitialState } from "./reducer";
export { createInitialState, getTickInterval } from "./engine";
export { nextTick } from "./next-tick";
export {
  coordinatesEqual,
  moveCoordinate,
  wrapCoordinate,
  isOppositeDirection,
  randomFreeCoordinate,
  placeFood,
} from "./utils";
