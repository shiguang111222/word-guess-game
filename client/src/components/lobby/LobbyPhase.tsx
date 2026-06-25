import React from 'react';
import { useGame } from '../../context/GameContext';
import PlayerList from './PlayerList';

export default function LobbyPhase() {
  const { state, startGame, setTotalGames } = useGame();
  const connectedCount = state.players.filter(p => p.isConnected).length;
  const canStart = connectedCount >= 3 && state.isHost;

  return (
    <div className="phase lobby-phase">
      <div className="phase-header">
        <h2>🕐 等待玩家加入</h2>
        <p>分享房间码或链接给你的朋友们（3-6人）</p>
      </div>

      <PlayerList />

      {state.isHost && (
        <div className="lobby-settings">
          <label className="setting-label">
            📋 总局数：
            <select
              className="setting-select"
              value={state.totalGames}
              onChange={e => setTotalGames(parseInt(e.target.value))}
            >
              {[1,2,3,4,5,6,7,8,9,10].map(n => (
                <option key={n} value={n}>{n} 局</option>
              ))}
            </select>
          </label>
        </div>
      )}

      {state.isHost && (
        <div className="lobby-actions">
          <button
            className="btn btn-primary btn-large"
            disabled={!canStart}
            onClick={startGame}
          >
            {canStart
              ? `🎮 开始游戏 (${connectedCount}人 · ${state.totalGames}局)`
              : `⏳ 至少需要3人 (当前${connectedCount}人)`}
          </button>
        </div>
      )}

      {!state.isHost && (
        <p className="lobby-waiting">等待房主开始游戏...（{state.totalGames}局）</p>
      )}
    </div>
  );
}
