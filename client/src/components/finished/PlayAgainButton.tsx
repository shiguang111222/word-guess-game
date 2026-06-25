import React from 'react';
import { useGame } from '../../context/GameContext';

export default function PlayAgainButton() {
  const { playAgain, state } = useGame();

  if (!state.isHost) {
    return (
      <div className="play-again">
        <p>等待房主开始下一局...</p>
      </div>
    );
  }

  return (
    <div className="play-again">
      <button className="btn btn-primary btn-large" onClick={playAgain}>
        🔄 再来一局
      </button>
    </div>
  );
}
