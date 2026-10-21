import React, { useState } from 'react';
import { Calendar, Filter, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import Button from '../ui/Button';

export const AnalyticsFilterBar = ({
  filters,
  onFilterChange,
  onResetFilters,
  departments = [],
  courses = [],
  className = '',
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Date range presets helper
  const handlePresetChange = (preset) => {
    if (preset === 'all') {
      onFilterChange({ datePreset: 'all', from: '', to: '' });
      return;
    }

    const today = new Date();
    const toStr = today.toISOString().slice(0, 10);
    const past = new Date(today);

    if (preset === '7d') past.setDate(today.getDate() - 7);
    else if (preset === '30d') past.setDate(today.getDate() - 30);
    else if (preset === '90d') past.setDate(today.getDate() - 90);
    else if (preset === '1y') past.setFullYear(today.getFullYear() - 1);

    const fromStr = past.toISOString().slice(0, 10);
    onFilterChange({ datePreset: preset, from: fromStr, to: toStr });
  };

  const hasActiveFilters = Boolean(
    (filters.datePreset && filters.datePreset !== 'all') ||
      filters.from ||
      filters.to ||
      filters.departmentId ||
      filters.courseId ||
      filters.status
  );

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm space-y-3 ${className}`}
      data-testid="analytics-filter-bar"
    >
      {/* Top Bar: Quick Date Range & Primary Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Preset Date Range Buttons */}
        <div className="flex items-center flex-wrap gap-1.5" role="group" aria-label="Date range presets">
          <span className="text-xs font-medium text-slate-500 mr-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            Range:
          </span>
          {[
            { id: 'all', label: 'All Time' },
            { id: '7d', label: '7 Days' },
            { id: '30d', label: '30 Days' },
            { id: '90d', label: '90 Days' },
            { id: 'custom', label: 'Custom' },
          ].map((preset) => {
            const isActive = (filters.datePreset || 'all') === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  if (preset.id === 'custom') {
                    onFilterChange({ datePreset: 'custom' });
                    setShowAdvanced(true);
                  } else {
                    handlePresetChange(preset.id);
                  }
                }}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-teal-700 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
                aria-pressed={isActive}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 ml-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced((prev) => !prev)}
            className="text-slate-600 hover:text-slate-900 text-xs flex items-center gap-1"
            aria-expanded={showAdvanced}
            aria-label="Toggle filter options"
          >
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Filters</span>
            {showAdvanced ? (
              <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            )}
          </Button>

          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onResetFilters}
              className="text-xs text-rose-600 hover:bg-rose-50 border-rose-200 flex items-center gap-1"
              aria-label="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </Button>
          )}
        </div>
      </div>

      {/* Advanced Filter Drawer / Controls */}
      {showAdvanced && (
        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Custom Date: From */}
          <div>
            <label htmlFor="filter-from-date" className="block text-xs font-medium text-slate-600 mb-1">
              From Date
            </label>
            <input
              id="filter-from-date"
              type="date"
              value={filters.from || ''}
              onChange={(e) =>
                onFilterChange({ from: e.target.value, datePreset: 'custom' })
              }
              className="w-full text-xs rounded-lg border border-slate-200 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
            />
          </div>

          {/* Custom Date: To */}
          <div>
            <label htmlFor="filter-to-date" className="block text-xs font-medium text-slate-600 mb-1">
              To Date
            </label>
            <input
              id="filter-to-date"
              type="date"
              value={filters.to || ''}
              onChange={(e) =>
                onFilterChange({ to: e.target.value, datePreset: 'custom' })
              }
              className="w-full text-xs rounded-lg border border-slate-200 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
            />
          </div>

          {/* Department Filter */}
          <div>
            <label htmlFor="filter-department" className="block text-xs font-medium text-slate-600 mb-1">
              Department
            </label>
            <select
              id="filter-department"
              value={filters.departmentId || ''}
              onChange={(e) => onFilterChange({ departmentId: e.target.value })}
              className="w-full text-xs rounded-lg border border-slate-200 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 bg-white"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          {/* Course Filter */}
          <div>
            <label htmlFor="filter-course" className="block text-xs font-medium text-slate-600 mb-1">
              Course
            </label>
            <select
              id="filter-course"
              value={filters.courseId || ''}
              onChange={(e) => onFilterChange({ courseId: e.target.value })}
              className="w-full text-xs rounded-lg border border-slate-200 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 bg-white"
            >
              <option value="">All Courses</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Active Filter Badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs text-slate-500">
          <span className="font-medium text-slate-600">Active filters:</span>
          {filters.from && filters.to && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-teal-50 text-teal-800 font-medium">
              {filters.from} to {filters.to}
            </span>
          )}
          {filters.departmentId && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-slate-100 text-slate-700 font-medium">
              Dept: {departments.find((d) => d._id === filters.departmentId)?.name || 'Selected'}
            </span>
          )}
          {filters.courseId && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-slate-100 text-slate-700 font-medium">
              Course: {courses.find((c) => c._id === filters.courseId)?.title || 'Selected'}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default AnalyticsFilterBar;
