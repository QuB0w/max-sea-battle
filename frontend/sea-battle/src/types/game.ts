export type CellState = 'empty' | 'ship' | 'hit' | 'miss';

export type Board = CellState[][];

export type Ship = {
  x: number;
  y: number;
  length: number;
  isHorizontal: boolean;
};

export type AiDifficulty = 'Easy' | 'Normal';

export type GameMode = 'ai' | 'online';

export type AppScreen =
  | 'mainMenu'
  | 'gameModeSelection'
  | 'lobby'
  | 'shipPlacement'
  | 'battleScreen'
  | 'gameOver';

export type UserProfile = {
  id: string;
  name: string;
};

export type Statistic = {
  userId: string;
  wins: number;
  losses: number;
  gamesPlayed: number;
};
