import React from 'react';
import { Briefcase, CheckCircle2, ChevronRight } from 'lucide-react';

export const JobRoleCard = ({
  jobRole,
  isSelected = false,
  onSelect,
  className = '',
}) => {
  if (!jobRole) return null;

  const { _id, name, code, description } = jobRole;

  return (
    <div
      role="button"
      tabIndex={0}
      data-testid="job-role-card"
      onClick={() => onSelect && onSelect(jobRole)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect && onSelect(jobRole);
        }
      }}
      className={`cursor-pointer rounded-2xl p-5 border text-left transition-all duration-200 relative flex flex-col justify-between ${
        isSelected
          ? 'bg-teal-50/50 border-teal-700 ring-2 ring-teal-600/20 shadow-md'
          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
      } ${className}`}
    >
      <div>
        {/* Header: Code & Select indicator */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
              isSelected
                ? 'bg-teal-100 text-teal-800'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            <Briefcase className="w-3 h-3 text-slate-400" />
            {code || 'ROLE'}
          </span>
          {isSelected ? (
            <span className="flex items-center gap-1 text-xs font-semibold text-teal-700">
              <CheckCircle2 className="w-4 h-4 text-teal-700" />
              <span>Selected</span>
            </span>
          ) : (
            <span className="text-xs text-slate-400 flex items-center group-hover:text-slate-600">
              Select <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </span>
          )}
        </div>

        {/* Title */}
        <h4 className="font-semibold text-[#102A2A] text-base mb-1.5 leading-snug">
          {name}
        </h4>

        {/* Description */}
        {description && (
          <p className="text-xs text-slate-600 line-clamp-2">
            {description}
          </p>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100/80 flex items-center justify-between text-xs text-slate-500">
        <span className="font-medium text-slate-500">Benchmark Role</span>
        <button
          type="button"
          data-testid={`select-role-${_id || code}`}
          onClick={(e) => {
            e.stopPropagation();
            onSelect && onSelect(jobRole);
          }}
          className={`font-semibold hover:underline ${
            isSelected ? 'text-teal-700' : 'text-slate-600'
          }`}
        >
          {isSelected ? 'Active Target' : 'Analyze Gaps'}
        </button>
      </div>
    </div>
  );
};

export default JobRoleCard;
