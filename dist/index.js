"use strict";
/**
 * Servidor de Jogo Snake Multiplayer
 *
 * Arquivo principal - Entry point da aplicação
 *
 * Responsibilidades:
 * - Inicializar servidor HTTP
 * - Configurar Socket.IO
 * - Registrar handlers de eventos
 * - Iniciar servidor na porta especificada
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const GameService_1 = require("./services/GameService");
const socketHandlers_1 = require("./handlers/socketHandlers");
const constants_1 = require("./config/constants");
const logger_1 = require("./utils/logger");
const SCOPE = 'Server';
/**
 * Inicializa o servidor
 */
function initializeServer() {
    // Criar servidor HTTP
    const httpServer = http_1.default.createServer();
    // Configurar Socket.IO
    const io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: constants_1.SERVER_CONFIG.CORS_ORIGIN,
            credentials: true,
        },
    });
    // Instanciar serviço de jogo
    const gameService = new GameService_1.GameService();
    // Registrar handlers de eventos Socket.IO
    (0, socketHandlers_1.registerSocketHandlers)(io, gameService);
    // Registrar broadcasts periódicos
    (0, socketHandlers_1.registerBroadcasts)(io, gameService);
    // Iniciar servidor
    httpServer.listen(constants_1.SERVER_CONFIG.PORT, () => {
        logger_1.Logger.info(SCOPE, `✓ Servidor rodando em http://localhost:${constants_1.SERVER_CONFIG.PORT}`);
    });
}
// Iniciar servidor
initializeServer();
