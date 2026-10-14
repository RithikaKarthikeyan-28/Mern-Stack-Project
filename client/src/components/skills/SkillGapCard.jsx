import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, ArrowRight, Tag } from 'lucide-react';
import SkillBadge from './SkillBadge';
import ProficiencyBar from './ProficiencyBar';

const STATUS_CONFIG = {
  MEETS_REQUIRED: {
    label: 'Meets Requirement',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: CheckCircle2,
    borderClass: 'border-emerald-200/60',
  },
  BELOW_REQUIRED: {
    label: 'Below Required',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: AlertTriangle,
    borderClass: 'border-amber-200/60',
  },
  MISSING: {
    label: 'Skill Missing',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: XCircle,
    borderClass: 'border-rose-200/60',
  },
};

export const SkillGapCard = ({ gap, className = '' }) => {
  if (!gap) return null;

  const {
    skill = {},
    requiredLevel = 'beginner',
    currentLevel = null,
    mandatory = false,
    weight = 1,
    status = 'MISSING',
  } = gap;

  const skillName = skill.name || 'Unnamed Skill';
  const category = skill.category || 'General';
  const statusInfo = STATUS_CONFIG[status] || STATUS_CONFIG.MISSING;
  const StatusIcon = statusInfo.icon;

  return (
    <div
      data-testid="skill-gap-card"
      data-status={status}
      className={`bg-white rounded-2xl border ${statusInfo.borderClass} p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between ${className}`}
    >
      <div>
        {/* Top Badges Row */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
            <Tag className="w-3 h-3 text-slate-400" />
            {category}
          </span>

          <div className="flex items-center gap-1.5">
            {mandatory ? (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                Mandatory
              </span>
            ) : (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                Optional
              </span>
            )}
            <span
              className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${statusInfo.badgeClass}`}
            >
              <StatusIcon className="w-3.5 h-3.5" />
              <span>{statusInfo.label}</span>
            </span>
          </div>
        </div>

        {/* Skill Title */}
        <h4 className="font-semibold text-slate-900 text-base mb-1">
          {skillName}
        </h4>

        {/* Weight indicator if > 1 */}
        {weight > 1 && (
          <p className="text-[11px] text-slate-400 mb-3">
            Weight multiplier: {weight}x
          </p>
        )}

        {/* Level Comparison Pills */}
        <div className="flex items-center gap-2 my-3 p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
          <div className="flex-1">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Current
            </div>
            {currentLevel ? (
              <SkillBadge level={currentLevel} size="sm" showRank />
            ) : (
              <span className="text-xs font-medium text-slate-400 italic">
                None
              </span>
            )}
          </div>

          <ArrowRight className="w-4 h-4 text-slate-300 shrink-0 mx-1" />

          <div className="flex-1">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Required
            </div>
            <SkillBadge level={requiredLevel} size="sm" showRank />
          </div>
        </div>
      </div>

      {/* Visual Proficiency Target Bar */}
      <div className="mt-3 pt-3 border-t border-slate-100">
        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
          <span>Gap Progress</span>
          <span className="font-medium text-slate-600">
            {currentLevel ? currentLevel : 'Unranked'} → {requiredLevel}
          </span>
        </div>
        <ProficiencyBar
          currentLevel={currentLevel}
          requiredLevel={requiredLevel}
          showLabels
        />
      </div>
    </div>
  );
};

export default SkillGapCard;
