import React from 'react';

const PROFICIENCY_CONFIG = {
  beginner: {
    label: 'Beginner',
    rank: 1,
    bg: 'bg-sky-50 text-sky-700 border-sky-200',
    dot: 'bg-sky-500',
  },
  intermediate: {
    label: 'Intermediate',
    rank: 2,
    bg: 'bg-teal-50 text-teal-800 border-teal-200',
    dot: 'bg-teal-600',
  },
  advanced: {
    label: 'Advanced',
    rank: 3,
    bg: 'bg-purple-50 text-purple-700 border-purple-200',
    dot: 'bg-purple-500',
  },
  expert: {
    label: 'Expert',
    rank: 4,
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  unranked: {
    label: 'Unranked',
    rank: 0,
    bg: 'bg-slate-100 text-slate-600 border-slate-200',
    dot: 'bg-slate-400',
  },
};

export const SkillBadge = ({
  level,
  size = 'md',
  showRank = false,
  className = '',
}) => {
  const normalized = (level || '').trim().toLowerCase();
  const config = PROFICIENCY_CONFIG[normalized] || PROFICIENCY_CONFIG.unranked;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3 py-1.5 gap-2 font-medium',
  };

  return (
    <span
      data-testid="skill-badge"
      data-level={normalized || 'unranked'}
      className={`inline-flex items-center rounded-full border transition-colors ${config.bg} ${sizeClasses[size] || sizeClasses.md} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} />
      <span>{config.label}</span>
      {showRank && config.rank > 0 && (
        <span className="opacity-75 text-[10px] tracking-wide ml-0.5">
          ({config.rank}/4)
        </span>
      )}
    </span>
  );
};

export default SkillBadge;
