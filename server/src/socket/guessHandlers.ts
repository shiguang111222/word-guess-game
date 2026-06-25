import type { Socket } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents } from '../types/socket.js';
import { getRoom, getConnectedPlayers } from '../services/roomManager.js';
import { submitRoundGuess, checkRoundComplete, processRoundEnd, getSurvivors } from '../services/gameEngine.js';
import { GamePhase } from '../types/game.js';
import { config } from '../config.js';

type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
type GameServer = any;

const lastGuessTime = new Map<string, number>();

/** Find which player owns a word (case-insensitive) */
function findWordOwner(room: ReturnType<typeof getRoom>, word: string): string | null {
  if (!room) return null;
  const w = word.trim().toLowerCase();
  for (const [playerId, submittedWord] of room.submittedWords) {
    if (submittedWord.toLowerCase() === w) return playerId;
  }
  return null;
}

export function registerGuessHandlers(socket: GameSocket, io: GameServer): void {
  socket.on('guess:identity', (data: { roomCode: string; targetPlayerId: string; guessedWord: string }) => {
    const { roomCode, targetPlayerId, guessedWord } = data;
    const room = getRoom(roomCode);
    if (!room) return;

    const guesserId = socket.id;

    if (room.phase !== GamePhase.GUESSING) {
      socket.emit('room:error', { message: '当前不是猜词阶段', code: 'WRONG_PHASE' });
      return;
    }

    if (room.eliminatedPlayers.has(guesserId)) {
      socket.emit('room:error', { message: '你已被淘汰，不能猜词', code: 'ELIMINATED' });
      return;
    }

    if (guesserId === targetPlayerId) {
      socket.emit('room:error', { message: '不能猜自己', code: 'SELF_TARGET' });
      return;
    }

    const target = room.players.get(targetPlayerId);
    if (!target || !target.isConnected || room.eliminatedPlayers.has(targetPlayerId)) {
      socket.emit('room:error', { message: '目标玩家不可用', code: 'INVALID_TARGET' });
      return;
    }

    const trimmed = guessedWord?.trim();
    if (!trimmed || trimmed.length > 20) {
      socket.emit('room:error', { message: '请输入有效的词语', code: 'INVALID_WORD' });
      return;
    }

    // Rate limit
    const now = Date.now();
    const last = lastGuessTime.get(guesserId) ?? 0;
    if (now - last < config.game.guessRateLimitMs) {
      socket.emit('room:error', { message: '提交太频繁，请稍等', code: 'RATE_LIMITED' });
      return;
    }
    lastGuessTime.set(guesserId, now);

    // Submit guess (stored privately until round ends)
    const result = submitRoundGuess(room, guesserId, targetPlayerId, trimmed);
    if ('error' in result) {
      socket.emit('room:error', { message: result.error, code: 'SUBMIT_FAILED' });
      return;
    }

    // If word is correct but person is wrong → private hint
    if (!result.correct) {
      const wordOwner = findWordOwner(room, trimmed);
      if (wordOwner && wordOwner !== targetPlayerId) {
        socket.emit('game:word-hint', {
          message: `"${trimmed}" 这个词是对的，但不是 ${target.name} 出的`,
        });
      }
    }

    // Notify this player their guess was accepted
    socket.emit('game:round-progress', {
      submitted: room.roundSubmitted.size,
      total: getSurvivors(room).length,
    });

    // Check if round complete
    if (checkRoundComplete(room)) {
      processRoundEnd(room, io);
    }
  });
}
