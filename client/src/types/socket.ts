import type { PlayerPublic, GuessEntry, GameOverData, RoundEndData, GamePhase } from './game';

export interface ServerToClientEvents {
  'room:created': (data: { roomCode: string; playerId: string; isHost: boolean }) => void;
  'room:joined': (data: { playerId: string; playerName: string; players: PlayerPublic[] }) => void;
  'room:left': (data: { playerId: string; players: PlayerPublic[] }) => void;
  'room:error': (data: { message: string; code: string }) => void;
  'room:state': (data: { players: PlayerPublic[]; isHost: boolean; phase: GamePhase }) => void;
  'game:phase': (data: { phase: GamePhase; payload?: Record<string, unknown> }) => void;
  'game:word-ack': (data: { accepted: boolean; word: string }) => void;
  'game:word-count': (data: { submitted: number; total: number }) => void;
  'game:generating': (data: { stage: 'story' }) => void;
  'game:story-ready': (data: { story: string; storyLength: number }) => void;
  'game:round-start': (data: { round: number }) => void;
  'game:round-progress': (data: { submitted: number; total: number }) => void;
  'game:round-end': (data: RoundEndData) => void;
  'game:word-hint': (data: { message: string }) => void;
  'game:guess': (data: GuessEntry) => void;
  'game:eliminated': (data: { playerId: string; playerName: string; guesserId: string; guesserName: string; word: string }) => void;
  'game:game-over': (data: GameOverData) => void;
  'game:reset': (data: Record<string, never>) => void;
}

export interface ClientToServerEvents {
  'room:create': (data: { playerName: string }) => void;
  'room:join': (data: { roomCode: string; playerName: string }) => void;
  'room:leave': (data: { roomCode: string }) => void;
  'room:start': (data: { roomCode: string }) => void;
  'room:settings': (data: { roomCode: string; totalGames: number }) => void;
  'word:submit': (data: { roomCode: string; word: string }) => void;
  'guess:identity': (data: { roomCode: string; targetPlayerId: string; guessedWord: string }) => void;
  'play:again': (data: { roomCode: string }) => void;
}
