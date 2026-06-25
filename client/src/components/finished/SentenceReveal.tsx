import React from 'react';

export default function SentenceReveal({ sentence }: { sentence: string }) {
  return (
    <div className="sentence-reveal">
      <h3>📝 AI 造的句子</h3>
      <div className="sentence-box">
        {sentence || '加载中...'}
      </div>
    </div>
  );
}
