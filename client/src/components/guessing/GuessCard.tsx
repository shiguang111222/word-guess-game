import React from 'react';
import type { GuessEntry } from '../../types/game';

interface GuessCardProps {
  entry: GuessEntry;
  isSelf: boolean;
}

export default function GuessCard({ entry, isSelf }: GuessCardProps) {
  const time = new Date(entry.timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });

  return (
    <div className={`guess-card ${entry.correct ? 'correct' : 'wrong'} ${entry.targetEliminated ? 'eliminated' : ''}`}>
      {entry.correct ? (
        <span className="guess-card-icon">✅</span>
      ) : (
        <span className="guess-card-icon">❌</span>
      )}
      <div className="guess-card-content">
        <span className="guess-card-text">
          <strong>{entry.guesserName}{isSelf ? '(你)' : ''}</strong>
          {' 猜 '}
          <strong>{entry.targetPlayerName}</strong>
          {' 的词是 '}"{entry.guessedWord}"
        </span>
        {entry.targetEliminated && (
          <span className="guess-card-eliminated">💀 淘汰！</span>
        )}
        <span className="guess-card-meta">
          第{entry.round}轮 · {time}
        </span>
      </div>
    </div>
  );
}
