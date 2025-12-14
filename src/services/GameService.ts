/**
 * GameService - Lógica Principal do Jogo
 *
 * Responsável por:
 * - Gerenciar estado do jogo
 * - Controlar o game loop
 * - Detectar colisões
 * - Gerar comida com frutas
 * - Gerenciar cobras e jogadores
 * - Gerenciar efeitos temporários
 */

import {
  GameStatus,
  Snake,
  GameState,
  Coordinate,
  SnakeData,
  LobbyStatus,
  GameStateResponse,
  FruitType,
  Fruit,
  ActiveEffect,
} from '../types/game';
import { GAME_CONFIG } from '../config/constants';
import { Logger } from '../utils/logger';

const SCOPE = 'GameService';

export class GameService {
  private gameState: GameState;
  private gameLoopInterval: NodeJS.Timeout | null = null;
  private status: GameStatus = 'lobby';
  private connectedPlayers: Set<string> = new Set();

  constructor() {
    this.gameState = {
      snakes: new Map(),
      food: [],
      gameWidth: GAME_CONFIG.GAME_WIDTH,
      gameHeight: GAME_CONFIG.GAME_HEIGHT,
    };
    // Gera comidas iniciais
    for (let i = 0; i < GAME_CONFIG.INITIAL_FOOD_COUNT; i++) {
      this.spawnFood();
    }
    Logger.info(SCOPE, `Jogo inicializado (${GAME_CONFIG.GAME_WIDTH}x${GAME_CONFIG.GAME_HEIGHT}) com ${GAME_CONFIG.INITIAL_FOOD_COUNT} comidas`);
  }

  /**
   * Adiciona um jogador ao lobby
   */
  addPlayer(playerId: string): void {
    this.connectedPlayers.add(playerId);
    Logger.info(SCOPE, `Jogador ${playerId} entrou (Total: ${this.connectedPlayers.size})`);
  }

  /**
   * Remove um jogador do jogo
   */
  removePlayer(playerId: string): void {
    this.connectedPlayers.delete(playerId);

    if (this.gameState.snakes.has(playerId)) {
      this.gameState.snakes.delete(playerId);
    }

    Logger.info(SCOPE, `Jogador ${playerId} saiu (Total: ${this.connectedPlayers.size})`);

    // Se a sala ficar vazia, reseta
    if (this.connectedPlayers.size === 0) {
      this.resetGame();
    }
  }

  /**
   * Obtém status do lobby
   */
  getLobbyStatus(): LobbyStatus {
    return {
      status: this.status,
      playerCount: this.connectedPlayers.size,
      players: Array.from(this.connectedPlayers),
    };
  }

  /**
   * Inicia o jogo
   */
  startGame(): boolean {
    if (this.connectedPlayers.size < 1) {
      Logger.warn(SCOPE, 'Tentativa de iniciar jogo sem jogadores');
      return false;
    }

    // Se o jogo está em andamento, reseta completamente antes de iniciar novamente
    if (this.status === 'playing' || this.status === 'finished') {
      this.resetGame();
    }

    Logger.info(SCOPE, `Iniciando jogo com ${this.connectedPlayers.size} jogador(es)`);
    this.status = 'playing';

    // Criar cobras para cada jogador conectado
    for (const playerId of this.connectedPlayers) {
      if (!this.gameState.snakes.has(playerId)) {
        this.createSnake(playerId);
      }
    }

    this.startGameLoop();
    return true;
  }

  /**
   * Cria uma cobra para um jogador
   */
  private createSnake(playerId: string): void {
    const startX = Math.floor(this.gameState.gameWidth / 2);
    const startY = Math.floor(this.gameState.gameHeight / 2);

    const newSnake: Snake = {
      id: playerId,
      body: [
        { x: startX, y: startY },
        { x: startX - 1, y: startY },
        { x: startX - 2, y: startY },
      ],
      direction: { dx: 1, dy: 0 },
      nextDirection: { dx: 1, dy: 0 },
      alive: true,
      score: 0,
      activeEffects: [],
    };

    this.gameState.snakes.set(playerId, newSnake);
    Logger.debug(SCOPE, `Cobra criada para ${playerId}`);
  }

