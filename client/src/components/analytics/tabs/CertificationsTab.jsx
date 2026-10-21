import React, { useState, useMemo } from 'react';
import {
  Award,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Search,
  BookOpen,
} from 'lucide-react';
import MetricCard from '../MetricCard';
import AnalyticsDistributionChart from '../AnalyticsDistributionChart';

export const CertificationsTab = ({ data }) => {
  const certs = data?.certifications || {};
  const [search, setSearch] = useState('');

  const totalIssued = certs.totalIssued ?? 0;
  const active = certs.active ?? 0;
  const expired = certs.expired ?? 0;
  const revoked = certs.revoked ?? 0;
  const expiringSoon = certs.expiringSoon ?? 0;
  const renewed = certs.renewed ?? 0;
  const renewalRate = certs.renewalRate ?? 0;

  const courseBreakdown = useMemo(
    () => certs.courseBreakdown || [],
    [certs.courseBreakdown]
  );

  const filteredCourses = useMemo(() => {
    if (!search.trim()) return courseBreakdown;
    const q = search.toLowerCase();
    return courseBreakdown.filter((c) => (c.courseTitle || '').toLowerCase().includes(q));
  }, [courseBreakdown, search]);

  const lifecycleItems = [
    { label: 'Active', value: active, colorClass: 'bg-emerald-500' },
    { label: 'Expiring Soon', value: expiringSoon, colorClass: 'bg-amber-500' },
    { label: 'Expired', value: expired, colorClass: 'bg-rose-500' },
    { label: 'Revoked', value: revoked, colorClass: 'bg-slate-400' },
  ];

  return (
    <div className="space-y-6" data-testid="analytics-certifications-tab">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Total Issued"
          value={totalIssued}
          subtext="Lifetime certificates granted"
          icon={Award}
          variant="default"
        />
        <MetricCard
          title="Active Credentials"
          value={active}
          subtext="Currently valid & verified"
          icon={CheckCircle2}
          variant="success"
        />
        <MetricCard
          title="Expiring Soon"
          value={expiringSoon}
          subtext="Within 30-day renewal window"
          icon={Clock}
          variant={expiringSoon > 0 ? 'warning' : 'default'}
        />
        <MetricCard
          title="Expired / Revoked"
          value={expired + revoked}
          subtext={`${expired} expired / ${revoked} revoked`}
          icon={AlertTriangle}
          variant={expired > 0 ? 'danger' : 'default'}
        />
        <MetricCard
          title="Renewal Rate"
          value={`${renewalRate}%`}
          subtext={`${renewed} recertifications recorded`}
          icon={RotateCcw}
          variant="purple"
          progress={renewalRate}
        />
      </div>

      {/* Distribution Chart */}
      <AnalyticsDistributionChart
        title="Certificate Lifecycle Standing"
        subtitle="Current status breakdown across all issued learning credentials"
        items={lifecycleItems}
        total={totalIssued}
      />

      {/* Course Certification Breakdown Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="text-sm font-semibold text-brand-ink-primary dark:text-white">Course Certification Velocity</h3>
            <p className="text-xs text-slate-500">Credential issuance, active standing, and renewal volumes per course</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search course certifications..."
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
                <th className="py-3 px-4">Course Title</th>
                <th className="py-3 px-4 text-center">Total Issued</th>
                <th className="py-3 px-4 text-center">Active</th>
                <th className="py-3 px-4 text-center">Expired</th>
                <th className="py-3 px-4 text-center">Revoked</th>
                <th className="py-3 px-4 text-center">Renewed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredCourses.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    No course certifications match the current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredCourses.map((c) => (
                  <tr key={c.courseId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-medium text-brand-ink-primary dark:text-white flex items-center gap-2">
                      <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                      {c.courseTitle || 'Untitled Course'}
                    </td>
                    <td className="py-3 px-4 text-center font-semibold">{c.totalIssued}</td>
                    <td className="py-3 px-4 text-center text-emerald-600 font-semibold">{c.active}</td>
                    <td className="py-3 px-4 text-center text-amber-600 font-semibold">{c.expired}</td>
                    <td className="py-3 px-4 text-center text-rose-600">{c.revoked}</td>
                    <td className="py-3 px-4 text-center text-teal-700 font-semibold">{c.renewed}</td>
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

export default CertificationsTab;
