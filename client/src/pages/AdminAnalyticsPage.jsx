import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  RefreshCw,
  Download,
  AlertTriangle,
  BookOpen,
  FileCheck,
  ShieldCheck,
  Award,
  Building2,
  Clock,
  Layers,
} from 'lucide-react';
import analyticsService from '../services/analyticsService';
import adminService from '../services/adminService';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import ErrorState from '../components/ui/ErrorState';
import AnalyticsFilterBar from '../components/analytics/AnalyticsFilterBar';
import ExportReportModal from '../components/analytics/ExportReportModal';

// Tabs
import OverviewTab from '../components/analytics/tabs/OverviewTab';
import LearningTab from '../components/analytics/tabs/LearningTab';
import AssessmentsTab from '../components/analytics/tabs/AssessmentsTab';
import ComplianceTab from '../components/analytics/tabs/ComplianceTab';
import CertificationsTab from '../components/analytics/tabs/CertificationsTab';
import DepartmentsTab from '../components/analytics/tabs/DepartmentsTab';
import CoursesTab from '../components/analytics/tabs/CoursesTab';

export const AdminAnalyticsPage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState({
    datePreset: 'all',
    from: '',
    to: '',
    departmentId: '',
    courseId: '',
    status: '',
  });

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Load filter options (departments & courses) once on mount
  useEffect(() => {
    let isMounted = true;
    const fetchOptions = async () => {
      try {
        const [deptList, courseList] = await Promise.allSettled([
          adminService.getDepartments(),
          adminService.getCourses(),
        ]);
        if (isMounted) {
          if (deptList.status === 'fulfilled') setDepartments(deptList.value || []);
          if (courseList.status === 'fulfilled') setCourses(courseList.value || []);
        }
      } catch {
        // Non-blocking
      }
    };
    fetchOptions();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch analytics data
  const loadAnalytics = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await analyticsService.getComprehensiveAnalytics(filters);
      setData(res);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err.message || 'Failed to retrieve analytics metrics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const handleFilterChange = (changed) => {
    setFilters((prev) => ({ ...prev, ...changed }));
  };

  const handleResetFilters = () => {
    setFilters({
      datePreset: 'all',
      from: '',
      to: '',
      departmentId: '',
      courseId: '',
      status: '',
    });
  };

  const tabs = [
    { id: 'overview', label: 'Executive Overview', icon: Layers },
    { id: 'learning', label: 'Learning & Courses', icon: BookOpen },
    { id: 'assessments', label: 'Assessments', icon: FileCheck },
    { id: 'compliance', label: 'Compliance', icon: ShieldCheck },
    { id: 'certifications', label: 'Certificates', icon: Award },
    { id: 'departments', label: 'Departments', icon: Building2 },
    { id: 'courses', label: 'Course Catalog', icon: BookOpen },
  ];

  return (
    <div className="space-y-6" data-testid="admin-analytics-page">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-950 to-slate-950 rounded-2xl p-6 sm:p-8 text-white shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-400/30 mb-2">
            Enterprise Intelligence
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-teal-300" />
            Analytics & Reports
          </h1>
          <p className="mt-1 text-slate-300 text-sm max-w-xl">
            Real-time organizational telemetry across workforce learning velocity, assessment proficiency, and regulatory compliance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {lastUpdated && (
            <span className="text-[11px] text-slate-400 flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60">
              <Clock className="w-3.5 h-3.5" />
              Updated {lastUpdated}
            </span>
          )}

          <Button
            variant="outline-light"
            size="sm"
            onClick={() => loadAnalytics(true)}
            disabled={loading || refreshing}
            className="flex items-center gap-1.5 shrink-0"
            aria-label="Refresh analytics data"
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsExportOpen(true)}
            disabled={loading}
            className="flex items-center gap-1.5 shadow-md shadow-teal-950/20 shrink-0"
            aria-label="Export report"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Global Filter Bar */}
      <AnalyticsFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        departments={departments}
        courses={courses}
        activeTab={activeTab}
      />

      {/* Partial Error Notification (Graceful degradation) */}
      {data?.hasPartialError && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Some analytics domains encountered a temporary service issue. Other data continues to render normally.
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadAnalytics(true)}
            className="text-xs text-amber-900 border-amber-300 hover:bg-amber-100"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 overflow-x-auto scrollbar-none">
        <nav className="flex space-x-1 sm:space-x-2" role="tablist" aria-label="Analytics Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={isActive}
                aria-controls={`panel-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 px-3.5 text-xs sm:text-sm font-semibold rounded-t-lg transition-all shrink-0 border-b-2 ${
                  isActive
                    ? 'border-teal-700 text-teal-800 bg-teal-50/60'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-teal-700' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="space-y-6" data-testid="analytics-loading-skeleton">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
          title="Analytics System Unavailable"
          message={error}
          onRetry={() => loadAnalytics()}
          retryLabel="Retry Connection"
        />
      ) : (
        <div
          role="tabpanel"
          id={`panel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}
          className="focus:outline-none"
        >
          {activeTab === 'overview' && <OverviewTab data={data} />}
          {activeTab === 'learning' && <LearningTab data={data} />}
          {activeTab === 'assessments' && <AssessmentsTab data={data} />}
          {activeTab === 'compliance' && <ComplianceTab data={data} />}
          {activeTab === 'certifications' && <CertificationsTab data={data} />}
          {activeTab === 'departments' && <DepartmentsTab data={data} />}
          {activeTab === 'courses' && <CoursesTab data={data} />}
        </div>
      )}

      {/* Export Report Modal */}
      <ExportReportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        data={data}
      />
    </div>
  );
};

export default AdminAnalyticsPage;
