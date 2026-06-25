import type { Server, Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '../types/socket.js';
import { registerRoomHandlers } from './roomHandlers.js';
import { registerWordHandlers } from './wordHandlers.js';
import { registerGuessHandlers } from './guessHandlers.js';
import { getRoom, getRoomPlayers } from '../services/roomManager.js';

type GameServer = Server<ClientToServerEvents, ServerToClientEvents>;
type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

export function registerSocketHandlers(io: GameServer): void {
  io.on('connection', (socket: GameSocket) => {
    console.log(`[Socket] Player connected: ${socket.id}`);

    registerRoomHandlers(socket, io);
    registerWordHandlers(socket, io);
    registerGuessHandlers(socket, io);

    socket.on('play:again', (data: { roomCode: string }) => {
      const { roomCode } = data;
      const room = getRoom(roomCode);
      if (!room) return;

      if (socket.id !== room.hostSocketId) {
        socket.emit('room:error', { message: '只有房主可以重新开始', code: 'NOT_HOST' });
        return;
      }

      import('../services/gameEngine.js').then(({ resetToLobby }) => {
        resetToLobby(room, io);
        io.to(roomCode).emit('room:joined', {
          playerId: socket.id,
          playerName: room.players.get(socket.id)?.name ?? '',
          players: getRoomPlayers(room),
        });
      });
    });
  });
}
