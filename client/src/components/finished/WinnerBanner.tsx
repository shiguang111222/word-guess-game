import React from 'react';
import type { GameOverData } from '../../types/game';

interface WinnerBannerProps {
  gameOver: GameOverData;
  currentPlayerId: string;
}

export default function WinnerBanner({ gameOver, currentPlayerId }: WinnerBannerProps) {
  const isSurvivor = gameOver.survivors.some(s => s.playerId === currentPlayerId);

  if (gameOver.reason === 'last_survivor') {
    const winner = gameOver.survivors[0];
    return (
      <div className="winner-banner">
        <div className="winner-icon">🏆</div>
        <h2>{winner.playerId === currentPlayerId ? '🎉 你赢了！' : `${winner.playerName} 获胜！`}</h2>
        <p className="winner-desc">
          {gameOver.isFinalGame
            ? '全部局数结束！'
            : `第 ${gameOver.currentGame}/${gameOver.totalGames} 局结束，准备下一局...`}
        </p>
      </div>
    );
  }

  return (
    <div className="winner-banner">
      <div className="winner-icon">⏰</div>
      <h2>时间到！</h2>
      <p className="winner-desc">
        {gameOver.isFinalGame
          ? '全部局数结束！'
          : `第 ${gameOver.currentGame}/${gameOver.totalGames} 局结束`}
      </p>
      {isSurvivor && <p className="winner-survivor">🎉 你存活到了最后！+2分</p>}
    </div>
  );
}
