"use strict";
/**
 * Socket.IO Event Handlers
 *
 * Gerencia todos os eventos de conexão e comunicação com clientes
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSocketHandlers = registerSocketHandlers;
exports.registerBroadcasts = registerBroadcasts;
const logger_1 = require("../utils/logger");
const SCOPE = 'SocketHandlers';
/**
 * Registra todos os handlers de eventos Socket.IO
 */
function registerSocketHandlers(io, gameService) {
    io.on('connection', (socket) => {
        logger_1.Logger.info(SCOPE, `Cliente ${socket.id} conectado`);
        // Adiciona jogador ao serviço
        gameService.addPlayer(socket.id);
        socket.emit('lobbyUpdate', gameService.getLobbyStatus());
        io.emit('lobbyUpdate', gameService.getLobbyStatus());
        /**
         * Evento: startGame
         * Cliente solicita iniciar o jogo
         */
        socket.on('startGame', () => {
            logger_1.Logger.debug(SCOPE, `${socket.id} solicitou iniciar jogo`);
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
            logger_1.Logger.info(SCOPE, `Cliente ${socket.id} desconectado`);
            gameService.removePlayer(socket.id);
            io.emit('lobbyUpdate', gameService.getLobbyStatus());
            io.emit('gameState', gameService.getGameState());
        });
    });
}
/**
 * Registra broadcast de atualizações periódicas
 */
function registerBroadcasts(io, gameService) {
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
