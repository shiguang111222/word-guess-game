import React from 'react';

interface SubmissionProgressProps {
  submitted: number;
  total: number;
}

export default function SubmissionProgress({ submitted, total }: SubmissionProgressProps) {
  const pct = total > 0 ? Math.round((submitted / total) * 100) : 0;

  return (
    <div className="submission-progress">
      <div className="progress-text">
        {submitted}/{total} 人已提交
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
