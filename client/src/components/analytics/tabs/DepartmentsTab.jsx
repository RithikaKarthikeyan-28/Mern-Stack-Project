import React, { useState, useMemo } from 'react';
import {
  Building2,
  Users,
  BookOpen,
  ShieldCheck,
  Search,
  ArrowUpDown,
} from 'lucide-react';
import MetricCard from '../MetricCard';
import ProgressBar from '../../ui/ProgressBar';

export const DepartmentsTab = ({ data }) => {
  const deptData = useMemo(
    () => data?.departments?.departments || data?.learning?.departmentBreakdown || [],
    [data]
  );
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('departmentName');
  const [sortAsc, setSortAsc] = useState(true);

  const totalDepts = deptData.length;
  const totalEmployees = deptData.reduce((sum, d) => sum + (d.employeeCount || 0), 0);
  const totalEnrollments = deptData.reduce((sum, d) => sum + (d.enrollmentCount || 0), 0);
  const avgCompliance =
    totalDepts > 0
      ? Math.round(
          deptData.reduce((sum, d) => sum + (d.complianceRate || 0), 0) / totalDepts
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
    let result = [...deptData];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((d) => (d.departmentName || '').toLowerCase().includes(q));
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
  }, [deptData, search, sortField, sortAsc]);

  return (
    <div className="space-y-6" data-testid="analytics-departments-tab">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Departments"
          value={totalDepts}
          subtext="Operational business divisions"
          icon={Building2}
          variant="default"
        />
        <MetricCard
          title="Workforce Across Depts"
          value={totalEmployees}
          subtext="Total assigned employees"
          icon={Users}
          variant="info"
        />
        <MetricCard
          title="Course Enrollments"
          value={totalEnrollments}
          subtext="Active & completed enrollments"
          icon={BookOpen}
          variant="purple"
        />
        <MetricCard
          title="Average Compliance"
          value={`${avgCompliance}%`}
          subtext="Mean adherence across divisions"
          icon={ShieldCheck}
          variant={avgCompliance >= 90 ? 'success' : avgCompliance >= 70 ? 'warning' : 'danger'}
          progress={avgCompliance}
        />
      </div>

      {/* Comparative Department Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="text-sm font-semibold text-brand-ink-primary dark:text-white">Department Comparative Analytics</h3>
            <p className="text-xs text-slate-500">Cross-department metrics across staffing, learning completion, and compliance</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search departments..."
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
                  onClick={() => handleSort('departmentName')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Department</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th
                  className="py-3 px-4 text-center cursor-pointer select-none hover:text-teal-700"
                  onClick={() => handleSort('employeeCount')}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Employees</span>
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
                  onClick={() => handleSort('completionCount')}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Completions</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th
                  className="py-3 px-4 text-center cursor-pointer select-none hover:text-teal-700"
                  onClick={() => handleSort('averageProgressPercentage')}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Avg Progress</span>
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
                  className="py-3 px-4 min-w-[130px] cursor-pointer select-none hover:text-teal-700"
                  onClick={() => handleSort('complianceRate')}
                >
                  <div className="flex items-center gap-1">
                    <span>Compliance</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {sortedAndFiltered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    No departments found.
                  </td>
                </tr>
              ) : (
                sortedAndFiltered.map((d) => (
                  <tr key={d.departmentId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-medium text-brand-ink-primary dark:text-white flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {d.departmentName}
                    </td>
                    <td className="py-3 px-4 text-center font-medium">
                      {d.employeeCount} <span className="text-[11px] text-slate-400">({d.activeEmployeeCount ?? d.employeeCount} active)</span>
                    </td>
                    <td className="py-3 px-4 text-center font-semibold">{d.enrollmentCount}</td>
                    <td className="py-3 px-4 text-center text-emerald-600 font-semibold">{d.completionCount ?? d.completedEnrollments ?? 0}</td>
                    <td className="py-3 px-4 text-center font-medium text-slate-700">{d.averageProgressPercentage || 0}%</td>
                    <td className="py-3 px-4 text-center font-medium text-slate-800">
                      {typeof d.assessmentPassRate === 'number' ? `${d.assessmentPassRate}%` : '—'}
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

export default DepartmentsTab;
