import { config } from '../config.js';
import { GamePhase } from '../types/game.js';
import type { RoomState, GameOverData } from '../types/game.js';
import { clearRoomTimers, resetRoom, getConnectedPlayers } from './roomManager.js';
import type { Server } from 'socket.io';
import type { ServerToClientEvents } from '../types/socket.js';

type GameIO = Server<any, ServerToClientEvents>;

export type TransitionResult = { success: true } | { success: false; error: string };

export function canTransition(room: RoomState, to: GamePhase): boolean {
  const validTransitions: Record<GamePhase, GamePhase[]> = {
    [GamePhase.LOBBY]: [GamePhase.WORD_SUBMISSION],
    [GamePhase.WORD_SUBMISSION]: [GamePhase.GENERATING, GamePhase.LOBBY],
    [GamePhase.GENERATING]: [GamePhase.GUESSING, GamePhase.LOBBY],
    [GamePhase.GUESSING]: [GamePhase.FINISHED, GamePhase.LOBBY],
    [GamePhase.FINISHED]: [GamePhase.LOBBY],
  };
  return validTransitions[room.phase]?.includes(to) ?? false;
}

export function transitionTo(room: RoomState, to: GamePhase, io: GameIO): TransitionResult {
  if (!canTransition(room, to)) {
    return { success: false, error: `无法从 ${room.phase} 切换到 ${to}` };
  }
  clearRoomTimers(room);
  room.timers = { disconnectGrace: room.timers.disconnectGrace ?? new Map() };
  room.phase = to;
  room.phaseStartedAt = Date.now();
  io.to(room.code).emit('game:phase', { phase: to });
  return { success: true };
}

export function startWordTimer(room: RoomState, io: GameIO): void {
  room.timers.wordTimeout = setTimeout(() => {
    if (room.phase === GamePhase.WORD_SUBMISSION) {
      transitionTo(room, GamePhase.GENERATING, io);
      startGeneration(room, io);
    }
  }, room.settings.wordTimeoutMs);
}

export function startGuessTimer(room: RoomState, io: GameIO): void {
  room.timers.guessTimeout = setTimeout(() => {
    if (room.phase === GamePhase.GUESSING) {
      const survivors = getSurvivors(room);
      for (const s of survivors) s.score += 2;

      const scores = getScores(room);
      const isFinal = room.currentGame >= room.totalGames;

      io.to(room.code).emit('game:game-over', {
        survivors: survivors.map(p => ({ playerId: p.id, playerName: p.name })),
        playerWordReveals: buildWordReveals(room),
        story: room.story,
        reason: 'timeout',
        scores,
        currentGame: room.currentGame,
        totalGames: room.totalGames,
        isFinalGame: isFinal,
      });

      if (isFinal) {
        transitionTo(room, GamePhase.FINISHED, io);
      } else {
        startNextGame(room, io);
      }
    }
  }, room.settings.guessTimeoutMs);
}

export async function startGeneration(room: RoomState, io: GameIO): Promise<void> {
  const { generateStory } = await import('./aiService.js');

  const words: string[] = [];
  for (const player of room.players.values()) {
    if (player.word) words.push(player.word);
  }

  if (words.length === 0) {
    io.to(room.code).emit('room:error', { message: '没有人提交词语', code: 'NO_WORDS' });
    transitionTo(room, GamePhase.LOBBY, io);
    return;
  }

  try {
    io.to(room.code).emit('game:generating', { stage: 'story' });

    const generationTimeout = new Promise<string>((_, reject) => {
      room.timers.generatingTimeout = setTimeout(
        () => reject(new Error('故事生成超时')),
        config.game.generatingTimeoutMs
      );
    });

    const story = await Promise.race([generateStory(words), generationTimeout]);
    if (room.timers.generatingTimeout) clearTimeout(room.timers.generatingTimeout);

    room.story = story;
    room.eliminatedPlayers = new Set();

    // Reset all players' elimination status
    for (const p of room.players.values()) {
      p.isEliminated = false;
    }

    transitionTo(room, GamePhase.GUESSING, io);
    io.to(room.code).emit('game:story-ready', {
      story,
      storyLength: story.length,
    });
    startNewRound(room, io);
    startGuessTimer(room, io);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI 生成失败';
    io.to(room.code).emit('room:error', { message, code: 'AI_FAILED' });
    transitionTo(room, GamePhase.LOBBY, io);
  }
}

// ---- Round Management ----

export function startNewRound(room: RoomState, io: GameIO): void {
  room.currentRound++;
  room.roundSubmitted = new Set();
  room.pendingRoundGuesses = [];
  io.to(room.code).emit('game:round-start', { round: room.currentRound });
  io.to(room.code).emit('game:round-progress', {
    submitted: 0,
    total: getSurvivors(room).length,
  });
}

