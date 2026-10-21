import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Users,
  FileCheck,
  CheckCircle2,
  ArrowRight,
  Plus,
  RefreshCw,
  Layers,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import trainerService from '../services/trainerService';
import StatCard from '../components/ui/StatCard';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import ErrorState from '../components/ui/ErrorState';
import TrainerStatusBadge from '../components/trainer/TrainerStatusBadge';
import ProgressBar from '../components/ui/ProgressBar';

export const TrainerDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const trainerUserId = user?._id || user?.id;

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const overview = await trainerService.getDashboardOverview(trainerUserId);
      setData(overview);
    } catch (err) {
      setError(err.message || 'Failed to load trainer dashboard.');
    } finally {
      setLoading(false);
    }
  }, [trainerUserId]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const courses = data?.courses || { total: 0, published: 0, draft: 0, list: [] };
  const assessments = data?.assessments || { total: 0, published: 0, draft: 0, list: [] };
  const learners = data?.learners || { total: 0, inProgress: 0, completed: 0, averageProgress: 0, list: [] };

  const recentCourses = courses.list.slice(0, 4);
  const recentEnrollments = learners.list.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-teal-900 to-slate-950 rounded-2xl p-6 sm:p-8 text-white shadow-md flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Trainer Hub — {user?.name || 'Instructor'}
          </h1>
          <p className="mt-2 text-slate-300 text-sm sm:text-base max-w-xl">
            Author courses, maintain curriculum modules, configure assessments, and review learner progress.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline-light"
            size="sm"
            onClick={loadDashboard}
            disabled={loading}
            className="flex items-center gap-1.5"
            aria-label="Refresh dashboard metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link to="/trainer/courses">
            <Button variant="primary" size="sm" className="flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              New Course
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </>
      ) : error && !data ? (
        <ErrorState
          title="Trainer Dashboard Unavailable"
          message={error}
          onRetry={loadDashboard}
        />
      ) : (
        <>
          {data?.errors && (data.errors.courses || data.errors.assessments || data.errors.enrollments) && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm flex items-center justify-between">
              <span>Some dashboard sections could not be loaded completely. Click refresh to retry.</span>
              <Button variant="ghost" size="sm" onClick={loadDashboard}>Retry</Button>
            </div>
          )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Assigned Courses"
          value={String(courses.total)}
          icon={<BookOpen className="w-5 h-5 text-teal-700" />}
          color="teal"
          description={`${courses.published} published, ${courses.draft} draft`}
        />
        <StatCard
          title="Active Enrollments"
          value={String(learners.total)}
          icon={<Users className="w-5 h-5 text-sky-600" />}
          color="sky"
          description={`${learners.inProgress} learning, ${learners.completed} completed`}
        />
        <StatCard
          title="Assessments Authored"
          value={String(assessments.total)}
          icon={<FileCheck className="w-5 h-5 text-amber-600" />}
          color="amber"
          description={`${assessments.published} active quizzes`}
        />
        <StatCard
          title="Avg Learner Progress"
          value={`${learners.averageProgress}%`}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          color="emerald"
          description="Across all cohorts"
        />
      </div>

      {/* Quick Action Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Link
          to="/trainer/courses"
          className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:shadow-md hover:border-teal-300 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-700 transition-colors" />
          </div>
          <h3 className="mt-4 font-semibold text-[#102A2A] dark:text-white">
            Manage Courses
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Create drafts, configure metadata, and publish courses for your learners.
          </p>
        </Link>

        <Link
          to="/trainer/assessments"
          className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:shadow-md hover:border-teal-300 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
              <FileCheck className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-700 transition-colors" />
          </div>
          <h3 className="mt-4 font-semibold text-[#102A2A] dark:text-white">
            Assessment Builder
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Design single &amp; multiple choice quizzes and configure passing scores.
          </p>
        </Link>

        <Link
          to="/trainer/learners"
          className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:shadow-md hover:border-teal-300 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-700 transition-colors" />
          </div>
          <h3 className="mt-4 font-semibold text-[#102A2A] dark:text-white">
            Learner Progress
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Monitor real-time course completions, active learners, and module progress.
          </p>
        </Link>
      </div>

      {/* Main Content Grid: Recent Courses & Learner Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Courses */}
        <Card>
          <Card.Header
            title="My Assigned Courses"
            subtitle="Recently updated courses and publication statuses"
            action={
              <Link to="/trainer/courses">
                <Button variant="ghost" size="sm" className="text-xs">
                  View All ({courses.total})
                </Button>
              </Link>
            }
          />
          <Card.Content className="p-0">
            {recentCourses.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No courses created yet. Click &quot;New Course&quot; to begin.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentCourses.map((c) => (
                  <div
                    key={c._id || c.id}
                    className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {c.title}
                        </h4>
                        <TrainerStatusBadge status={c.status} />
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {c.category} • {c.level} • {c.duration ? `${c.duration}h` : 'Self-paced'}
                      </p>
                    </div>

                    <Link to={`/trainer/courses/${c._id || c.id}/curriculum`}>
                      <Button variant="outline" size="sm" className="text-xs flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        Curriculum
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </Card.Content>
        </Card>

        {/* Recent Learner Activity */}
        <Card>
          <Card.Header
            title="Recent Learner Enrollments"
            subtitle="Latest active learners across your courses"
            action={
              <Link to="/trainer/learners">
                <Button variant="ghost" size="sm" className="text-xs">
                  View All ({learners.total})
                </Button>
              </Link>
            }
          />
          <Card.Content className="p-0">
            {recentEnrollments.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No enrollments recorded for your courses yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentEnrollments.map((e) => {
                  const learner = e.employee?.user;
                  const progress = e.progressPercentage || 0;
                  return (
                    <div
                      key={e._id || e.id}
                      className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="min-w-0">
                        <h4 className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {learner?.name || 'Learner'}
                        </h4>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {e.course?.title || 'Course'}
                        </p>
                      </div>

                      <div className="w-28 text-right space-y-1 shrink-0">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {progress}%
                        </span>
                        <ProgressBar value={progress} size="sm" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card.Content>
        </Card>
      </div>
        </>
      )}
    </div>
  );
};

export default TrainerDashboard;
