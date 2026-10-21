import React from 'react';
import { Users, Award, TrendingUp, AlertTriangle } from 'lucide-react';

export const AssessmentPerformanceCard = ({ performance }) => {
  if (!performance) return null;

  const {
    totalAttempts = 0,
    submittedAttempts = 0,
    passedAttempts = 0,
    failedAttempts = 0,
    averagePercentage = 0,
    highestPercentage = 0,
    lowestPercentage = 0,
    passPercentage = 0,
  } = performance;

  return (
    <div
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4"
      data-testid="assessment-performance-card"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-[#102A2A] dark:text-white flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-teal-700" />
          Authoritative Cohort Performance
        </h3>
        <span className="text-xs text-slate-500">
          {submittedAttempts} of {totalAttempts} submitted
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200/60 dark:border-slate-700/60 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">Total Attempts</p>
          <p className="mt-1 text-xl font-bold text-[#102A2A] dark:text-white">
            {totalAttempts}
          </p>
        </div>

        <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-lg border border-emerald-200/60 dark:border-emerald-800/60 text-center">
          <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">Pass Rate</p>
          <p className="mt-1 text-xl font-bold text-emerald-700 dark:text-emerald-300">
            {passPercentage}%
          </p>
        </div>

        <div className="p-3 bg-teal-50/60 dark:bg-teal-950/30 rounded-lg border border-teal-200/60 dark:border-teal-800/60 text-center">
          <p className="text-xs text-teal-800 dark:text-teal-300 font-medium">Average Score</p>
          <p className="mt-1 text-xl font-bold text-teal-800 dark:text-teal-300">
            {averagePercentage}%
          </p>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200/60 dark:border-slate-700/60 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">High / Low</p>
          <p className="mt-1 text-base font-bold text-slate-800 dark:text-slate-200">
            {highestPercentage}% / {lowestPercentage}%
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
        <span className="flex items-center gap-1 text-emerald-600">
          <Award className="w-3.5 h-3.5" />
          Passed: {passedAttempts}
        </span>
        <span className="flex items-center gap-1 text-red-600">
          <AlertTriangle className="w-3.5 h-3.5" />
          Failed: {failedAttempts}
        </span>
        <span className="flex items-center gap-1 text-slate-500">
          <Users className="w-3.5 h-3.5" />
          In-Progress: {totalAttempts - submittedAttempts}
        </span>
      </div>
    </div>
  );
};

export default AssessmentPerformanceCard;