export function submitRoundGuess(
  room: RoomState,
  guesserId: string,
  targetPlayerId: string,
  guessedWord: string
): { correct: boolean; eliminated: boolean } | { error: string } {
  // Already submitted this round?
  if (room.roundSubmitted.has(guesserId)) {
    return { error: '本轮已提交过猜测' };
  }

  const guesser = room.players.get(guesserId);
  const target = room.players.get(targetPlayerId);
  if (!guesser || !target) return { error: '玩家不存在' };

  const actualWord = room.submittedWords.get(targetPlayerId);
  if (!actualWord) return { error: '目标玩家没有提交过词' };

  const isCorrect = guessedWord.trim().toLowerCase() === actualWord.trim().toLowerCase();

  const entry: import('../types/game.js').GuessEntry = {
    guesserId,
    guesserName: guesser.name,
    targetPlayerId,
    targetPlayerName: target.name,
    guessedWord: guessedWord.trim(),
    correct: isCorrect,
    targetEliminated: false, // determined at round end
    round: room.currentRound,
    timestamp: Date.now(),
  };

  room.pendingRoundGuesses.push(entry);
  room.roundSubmitted.add(guesserId);

  return { correct: isCorrect, eliminated: false };
}

export function checkRoundComplete(room: RoomState): boolean {
  const survivors = getSurvivors(room);
  return survivors.every(p => room.roundSubmitted.has(p.id));
}

export function processRoundEnd(room: RoomState, io: GameIO): void {
  const eliminated: Array<{ playerId: string; playerName: string; word: string }> = [];

  // Process all pending guesses
  for (const entry of room.pendingRoundGuesses) {
    if (entry.correct && !room.eliminatedPlayers.has(entry.targetPlayerId)) {
      const player = room.players.get(entry.targetPlayerId);
      if (player) player.isEliminated = true;
      room.eliminatedPlayers.add(entry.targetPlayerId);
      entry.targetEliminated = true;

      // Score: +1 for correct guess
      const guesser = room.players.get(entry.guesserId);
      if (guesser) guesser.score += 1;

      eliminated.push({
        playerId: entry.targetPlayerId,
        playerName: entry.targetPlayerName,
        word: room.submittedWords.get(entry.targetPlayerId) ?? '',
      });

      io.to(room.code).emit('game:eliminated', {
        playerId: entry.targetPlayerId,
        playerName: entry.targetPlayerName,
        guesserId: entry.guesserId,
        guesserName: entry.guesserName,
        word: room.submittedWords.get(entry.targetPlayerId) ?? '',
      });
    }
  }

  // Move pending guesses to history
  room.guesses.push(...room.pendingRoundGuesses);

  // Broadcast round end with all guesses
  io.to(room.code).emit('game:round-end', {
    round: room.currentRound,
    guesses: room.pendingRoundGuesses,
    eliminated,
  });

  // Check game over
  if (checkGameOver(room) === 'last_survivor') {
    if (room.timers.guessTimeout) {
      clearTimeout(room.timers.guessTimeout);
      room.timers.guessTimeout = undefined;
    }

    // Score: +2 for survivors
    const survivors = getSurvivors(room);
    for (const s of survivors) {
      s.score += 2;
    }

    const scores = getScores(room);
    const isFinal = room.currentGame >= room.totalGames;

    io.to(room.code).emit('game:game-over', {
      survivors: survivors.map(p => ({ playerId: p.id, playerName: p.name })),
      playerWordReveals: buildWordReveals(room),
      story: room.story,
      reason: 'last_survivor',
      scores,
      currentGame: room.currentGame,
      totalGames: room.totalGames,
      isFinalGame: isFinal,
    });

    if (isFinal) {
      transitionTo(room, GamePhase.FINISHED, io);
    } else {
      // More games to play → start next
      startNextGame(room, io);
    }
  } else {
    // Start next guessing round
    startNewRound(room, io);
  }
}

export function startNextGame(room: RoomState, io: GameIO): void {
  room.currentGame++;
  room.story = '';
  room.guesses = [];
  room.eliminatedPlayers = new Set();
  room.currentRound = 0;
  room.roundSubmitted = new Set();
  room.pendingRoundGuesses = [];
  room.submittedWords = new Map();

  for (const p of room.players.values()) {
    p.word = undefined;
    p.isEliminated = false;
  }

  transitionTo(room, GamePhase.WORD_SUBMISSION, io);
  io.to(room.code).emit('game:word-count', {
    submitted: 0,
    total: getConnectedPlayers(room).length,
  });
  startWordTimer(room, io);
}

export function getScores(room: RoomState): import('../types/game.js').ScoreEntry[] {
  return [...room.players.values()]
    .map(p => ({ playerId: p.id, playerName: p.name, score: p.score }))
    .sort((a, b) => b.score - a.score);
}

export function checkGameOver(room: RoomState): 'last_survivor' | 'continue' {
  const survivors = getSurvivors(room);
  return survivors.length <= 1 ? 'last_survivor' : 'continue';
}

export function getSurvivors(room: RoomState) {
  return [...room.players.values()].filter(p => p.isConnected && !p.isEliminated);
}

export function buildWordReveals(room: RoomState) {
  return [...room.submittedWords.entries()].map(([playerId, word]) => {
    const player = room.players.get(playerId);
    return {
      playerId,
      playerName: player?.name ?? 'Unknown',
      word,
    };
  });
}

export function checkAllWordsSubmitted(room: RoomState): boolean {
  const connected = getConnectedPlayers(room);
  const allSubmitted = connected.every(p => room.submittedWords.has(p.id));
  return allSubmitted && connected.length >= room.settings.minPlayers;
}

export function resetToLobby(room: RoomState, io: GameIO): void {
  resetRoom(room);
  io.to(room.code).emit('game:reset', {});
  io.to(room.code).emit('game:phase', { phase: GamePhase.LOBBY });
}
