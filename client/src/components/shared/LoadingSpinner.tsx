import React from 'react';

export default function LoadingSpinner({ text = '加载中...' }: { text?: string }) {
  return (
    <div className="loading-spinner">
      <div className="spinner" />
      <p>{text}</p>
    </div>
  );
}
