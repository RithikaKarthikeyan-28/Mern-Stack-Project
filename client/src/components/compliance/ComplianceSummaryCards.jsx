import React from 'react';
import PropTypes from 'prop-types';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Clock,
  FileText,
} from 'lucide-react';
import ProgressCircle from '../ui/ProgressCircle';
import ProgressBar from '../ui/ProgressBar';

export const ComplianceSummaryCards = ({ summary, className = '' }) => {
  if (!summary) return null;

  const {
    totalAssignments = 0,
    compliant = 0,
    dueSoon = 0,
    overdue = 0,
    inProgress = 0,
    notStarted = 0,
    complianceRate = 100,
  } = summary;

  const isFullyCompliant = complianceRate === 100 && totalAssignments > 0;
  const hasOverdue = overdue > 0;
  const hasDueSoon = dueSoon > 0;

  // Rate variant color
  const getRateVariant = (rate) => {
    if (rate === 100) return 'emerald';
    if (rate >= 75) return 'teal';
    if (rate >= 50) return 'amber';
    return 'rose';
  };

  const rateVariant = getRateVariant(complianceRate);

  return (
    <div
      data-testid="compliance-summary-cards"
      className={`space-y-6 ${className}`}
    >
      {/* 1. Hero Standing Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-5">
            <ProgressCircle
              value={complianceRate}
              size={80}
              strokeWidth={8}
              variant={rateVariant}
              showValue
            />
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-0.5">
                Organizational Compliance Standing
              </div>
              <h2 className="text-2xl font-bold text-[#102A2A]">
                {complianceRate}% Compliant
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {compliant} of {totalAssignments} mandatory requirement{totalAssignments === 1 ? '' : 's'} satisfied
              </p>
            </div>
          </div>

          {/* Standing status badge */}
          <div className="sm:text-right">
            {isFullyCompliant ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Fully Compliant</span>
              </span>
            ) : hasOverdue ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                <AlertOctagon className="w-4 h-4 text-rose-600" />
                <span>Immediate Action Required</span>
              </span>
            ) : hasDueSoon ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Upcoming Deadlines</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
                <Clock className="w-4 h-4 text-sky-600" />
                <span>Assignments Pending</span>
              </span>
            )}
          </div>
        </div>

        {/* Progress Bar & Subtitle */}
        <div className="pt-4">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Overall Fulfillment</span>
            <span className="font-semibold text-slate-700">{complianceRate}% Completed</span>
          </div>
          <ProgressBar
            value={complianceRate}
            variant={rateVariant}
            size="sm"
          />
        </div>
      </div>

      {/* 2. Stat Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Requirements */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Total Assigned</span>
            <span className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
              <FileText className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-[#102A2A]">{totalAssignments}</div>
          <div className="text-[11px] text-slate-400 mt-1">Active policies</div>
        </div>

        {/* Compliant */}
        <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-emerald-700">Compliant</span>
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-emerald-900">{compliant}</div>
          <div className="text-[11px] text-emerald-700/80 mt-1">Valid & certified</div>
        </div>

        {/* Due Soon */}
        <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-amber-700">Due Soon</span>
            <span className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-amber-900">{dueSoon}</div>
          <div className="text-[11px] text-amber-700/80 mt-1">Due within 30 days</div>
        </div>

        {/* Overdue */}
        <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-rose-700">Overdue</span>
            <span className="p-1.5 rounded-lg bg-rose-100 text-rose-700">
              <AlertOctagon className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-rose-900">{overdue}</div>
          <div className="text-[11px] text-rose-700/80 mt-1">Past deadline</div>
        </div>

        {/* In Progress / Not Started */}
        <div className="p-4 rounded-2xl bg-sky-50/40 border border-sky-100 shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-sky-700">Incomplete</span>
            <span className="p-1.5 rounded-lg bg-sky-100 text-sky-700">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-sky-900">{inProgress + notStarted}</div>
          <div className="text-[11px] text-sky-700/80 mt-1">
            {inProgress} in prog • {notStarted} not started
          </div>
        </div>
      </div>
    </div>
  );
};

ComplianceSummaryCards.propTypes = {
  summary: PropTypes.shape({
    totalAssignments: PropTypes.number,
    compliant: PropTypes.number,
    dueSoon: PropTypes.number,
    overdue: PropTypes.number,
    inProgress: PropTypes.number,
    notStarted: PropTypes.number,
    complianceRate: PropTypes.number,
  }),
  className: PropTypes.string,
};

export default ComplianceSummaryCards;
