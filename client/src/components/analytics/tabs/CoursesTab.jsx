import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Award,
  Search,
  ArrowUpDown,
} from 'lucide-react';
import MetricCard from '../MetricCard';

export const CoursesTab = ({ data }) => {
  const courseData = useMemo(
    () => data?.courses?.courses || data?.learning?.courseBreakdown || [],
    [data]
  );
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('title');
  const [sortAsc, setSortAsc] = useState(true);

  const totalCourses = courseData.length;
  const totalEnrollments = courseData.reduce((sum, c) => sum + (c.enrollmentCount || 0), 0);
  const totalCompletions = courseData.reduce((sum, c) => sum + (c.completedCount || 0), 0);
  const avgCompletionRate =
    totalCourses > 0
      ? Math.round(
          courseData.reduce((sum, c) => sum + (c.completionRate || 0), 0) / totalCourses
        )
      : 100;

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedAndFiltered = useMemo(() => {
    let result = [...courseData];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((c) => (c.title || '').toLowerCase().includes(q));
    }

    result.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

    return result;
  }, [courseData, search, sortField, sortAsc]);

  return (
    <div className="space-y-6" data-testid="analytics-courses-tab">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Catalog Courses"
          value={totalCourses}
          subtext="Total analyzed curriculum courses"
          icon={BookOpen}
          variant="default"
        />
        <MetricCard
          title="Curriculum Enrollments"
          value={totalEnrollments}
          subtext={`${totalCompletions} total completions`}
          icon={CheckCircle2}
          variant="info"
        />
        <MetricCard
          title="Mean Completion Rate"
          value={`${avgCompletionRate}%`}
          subtext="Average across catalog offerings"
          icon={CheckCircle2}
          variant={avgCompletionRate >= 75 ? 'success' : avgCompletionRate >= 50 ? 'warning' : 'danger'}
          progress={avgCompletionRate}
        />
        <MetricCard
          title="Total Completions"
          value={totalCompletions}
          subtext="Graduated learners across all courses"
          icon={Award}
          variant="purple"
        />
      </div>

      {/* Course Comparative Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="text-sm font-semibold text-brand-ink-primary dark:text-white">Course Performance & Outcome Matrix</h3>
            <p className="text-xs text-slate-500">Cross-course volume, assessment pass rates, and certification awards</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search courses..."
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
                <th
                  className="py-3 px-4 cursor-pointer select-none hover:text-teal-700"
                  onClick={() => handleSort('title')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Course Title</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th
                  className="py-3 px-4 text-center cursor-pointer select-none hover:text-teal-700"
                  onClick={() => handleSort('enrollmentCount')}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Enrollments</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th
                  className="py-3 px-4 text-center cursor-pointer select-none hover:text-teal-700"
                  onClick={() => handleSort('completedCount')}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Completed</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th
                  className="py-3 px-4 text-center cursor-pointer select-none hover:text-teal-700"
                  onClick={() => handleSort('completionRate')}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Completion Rate</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th
                  className="py-3 px-4 text-center cursor-pointer select-none hover:text-teal-700"
                  onClick={() => handleSort('assessmentPassRate')}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Pass Rate</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th
                  className="py-3 px-4 text-center cursor-pointer select-none hover:text-teal-700"
                  onClick={() => handleSort('certificateCount')}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Certificates</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {sortedAndFiltered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    No courses found.
                  </td>
                </tr>
              ) : (
                sortedAndFiltered.map((c) => (
                  <tr key={c.courseId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-medium text-brand-ink-primary dark:text-white">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                        <span>{c.title}</span>
                        {c.status && (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                              c.status === 'published'
                                ? 'bg-emerald-50 text-emerald-700'
                                : c.status === 'draft'
                                ? 'bg-slate-100 text-slate-600'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {c.status}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-semibold">{c.enrollmentCount}</td>
                    <td className="py-3 px-4 text-center text-emerald-600 font-semibold">{c.completedCount}</td>
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
                    <td className="py-3 px-4 text-center font-medium text-slate-800">
                      {typeof c.assessmentPassRate === 'number' ? `${c.assessmentPassRate}%` : '—'}
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-teal-700">
                      {c.certificateCount ?? '—'}
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

export default CoursesTab;
