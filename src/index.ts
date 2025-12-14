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

import http from 'http';
import { Server } from 'socket.io';
import { GameService } from './services/GameService';
import { registerSocketHandlers, registerBroadcasts } from './handlers/socketHandlers';
import { SERVER_CONFIG } from './config/constants';
import { Logger } from './utils/logger';

const SCOPE = 'Server';

/**
 * Inicializa o servidor
 */
function initializeServer(): void {
  // Criar servidor HTTP
  const httpServer = http.createServer();

  // Configurar Socket.IO
  const io = new Server(httpServer, {
    cors: {
      origin: SERVER_CONFIG.CORS_ORIGIN,
      credentials: true,
    },
  });

  // Instanciar serviço de jogo
  const gameService = new GameService();

  // Registrar handlers de eventos Socket.IO
  registerSocketHandlers(io, gameService);

  // Registrar broadcasts periódicos
  registerBroadcasts(io, gameService);

  // Iniciar servidor
  httpServer.listen(SERVER_CONFIG.PORT, () => {
    Logger.info(SCOPE, `✓ Servidor rodando em http://localhost:${SERVER_CONFIG.PORT}`);
  });
}

// Iniciar servidor
initializeServer();
