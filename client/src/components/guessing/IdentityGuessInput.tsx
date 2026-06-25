import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';

export default function IdentityGuessInput() {
  const { state, submitIdentityGuess } = useGame();
  const [targetId, setTargetId] = useState('');
  const [word, setWord] = useState('');
  const [error, setError] = useState('');

  const isEliminated = state.players.find(p => p.id === state.playerId)?.isEliminated;
  const alivePlayers = state.players.filter(
    p => p.isConnected && !p.isEliminated && p.id !== state.playerId
  );

  if (isEliminated) {
    return (
      <div className="eliminated-notice">
        💀 你已被淘汰，只能观战
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetId) { setError('请选择目标玩家'); return; }
    if (!word.trim()) { setError('请输入你猜测的词'); return; }
    submitIdentityGuess(targetId, word.trim());
    setWord('');
    setError('');
  };

  return (
    <div>
      {/* Private hint: word is correct but belongs to someone else */}
      {state.wordHint && (
        <div className="word-hint">
          💡 {state.wordHint}
        </div>
      )}

      {state.myRoundSubmitted ? (
        <div className="waiting-notice">
          ✅ 本轮已提交，等待其他玩家...
          <span className="round-progress">
            ({state.roundSubmitted}/{state.roundTotal})
          </span>
        </div>
      ) : (
        <form className="identity-guess-form" onSubmit={handleSubmit}>
          <div className="identity-guess-row">
            <span className="identity-prefix">我猜</span>
            <select
              className="target-select"
              value={targetId}
              onChange={e => { setTargetId(e.target.value); setError(''); }}
            >
              <option value="">选择玩家</option>
              {alivePlayers.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <span className="identity-infix">的词是</span>
            <input
              type="text"
              className="word-guess-input"
              placeholder="输入词语..."
              value={word}
              onChange={e => { setWord(e.target.value); setError(''); }}
              maxLength={20}
            />
            <button type="submit" className="btn btn-primary">提交</button>
          </div>
          {error && <div className="form-error">{error}</div>}
        </form>
      )}
    </div>
  );
}
