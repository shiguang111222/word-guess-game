import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import type { GameState, GameAction } from '../types/game';
import { GamePhase } from '../types/game';
import { gameReducer, initialState } from './gameReducer';
import socket from '../socket/socket';

interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  connect: () => void;
  createRoom: (playerName: string) => void;
  joinRoom: (roomCode: string, playerName: string) => void;
  startGame: () => void;
  submitWord: (word: string) => void;
  submitIdentityGuess: (targetPlayerId: string, guessedWord: string) => void;
  setTotalGames: (n: number) => void;
  playAgain: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameContextProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const connected = useRef(false);

  const connect = useCallback(() => {
    if (connected.current) return;
    socket.connect();
    connected.current = true;
  }, []);

  useEffect(() => {
    socket.on('room:created', ({ roomCode, playerId, isHost }) => {
      dispatch({ type: 'SET_ROOM_CODE', payload: roomCode });
      dispatch({ type: 'SET_PLAYER_ID', payload: playerId });
      dispatch({ type: 'SET_IS_HOST', payload: isHost });
    });

    socket.on('room:joined', ({ players }) => {
      dispatch({ type: 'SET_PLAYERS', payload: players });
    });

    socket.on('room:left', ({ players }) => {
      dispatch({ type: 'SET_PLAYERS', payload: players });
    });

    socket.on('room:error', ({ message }) => {
      alert(message);
    });

    socket.on('game:phase', ({ phase }) => {
      dispatch({ type: 'SET_PHASE', payload: phase });
    });

    socket.on('game:word-count', ({ submitted, total }) => {
      dispatch({ type: 'SET_WORD_COUNT', payload: { submitted, total } });
    });

    socket.on('game:generating', ({ stage }) => {
      dispatch({ type: 'SET_GENERATING_STAGE', payload: stage });
    });

    socket.on('game:story-ready', ({ story, storyLength }) => {
      dispatch({ type: 'SET_STORY', payload: { story, storyLength } });
    });

    socket.on('game:round-start', ({ round }) => {
      dispatch({ type: 'SET_ROUND', payload: { round } });
    });

    socket.on('game:round-progress', ({ submitted, total }) => {
      dispatch({ type: 'SET_ROUND_PROGRESS', payload: { submitted, total } });
    });

    socket.on('game:word-hint', ({ message }) => {
      dispatch({ type: 'SET_WORD_HINT', payload: message });
    });

    socket.on('game:round-end', ({ guesses, eliminated }) => {
      dispatch({ type: 'ADD_ROUND_GUESSES', payload: guesses });
      for (const e of eliminated) {
        dispatch({ type: 'ELIMINATE_PLAYER', payload: { playerId: e.playerId } });
      }
    });

    socket.on('game:guess', (guessEntry) => {
      dispatch({ type: 'ADD_GUESS', payload: guessEntry });
    });

    socket.on('game:eliminated', ({ playerId }) => {
      dispatch({ type: 'ELIMINATE_PLAYER', payload: { playerId } });
    });

    socket.on('game:game-over', (gameOverData) => {
      dispatch({ type: 'SET_CURRENT_GAME', payload: gameOverData.currentGame });
      dispatch({ type: 'SET_GAME_OVER', payload: gameOverData });
    });

    socket.on('game:reset', () => {
      dispatch({ type: 'RESET' });
    });

    return () => {
      socket.off('room:created');
      socket.off('room:joined');
      socket.off('room:left');
      socket.off('room:error');
      socket.off('game:phase');
      socket.off('game:word-count');
      socket.off('game:generating');
      socket.off('game:story-ready');
      socket.off('game:word-hint');
      socket.off('game:round-start');
      socket.off('game:round-progress');
      socket.off('game:round-end');
      socket.off('game:guess');
      socket.off('game:eliminated');
      socket.off('game:game-over');
      socket.off('game:reset');
    };
  }, []);

  const createRoom = useCallback((playerName: string) => {
    connect();
    socket.emit('room:create', { playerName });
  }, [connect]);

  const joinRoom = useCallback((roomCode: string, playerName: string) => {
    connect();
    socket.emit('room:join', { roomCode: roomCode.toUpperCase(), playerName });
  }, [connect]);

  const startGame = useCallback(() => {
    socket.emit('room:start', { roomCode: state.roomCode });
  }, [state.roomCode]);

  const submitWord = useCallback((word: string) => {
    socket.emit('word:submit', { roomCode: state.roomCode, word });
  }, [state.roomCode]);

  const submitIdentityGuess = useCallback((targetPlayerId: string, guessedWord: string) => {
    dispatch({ type: 'SET_MY_ROUND_SUBMITTED', payload: true });
    socket.emit('guess:identity', { roomCode: state.roomCode, targetPlayerId, guessedWord });
  }, [state.roomCode]);

  const setTotalGames = useCallback((n: number) => {
    const games = Math.max(1, Math.min(10, n));
    dispatch({ type: 'SET_TOTAL_GAMES', payload: games });
    socket.emit('room:settings', { roomCode: state.roomCode, totalGames: games });
  }, [state.roomCode]);

  const playAgain = useCallback(() => {
    socket.emit('play:again', { roomCode: state.roomCode });
  }, [state.roomCode]);

  return (
    <GameContext.Provider value={{
      state, dispatch, connect, createRoom, joinRoom,
      startGame, submitWord, submitIdentityGuess, setTotalGames, playAgain,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameContextProvider');
  return ctx;
}
