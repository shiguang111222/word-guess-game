import React from 'react';

export default function GeneratingScreen() {
  return (
    <div className="phase generating-phase">
      <div className="generating-content">
        <div className="generating-icon">📖</div>
        <h2>AI 正在创作故事...</h2>
        <p className="generating-desc">将每个人的词自然融入一段短故事</p>
        <div className="generating-dots">
          <span className="dot" />
          <span className="dot" />
          <span className="dot" />
        </div>
      </div>
    </div>
  );
}
