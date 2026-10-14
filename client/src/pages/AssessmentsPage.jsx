import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FileCheck,
  Search,
  CheckCircle2,
  XCircle,
  Award,
  Layers,
  ArrowRight,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import StatCard from '../components/ui/StatCard';
import assessmentService from '../services/assessmentService';

export const AssessmentsPage = () => {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'passed', 'failed'

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await assessmentService.getMyAssessmentHistory();
      setHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load assessment history.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Derived KPI metrics
  const stats = useMemo(() => {
    const total = history.length;
    const passed = history.filter((h) => h.result === 'passed').length;
    const failed = total - passed;
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

    const avgScore = total > 0
      ? Math.round(history.reduce((sum, h) => sum + (h.percentage || 0), 0) / total)
      : 0;

    return { total, passed, failed, passRate, avgScore };
  }, [history]);

  // Filtered assessment attempts
  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      const matchesSearch =
        !searchQuery.trim() ||
        (item.assessmentTitle || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.courseTitle || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        item.result === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [history, searchQuery, statusFilter]);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-12" data-testid="assessments-page-skeleton">
        <div className="space-y-2">
          <Skeleton height="32px" width="220px" className="rounded-lg" />
          <Skeleton height="16px" width="360px" className="rounded-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height="100px" className="rounded-2xl" />
          ))}
        </div>
        <Card className="p-6">
          <Skeleton height="200px" className="rounded-xl" />
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <ErrorState
          title="Error Loading Assessments"
          message={error}
          onRetry={fetchHistory}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12" data-testid="assessments-page">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          My Assessments
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Review your quiz submissions, test scores, and grading evaluations across all enrolled courses.
        </p>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Attempts"
          value={stats.total}
          subtitle="All completed submissions"
          icon={<FileCheck className="w-5 h-5 text-indigo-600" />}
        />
        <StatCard
          title="Passed Quizzes"
          value={stats.passed}
          subtitle="Met passing criteria"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
        />
        <StatCard
          title="Overall Pass Rate"
          value={`${stats.passRate}%`}
          subtitle="Success percentage"
          icon={<Award className="w-5 h-5 text-sky-600" />}
        />
        <StatCard
          title="Average Score"
          value={`${stats.avgScore}%`}
          subtitle="Across all attempts"
          icon={<Layers className="w-5 h-5 text-purple-600" />}
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search by assessment or course title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            size="sm"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              statusFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({stats.total})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('passed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              statusFilter === 'passed'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Passed ({stats.passed})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('failed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              statusFilter === 'failed'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Failed ({stats.failed})
          </button>
        </div>
      </div>

      {/* Attempts List / Table */}
      {filteredHistory.length === 0 ? (
        <Card className="py-12">
          <EmptyState
            title={history.length === 0 ? 'No Assessments Taken Yet' : 'No Matching Assessments'}
            description={
              history.length === 0
                ? 'Complete learning lessons in your enrolled courses to take interactive module and final evaluations.'
                : 'Try adjusting your search query or filter to find what you are looking for.'
            }
            actionText={history.length === 0 ? 'Browse Courses' : 'Clear Filters'}
            onAction={
              history.length === 0
                ? () => {}
                : () => {
                    setSearchQuery('');
                    setStatusFilter('all');
                  }
            }
          />
        </Card>
      ) : (
        <Card padding={false} className="border-slate-200/90 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" role="table">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th scope="col" className="px-6 py-4">Assessment</th>
                  <th scope="col" className="px-6 py-4">Course</th>
                  <th scope="col" className="px-6 py-4">Attempt</th>
                  <th scope="col" className="px-6 py-4">Score</th>
                  <th scope="col" className="px-6 py-4">Percentage</th>
                  <th scope="col" className="px-6 py-4">Result</th>
                  <th scope="col" className="px-6 py-4">Date</th>
                  <th scope="col" className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredHistory.map((item) => {
                  const attemptId = item.attemptId || item.id;
                  const assessmentId = item.assessmentId;
                  const isPassed = item.result === 'passed';
                  const formattedDate = item.submittedAt || item.evaluatedAt
                    ? new Date(item.submittedAt || item.evaluatedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : '—';

                  return (
                    <tr key={attemptId} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">
                        <Link
                          to={`/assessments/${assessmentId}`}
                          className="hover:text-indigo-600 transition-colors"
                        >
                          {item.assessmentTitle || 'Assessment'}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {item.courseTitle || '—'}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-700">
                        #{item.attemptNumber || 1}
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {item.obtainedMarks != null && item.totalMarks != null
                          ? `${item.obtainedMarks} / ${item.totalMarks}`
                          : '—'}
                      </td>
                      <td className="px-6 py-4 font-bold">
                        <span className={isPassed ? 'text-emerald-700' : 'text-rose-700'}>
                          {item.percentage != null ? `${item.percentage}%` : '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={isPassed ? 'success' : 'danger'}
                          size="sm"
                          className="font-medium"
                        >
                          {isPassed ? (
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Passed
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              Failed
                            </span>
                          )}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {formattedDate}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link to={`/assessments/${assessmentId}/result/${attemptId}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                            >
                              View Result
                            </Button>
                          </Link>
                          <Link to={`/assessments/${assessmentId}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                            >
                              Details
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AssessmentsPage;
