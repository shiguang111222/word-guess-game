import React from 'react';

export default function StoryReveal({ story }: { story: string }) {
  return (
    <div className="sentence-reveal">
      <h3>📖 AI 生成的故事</h3>
      <div className="sentence-box">{story}</div>
    </div>
  );
}
