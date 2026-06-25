import type { Socket } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents } from '../types/socket.js';
import {
  createRoom, joinRoom, getRoom, getRoomPlayers,
  leaveRoom, handleDisconnect, findRoomBySocketId,
} from '../services/roomManager.js';
import {
  transitionTo, startWordTimer, resetToLobby,
} from '../services/gameEngine.js';
import { GamePhase } from '../types/game.js';

type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
type GameServer = any; // Socket.io Server type

export function registerRoomHandlers(socket: GameSocket, io: GameServer): void {
  const sid = socket.id;

  socket.on('room:create', (data: { playerName: string }) => {
    const { playerName } = data;
    const name = playerName?.trim();
    if (!name || name.length > 20) {
      socket.emit('room:error', { message: '请输入有效的昵称（最多20个字符）', code: 'INVALID_NAME' });
      return;
    }

    const room = createRoom(sid, name);
    socket.join(room.code);
    socket.emit('room:created', {
      roomCode: room.code,
      playerId: sid,
      isHost: true,
    });
    io.to(room.code).emit('room:joined', {
      playerId: sid,
      playerName: name,
      players: getRoomPlayers(room),
    });
  });

  socket.on('room:join', (data: { roomCode: string; playerName: string }) => {
    const { roomCode, playerName } = data;
    const name = playerName?.trim();
    const code = roomCode?.trim().toUpperCase();

    if (!name || name.length > 20) {
      socket.emit('room:error', { message: '请输入有效的昵称', code: 'INVALID_NAME' });
      return;
    }
    if (!code || code.length !== 6) {
      socket.emit('room:error', { message: '请输入6位房间码', code: 'INVALID_CODE' });
      return;
    }

    const result = joinRoom(sid, code, name);
    if ('error' in result) {
      socket.emit('room:error', { message: result.error, code: 'JOIN_FAILED' });
      return;
    }

    const { room, player } = result;
    socket.join(code);

    socket.emit('room:created', {
      roomCode: code,
      playerId: sid,
      isHost: player.isHost,
    });

    io.to(code).emit('room:joined', {
      playerId: sid,
      playerName: name,
      players: getRoomPlayers(room),
    });

    // Send current phase state for reconnecting players
    socket.emit('game:phase', { phase: room.phase });

    if (room.phase === GamePhase.GUESSING && room.story) {
      socket.emit('game:story-ready', {
        story: room.story,
        storyLength: room.story.length,
      });
      for (const g of room.guesses) {
        socket.emit('game:guess', g);
      }
    }
  });

  socket.on('room:leave', (data: { roomCode: string }) => {
    const { roomCode } = data;
    const room = getRoom(roomCode);
    if (!room) return;

    const player = leaveRoom(sid, roomCode);
    if (player) {
      socket.leave(roomCode);
      io.to(roomCode).emit('room:left', {
        playerId: sid,
        players: getRoomPlayers(room),
      });

      const connectedCount = [...room.players.values()].filter(p => p.isConnected).length;
      if (
        room.phase !== GamePhase.LOBBY &&
        room.phase !== GamePhase.FINISHED &&
        connectedCount < room.settings.minPlayers
      ) {
        io.to(roomCode).emit('room:error', {
          message: '玩家不足，游戏终止',
          code: 'NOT_ENOUGH_PLAYERS',
        });
        resetToLobby(room, io);
      }
    }
  });

  socket.on('room:settings', (data: { roomCode: string; totalGames: number }) => {
    const { roomCode, totalGames } = data;
    const room = getRoom(roomCode);
    if (!room) return;
    if (sid !== room.hostSocketId) return;
    const n = Math.max(1, Math.min(10, totalGames || 3));
    room.totalGames = n;
    room.currentGame = 1;
    // Reset all scores
    for (const p of room.players.values()) p.score = 0;
  });

  socket.on('room:start', (data: { roomCode: string }) => {
    const { roomCode } = data;
    const room = getRoom(roomCode);
    if (!room) return;
    if (sid !== room.hostSocketId) {
      socket.emit('room:error', { message: '只有房主可以开始游戏', code: 'NOT_HOST' });
      return;
    }

    const connectedCount = [...room.players.values()].filter(p => p.isConnected).length;
    if (connectedCount < room.settings.minPlayers) {
      socket.emit('room:error', {
        message: `至少需要 ${room.settings.minPlayers} 名玩家`,
        code: 'NOT_ENOUGH_PLAYERS',
      });
      return;
    }

    transitionTo(room, GamePhase.WORD_SUBMISSION, io);
    startWordTimer(room, io);

    io.to(roomCode).emit('game:word-count', {
      submitted: 0,
      total: connectedCount,
    });
  });

  socket.on('disconnect', () => {
    const found = findRoomBySocketId(sid);
    if (!found) return;

    const { code, room } = found;
    const { player, roomEmpty, shouldAbort } = handleDisconnect(sid, code);

    if (roomEmpty) return;

    io.to(code).emit('room:left', {
      playerId: sid,
      players: getRoomPlayers(room),
    });

    if (shouldAbort) {
      io.to(code).emit('room:error', {
        message: '玩家不足，游戏终止',
        code: 'NOT_ENOUGH_PLAYERS',
      });
      resetToLobby(room, io);
    }
  });
}
