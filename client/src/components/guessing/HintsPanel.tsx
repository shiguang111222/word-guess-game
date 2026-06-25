import React from 'react';

export default function HintsPanel({ storyLength }: { storyLength: number }) {
  return (
    <div className="hints-panel">
      <span className="hints-meta">
        📏 故事长度：<strong>{storyLength}</strong> 字
      </span>
    </div>
  );
}
