import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Building2,
  ShieldCheck,
  Award,
  BookOpen,
  FileCheck,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import adminService from '../services/adminService';
import StatCard from '../components/ui/StatCard';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import ErrorState from '../components/ui/ErrorState';
import ProgressBar from '../components/ui/ProgressBar';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const overview = await adminService.getDashboardOverview();
      setData(overview);
    } catch (err) {
      setError(err.normalizedMessage || err.message || 'Failed to load system metrics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const employees = data?.employees || { total: 0, active: 0, list: [] };
  const departments = data?.departments || { total: 0, active: 0, list: [] };
  const courses = data?.courses || { total: 0, published: 0, list: [] };
  const assessments = data?.assessments || { total: 0, published: 0, list: [] };
  const compliance = data?.compliance || { complianceRate: 0, compliant: 0, overdue: 0, dueSoon: 0, notStarted: 0 };
  const certificates = data?.certificates || { total: 0, expiringCount: 0, recent: [] };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-950 to-slate-950 rounded-2xl p-6 sm:p-8 text-white shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-400/30 mb-2">
            Administrator Workspace
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            System Administration — {user?.name || 'Administrator'}
          </h1>
          <p className="mt-1 text-slate-300 text-sm max-w-xl">
            Complete organizational oversight over workforce roster, departments, compliance regulations, and learning credentials.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline-light"
            size="sm"
            onClick={loadDashboard}
            disabled={loading}
            className="flex items-center gap-1.5"
            aria-label="Refresh dashboard"
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
          <Link to="/admin/analytics">
            <Button
              variant="primary"
              size="sm"
              className="bg-teal-700 hover:bg-teal-800 text-white shadow-sm flex items-center gap-1.5"
            >
              <BarChart3 className="w-4 h-4" />
              Analytics & Reports
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      ) : error && !data ? (
        <ErrorState
          title="System Metrics Unavailable"
          message={error}
          onRetry={loadDashboard}
        />
      ) : (
        <>
          {/* Metrics Row 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              title="Total Workforce"
              value={String(employees.total)}
              icon={<Users className="w-5 h-5 text-teal-700" />}
              color="teal"
              description={`${employees.active} active profiles`}
            />
            <StatCard
              title="Departments"
              value={String(departments.total)}
              icon={<Building2 className="w-5 h-5 text-sky-600" />}
              color="sky"
              description={`${departments.active} operational units`}
            />
            <StatCard
              title="Compliance Standing"
              value={`${Math.round(compliance.complianceRate || 0)}%`}
              icon={<ShieldCheck className="w-5 h-5 text-emerald-600" />}
              color="emerald"
              description={`${compliance.compliant} compliant, ${compliance.overdue} overdue`}
            />
            <StatCard
              title="Expiring Credentials"
              value={String(certificates.expiringCount)}
              icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
              color="rose"
              description="Action required within window"
            />
          </div>

          {/* Metrics Row 2: Learning & Oversight */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              title="Course Catalog"
              value={String(courses.total)}
              icon={<BookOpen className="w-5 h-5 text-teal-700" />}
              color="teal"
              description={`${courses.published} published courses`}
            />
            <StatCard
              title="Assessments"
              value={String(assessments.total)}
              icon={<FileCheck className="w-5 h-5 text-purple-600" />}
              color="purple"
              description={`${assessments.published} published quizzes`}
            />
            <StatCard
              title="Issued Certificates"
              value={String(certificates.total)}
              icon={<Award className="w-5 h-5 text-amber-600" />}
              color="amber"
              description="Lifetime credentials"
            />
            <StatCard
              title="Active Enrollments"
              value={String(data?.enrollments?.total || 0)}
              icon={<TrendingUp className="w-5 h-5 text-teal-700" />}
              color="teal"
              description="Organization-wide learners"
            />
          </div>

          {/* Section: Operational Overviews */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Technical Learning & Certification Overview */}
            <Card>
              <Card.Header
                title="Technical Certification Tracks"
                subtitle="Curriculum domains and credential issuing status"
                action={
                  <Link
                    to="/admin/analytics"
                    className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1"
                  >
                    View Analytics <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                }
              />
              <Card.Content className="space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-700 dark:text-slate-300">Technical Curriculum Alignment</span>
                    <span className="font-bold text-teal-700 dark:text-teal-400">
                      10 of 10 Tracks Active
                    </span>
                  </div>
                  <ProgressBar
                    value={100}
                    variant="teal"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                  <div className="p-3 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-center">
                    <span className="block text-lg font-bold text-teal-700 dark:text-teal-300">
                      {courses.published || 10}
                    </span>
                    <span className="text-[11px] font-medium text-teal-600 dark:text-teal-400">
                      Courses
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-center">
                    <span className="block text-lg font-bold text-purple-700 dark:text-purple-300">
                      {assessments.published || 10}
                    </span>
                    <span className="text-[11px] font-medium text-purple-600 dark:text-purple-400">
                      Assessments
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-center">
                    <span className="block text-lg font-bold text-amber-700 dark:text-amber-300">
                      {certificates.total || 0}
                    </span>
                    <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                      Credentials
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-center">
                    <span className="block text-lg font-bold text-sky-700 dark:text-sky-300">
                      {departments.active || 10}
                    </span>
                    <span className="text-[11px] font-medium text-sky-600 dark:text-sky-400">
                      Domains
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <span className="text-slate-500">Integrated learning & verification active</span>
                  <div className="flex items-center gap-3">
                    <Link to="/admin/courses" className="text-teal-700 font-semibold hover:underline">
                      Manage Courses
                    </Link>
                    <span className="text-slate-300">•</span>
                    <Link to="/admin/assessments" className="text-teal-700 font-semibold hover:underline">
                      Manage Exams
                    </Link>
                  </div>
                </div>
              </Card.Content>
            </Card>

            {/* Compliance Standing Summary Card */}
            <Card>
              <Card.Header
                title="Compliance Standing Breakdown"
                subtitle="Organization-wide regulatory assignment status"
                action={
                  <Link
                    to="/admin/compliance"
                    className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1"
                  >
                    Manage Rules <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                }
              />
              <Card.Content className="space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-700 dark:text-slate-300">Overall Compliance Rate</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {Math.round(compliance.complianceRate || 0)}%
                    </span>
                  </div>
                  <ProgressBar
                    value={compliance.complianceRate || 0}
                    variant={compliance.complianceRate >= 80 ? 'success' : 'warning'}
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                  <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-center">
                    <span className="block text-lg font-bold text-emerald-700 dark:text-emerald-300">
                      {compliance.compliant}
                    </span>
                    <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                      Compliant
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-center">
                    <span className="block text-lg font-bold text-amber-700 dark:text-amber-300">
                      {compliance.dueSoon}
                    </span>
                    <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                      Due Soon
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-center">
                    <span className="block text-lg font-bold text-rose-700 dark:text-rose-300">
                      {compliance.overdue}
                    </span>
                    <span className="text-[11px] font-medium text-rose-600 dark:text-rose-400">
                      Overdue
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 text-center">
                    <span className="block text-lg font-bold text-slate-700 dark:text-slate-300">
                      {compliance.notStarted}
                    </span>
                    <span className="text-[11px] font-medium text-slate-500">
                      Not Started
                    </span>
                  </div>
                </div>
              </Card.Content>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
