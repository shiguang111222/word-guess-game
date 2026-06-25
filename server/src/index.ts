import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { config } from './config.js';
import { registerSocketHandlers } from './socket/index.js';
import { startRoomCleanup } from './services/roomManager.js';
import type { ClientToServerEvents, ServerToClientEvents } from './types/socket.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// CORS: in production accept all origins (behind Railway proxy)
const corsOrigin = config.isProd ? '*' : config.clientOrigin;
app.use(cors({ origin: corsOrigin }));
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Serve built React app in production
if (config.isProd) {
  const clientDist = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  // SPA fallback: all non-API routes serve index.html
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

const httpServer = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST'],
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 120_000,
  },
  pingTimeout: 30_000,
  pingInterval: 10_000,
});

registerSocketHandlers(io);

const cleanupInterval = startRoomCleanup();

const port = process.env.PORT || config.port;
httpServer.listen(port, () => {
  console.log(`[Server] Game server running on port ${port}`);
  console.log(`[Server] Mode: ${config.isProd ? 'production' : 'development'}`);
});

process.on('SIGTERM', () => {
  console.log('[Server] Shutting down...');
  clearInterval(cleanupInterval);
  io.close();
  httpServer.close();
});
