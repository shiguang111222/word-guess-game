import type { GameState, GameAction } from '../types/game';
import { GamePhase } from '../types/game';

export const initialState: GameState = {
  playerId: '', roomCode: '', isHost: false, phase: GamePhase.LOBBY, players: [],
  story: '', storyLength: 0, guesses: [],
  wordCount: { submitted: 0, total: 0 }, generatingStage: 'story',
  currentRound: 0, roundSubmitted: 0, roundTotal: 0,
  myRoundSubmitted: false, wordHint: null,
  currentGame: 1, totalGames: 3,
  gameOver: null, error: null,
};

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_PLAYER_ID': return { ...state, playerId: action.payload };
    case 'SET_ROOM_CODE': return { ...state, roomCode: action.payload };
    case 'SET_IS_HOST': return { ...state, isHost: action.payload };
    case 'SET_PHASE': return { ...state, phase: action.payload, error: null };
    case 'SET_PLAYERS': return { ...state, players: action.payload };
    case 'SET_WORD_COUNT': return { ...state, wordCount: action.payload };
    case 'SET_GENERATING_STAGE': return { ...state, generatingStage: action.payload };
    case 'SET_STORY': return { ...state, story: action.payload.story, storyLength: action.payload.storyLength };
    case 'SET_ROUND':
      return { ...state, currentRound: action.payload.round, myRoundSubmitted: false, wordHint: null };
    case 'SET_ROUND_PROGRESS':
      return { ...state, roundSubmitted: action.payload.submitted, roundTotal: action.payload.total };
    case 'SET_MY_ROUND_SUBMITTED': return { ...state, myRoundSubmitted: action.payload };
    case 'ADD_ROUND_GUESSES': return { ...state, guesses: [...state.guesses, ...action.payload] };
    case 'ADD_GUESS': return { ...state, guesses: [...state.guesses, action.payload] };
    case 'SET_WORD_HINT': return { ...state, wordHint: action.payload };
    case 'ELIMINATE_PLAYER':
      return { ...state, players: state.players.map(p =>
        p.id === action.payload.playerId ? { ...p, isEliminated: true } : p) };
    case 'SET_GAME_OVER': return { ...state, gameOver: action.payload, phase: GamePhase.FINISHED };
    case 'SET_TOTAL_GAMES': return { ...state, totalGames: action.payload };
    case 'SET_CURRENT_GAME': return { ...state, currentGame: action.payload };
    case 'RESET':
      return { ...initialState, playerId: state.playerId, roomCode: state.roomCode, isHost: state.isHost,
        totalGames: state.totalGames,
        players: state.players.map(p => ({ ...p, hasSubmittedWord: false, isEliminated: false })) };
    default: return state;
  }
}
