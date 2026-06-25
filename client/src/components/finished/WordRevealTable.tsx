import React from 'react';
import type { GameOverData } from '../../types/game';

interface WordRevealTableProps {
  reveals: GameOverData['playerWordReveals'];
}

export default function WordRevealTable({ reveals }: WordRevealTableProps) {
  return (
    <div className="word-reveal-table">
      <h3>📋 所有人出的词</h3>
      <table>
        <thead>
          <tr>
            <th>玩家</th>
            <th>出的词</th>
          </tr>
        </thead>
        <tbody>
          {reveals.map(r => (
            <tr key={r.playerId}>
              <td>{r.playerName}</td>
              <td className="reveal-word">{r.word}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
