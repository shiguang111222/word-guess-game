import React from 'react';

export default function ErrorBanner({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="error-banner">
      <span>⚠️</span>
      <span>{message}</span>
    </div>
  );
}
