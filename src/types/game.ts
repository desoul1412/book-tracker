/**
 * @file src/types/game.ts
 * @description Shared domain types for the Snake game.
 */

export type Position = readonly [x: number, y: number];
export type Coordinate = Position;
export type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";
export type Snake = readonly Position[];

export const GameStatus = {
  idle: "IDLE",
  playing: "RUNNING",
  paused: "PAUSED",
  game_over: "GAME_OVER",
} as const;

export type GameStatus = (typeof GameStatus)[keyof typeof GameStatus];

export interface GameState {
  readonly snake: Snake;
  readonly food: Position;
  readonly score: number;
  readonly direction: Direction;
  readonly nextDirection: Direction;
  readonly boardWidth: number;
  readonly boardHeight: number;
  readonly status: GameStatus;
  readonly highScore: number;
}

export interface GameConfig {
  boardWidth?: number;
  boardHeight?: number;
  initialTickMs?: number;
  minTickMs?: number;
  scorePerPellet?: number;
}

export type GameEvent =
  | { type: "START" }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "RESET" }
  | { type: "TICK" }
  | { type: "CHANGE_DIRECTION"; direction: Direction };

export type GameAction = GameEvent;
