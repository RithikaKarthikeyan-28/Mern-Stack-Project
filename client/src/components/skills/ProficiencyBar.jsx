import React from 'react';

const RANK_MAP = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
  expert: 4,
};

const LEVELS = [
  { key: 'beginner', label: 'Beg', rank: 1 },
  { key: 'intermediate', label: 'Int', rank: 2 },
  { key: 'advanced', label: 'Adv', rank: 3 },
  { key: 'expert', label: 'Exp', rank: 4 },
];

export const ProficiencyBar = ({
  currentLevel,
  requiredLevel,
  showLabels = false,
  className = '',
}) => {
  const currentRank = typeof currentLevel === 'number'
    ? currentLevel
    : RANK_MAP[(currentLevel || '').toLowerCase()] || 0;

  const requiredRank = typeof requiredLevel === 'number'
    ? requiredLevel
    : requiredLevel
    ? RANK_MAP[requiredLevel.toLowerCase()] || 0
    : 0;

  return (
    <div data-testid="proficiency-bar" className={`w-full space-y-1 ${className}`}>
      <div className="grid grid-cols-4 gap-1.5 h-2">
        {LEVELS.map((lvl) => {
          const isFilled = lvl.rank <= currentRank;
          const isRequiredTarget = requiredRank > 0 && lvl.rank === requiredRank;
          const isCurrentTarget = lvl.rank === currentRank;

          let segColor = 'bg-slate-100 dark:bg-slate-800';
          if (isFilled) {
            segColor = 'bg-teal-700';
          }

          return (
            <div
              key={lvl.key}
              title={`${lvl.label} (Level ${lvl.rank})`}
              className={`relative h-full rounded-sm transition-all duration-300 ${segColor}`}
            >
              {isRequiredTarget && (
                <div
                  title={`Required: ${lvl.key}`}
                  className="absolute -top-1 right-0 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white transform translate-x-1"
                />
              )}
              {isCurrentTarget && !isRequiredTarget && (
                <div
                  title={`Current: ${lvl.key}`}
                  className="absolute -top-1 right-0 w-2 h-2 rounded-full bg-teal-600 ring-2 ring-white transform translate-x-1"
                />
              )}
            </div>
          );
        })}
      </div>

      {showLabels && (
        <div className="flex justify-between text-[10px] text-slate-400 font-medium px-0.5">
          <span>Beg</span>
          <span>Int</span>
          <span>Adv</span>
          <span>Exp</span>
        </div>
      )}
    </div>
  );
};

export default ProficiencyBar;
