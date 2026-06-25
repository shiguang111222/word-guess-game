import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { config } from './config.js';
import { registerSocketHandlers } from './socket/index.js';
import { startRoomCleanup } from './services/roomManager.js';
import type { ClientToServerEvents, ServerToClientEvents } from './types/socket.js';

const app = express();
app.use(cors({ origin: config.clientOrigin }));
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

const httpServer = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: config.clientOrigin,
    methods: ['GET', 'POST'],
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 120_000, // 2 min recovery window
  },
  pingTimeout: 30_000,
  pingInterval: 10_000,
});

registerSocketHandlers(io);

// Start inactive room cleanup
const cleanupInterval = startRoomCleanup();

httpServer.listen(config.port, () => {
  console.log(`[Server] Game server running on http://localhost:${config.port}`);
  console.log(`[Server] Allowed client origin: ${config.clientOrigin}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Server] Shutting down...');
  clearInterval(cleanupInterval);
  io.close();
  httpServer.close();
});
