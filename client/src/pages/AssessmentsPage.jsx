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
  Lock,
  PlayCircle,
  Clock,
  BookOpen,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import ProgressBar from '../components/ui/ProgressBar';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import StatCard from '../components/ui/StatCard';
import assessmentService from '../services/assessmentService';

export const AssessmentsPage = () => {
  const [history, setHistory] = useState([]);
  const [courseAssessments, setCourseAssessments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'passed', 'failed'
  const [courseFilter, setCourseFilter] = useState('all'); // 'all', 'available', 'passed', 'locked'

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [historyRes, assessmentsRes] = await Promise.allSettled([
        assessmentService.getMyAssessmentHistory(),
        assessmentService.getAssessments ? assessmentService.getAssessments() : Promise.resolve([]),
      ]);

      if (historyRes.status === 'rejected') {
        throw new Error(
          historyRes.reason?.response?.data?.message ||
          historyRes.reason?.message ||
          'Failed to load assessment history.'
        );
      }

      setHistory(Array.isArray(historyRes.value) ? historyRes.value : []);

      if (assessmentsRes.status === 'fulfilled') {
        setCourseAssessments(Array.isArray(assessmentsRes.value) ? assessmentsRes.value : []);
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load assessment data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derived KPI metrics from attempt history
  const stats = useMemo(() => {
    const total = history.length;
    const passed = history.filter((h) => h.result === 'passed').length;
    const failed = total - passed;
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

    const avgScore =
      total > 0
        ? Math.round(history.reduce((sum, h) => sum + (h.percentage || 0), 0) / total)
        : 0;

    return { total, passed, failed, passRate, avgScore };
  }, [history]);

  // Filtered course assessments
  const filteredAssessments = useMemo(() => {
    return courseAssessments.filter((asm) => {
      const statusBadge = asm.learnerStatus?.statusBadge || 'Not Started';

      if (courseFilter === 'available') {
        return statusBadge === 'Assessment Available';
      }
      if (courseFilter === 'passed') {
        return statusBadge === 'Passed';
      }
      if (courseFilter === 'locked') {
        return statusBadge === 'Not Started' || (!asm.learnerStatus?.isUnlocked && statusBadge !== 'Passed');
      }
      return true;
    });
  }, [courseAssessments, courseFilter]);

  // Filtered assessment attempts
  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      const matchesSearch =
        !searchQuery.trim() ||
        (item.assessmentTitle || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.courseTitle || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || item.result === statusFilter;

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
          onRetry={fetchData}
        />
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-12" data-testid="assessments-page">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#102A2A] tracking-tight">
            My Assessments
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review your quiz submissions, test scores, and grading evaluations across all enrolled courses.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={isLoading}
            className="flex items-center gap-1.5"
            aria-label="Refresh assessments"
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Attempts"
          value={stats.total}
          subtitle="All completed submissions"
          icon={<FileCheck className="w-5 h-5 text-teal-700" />}
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

      {/* SECTION 1: Technical Course Certification Assessments (10 Courses) */}
      {courseAssessments.length > 0 && (
        <div className="space-y-4" data-testid="course-assessments-section">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-teal-700" />
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  Course Certification Assessments
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Each assessment unlocks after completing 100% of the course lessons. Score 70% or higher to earn certification.
              </p>
            </div>

            {/* Quick Filter for Course Assessments */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { key: 'all', label: `All (${courseAssessments.length})` },
                {
                  key: 'available',
                  label: `Available (${courseAssessments.filter((a) => a.learnerStatus?.statusBadge === 'Assessment Available').length})`,
                },
                {
                  key: 'passed',
                  label: `Passed (${courseAssessments.filter((a) => a.learnerStatus?.statusBadge === 'Passed').length})`,
                },
                {
                  key: 'locked',
                  label: `Locked (${courseAssessments.filter((a) => a.learnerStatus?.statusBadge === 'Not Started' || !a.learnerStatus?.isUnlocked).length})`,
                },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setCourseFilter(tab.key)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    courseFilter === tab.key
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAssessments.map((asm) => {
              const learner = asm.learnerStatus || {};
              const statusBadge = learner.statusBadge || 'Not Started';
              const courseObj = asm.course || {};
              const courseId = courseObj._id || courseObj.id || courseObj;
              const courseTitle = courseObj.title || 'Course';

              // Badge variant and icon mapping
              const badgeConfig = {
                Passed: { variant: 'success', text: 'Passed', icon: CheckCircle2 },
                'Assessment Available': { variant: 'primary', text: 'Assessment Available', icon: Award },
                'In Progress': { variant: 'warning', text: 'In Progress', icon: PlayCircle },
                Failed: { variant: 'danger', text: 'Failed', icon: XCircle },
                'Not Started': { variant: 'default', text: 'Not Started', icon: Lock },
              }[statusBadge] || { variant: 'default', text: statusBadge, icon: Lock };

              const BadgeIcon = badgeConfig.icon;

              return (
                <Card
                  key={asm._id}
                  className="p-5 border-slate-200/90 hover:border-teal-200 transition-all flex flex-col justify-between space-y-4 shadow-xs"
                >
                  <div className="space-y-3">
                    {/* Top Row: Category + Status Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold tracking-wide uppercase text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
                        {courseObj.category || 'Certification'}
                      </span>
                      <Badge variant={badgeConfig.variant} size="sm" dot>
                        <span className="flex items-center gap-1">
                          <BadgeIcon className="w-3 h-3" />
                          {badgeConfig.text}
                        </span>
                      </Badge>
                    </div>

                    {/* Title & Linked Course */}
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                        {asm.title}
                      </h3>
                      <Link
                        to={`/courses/${courseId}`}
                        className="text-xs text-slate-500 hover:text-teal-700 line-clamp-1 mt-0.5 transition-colors"
                      >
                        Course: {courseTitle}
                      </Link>
                    </div>

                    {/* Meta Specifications */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-teal-600" />
                        <span>10 MCQs (20 Marks)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-teal-600" />
                        <span>{asm.timeLimitMinutes || 30} Minutes</span>
                      </div>
                      <div className="flex items-center gap-1.5 col-span-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                        <span>Passing Threshold: {asm.passingPercentage || 70}% (14/20 marks)</span>
                      </div>
                    </div>

                    {/* Course Progress Gating Indicator */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10px] text-slate-500">
                        <span>Course Completion Prerequisite</span>
                        <span className="font-semibold">{learner.courseProgress || 0}%</span>
                      </div>
                      <ProgressBar
                        value={learner.courseProgress || 0}
                        max={100}
                        size="xs"
                        color={learner.isCourseCompleted ? 'emerald' : 'teal'}
                      />
                    </div>
                  </div>

                  {/* Card Action */}
                  <div className="pt-2 border-t border-slate-100">
                    {statusBadge === 'Passed' ? (
                      <div className="flex items-center gap-2">
                        {learner.certificate?.id ? (
                          <Link to={`/certificates/${learner.certificate.id}`} className="flex-1">
                            <Button
                              variant="primary"
                              size="sm"
                              className="w-full justify-center bg-teal-700 hover:bg-teal-800 text-white"
                              leftIcon={<Award className="w-3.5 h-3.5" />}
                            >
                              View Certificate
                            </Button>
                          </Link>
                        ) : null}
                        <Link to={`/assessments/${asm._id}`} className={learner.certificate?.id ? '' : 'flex-1'}>
                          <Button variant="outline" size="sm" className="w-full justify-center">
                            Review Details
                          </Button>
                        </Link>
                      </div>
                    ) : statusBadge === 'Assessment Available' ? (
                      <Link to={`/assessments/${asm._id}`} className="block">
                        <Button
                          variant="primary"
                          size="sm"
                          className="w-full justify-center bg-teal-700 hover:bg-teal-800 text-white"
                          leftIcon={<Award className="w-3.5 h-3.5" />}
                          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                        >
                          Start Assessment
                        </Button>
                      </Link>
                    ) : statusBadge === 'Failed' ? (
                      <Link to={`/assessments/${asm._id}`} className="block">
                        <Button
                          variant="primary"
                          size="sm"
                          className="w-full justify-center bg-rose-600 hover:bg-rose-700 text-white"
                          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                        >
                          Retake Assessment
                        </Button>
                      </Link>
                    ) : statusBadge === 'In Progress' ? (
                      <Link
                        to={learner.isUnlocked ? `/assessments/${asm._id}` : `/learn/${courseId}`}
                        className="block"
                      >
                        <Button variant="secondary" size="sm" className="w-full justify-center">
                          {learner.isUnlocked ? 'Resume Assessment' : 'Resume Course Lessons'}
                        </Button>
                      </Link>
                    ) : (
                      <Link to={`/courses/${courseId}`} className="block">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-center text-slate-600"
                          leftIcon={<Lock className="w-3.5 h-3.5 text-slate-400" />}
                        >
                          View Course to Unlock
                        </Button>
                      </Link>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 2: Attempt History & Submissions Table */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Attempt History & Grading Evaluations
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Log of all completed test attempts and evaluated marks
          </p>
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
                  ? 'bg-teal-700 text-white shadow-xs'
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
                        <td className="px-6 py-4 font-bold text-[#102A2A]">
                          <Link
                            to={`/assessments/${assessmentId}`}
                            className="hover:text-teal-700 transition-colors"
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
                                className="text-teal-700 hover:text-teal-800 hover:bg-teal-50"
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
    </div>
  );
};

export default AssessmentsPage;
