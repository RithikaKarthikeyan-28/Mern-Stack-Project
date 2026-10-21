import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  TrendingUp,
  Search,
  Building2,
} from 'lucide-react';
import MetricCard from '../MetricCard';
import AnalyticsDistributionChart from '../AnalyticsDistributionChart';
import ProgressBar from '../../ui/ProgressBar';

export const LearningTab = ({ data }) => {
  const learning = data?.learning || {};
  const [courseSearch, setCourseSearch] = useState('');
  const [deptSearch, setDeptSearch] = useState('');

  const totalEnrollments = learning.totalEnrollments ?? 0;
  const enrolled = learning.enrolled ?? 0;
  const inProgress = learning.inProgress ?? 0;
  const completed = learning.completed ?? 0;
  const dropped = learning.dropped ?? 0;
  const completionRate = learning.completionRate ?? 0;
  const avgProgress = learning.averageProgressPercentage ?? 0;
  const avgDays = learning.averageCompletionTimeDays ?? 0;

  const courseBreakdown = useMemo(
    () => learning.courseBreakdown || [],
    [learning.courseBreakdown]
  );
  const departmentBreakdown = useMemo(
    () => learning.departmentBreakdown || [],
    [learning.departmentBreakdown]
  );

  const filteredCourses = useMemo(() => {
    if (!courseSearch.trim()) return courseBreakdown;
    const q = courseSearch.toLowerCase();
    return courseBreakdown.filter((c) => (c.title || '').toLowerCase().includes(q));
  }, [courseBreakdown, courseSearch]);

  const filteredDepartments = useMemo(() => {
    if (!deptSearch.trim()) return departmentBreakdown;
    const q = deptSearch.toLowerCase();
    return departmentBreakdown.filter((d) => (d.departmentName || '').toLowerCase().includes(q));
  }, [departmentBreakdown, deptSearch]);

  const statusItems = [
    { label: 'Enrolled', value: enrolled, colorClass: 'bg-blue-500' },
    { label: 'In Progress', value: inProgress, colorClass: 'bg-teal-600' },
    { label: 'Completed', value: completed, colorClass: 'bg-emerald-500' },
    { label: 'Dropped', value: dropped, colorClass: 'bg-rose-500' },
  ];

  return (
    <div className="space-y-6" data-testid="analytics-learning-tab">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Total Enrollments"
          value={totalEnrollments}
          subtext={`${inProgress} actively learning`}
          icon={BookOpen}
          variant="default"
        />
        <MetricCard
          title="Completed"
          value={completed}
          subtext={`${enrolled} waiting to start`}
          icon={CheckCircle2}
          variant="success"
        />
        <MetricCard
          title="Completion Rate"
          value={`${completionRate}%`}
          subtext={`${dropped} dropped enrollments`}
          icon={TrendingUp}
          variant={completionRate >= 75 ? 'success' : completionRate >= 50 ? 'warning' : 'danger'}
          progress={completionRate}
        />
        <MetricCard
          title="Average Progress"
          value={`${avgProgress}%`}
          subtext="Across active enrollments"
          icon={TrendingUp}
          variant="purple"
          progress={avgProgress}
        />
        <MetricCard
          title="Avg Completion Time"
          value={`${avgDays} days`}
          subtext="Enrollment to completion"
          icon={Clock}
          variant="info"
        />
      </div>

      {/* Distribution Chart */}
      <AnalyticsDistributionChart
        title="Enrollment Status Pipeline"
        subtitle="Distribution of employee learning engagement across lifecycle states"
        items={statusItems}
        total={totalEnrollments}
      />

      {/* Course Breakdown Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="text-sm font-semibold text-brand-ink-primary dark:text-white">Course Performance Breakdown</h3>
            <p className="text-xs text-slate-500">Learning adoption, completion rates, and average progress per course</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search courses..."
              value={courseSearch}
              onChange={(e) => setCourseSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 bg-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-3 px-4">Course Title</th>
                <th className="py-3 px-4 text-center">Enrollments</th>
                <th className="py-3 px-4 text-center">Completed</th>
                <th className="py-3 px-4 text-center">In Progress</th>
                <th className="py-3 px-4 text-center">Completion Rate</th>
                <th className="py-3 px-4 min-w-[140px]">Avg Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredCourses.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    No courses match the current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredCourses.map((c) => (
                  <tr key={c.courseId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-medium text-brand-ink-primary dark:text-white">{c.title}</td>
                    <td className="py-3 px-4 text-center font-semibold">{c.enrollmentCount}</td>
                    <td className="py-3 px-4 text-center text-emerald-600 font-semibold">{c.completedCount}</td>
                    <td className="py-3 px-4 text-center text-teal-700 font-semibold">{c.inProgressCount}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          c.completionRate >= 75
                            ? 'bg-emerald-50 text-emerald-700'
                            : c.completionRate >= 50
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {c.completionRate}%
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <ProgressBar
                          value={c.averageProgressPercentage || 0}
                          size="sm"
                          showPercentage={false}
                          className="flex-1"
                        />
                        <span className="text-[11px] font-medium text-slate-600 w-10 text-right">
                          {c.averageProgressPercentage || 0}%
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

      {/* Department Breakdown Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="text-sm font-semibold text-brand-ink-primary dark:text-white">Department Learning Engagement</h3>
            <p className="text-xs text-slate-500">Employee volume, enrollments, and completion velocity per business unit</p>
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
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4 text-center">Employees</th>
                <th className="py-3 px-4 text-center">Enrollments</th>
                <th className="py-3 px-4 text-center">Completed</th>
                <th className="py-3 px-4 text-center">In Progress</th>
                <th className="py-3 px-4 text-center">Completion Rate</th>
                <th className="py-3 px-4 min-w-[140px]">Avg Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredDepartments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
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
                    <td className="py-3 px-4 text-center">{d.employeeCount}</td>
                    <td className="py-3 px-4 text-center font-semibold">{d.enrollmentCount}</td>
                    <td className="py-3 px-4 text-center text-emerald-600 font-semibold">{d.completedEnrollments}</td>
                    <td className="py-3 px-4 text-center text-teal-700 font-semibold">{d.inProgressEnrollments}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          d.completionRate >= 75
                            ? 'bg-emerald-50 text-emerald-700'
                            : d.completionRate >= 50
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {d.completionRate}%
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <ProgressBar
                          value={d.averageProgressPercentage || 0}
                          size="sm"
                          showPercentage={false}
                          className="flex-1"
                        />
                        <span className="text-[11px] font-medium text-slate-600 w-10 text-right">
                          {d.averageProgressPercentage || 0}%
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

export default LearningTab;
