import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';

export default function WordInput() {
  const { submitWord, state } = useGame();
  const [word, setWord] = useState('');
  const [error, setError] = useState('');
  const player = state.players.find(p => p.id === state.playerId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = word.trim();

    if (!trimmed) {
      setError('请输入一个词');
      return;
    }
    if (/\s/.test(trimmed)) {
      setError('只能输入一个词（不要包含空格）');
      return;
    }
    if (trimmed.length > 20) {
      setError('词语太长（最多20个字符）');
      return;
    }

    submitWord(trimmed);
    setError('');
  };

  if (!player?.isConnected) return null;

  return (
    <form className="word-input-form" onSubmit={handleSubmit}>
      <div className="word-input-group">
        <input
          type="text"
          className="word-input"
          placeholder="输入一个词..."
          value={word}
          onChange={e => { setWord(e.target.value); setError(''); }}
          maxLength={20}
          autoFocus
        />
        <button type="submit" className="btn btn-primary">
          提交 →
        </button>
      </div>
      {error && <div className="form-error">{error}</div>}
      <p className="word-hint">💡 发挥创意！AI 会负责把这堆词串成有趣的话</p>
    </form>
  );
}
