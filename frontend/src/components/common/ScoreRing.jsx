import React from 'react';

export const ScoreRing = ({ score = 78, maxScore = 100, size = 180, strokeWidth = 12, label = "Overall Score" }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = Math.min(100, Math.max(0, (score / maxScore) * 100));
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  let scoreColor = '#0e8ce6'; // Brand blue
  let glowColor = 'rgba(14, 140, 230, 0.2)';
  let statusText = 'Job Ready';

  if (score >= 85) {
    scoreColor = '#10b981'; // Emerald
    glowColor = 'rgba(16, 185, 129, 0.25)';
    statusText = 'Highly Job Ready';
  } else if (score >= 70) {
    scoreColor = '#0e8ce6'; // Blue
    glowColor = 'rgba(14, 140, 230, 0.25)';
    statusText = 'Good Progress';
  } else if (score >= 55) {
    scoreColor = '#f59e0b'; // Amber
    glowColor = 'rgba(245, 158, 11, 0.25)';
    statusText = 'Developing';
  } else {
    scoreColor = '#ef4444'; // Red
    glowColor = 'rgba(239, 68, 68, 0.25)';
    statusText = 'Needs Training';
  }

  return (
    <div className="flex flex-col items-center justify-center relative select-none">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeLinecap="round"
          />
          {/* Progress Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={scoreColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 1s ease-in-out, stroke 0.5s ease',
              filter: `drop-shadow(0px 2px 8px ${glowColor})`
            }}
          />
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
            {score}
          </span>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
            / {maxScore}
          </span>
        </div>
      </div>

      <div className="mt-3 text-center">
        <span 
          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
          style={{
            backgroundColor: `${scoreColor}15`,
            color: scoreColor,
            border: `1px solid ${scoreColor}30`
          }}
        >
          {statusText}
        </span>
      </div>
    </div>
  );
};