  /**
   * Move uma cobra baseado na direção
   */
  moveSnake(playerId: string, direction: { dx: number; dy: number }): boolean {
    const snake = this.gameState.snakes.get(playerId);
    if (!snake || !snake.alive) return false;

    // Previne movimento para direção oposta
    const isOppositeDirection =
      direction.dx === -snake.direction.dx && direction.dy === -snake.direction.dy;

    if (isOppositeDirection) return false;

    snake.nextDirection = direction;
    return true;
  }

  /**
   * Armazena o último tempo de movimento de cada cobra
   */
  private lastSnakeMoveTimes: Map<string, number> = new Map();

  /**
   * Um tick do game loop
   * Executa a lógica do jogo a cada tick
   * Respeita a velocidade individual de cada cobra (com efeitos)
   */
  private gameLoopTick(): void {
    const alivePlayers = Array.from(this.gameState.snakes.values()).filter((s) => s.alive);

    // Verifica se nenhuma cobra está viva
    if (alivePlayers.length === 0) {
      this.finishGame();
      return;
    }

    const now = Date.now();

    // Atualiza direções
    for (const snake of alivePlayers) {
      snake.direction = snake.nextDirection;
    }

    // Move cobras e verifica colisões (respeitando velocidade individual)
    for (const snake of alivePlayers) {
      // Obtém o tick rate específico dessa cobra (com efeitos)
      const tickRate = this.getTickRateForSnake(snake);
      const lastMoveTime = this.lastSnakeMoveTimes.get(snake.id) || 0;

      // Só move se passou o tempo necessário para essa cobra
      if (now - lastMoveTime >= tickRate) {
        this.moveSnakeLogic(snake);
        this.lastSnakeMoveTimes.set(snake.id, now);
      }
    }
  }

  /**
   * Executa a lógica de movimento de uma cobra
   */
  private moveSnakeLogic(snake: Snake): void {
    const head = { ...snake.body[0] };
    head.x += snake.direction.dx;
    head.y += snake.direction.dy;

    snake.body.unshift(head);

    // Colisão com parede
    if (
      head.x < 0 ||
      head.x >= this.gameState.gameWidth ||
      head.y < 0 ||
      head.y >= this.gameState.gameHeight
    ) {
      snake.alive = false;
      return;
    }

    // Colisão com próprio corpo
    if (snake.body.slice(1).some((seg) => seg.x === head.x && seg.y === head.y)) {
      snake.alive = false;
      return;
    }

    // Colisão com outra cobra
    for (const otherSnake of this.gameState.snakes.values()) {
      if (otherSnake.id !== snake.id && otherSnake.alive) {
        if (otherSnake.body.some((seg) => seg.x === head.x && seg.y === head.y)) {
          snake.alive = false;
          return;
        }
      }
    }

    // Comida (Frutas)
    const foodIndex = this.gameState.food.findIndex(
      (f) => f.x === head.x && f.y === head.y
    );
    
    if (foodIndex !== -1) {
      const fruit = this.gameState.food[foodIndex];
      this.handleFruitCollision(snake, fruit);
      
      // Remove a fruta comida do array
      this.gameState.food.splice(foodIndex, 1);
      // Gera uma nova fruta
      this.spawnFood();
    } else {
      snake.body.pop();
    }
  }

  /**
   * Processa a colisão com uma fruta
   */
  private handleFruitCollision(snake: Snake, fruit: Fruit): void {
    switch (fruit.type) {
      case 'apple':
        // Maçã: +10 pontos
        snake.score += 10;
        break;

      case 'mango':
        // Manga: +20 pontos
        snake.score += 20;
        break;
    }
  }

