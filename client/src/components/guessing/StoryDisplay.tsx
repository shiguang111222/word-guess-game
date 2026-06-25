import React from 'react';

export default function StoryDisplay({ story }: { story: string }) {
  return (
    <div className="story-display">
      <h3>📖 AI 生成的故事</h3>
      <div className="story-text">{story}</div>
    </div>
  );
}
