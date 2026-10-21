import React from 'react';
import { Check, Sparkles } from 'lucide-react';

export const RecommendationReason = ({ matchedSkills = [], className = '' }) => {
  if (!matchedSkills || matchedSkills.length === 0) return null;

  return (
    <div data-testid="recommendation-reasons" className={`space-y-1.5 ${className}`}>
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
        <Sparkles className="w-3.5 h-3.5 text-teal-600" />
        <span>Skills Targeted ({matchedSkills.length})</span>
      </div>

      <div className="space-y-1">
        {matchedSkills.map((match, idx) => {
          const skillName = match.skill?.name || 'Skill';
          const isMandatory = match.mandatory;
          const status = match.status; // 'MISSING' or 'BELOW_REQUIRED'
          const coverage = match.coverageLevel;
          const target = match.requiredLevel;

          return (
            <div
              key={match.skill?._id || idx}
              className="flex items-start gap-2 text-xs text-slate-600 bg-slate-50/80 rounded-lg p-2 border border-slate-100"
            >
              <span
                className={`mt-0.5 p-0.5 rounded-full shrink-0 ${
                  isMandatory
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                <Check className="w-3 h-3" />
              </span>
              <div className="flex-1 leading-snug">
                <span className="font-semibold text-slate-800">
                  {skillName}
                </span>
                {isMandatory && (
                  <span className="ml-1.5 text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                    Mandatory
                  </span>
                )}
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {status === 'MISSING' ? 'Acquires missing competency' : 'Advances existing level'}
                  {coverage && target && (
                    <span> • Covers {coverage} (Target: {target})</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecommendationReason;
