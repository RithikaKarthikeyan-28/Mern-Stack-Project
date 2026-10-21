import React, { useState, useMemo } from 'react';
import {
  FileCheck,
  CheckCircle2,
  TrendingUp,
  Search,
  Award,
} from 'lucide-react';
import MetricCard from '../MetricCard';
import AnalyticsDistributionChart from '../AnalyticsDistributionChart';

export const AssessmentsTab = ({ data }) => {
  const assessments = data?.assessments || {};
  const [search, setSearch] = useState('');

  const totalAttempts = assessments.totalAttempts ?? 0;
  const submittedAttempts = assessments.submittedAttempts ?? 0;
  const passed = assessments.passed ?? 0;
  const failed = assessments.failed ?? 0;
  const passRate = assessments.passRate ?? 100;
  const avgPct = assessments.averagePercentage ?? 0;
  const highestPct = assessments.highestPercentage ?? 0;
  const lowestPct = assessments.lowestPercentage ?? 0;
  const avgAttemptsPerEmp = assessments.averageAttemptsPerEmployee ?? 0;

  const assessmentBreakdown = useMemo(
    () => assessments.assessmentBreakdown || [],
    [assessments.assessmentBreakdown]
  );

  const filteredAssessments = useMemo(() => {
    if (!search.trim()) return assessmentBreakdown;
    const q = search.toLowerCase();
    return assessmentBreakdown.filter((a) => (a.title || '').toLowerCase().includes(q));
  }, [assessmentBreakdown, search]);

  const outcomeItems = [
    { label: 'Passed', value: passed, colorClass: 'bg-emerald-500' },
    { label: 'Failed', value: failed, colorClass: 'bg-rose-500' },
  ];

  return (
    <div className="space-y-6" data-testid="analytics-assessments-tab">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Submitted Attempts"
          value={submittedAttempts}
          subtext={`${totalAttempts} total records`}
          icon={FileCheck}
          variant="default"
        />
        <MetricCard
          title="Pass Rate"
          value={`${passRate}%`}
          subtext={`${passed} passed / ${failed} failed`}
          icon={CheckCircle2}
          variant={passRate >= 80 ? 'success' : passRate >= 60 ? 'warning' : 'danger'}
          progress={passRate}
        />
        <MetricCard
          title="Average Score"
          value={`${avgPct}%`}
          subtext="Across all graded submissions"
          icon={TrendingUp}
          variant="purple"
          progress={avgPct}
        />
        <MetricCard
          title="Score Range"
          value={`${lowestPct}% – ${highestPct}%`}
          subtext="Lowest to highest achieved"
          icon={Award}
          variant="info"
        />
        <MetricCard
          title="Attempts / Learner"
          value={avgAttemptsPerEmp}
          subtext="Average attempt volume"
          icon={FileCheck}
          variant="default"
        />
      </div>

      {/* Evaluation Outcomes */}
      <AnalyticsDistributionChart
        title="Assessment Result Distribution"
        subtitle="Ratio of successfully passed vs failed graded evaluations"
        items={outcomeItems}
        total={submittedAttempts}
      />

      {/* Assessment Breakdown Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="text-sm font-semibold text-brand-ink-primary dark:text-white">Assessment Cohort Breakdown</h3>
            <p className="text-xs text-slate-500">Attempt volume, pass rates, and score distributions per assessment</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search assessments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 bg-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-3 px-4">Assessment Title</th>
                <th className="py-3 px-4 text-center">Attempts</th>
                <th className="py-3 px-4 text-center">Learners</th>
                <th className="py-3 px-4 text-center">Passed</th>
                <th className="py-3 px-4 text-center">Failed</th>
                <th className="py-3 px-4 text-center">Pass Rate</th>
                <th className="py-3 px-4 text-center">Avg Score</th>
                <th className="py-3 px-4 text-center">Score Range</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredAssessments.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">
                    No assessments match the current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredAssessments.map((a) => (
                  <tr key={a.assessmentId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-medium text-brand-ink-primary dark:text-white">{a.title}</td>
                    <td className="py-3 px-4 text-center font-semibold">{a.attemptCount}</td>
                    <td className="py-3 px-4 text-center text-slate-600">{a.uniqueEmployees}</td>
                    <td className="py-3 px-4 text-center text-emerald-600 font-semibold">{a.passed}</td>
                    <td className="py-3 px-4 text-center text-rose-600 font-semibold">{a.failed}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          a.passRate >= 80
                            ? 'bg-emerald-50 text-emerald-700'
                            : a.passRate >= 60
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {a.passRate}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-medium text-slate-800">{a.averagePercentage}%</td>
                    <td className="py-3 px-4 text-center text-slate-500">
                      {a.lowestPercentage}% – {a.highestPercentage}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AssessmentsTab;
