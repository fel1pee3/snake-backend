/**
 * Socket.IO Event Handlers
 *
 * Gerencia todos os eventos de conexão e comunicação com clientes
 */

import { Socket, Server } from 'socket.io';
import { GameService } from '../services/GameService';
import { Logger } from '../utils/logger';

const SCOPE = 'SocketHandlers';

/**
 * Registra todos os handlers de eventos Socket.IO
 */
export function registerSocketHandlers(io: Server, gameService: GameService): void {
  io.on('connection', (socket: Socket) => {
    Logger.info(SCOPE, `Cliente ${socket.id} conectado`);

    // Adiciona jogador ao serviço
    gameService.addPlayer(socket.id);
    socket.emit('lobbyUpdate', gameService.getLobbyStatus());
    io.emit('lobbyUpdate', gameService.getLobbyStatus());

    /**
     * Evento: startGame
     * Cliente solicita iniciar o jogo
     */
    socket.on('startGame', () => {
      Logger.debug(SCOPE, `${socket.id} solicitou iniciar jogo`);
      const success = gameService.startGame();

      if (success) {
        io.emit('gameState', gameService.getGameState());
        io.emit('gameStarted');
      }
    });

    /**
     * Evento: move
     * Cliente envia movimento da cobra
     */
    socket.on('move', (data) => {
      if (data?.direction && gameService.getStatus() === 'playing') {
        gameService.moveSnake(socket.id, data.direction);
      }
    });

    /**
     * Evento: disconnect
     * Cliente desconectado
     */
    socket.on('disconnect', () => {
      Logger.info(SCOPE, `Cliente ${socket.id} desconectado`);
      gameService.removePlayer(socket.id);
      io.emit('lobbyUpdate', gameService.getLobbyStatus());
      io.emit('gameState', gameService.getGameState());
    });
  });
}

/**
 * Registra broadcast de atualizações periódicas
 */
export function registerBroadcasts(io: Server, gameService: GameService): void {
  // Atualiza lobby a cada 500ms
  setInterval(() => {
    io.emit('lobbyUpdate', gameService.getLobbyStatus());
  }, 500);

  // Atualiza estado do jogo a cada 50ms
  setInterval(() => {
    if (gameService.getStatus() === 'playing') {
      io.emit('gameState', gameService.getGameState());
    }
  }, 50);
}
