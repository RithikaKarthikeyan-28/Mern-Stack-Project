import React, { useState, useMemo } from 'react';
import { Search, Users, CheckCircle, Clock } from 'lucide-react';
import ProgressBar from '../ui/ProgressBar';

export const LearnerProgressTable = ({
  enrollments = [],
  courses = [],
  selectedCourseId = '',
  onCourseChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const validEnrollments = useMemo(() => {
    return enrollments.filter((e) => e && e.employee);
  }, [enrollments]);

  const filteredEnrollments = useMemo(() => {
    return validEnrollments.filter((enrollment) => {
      // Course filter
      if (selectedCourseId) {
        const courseId =
          enrollment.course?._id || enrollment.course?.id || enrollment.course;
        if (courseId !== selectedCourseId) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && enrollment.status !== statusFilter) {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const employeeName = (
          enrollment.employee?.user?.name || ''
        ).toLowerCase();
        const employeeEmail = (
          enrollment.employee?.user?.email || ''
        ).toLowerCase();
        const employeeId = (enrollment.employee?.employeeId || '').toLowerCase();
        const courseTitle = (enrollment.course?.title || '').toLowerCase();
        const dept = (
          enrollment.employee?.department?.name || ''
        ).toLowerCase();

        return (
          employeeName.includes(term) ||
          employeeEmail.includes(term) ||
          employeeId.includes(term) ||
          courseTitle.includes(term) ||
          dept.includes(term)
        );
      }

      return true;
    });
  }, [validEnrollments, selectedCourseId, statusFilter, searchTerm]);

  const statusBadge = (status) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300">
            <CheckCircle className="w-3 h-3" />
            Completed
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-800 border border-teal-200 dark:bg-teal-950/40 dark:text-teal-300">
            <Clock className="w-3 h-3" />
            In Progress
          </span>
        );
      case 'dropped':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300">
            Dropped
          </span>
        );
      case 'enrolled':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300">
            Enrolled
          </span>
        );
    }
  };

  const statusTabs = [
    { id: 'all', label: 'All Learners', count: validEnrollments.length },
    {
      id: 'in_progress',
      label: 'In Progress',
      count: validEnrollments.filter((e) => e.status === 'in_progress').length,
    },
    {
      id: 'completed',
      label: 'Completed',
      count: validEnrollments.filter((e) => e.status === 'completed').length,
    },
    {
      id: 'enrolled',
      label: 'Not Started',
      count: validEnrollments.filter((e) => e.status === 'enrolled').length,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by learner name, email, or course..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-brand-ink-primary dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
            aria-label="Search learners"
          />
        </div>

        {courses.length > 0 && onCourseChange && (
          <div className="shrink-0 w-full sm:w-64">
            <select
              value={selectedCourseId}
              onChange={(e) => onCourseChange(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-brand-ink-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
              aria-label="Filter by course"
            >
              <option value="">All Assigned Courses</option>
              {courses.map((c) => (
                <option key={c._id || c.id} value={c._id || c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800">
        {statusTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              statusFilter === tab.id
                ? 'bg-teal-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 font-semibold'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                statusFilter === tab.id
                  ? 'bg-teal-200/60 text-teal-900 dark:bg-teal-900 dark:text-teal-200'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Learners Table / List */}
      {filteredEnrollments.length === 0 ? (
        <div className="py-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <Users className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-60" />
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            No learners found
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {searchTerm || statusFilter !== 'all' || selectedCourseId
              ? 'Try adjusting your filters or search keywords.'
              : 'Learners enrolled in your courses will appear here.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th scope="col" className="px-4 py-3">
                  Learner
                </th>
                <th scope="col" className="px-4 py-3">
                  ID &amp; Department
                </th>
                <th scope="col" className="px-4 py-3">
                  Course
                </th>
                <th scope="col" className="px-4 py-3">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 min-w-[140px]">
                  Progress
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredEnrollments.map((enrollment) => {
                const enrollmentId = enrollment._id || enrollment.id;
                const employeeUser = enrollment.employee?.user;
                const learnerName = employeeUser?.name || 'Learner';
                const learnerEmail = employeeUser?.email || '';
                const employeeId = enrollment.employee?.employeeId || '—';
                const departmentName =
                  enrollment.employee?.department?.name || 'General';
                const courseTitle =
                  enrollment.course?.title || 'Assigned Course';
                const progress = enrollment.progressPercentage || 0;

                return (
                  <tr
                    key={enrollmentId}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                    data-testid={`learner-row-${enrollmentId}`}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">
                          {learnerName}
                        </div>
                        {learnerEmail && (
                          <div className="text-xs text-slate-500">
                            {learnerEmail}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-xs">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {employeeId}
                      </div>
                      <div className="text-slate-500">{departmentName}</div>
                    </td>

                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white text-xs max-w-xs truncate">
                      {courseTitle}
                    </td>

                    <td className="px-4 py-3">
                      {statusBadge(enrollment.status)}
                    </td>

                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {progress}%
                          </span>
                        </div>
                        <ProgressBar value={progress} size="sm" />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LearnerProgressTable;
