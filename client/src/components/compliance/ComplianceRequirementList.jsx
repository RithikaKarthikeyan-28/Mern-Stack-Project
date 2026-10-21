import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Search,
  ArrowUpDown,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  AlertCircle,
  Clock,
  Layers,
} from 'lucide-react';
import ComplianceRequirementCard from './ComplianceRequirementCard';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';

export const ComplianceRequirementList = ({ assignments = [], className = '' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('due_asc');

  // Counts for tabs
  const counts = useMemo(() => {
    let overdue = 0;
    let dueSoon = 0;
    let inProgress = 0;
    let compliant = 0;
    let actionRequired = 0;

    assignments.forEach((a) => {
      const s = (a.status || '').toUpperCase();
      if (s === 'OVERDUE') {
        overdue++;
        actionRequired++;
      } else if (s === 'DUE_SOON') {
        dueSoon++;
        actionRequired++;
      } else if (s === 'IN_PROGRESS' || s === 'NOT_STARTED') {
        inProgress++;
        actionRequired++;
      } else if (s === 'COMPLIANT') {
        compliant++;
      }
    });

    return {
      all: assignments.length,
      actionRequired,
      overdue,
      dueSoon,
      inProgress,
      compliant,
    };
  }, [assignments]);

  // Filtered and sorted assignments
  const filteredAssignments = useMemo(() => {
    let result = [...assignments];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((a) => {
        const req = a.complianceRequirement || a.requirement || {};
        const course = req.course || a.course || {};
        const title = (req.title || '').toLowerCase();
        const desc = (req.description || '').toLowerCase();
        const courseTitle = (course.title || '').toLowerCase();
        return title.includes(q) || desc.includes(q) || courseTitle.includes(q);
      });
    }

    // Status filter
    if (statusFilter === 'ACTION_REQUIRED') {
      result = result.filter((a) => (a.status || '').toUpperCase() !== 'COMPLIANT');
    } else if (statusFilter !== 'ALL') {
      result = result.filter((a) => (a.status || '').toUpperCase() === statusFilter);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'due_asc') {
        return new Date(a.dueAt || 0) - new Date(b.dueAt || 0);
      }
      if (sortBy === 'due_desc') {
        return new Date(b.dueAt || 0) - new Date(a.dueAt || 0);
      }
      if (sortBy === 'title_asc') {
        const titleA = (a.complianceRequirement?.title || a.requirement?.title || '').toLowerCase();
        const titleB = (b.complianceRequirement?.title || b.requirement?.title || '').toLowerCase();
        return titleA.localeCompare(titleB);
      }
      return 0;
    });

    return result;
  }, [assignments, searchQuery, statusFilter, sortBy]);

  return (
    <div
      data-testid="compliance-requirement-list"
      className={`space-y-6 ${className}`}
    >
      {/* 1. Filter Chips Toolbar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
        {[
          { key: 'ALL', label: 'All Policies', count: counts.all, icon: Layers },
          { key: 'ACTION_REQUIRED', label: 'Action Required', count: counts.actionRequired, icon: AlertCircle, badgeClass: counts.actionRequired > 0 ? 'bg-amber-100 text-amber-800' : '' },
          { key: 'OVERDUE', label: 'Overdue', count: counts.overdue, icon: AlertOctagon, badgeClass: counts.overdue > 0 ? 'bg-rose-100 text-rose-800' : '' },
          { key: 'DUE_SOON', label: 'Due Soon', count: counts.dueSoon, icon: AlertTriangle, badgeClass: counts.dueSoon > 0 ? 'bg-amber-100 text-amber-800' : '' },
          { key: 'IN_PROGRESS', label: 'In Progress', count: counts.inProgress, icon: Clock },
          { key: 'COMPLIANT', label: 'Compliant', count: counts.compliant, icon: CheckCircle2, badgeClass: counts.compliant > 0 ? 'bg-emerald-100 text-emerald-800' : '' },
        ].map((tab) => {
          const isActive = statusFilter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              data-testid={`compliance-filter-${tab.key.toLowerCase()}`}
              onClick={() => setStatusFilter(tab.key)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive
                    ? 'bg-teal-800 text-white'
                    : tab.badgeClass || 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 2. Search & Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            data-testid="compliance-search-input"
            placeholder="Search requirements or courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-slate-400" />
          <select
            data-testid="compliance-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-xs font-medium text-slate-700 py-2 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600/20 bg-white"
          >
            <option value="due_asc">Deadline: Earliest First</option>
            <option value="due_desc">Deadline: Latest First</option>
            <option value="title_asc">Title: A to Z</option>
          </select>
        </div>
      </div>

      {/* 3. Cards Grid or Empty State */}
      {filteredAssignments.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="w-7 h-7 text-teal-700" />}
          title={
            assignments.length === 0
              ? 'No compliance requirements assigned'
              : 'No matching requirements found'
          }
          description={
            assignments.length === 0
              ? 'Your employee profile does not currently have any active compliance policy requirements assigned.'
              : 'Try clearing your search query or switching to a different status filter.'
          }
          action={
            assignments.length > 0 ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                }}
              >
                Reset Filters
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssignments.map((assignment) => (
            <ComplianceRequirementCard
              key={assignment._id || assignment.id}
              assignment={assignment}
            />
          ))}
        </div>
      )}
    </div>
  );
};

ComplianceRequirementList.propTypes = {
  assignments: PropTypes.array,
  className: PropTypes.string,
};

export default ComplianceRequirementList;
