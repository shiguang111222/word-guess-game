import React from 'react';
import type { PlayerPublic } from '../../types/game';

interface SurvivorBoardProps {
  players: PlayerPublic[];
  currentPlayerId: string;
}

export default function SurvivorBoard({ players, currentPlayerId }: SurvivorBoardProps) {
  const alive = players.filter(p => p.isConnected && !p.isEliminated);
  const eliminated = players.filter(p => p.isEliminated);

  return (
    <div className="survivor-board">
      <h3>🟢 存活玩家 ({alive.length})</h3>
      <div className="survivor-list">
        {alive.map(p => (
          <div key={p.id} className={`survivor-card ${p.id === currentPlayerId ? 'self' : ''}`}>
            <span className="survivor-icon">😎</span>
            <span className="survivor-name">
              {p.name}{p.id === currentPlayerId ? ' (你)' : ''}
            </span>
          </div>
        ))}
      </div>

      {eliminated.length > 0 && (
        <>
          <h3 className="eliminated-header">💀 已淘汰 ({eliminated.length})</h3>
          <div className="survivor-list">
            {eliminated.map(p => (
              <div key={p.id} className="survivor-card eliminated">
                <span className="survivor-icon">💀</span>
                <span className="survivor-name">{p.name}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
