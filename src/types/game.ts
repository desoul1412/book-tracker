// Game Types for Snake Game

export type Position = {
  x: number;
  y: number;
};

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export type Snake = {
  body: Position[];
  direction: Direction;
};

export enum GameStatus {
  idle = 'idle',
  playing = 'playing',
  paused = 'paused',
  game_over = 'game_over',
}

export type GameConfig = {
  gridWidth: number;
  gridHeight: number;
  initialSpeed: number;
  scorePerPellet: number;
};

export type GameState = {
  snake: Snake;
  pellet: Position;
  score: number;
  highScore: number;
  status: GameStatus;
  config: GameConfig;
};

export type GameEvent =
  | { type: 'START' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'RESET' }
  | { type: 'CHANGE_DIRECTION'; direction: Direction }
  | { type: 'TICK' }
  | { type: 'EAT_PELLET' }
  | { type: 'GAME_OVER' };
