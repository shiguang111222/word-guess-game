import React, { useRef, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import GuessCard from './GuessCard';

export default function GuessFeed() {
  const { state } = useGame();
  const feedEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.guesses.length]);

  return (
    <div className="guess-feed">
      <h3>💬 猜测记录</h3>
      <div className="guess-list">
        {state.guesses.length === 0 && (
          <p className="guess-empty">还没有人猜词，来做第一个侦探！</p>
        )}
        {state.guesses.map((g, i) => (
          <GuessCard
            key={`${g.guesserId}-${g.targetPlayerId}-${g.timestamp}-${i}`}
            entry={g}
            isSelf={g.guesserId === state.playerId}
          />
        ))}
        <div ref={feedEndRef} />
      </div>
    </div>
  );
}
