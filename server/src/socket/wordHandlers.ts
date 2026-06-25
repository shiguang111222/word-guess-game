import type { Socket } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents } from '../types/socket.js';
import { getRoom, getConnectedPlayers } from '../services/roomManager.js';
import { transitionTo, checkAllWordsSubmitted, startGeneration } from '../services/gameEngine.js';
import { GamePhase } from '../types/game.js';

type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
type GameServer = any;

export function registerWordHandlers(socket: GameSocket, io: GameServer): void {
  socket.on('word:submit', (data: { roomCode: string; word: string }) => {
    const { roomCode, word } = data;
    const room = getRoom(roomCode);
    if (!room) return;

    if (room.phase !== GamePhase.WORD_SUBMISSION) {
      socket.emit('room:error', { message: '当前不是出词阶段', code: 'WRONG_PHASE' });
      return;
    }

    const trimmed = word?.trim();
    if (!trimmed) {
      socket.emit('room:error', { message: '请输入一个词', code: 'EMPTY_WORD' });
      return;
    }

    if (/\s/.test(trimmed)) {
      socket.emit('room:error', { message: '只能输入一个词（不要包含空格）', code: 'MULTI_WORD' });
      return;
    }

    if (trimmed.length > 20) {
      socket.emit('room:error', { message: '词语太长（最多20个字符）', code: 'WORD_TOO_LONG' });
      return;
    }

    const player = room.players.get(socket.id);
    if (!player) return;

    player.word = trimmed;
    room.submittedWords.set(socket.id, trimmed);

    socket.emit('game:word-ack', { accepted: true, word: trimmed });

    const connectedCount = getConnectedPlayers(room).length;
    const submittedCount = room.submittedWords.size;
    io.to(roomCode).emit('game:word-count', {
      submitted: submittedCount,
      total: connectedCount,
    });

    if (checkAllWordsSubmitted(room)) {
      if (room.timers.wordTimeout) {
        clearTimeout(room.timers.wordTimeout);
        room.timers.wordTimeout = undefined;
      }

      transitionTo(room, GamePhase.GENERATING, io);
      startGeneration(room, io);
    }
  });
}
