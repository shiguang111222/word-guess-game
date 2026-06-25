import React from 'react';
import { useGame } from '../../context/GameContext';
import PlayerCard from './PlayerCard';

export default function PlayerList() {
  const { state } = useGame();

  return (
    <div className="player-list">
      <h3>玩家列表 ({state.players.filter(p => p.isConnected).length}/{state.players.length})</h3>
      <div className="player-grid">
        {state.players.map(player => (
          <PlayerCard
            key={player.id}
            player={player}
            isSelf={player.id === state.playerId}
          />
        ))}
        {/* Empty slots */}
        {Array.from({ length: Math.max(0, 6 - state.players.length) }).map((_, i) => (
          <div key={`empty-${i}`} className="player-card empty">
            <div className="player-avatar">?</div>
            <div className="player-info">
              <span className="player-name">等待加入...</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
