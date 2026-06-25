import React from 'react';
import { useGame } from '../../context/GameContext';
import WordInput from './WordInput';
import SubmissionProgress from './SubmissionProgress';

export default function WordSubmitPhase() {
  const { state } = useGame();
  const hasSubmitted = state.players.find(p => p.id === state.playerId)?.hasSubmittedWord;

  return (
    <div className="phase word-submit-phase">
      <div className="phase-header">
        <h2>✍️ 每人出一个词</h2>
        <p>输入一个词，AI 会把所有人的词组合成一句话</p>
      </div>

      <SubmissionProgress
        submitted={state.wordCount.submitted}
        total={state.wordCount.total}
      />

      {!hasSubmitted && <WordInput />}

      {hasSubmitted && (
        <div className="word-submitted-check">
          ✅ 已提交，等待其他玩家...
        </div>
      )}

      <div className="player-word-status">
        <h4>玩家状态</h4>
        {state.players.map(player => (
          <div key={player.id} className={`word-status-item ${player.hasSubmittedWord ? 'done' : 'waiting'}`}>
            <span className="status-dot">{player.hasSubmittedWord ? '✅' : '⏳'}</span>
            <span>{player.name}{player.id === state.playerId ? ' (你)' : ''}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
