/**
 * Tipos e Interfaces do Jogo
 * Define a estrutura de dados usada em toda a aplicação
 */

export type GameStatus = 'lobby' | 'playing' | 'finished';

export type FruitType = 'apple' | 'mango';

export interface Coordinate {
  x: number;
  y: number;
}

export interface Fruit extends Coordinate {
  type: FruitType;
}

export interface ActiveEffect {
  type: 'speedBoost' | 'slowDown';
  endTime: number; // timestamp quando o efeito termina
}

export interface Snake {
  id: string;
  body: Coordinate[];
  direction: { dx: number; dy: number };
  nextDirection: { dx: number; dy: number };
  alive: boolean;
  score: number;
  activeEffects: ActiveEffect[];
}

export interface GameState {
  snakes: Map<string, Snake>;
  food: Fruit[];
  gameWidth: number;
  gameHeight: number;
}

export interface SnakeData {
  id: string;
  body: Coordinate[];
  alive: boolean;
  score: number;
  activeEffects: ActiveEffect[];
}

export interface LobbyStatus {
  status: GameStatus;
  playerCount: number;
  players: string[];
}

export interface GameStateResponse {
  status: GameStatus;
  snakes: SnakeData[];
  food: Fruit[];
  gameWidth: number;
  gameHeight: number;
}
