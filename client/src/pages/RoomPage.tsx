import React from 'react';
import { useGame } from '../context/GameContext';
import { GamePhase } from '../types/game';
import RoomHeader from '../components/shared/RoomHeader';
import LobbyPhase from '../components/lobby/LobbyPhase';
import WordSubmitPhase from '../components/wordSubmission/WordSubmitPhase';
import GeneratingScreen from '../components/generating/GeneratingScreen';
import GuessingPhase from '../components/guessing/GuessingPhase';
import FinishedPhase from '../components/finished/FinishedPhase';

export default function RoomPage() {
  const { state } = useGame();

  const renderPhase = () => {
    switch (state.phase) {
      case GamePhase.LOBBY:
        return <LobbyPhase />;
      case GamePhase.WORD_SUBMISSION:
        return <WordSubmitPhase />;
      case GamePhase.GENERATING:
        return <GeneratingScreen />;
      case GamePhase.GUESSING:
        return <GuessingPhase />;
      case GamePhase.FINISHED:
        return <FinishedPhase />;
      default:
        return <LobbyPhase />;
    }
  };

  return (
    <div className="room-page">
      <RoomHeader />
      <main className="room-main">
        {renderPhase()}
      </main>
    </div>
  );
}
