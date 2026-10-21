import React from 'react';

export const ProgressCircle = ({
  value = 0,
  size = 56,
  strokeWidth = 5,
  color = 'teal',
  showValue = true,
  className = '',
}) => {
  const percentage = Math.min(100, Math.max(0, Math.round(value)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const colorClasses = {
    teal: 'text-teal-700',
    indigo: 'text-teal-700',
    emerald: 'text-emerald-500',
    amber: 'text-amber-500',
    rose: 'text-rose-500',
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-100 fill-transparent"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`fill-transparent transition-all duration-500 ease-out ${
            colorClasses[color] || colorClasses.teal
          }`}
        />
      </svg>
      {showValue && (
        <span className="absolute text-xs font-semibold text-[#102A2A]">
          {percentage}%
        </span>
      )}
    </div>
  );
};

export default ProgressCircle;
