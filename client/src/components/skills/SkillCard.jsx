import React from 'react';
import { ShieldCheck, Tag } from 'lucide-react';
import SkillBadge from './SkillBadge';
import ProficiencyBar from './ProficiencyBar';

export const SkillCard = ({ employeeSkill, className = '' }) => {
  if (!employeeSkill) return null;

  const skill = employeeSkill.skill || {};
  const skillName = skill.name || 'Unnamed Skill';
  const category = skill.category || 'General';
  const description = skill.description || '';
  const proficiencyLevel = employeeSkill.proficiencyLevel || 'beginner';

  return (
    <div
      data-testid="skill-card"
      className={`bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between ${className}`}
    >
      <div>
        {/* Header: Category & Verified Badge */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
            <Tag className="w-3 h-3 text-slate-400" />
            {category}
          </span>
          <span
            title="Verified by Administrator"
            className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Verified</span>
          </span>
        </div>

        {/* Skill Title & Level Badge */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-[#102A2A] text-base leading-tight">
            {skillName}
          </h3>
          <SkillBadge level={proficiencyLevel} size="sm" showRank />
        </div>

        {/* Skill Description */}
        {description && (
          <p className="text-xs text-slate-600 line-clamp-2 mb-4">
            {description}
          </p>
        )}
      </div>

      {/* Footer: Visual Proficiency Level */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
          <span className="font-medium text-slate-700">Proficiency Mastery</span>
          <span className="capitalize font-semibold text-teal-700">
            {proficiencyLevel}
          </span>
        </div>
        <ProficiencyBar currentLevel={proficiencyLevel} showLabels />
      </div>
    </div>
  );
};

export default SkillCard;
