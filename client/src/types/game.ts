export enum GamePhase {
  LOBBY = 'LOBBY', WORD_SUBMISSION = 'WORD_SUBMISSION',
  GENERATING = 'GENERATING', GUESSING = 'GUESSING', FINISHED = 'FINISHED',
}

export interface PlayerPublic {
  id: string; name: string; isHost: boolean;
  isConnected: boolean; isEliminated: boolean; hasSubmittedWord: boolean;
  score: number;
}

export interface GuessEntry {
  guesserId: string; guesserName: string;
  targetPlayerId: string; targetPlayerName: string;
  guessedWord: string;
  correct: boolean; targetEliminated: boolean;
  round: number; timestamp: number;
}

export interface ScoreEntry { playerId: string; playerName: string; score: number; }

export interface GameOverData {
  survivors: Array<{ playerId: string; playerName: string }>;
  playerWordReveals: Array<{ playerId: string; playerName: string; word: string }>;
  story: string; reason: 'last_survivor' | 'timeout';
  scores: ScoreEntry[];
  currentGame: number; totalGames: number; isFinalGame: boolean;
}

export interface RoundEndData {
  round: number; guesses: GuessEntry[];
  eliminated: Array<{ playerId: string; playerName: string; word: string }>;
}

export type GameAction =
  | { type: 'SET_PLAYER_ID'; payload: string }
  | { type: 'SET_ROOM_CODE'; payload: string }
  | { type: 'SET_IS_HOST'; payload: boolean }
  | { type: 'SET_PHASE'; payload: GamePhase }
  | { type: 'SET_PLAYERS'; payload: PlayerPublic[] }
  | { type: 'SET_WORD_COUNT'; payload: { submitted: number; total: number } }
  | { type: 'SET_GENERATING_STAGE'; payload: 'story' }
  | { type: 'SET_STORY'; payload: { story: string; storyLength: number } }
  | { type: 'SET_ROUND'; payload: { round: number } }
  | { type: 'SET_ROUND_PROGRESS'; payload: { submitted: number; total: number } }
  | { type: 'SET_MY_ROUND_SUBMITTED'; payload: boolean }
  | { type: 'ADD_ROUND_GUESSES'; payload: GuessEntry[] }
  | { type: 'ADD_GUESS'; payload: GuessEntry }
  | { type: 'ELIMINATE_PLAYER'; payload: { playerId: string } }
  | { type: 'SET_WORD_HINT'; payload: string | null }
  | { type: 'SET_GAME_OVER'; payload: GameOverData }
  | { type: 'SET_TOTAL_GAMES'; payload: number }
  | { type: 'SET_CURRENT_GAME'; payload: number }
  | { type: 'RESET' };

export interface GameState {
  playerId: string; roomCode: string; isHost: boolean;
  phase: GamePhase; players: PlayerPublic[];
  story: string; storyLength: number;
  guesses: GuessEntry[];
  wordCount: { submitted: number; total: number };
  generatingStage: 'story';
  currentRound: number; roundSubmitted: number; roundTotal: number;
  myRoundSubmitted: boolean; wordHint: string | null;
  currentGame: number; totalGames: number;
  gameOver: GameOverData | null;
  error: string | null;
}
