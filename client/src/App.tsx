import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useGame } from './context/GameContext';
import { GamePhase } from './types/game';
import HomePage from './pages/HomePage';
import RoomPage from './pages/RoomPage';

export default function App() {
  const { state } = useGame();

  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/room/:roomCode"
          element={state.roomCode ? <RoomPage /> : <Navigate to="/" />}
        />
      </Routes>
    </div>
  );
}
