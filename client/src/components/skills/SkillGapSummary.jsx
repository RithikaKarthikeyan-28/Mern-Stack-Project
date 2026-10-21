import React from 'react';
import { Target, CheckCircle2, AlertTriangle, XCircle, Sparkles } from 'lucide-react';
import ProgressCircle from '../ui/ProgressCircle';
import ProgressBar from '../ui/ProgressBar';

export const SkillGapSummary = ({
  summary,
  jobRoleTitle = 'Selected Job Role',
  onViewRecommendations,
  className = '',
}) => {
  if (!summary) return null;

  const {
    overallMatchPercentage = 0,
    mandatoryMatchPercentage = 0,
    totalRequirements = 0,
    meetsRequiredSkills = 0,
    belowRequiredSkills = 0,
    missingSkills = 0,
    mandatoryGaps = 0,
  } = summary;

  const hasGaps = (missingSkills + belowRequiredSkills) > 0;

  // Variant color based on overall match
  const getMatchVariant = (pct) => {
    if (pct >= 85) return 'emerald';
    if (pct >= 60) return 'teal';
    if (pct >= 40) return 'amber';
    return 'rose';
  };

  const overallVariant = getMatchVariant(overallMatchPercentage);
  const mandatoryVariant = getMatchVariant(mandatoryMatchPercentage);

  return (
    <div
      data-testid="skill-gap-summary"
      className={`bg-white rounded-3xl border border-slate-200 p-6 shadow-sm ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-teal-50 text-teal-700">
              <Target className="w-5 h-5" />
            </span>
            <h3 className="text-lg font-bold text-[#102A2A]">
              Competency Benchmark: {jobRoleTitle}
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Authoritative evaluation based on current verified proficiency levels against role criteria.
          </p>
        </div>

        {hasGaps && onViewRecommendations && (
          <button
            type="button"
            data-testid="view-recommendations-btn"
            onClick={onViewRecommendations}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 transition shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            <span>Recommended Courses</span>
          </button>
        )}
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-6">
        {/* 1. Overall Match Gauge */}
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
          <ProgressCircle
            value={overallMatchPercentage}
            size={72}
            strokeWidth={7}
            variant={overallVariant}
            showValue
          />
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Overall Match
            </div>
            <div className="text-lg font-bold text-[#102A2A]">
              {overallMatchPercentage}%
            </div>
            <div className="text-xs text-slate-500">
              {meetsRequiredSkills} of {totalRequirements} criteria met
            </div>
          </div>
        </div>

        {/* 2. Mandatory Match */}
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
          <ProgressCircle
            value={mandatoryMatchPercentage}
            size={72}
            strokeWidth={7}
            variant={mandatoryVariant}
            showValue
          />
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Mandatory Match
            </div>
            <div className="text-lg font-bold text-[#102A2A]">
              {mandatoryMatchPercentage}%
            </div>
            <div className="text-xs text-slate-500">
              {mandatoryGaps === 0 ? 'All mandatory met' : `${mandatoryGaps} mandatory gap${mandatoryGaps > 1 ? 's' : ''}`}
            </div>
          </div>
        </div>

        {/* 3. Status Breakdown Counts */}
        <div className="col-span-1 md:col-span-2 grid grid-cols-3 gap-3">
          {/* Meets Required */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-center flex flex-col justify-center">
            <div className="flex items-center justify-center gap-1 text-emerald-700 mb-1">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-xs font-semibold">Meets</span>
            </div>
            <div className="text-2xl font-bold text-emerald-900">
              {meetsRequiredSkills}
            </div>
            <div className="text-[11px] text-emerald-700/80">Skills Qualified</div>
          </div>

          {/* Below Required */}
          <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-100 text-center flex flex-col justify-center">
            <div className="flex items-center justify-center gap-1 text-amber-700 mb-1">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs font-semibold">Below</span>
            </div>
            <div className="text-2xl font-bold text-amber-900">
              {belowRequiredSkills}
            </div>
            <div className="text-[11px] text-amber-700/80">Needs Upskilling</div>
          </div>

          {/* Missing Skills */}
          <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-100 text-center flex flex-col justify-center">
            <div className="flex items-center justify-center gap-1 text-rose-700 mb-1">
              <XCircle className="w-4 h-4" />
              <span className="text-xs font-semibold">Missing</span>
            </div>
            <div className="text-2xl font-bold text-rose-900">
              {missingSkills}
            </div>
            <div className="text-[11px] text-rose-700/80">Not Acquired</div>
          </div>
        </div>
      </div>

      {/* Compliance / Qualification Bar */}
      <div className="mt-6 pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
          <span>Benchmark Fulfillment</span>
          <span className="font-semibold text-slate-700">{overallMatchPercentage}% Complete</span>
        </div>
        <ProgressBar
          value={overallMatchPercentage}
          variant={overallVariant}
          size="sm"
        />
      </div>
    </div>
  );
};

export default SkillGapSummary;
