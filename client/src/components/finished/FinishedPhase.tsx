import React from 'react';
import { useGame } from '../../context/GameContext';
import WinnerBanner from './WinnerBanner';
import StoryReveal from './StoryReveal';
import WordRevealTable from './WordRevealTable';
import PlayAgainButton from './PlayAgainButton';

export default function FinishedPhase() {
  const { state } = useGame();

  if (!state.gameOver) {
    return <div className="phase finished-phase"><p>加载中...</p></div>;
  }

  const { gameOver } = state;

  return (
    <div className="phase finished-phase">
      <WinnerBanner gameOver={gameOver} currentPlayerId={state.playerId} />

      {/* Leaderboard */}
      <div className="leaderboard">
        <h3>🏅 积分排行榜</h3>
        <table>
          <thead>
            <tr><th>排名</th><th>玩家</th><th>分数</th></tr>
          </thead>
          <tbody>
            {gameOver.scores.map((s, i) => (
              <tr key={s.playerId} className={s.playerId === state.playerId ? 'self-row' : ''}>
                <td className="rank-cell">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                </td>
                <td>{s.playerName}{s.playerId === state.playerId ? ' (你)' : ''}</td>
                <td className="score-cell">{s.score} 分</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="score-note">猜对词 +1分 · 存活到最后 +2分</p>
      </div>

      <StoryReveal story={gameOver.story} />

      <WordRevealTable reveals={gameOver.playerWordReveals} />

      <PlayAgainButton />
    </div>
  );
}
