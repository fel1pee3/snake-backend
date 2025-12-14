"use strict";
/**
 * Constantes do Jogo
 * Valores configuráveis do jogo
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SERVER_CONFIG = exports.GAME_CONFIG = void 0;
exports.GAME_CONFIG = {
    // Dimensões do mapa
    GAME_WIDTH: 100,
    GAME_HEIGHT: 60,
    // Posição inicial da comida
    INITIAL_FOOD_X: 50,
    INITIAL_FOOD_Y: 30,
    // Quantidade de comidas no mapa
    INITIAL_FOOD_COUNT: 48,
    // Velocidade do jogo (ms entre ticks)
    GAME_TICK_RATE: 100,
    // Pontos por comida
    FOOD_SCORE: 10,
    // Broadcast rates (ms)
    LOBBY_UPDATE_RATE: 500,
    GAME_STATE_UPDATE_RATE: 100,
};
exports.SERVER_CONFIG = {
    PORT: 5000,
    CORS_ORIGIN: 'http://localhost:3001',
};
