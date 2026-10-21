import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Search,
  Building2,
  FileCheck2,
} from 'lucide-react';
import MetricCard from '../MetricCard';
import AnalyticsDonutChart from '../AnalyticsDonutChart';
import AnalyticsDistributionChart from '../AnalyticsDistributionChart';
import ProgressBar from '../../ui/ProgressBar';

export const ComplianceTab = ({ data }) => {
  const comp = data?.compliance || {};
  const [reqSearch, setReqSearch] = useState('');
  const [deptSearch, setDeptSearch] = useState('');

  const totalAssignments = comp.totalAssignments ?? 0;
  const compliant = comp.compliant ?? 0;
  const dueSoon = comp.dueSoon ?? 0;
  const overdue = comp.overdue ?? 0;
  const inProgress = comp.inProgress ?? 0;
  const notStarted = comp.notStarted ?? 0;
  const complianceRate = comp.complianceRate ?? 100;

  const requirementBreakdown = useMemo(
    () => comp.requirementBreakdown || [],
    [comp.requirementBreakdown]
  );
  const departmentBreakdown = useMemo(
    () => comp.departmentBreakdown || [],
    [comp.departmentBreakdown]
  );

  const filteredRequirements = useMemo(() => {
    if (!reqSearch.trim()) return requirementBreakdown;
    const q = reqSearch.toLowerCase();
    return requirementBreakdown.filter((r) => (r.title || '').toLowerCase().includes(q));
  }, [requirementBreakdown, reqSearch]);

  const filteredDepartments = useMemo(() => {
    if (!deptSearch.trim()) return departmentBreakdown;
    const q = deptSearch.toLowerCase();
    return departmentBreakdown.filter((d) => (d.departmentName || '').toLowerCase().includes(q));
  }, [departmentBreakdown, deptSearch]);

  const complianceItems = [
    { label: 'Compliant', value: compliant, color: '#10b981', colorClass: 'bg-emerald-500' },
    { label: 'Due Soon', value: dueSoon, color: '#f59e0b', colorClass: 'bg-amber-500' },
    { label: 'Overdue', value: overdue, color: '#ef4444', colorClass: 'bg-rose-500' },
    { label: 'In Progress', value: inProgress, color: '#0F766E', colorClass: 'bg-teal-600' },
    { label: 'Not Started', value: notStarted, color: '#94a3b8', colorClass: 'bg-slate-400' },
  ];

  return (
    <div className="space-y-6" data-testid="analytics-compliance-tab">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Compliance Rate"
          value={`${complianceRate}%`}
          subtext={`${totalAssignments} assignments monitored`}
          icon={ShieldCheck}
          variant={complianceRate >= 90 ? 'success' : complianceRate >= 70 ? 'warning' : 'danger'}
          progress={complianceRate}
        />
        <MetricCard
          title="Compliant"
          value={compliant}
          subtext="Certifications active & valid"
          icon={CheckCircle2}
          variant="success"
        />
        <MetricCard
          title="Due Soon"
          value={dueSoon}
          subtext="Expiring within 30 days"
          icon={Clock}
          variant="warning"
        />
        <MetricCard
          title="Overdue"
          value={overdue}
          subtext={overdue > 0 ? 'Requires immediate action' : 'Zero compliance lapses'}
          icon={AlertTriangle}
          variant={overdue > 0 ? 'danger' : 'success'}
        />
        <MetricCard
          title="In Progress / Pending"
          value={inProgress + notStarted}
          subtext={`${inProgress} learning / ${notStarted} unstarted`}
          icon={FileCheck2}
          variant="info"
        />
      </div>

      {/* Visual Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsDonutChart
          title="Compliance Standing Breakdown"
          subtitle="Proportion of compliant vs at-risk mandatory obligations"
          centerValue={`${complianceRate}%`}
          centerLabel="Compliance"
          items={complianceItems}
        />
        <AnalyticsDistributionChart
          title="Compliance Pipeline Pipeline"
          subtitle="Relative distribution of mandatory workforce training states"
          items={complianceItems}
          total={totalAssignments}
        />
      </div>

      {/* Requirement Breakdown Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="text-sm font-semibold text-brand-ink-primary dark:text-white">Compliance Requirement Breakdown</h3>
            <p className="text-xs text-slate-500">Adherence, due soon warnings, and overdue breaches per regulation</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search requirements..."
              value={reqSearch}
              onChange={(e) => setReqSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 bg-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-3 px-4">Requirement Title</th>
                <th className="py-3 px-4 text-center">Assigned Employees</th>
                <th className="py-3 px-4 text-center">Compliant</th>
                <th className="py-3 px-4 text-center">Due Soon</th>
                <th className="py-3 px-4 text-center">Overdue</th>
                <th className="py-3 px-4 text-center">Compliance Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRequirements.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    No compliance requirements match the current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredRequirements.map((r) => (
                  <tr key={r.requirementId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-medium text-brand-ink-primary dark:text-white">{r.title}</td>
                    <td className="py-3 px-4 text-center font-semibold">{r.assignedEmployees}</td>
                    <td className="py-3 px-4 text-center text-emerald-600 font-semibold">{r.compliant}</td>
                    <td className="py-3 px-4 text-center text-amber-600 font-semibold">{r.dueSoon}</td>
                    <td className="py-3 px-4 text-center text-rose-600 font-semibold">
                      {r.overdue > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700">
                          {r.overdue}
                        </span>
                      ) : (
                        0
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          r.complianceRate >= 90
                            ? 'bg-emerald-50 text-emerald-700'
                            : r.complianceRate >= 70
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {r.complianceRate}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Department Compliance Breakdown Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="text-sm font-semibold text-brand-ink-primary dark:text-white">Department Compliance Matrix</h3>
            <p className="text-xs text-slate-500">Regulatory adherence and risk exposure categorized by business department</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search departments..."
              value={deptSearch}
              onChange={(e) => setDeptSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 bg-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-3 px-4">Department Name</th>
                <th className="py-3 px-4 text-center">Assigned Employees</th>
                <th className="py-3 px-4 text-center">Compliant</th>
                <th className="py-3 px-4 text-center">Due Soon</th>
                <th className="py-3 px-4 text-center">Overdue</th>
                <th className="py-3 px-4 min-w-[140px]">Compliance Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredDepartments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    No departments match the current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredDepartments.map((d) => (
                  <tr key={d.departmentId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-medium text-brand-ink-primary dark:text-white flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {d.departmentName}
                    </td>
                    <td className="py-3 px-4 text-center font-semibold">{d.assignedEmployees}</td>
                    <td className="py-3 px-4 text-center text-emerald-600 font-semibold">{d.compliant}</td>
                    <td className="py-3 px-4 text-center text-amber-600">{d.dueSoon}</td>
                    <td className="py-3 px-4 text-center text-rose-600 font-semibold">
                      {d.overdue > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700">
                          {d.overdue}
                        </span>
                      ) : (
                        0
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <ProgressBar
                          value={d.complianceRate || 0}
                          size="sm"
                          showPercentage={false}
                          variant={d.complianceRate >= 90 ? 'success' : d.complianceRate >= 70 ? 'warning' : 'danger'}
                          className="flex-1"
                        />
                        <span className="text-[11px] font-semibold text-slate-700 w-10 text-right">
                          {d.complianceRate || 0}%
                        </span>
                      </div>
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

export default ComplianceTab;