  /**
   * Obtém a taxa de tick atual baseado nos efeitos ativos
   */
  private getTickRateForSnake(snake: Snake): number {
    const now = Date.now();
    let multiplier = 1;

    for (const effect of snake.activeEffects) {
      if (effect.endTime > now) {
        if (effect.type === 'speedBoost') {
          multiplier *= 0.5; // 50% mais rápido
        } else if (effect.type === 'slowDown') {
          multiplier *= 2; // 50% mais lento (dobra o tempo)
        }
      }
    }

    // Limpa efeitos expirados
    snake.activeEffects = snake.activeEffects.filter((e) => e.endTime > now);

    return Math.max(30, Math.min(200, GAME_CONFIG.GAME_TICK_RATE * multiplier));
  }

  /**
   * Gera fruta em uma posição aleatória válida
   */
  spawnFood(): void {
    let newFoodPos: Coordinate;
    let isValid: boolean;

    do {
      isValid = true;
      newFoodPos = {
        x: Math.floor(Math.random() * this.gameState.gameWidth),
        y: Math.floor(Math.random() * this.gameState.gameHeight),
      };

      // Verifica se a posição colide com alguma cobra
      for (const snake of this.gameState.snakes.values()) {
        if (snake.body.some((seg) => seg.x === newFoodPos.x && seg.y === newFoodPos.y)) {
          isValid = false;
          break;
        }
      }

      // Verifica se a posição colide com outra fruta
      if (this.gameState.food.some((f) => f.x === newFoodPos.x && f.y === newFoodPos.y)) {
        isValid = false;
      }
    } while (!isValid);

    // Adiciona a nova fruta ao array com tipo aleatório
    const fruitTypes: FruitType[] = ['apple', 'mango'];
    const randomType = fruitTypes[Math.floor(Math.random() * fruitTypes.length)];
    
    const fruit: Fruit = {
      x: newFoodPos.x,
      y: newFoodPos.y,
      type: randomType,
    };

    this.gameState.food.push(fruit);
  }

  /**
   * Inicia o game loop
   * Usa um tick rate menor (20ms) para permitir movimentos independentes por cobra
   */
  private startGameLoop(): void {
    if (this.gameLoopInterval) return;

    Logger.info(SCOPE, 'Game loop iniciado');
    // Usa um intervalo rápido (20ms) e verifica se cada cobra deve se mover
    this.gameLoopInterval = setInterval(() => {
      this.gameLoopTick();
    }, 20);
  }

  /**
   * Para o game loop
   */
  private stopGameLoop(): void {
    if (this.gameLoopInterval) {
      clearInterval(this.gameLoopInterval);
      this.gameLoopInterval = null;
      Logger.info(SCOPE, 'Game loop parado');
    }
  }

  /**
   * Finaliza o jogo
   */
  private finishGame(): void {
    Logger.info(SCOPE, 'Jogo finalizado');
    this.status = 'finished';
    this.stopGameLoop();
  }

  /**
   * Reseta o jogo para o estado inicial
   */
  private resetGame(): void {
    Logger.info(SCOPE, 'Resetando jogo');
    this.stopGameLoop();
    this.status = 'lobby';
    this.gameState.snakes.clear();
    this.gameState.food = [];
    // Gera comidas iniciais novamente
    for (let i = 0; i < GAME_CONFIG.INITIAL_FOOD_COUNT; i++) {
      this.spawnFood();
    }
  }

  /**
   * Obtém o estado do jogo formatado para enviar ao cliente
   */
  getGameState(): GameStateResponse {
    return {
      status: this.status,
      snakes: Array.from(this.gameState.snakes.entries()).map(([id, snake]) => ({
        id,
        body: snake.body,
        alive: snake.alive,
        score: snake.score,
        activeEffects: snake.activeEffects,
      })),
      food: this.gameState.food,
      gameWidth: this.gameState.gameWidth,
      gameHeight: this.gameState.gameHeight,
    };
  }

  /**
   * Obtém o status atual do jogo
   */
  getStatus(): GameStatus {
    return this.status;
  }
}
