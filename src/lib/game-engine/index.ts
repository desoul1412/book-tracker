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
 *   import { validateDirectionChange, queueDirection } from "@/lib/game-engine";
 */

// Reducer — game state transitions and initial state factory
export { gameReducer, buildInitialState } from "./reducer";

// Engine — direction validation, queuing, and initial state creation
export { createInitialState, validateDirectionChange, queueDirection, applyQueuedDirection } from "./engine";
export type { DirectionValidationResult } from "./engine";

// Next-tick — frame-by-frame pure step function
export { nextTick } from "./next-tick";

// Utils — pure coordinate and direction helpers
export {
  coordinatesEqual,
  moveCoordinate,
  wrapCoordinate,
  isOppositeDirection,
  randomFreeCoordinate,
  placeFood,
} from "./utils";
