import React from 'react';
import type { PlayerPublic } from '../../types/game';

export default function PlayerCard({ player, isSelf }: { player: PlayerPublic; isSelf: boolean }) {
  return (
    <div className={`player-card ${!player.isConnected ? 'disconnected' : ''} ${isSelf ? 'self' : ''}`}>
      <div className="player-avatar">
        {player.name.charAt(0).toUpperCase()}
      </div>
      <div className="player-info">
        <span className="player-name">
          {player.name} {isSelf && '(你)'}
        </span>
        <span className="player-badges">
          {player.isHost && <span className="badge badge-host">👑 房主</span>}
          {!player.isConnected && <span className="badge badge-offline">🔴 已断开</span>}
          {player.score > 0 && <span className="badge badge-score">⭐ {player.score}分</span>}
        </span>
      </div>
    </div>
  );
}
