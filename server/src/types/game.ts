export enum GamePhase {
  LOBBY = 'LOBBY',
  WORD_SUBMISSION = 'WORD_SUBMISSION',
  GENERATING = 'GENERATING',
  GUESSING = 'GUESSING',
  FINISHED = 'FINISHED',
}

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isConnected: boolean;
  isEliminated: boolean;
  word?: string;
  score: number;
  joinedAt: number;
}

export interface GuessEntry {
  guesserId: string;
  guesserName: string;
  targetPlayerId: string;
  targetPlayerName: string;
  guessedWord: string;
  correct: boolean;
  targetEliminated: boolean;
  round: number;
  timestamp: number;
}

export interface ScoreEntry {
  playerId: string;
  playerName: string;
  score: number;
}

export interface GameOverData {
  survivors: Array<{ playerId: string; playerName: string }>;
  playerWordReveals: Array<{ playerId: string; playerName: string; word: string }>;
  story: string;
  reason: 'last_survivor' | 'timeout';
  scores: ScoreEntry[];
  currentGame: number;
  totalGames: number;
  isFinalGame: boolean;
}

export interface RoomState {
  code: string;
  phase: GamePhase;
  players: Map<string, Player>;
  hostSocketId: string;
  submittedWords: Map<string, string>;
  story: string;
  guesses: GuessEntry[];
  eliminatedPlayers: Set<string>;
  currentRound: number;
  roundSubmitted: Set<string>;
  pendingRoundGuesses: GuessEntry[];
  currentGame: number;        // which game (1-based)
  totalGames: number;         // total games to play
  createdAt: number;
  phaseStartedAt: number;
  settings: {
    maxPlayers: number;
    minPlayers: number;
    wordTimeoutMs: number;
    guessTimeoutMs: number;
  };
  timers: {
    wordTimeout?: ReturnType<typeof setTimeout>;
    guessTimeout?: ReturnType<typeof setTimeout>;
    generatingTimeout?: ReturnType<typeof setTimeout>;
    disconnectGrace?: Map<string, ReturnType<typeof setTimeout>>;
  };
}

export interface PlayerPublic {
  id: string;
  name: string;
  isHost: boolean;
  isConnected: boolean;
  isEliminated: boolean;
  hasSubmittedWord: boolean;
  score: number;
}
