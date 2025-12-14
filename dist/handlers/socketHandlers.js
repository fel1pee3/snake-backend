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
        const currentStatus = gameService.getStatus();
        const playerCount = gameService.getConnectedPlayersCount();
        logger_1.Logger.debug(SCOPE, `Jogadores: ${playerCount}, Status: ${currentStatus}`);
        // Se é o primeiro jogador E jogo não está rodando, inicia automaticamente
        if (playerCount === 1 && currentStatus !== 'playing') {
            logger_1.Logger.info(SCOPE, `Iniciando jogo automaticamente para o primeiro jogador`);
            const started = gameService.startGame();
            logger_1.Logger.debug(SCOPE, `startGame() retornou: ${started}`);
        }
        else if (currentStatus === 'playing') {
            // Se o jogo já está em andamento, cria uma cobra para o novo jogador
            logger_1.Logger.debug(SCOPE, `Jogo em andamento, adicionando cobra para ${socket.id}`);
            gameService.addPlayerDuringGame(socket.id);
        }
        // Envia estado atual imediatamente para sincronizar
        const finalGameState = gameService.getGameState();
        logger_1.Logger.debug(SCOPE, `Enviando gameState com status: ${finalGameState.status}`);
        socket.emit('lobbyUpdate', gameService.getLobbyStatus());
        socket.emit('gameState', finalGameState);
        // Notifica todos sobre a nova conexão
        io.emit('lobbyUpdate', gameService.getLobbyStatus());
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
    // Atualiza estado do jogo a cada 50ms (sempre, tanto lobby quanto playing)
    setInterval(() => {
        io.emit('gameState', gameService.getGameState());
    }, 50);
}
