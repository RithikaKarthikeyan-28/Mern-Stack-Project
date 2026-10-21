import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  CheckCircle2,
  Award,
  ShieldCheck,
  Target,
  ArrowRight,
  Bell,
  AlertTriangle,
  PlayCircle,
  ExternalLink,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/ui/StatCard';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import ProgressBar from '../components/ui/ProgressBar';
import ProgressCircle from '../components/ui/ProgressCircle';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import Skeleton from '../components/ui/Skeleton';
import ComplianceRequirementList from '../components/compliance/ComplianceRequirementList';

// Services
import enrollmentService from '../services/enrollmentService';
import certificateService from '../services/certificateService';
import complianceService from '../services/complianceService';
import skillService from '../services/skillService';
import notificationService from '../services/notificationService';

// Utilities
import {
  getGreeting,
  formatPercentage,
  formatRelativeTime,
  deriveRecentActivity,
} from '../utils/dashboardUtils';

export const EmployeeDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Loading states
  const [loading, setLoading] = useState(true);

  // Data states
  const [enrollments, setEnrollments] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [complianceSummary, setComplianceSummary] = useState(null);
  const [complianceAssignments, setComplianceAssignments] = useState([]);
  const [skillGapSummary, setSkillGapSummary] = useState(null);
  const [skillsCount, setSkillsCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  // Section error states
  const [enrollmentError, setEnrollmentError] = useState(null);
  const [certificateError, setCertificateError] = useState(null);
  const [complianceError, setComplianceError] = useState(null);
  const [skillError, setSkillError] = useState(null);
  const [notificationError, setNotificationError] = useState(null);

  // Fetch Enrollments
  const fetchEnrollments = useCallback(async () => {
    try {
      setEnrollmentError(null);
      const data = await enrollmentService.getMyEnrollments();
      setEnrollments(data);
    } catch {
      setEnrollmentError('Failed to load courses.');
    }
  }, []);

  // Fetch Certificates
  const fetchCertificates = useCallback(async () => {
    try {
      setCertificateError(null);
      const data = await certificateService.getMyCertificates({ limit: 10 });
      setCertificates(data.certificates || []);
    } catch {
      setCertificateError('Failed to load certificates.');
    }
  }, []);

  // Fetch Compliance Summary & Assignments
  const fetchCompliance = useCallback(async () => {
    try {
      setComplianceError(null);
      const [summaryData, assignmentsData] = await Promise.all([
        complianceService.getMyComplianceSummary(),
        complianceService.getMyComplianceAssignments(),
      ]);
      setComplianceSummary(summaryData);
      setComplianceAssignments(assignmentsData || []);
    } catch {
      setComplianceError('Failed to load compliance status.');
    }
  }, []);

  // Fetch Skills and Skill Gap
  const fetchSkills = useCallback(async () => {
    try {
      setSkillError(null);
      const skillsData = await skillService.getMySkills();
      setSkillsCount(skillsData.total || 0);

      // Attempt to load job roles to derive skill gap analysis matching employee's role/department
      const jobRoles = await skillService.getJobRoles();
      if (jobRoles && jobRoles.length > 0) {
        const assignedRoleId = user?.employee?.jobRole?._id || user?.employee?.jobRole?.id || user?.employee?.jobRole;
        const assignedRoleName = user?.employee?.jobRole?.name || user?.employee?.designation;
        const employeeDeptId = user?.employee?.department?._id || user?.employee?.department?.id || user?.employee?.department;
        const employeeDeptName = user?.employee?.department?.name;

        const targetRole = jobRoles.find((r) =>
          (assignedRoleId && (r._id === assignedRoleId || r.id === assignedRoleId)) ||
          (assignedRoleName && (
            r.name.toLowerCase() === assignedRoleName.toLowerCase() ||
            assignedRoleName.toLowerCase().includes(r.name.toLowerCase()) ||
            r.name.toLowerCase().includes(assignedRoleName.toLowerCase())
          )) ||
          (employeeDeptId && (
            (r.department && (r.department === employeeDeptId || r.department?._id === employeeDeptId)) ||
            (r.departments && r.departments.some(d => d === employeeDeptId || d?._id === employeeDeptId))
          )) ||
          (employeeDeptName && (
            r.name.toLowerCase().includes(employeeDeptName.toLowerCase()) ||
            employeeDeptName.toLowerCase().includes(r.name.toLowerCase())
          ))
        ) || jobRoles[0];

        const gapData = await skillService.getMySkillGap(targetRole._id || targetRole.id);
        if (gapData?.summary) {
          setSkillGapSummary(gapData.summary);
        }
      }
    } catch {
      setSkillError('Failed to load skill data.');
    }
  }, []);

  // Fetch Notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setNotificationError(null);
      const data = await notificationService.getNotifications({ limit: 3 });
      setNotifications(data.notifications || []);
    } catch {
      setNotificationError('Failed to load notifications.');
    }
  }, []);

  // Initial dashboard load
  useEffect(() => {
    let isMounted = true;
    const loadAll = async () => {
      setLoading(true);
      await Promise.allSettled([
        fetchEnrollments(),
        fetchCertificates(),
        fetchCompliance(),
        fetchSkills(),
        fetchNotifications(),
      ]);
      if (isMounted) setLoading(false);
    };

    loadAll();
    return () => {
      isMounted = false;
    };
  }, [fetchEnrollments, fetchCertificates, fetchCompliance, fetchSkills, fetchNotifications]);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.allSettled([
      fetchEnrollments(),
      fetchCertificates(),
      fetchCompliance(),
      fetchSkills(),
      fetchNotifications(),
    ]);
    setIsRefreshing(false);
  }, [fetchEnrollments, fetchCertificates, fetchCompliance, fetchSkills, fetchNotifications]);

  // Derived KPI calculations
  const activeEnrollments = enrollments.filter(
    (e) => e.status === 'enrolled' || e.status === 'in_progress'
  );
  const completedEnrollments = enrollments.filter((e) => e.status === 'completed');

  const avgProgress =
    activeEnrollments.length > 0
      ? Math.round(
          activeEnrollments.reduce((acc, curr) => acc + (curr.progressPercentage || 0), 0) /
            activeEnrollments.length
        )
      : completedEnrollments.length > 0
      ? 100
      : 0;

  const now = new Date();
  const activeCertificates = certificates.filter(
    (c) => c.status === 'active' && (!c.expiresAt || new Date(c.expiresAt) > now)
  );

  const complianceRate = complianceSummary?.complianceRate ?? 100;

  // Derived activity feed
  const recentActivity = deriveRecentActivity(enrollments, certificates, notifications, 5);

  return (
    <div className="space-y-8">
      {/* 1. Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-teal-800 via-teal-900 to-slate-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-teal-950/20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md text-teal-100 border border-white/10 mb-4">
              <Sparkles className="w-3.5 h-3.5 text-teal-300" />
              Employee Learning Hub
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
              {getGreeting()}, {user?.name || 'Learner'} 👋
            </h1>
            <p className="mt-2 text-teal-100/90 text-sm sm:text-base leading-relaxed">
              Welcome back, {user?.name || 'Learner'}! Here&apos;s your learning and development overview. Continue your active courses and review certifications.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <Button
              variant="outline-light"
              size="sm"
              onClick={handleRefresh}
              disabled={loading || isRefreshing}
              className="flex items-center gap-1.5"
              aria-label="Refresh employee dashboard"
            >
              <RefreshCw className={`w-4 h-4 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-8 animate-in fade-in" data-testid="dashboard-skeleton">
          {/* KPI Row Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <Skeleton height="110px" count={4} />
          </div>

          {/* Content Skeletons */}
          <div className="space-y-6">
            <Skeleton height="200px" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Skeleton height="260px" />
              <Skeleton height="260px" />
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* 2. KPI Metrics Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Learning Progress"
          value={formatPercentage(avgProgress)}
          icon={<BookOpen className="w-5 h-5 text-teal-700" />}
          color="teal"
          description={`${activeEnrollments.length} active course${activeEnrollments.length === 1 ? '' : 's'}`}
        />
        <StatCard
          title="Courses Completed"
          value={completedEnrollments.length.toString()}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          color="emerald"
          description="Total finished modules"
        />
        <StatCard
          title="Active Certificates"
          value={activeCertificates.length.toString()}
          icon={<Award className="w-5 h-5 text-amber-600" />}
          color="amber"
          description="Verified credentials"
        />
        <StatCard
          title="Compliance Status"
          value={formatPercentage(complianceRate)}
          icon={<ShieldCheck className="w-5 h-5 text-sky-600" />}
          color="sky"
          trend={
            complianceSummary?.overdue > 0
              ? { direction: 'down', value: `${complianceSummary.overdue} overdue` }
              : { direction: 'up', value: 'Compliant' }
          }
        />
      </div>

      {/* 3. Continue Learning Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Continue Learning</h2>
            <p className="text-xs text-slate-500">Pick up where you left off in your enrolled courses</p>
          </div>
          <Link
            to="/my-learning"
            className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1 transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {enrollmentError ? (
          <ErrorState
            title="Unable to load learning data"
            message={enrollmentError}
            onRetry={fetchEnrollments}
          />
        ) : activeEnrollments.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="w-7 h-7 text-teal-700" />}
            title="Start your learning journey"
            description="You have no active courses in progress. Explore our catalog to enroll in foundational modules."
            action={
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/courses')}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Browse Courses
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeEnrollments.map((enr) => {
              const course = enr.course || {};
              const progress = enr.progressPercentage || 0;
              return (
                <Card key={enr._id} hover className="flex flex-col justify-between p-5 border-slate-200/80">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <Badge variant="primary" size="sm">
                        {course.category || 'General'}
                      </Badge>
                      <span className="text-[11px] font-medium text-slate-400 capitalize">
                        {enr.status?.replace('_', ' ')}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-[#102A2A] leading-snug line-clamp-2 mb-2">
                      {course.title || 'Untitled Course'}
                    </h3>

                    {course.duration && (
                      <p className="text-xs text-slate-500 mb-4">
                        Estimated duration: {course.duration} mins
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <ProgressBar
                      value={progress}
                      max={100}
                      showLabel
                      label="Progress"
                      color="teal"
                      size="sm"
                      className="mb-4"
                    />

                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full justify-between"
                      onClick={() => navigate('/my-learning')}
                      leftIcon={<PlayCircle className="w-4 h-4" />}
                      rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    >
                      Continue Learning
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. Middle Two-Column Grid: Skill Development & Compliance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Skill Development Card */}
        <Card className="flex flex-col justify-between">
          <div>
            <Card.Header
              title="Skill Development"
              subtitle="Alignment against organizational competencies"
              action={
                <Link to="/skills" className="text-xs font-semibold text-teal-700 hover:text-teal-800">
                  Skill gaps →
                </Link>
              }
            />

            <Card.Content>
              {skillError ? (
                <ErrorState
                  title="Unable to load skills"
                  message={skillError}
                  onRetry={fetchSkills}
                />
              ) : skillGapSummary ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-6 p-4 rounded-2xl bg-teal-50/50 border border-teal-200/60">
                    <ProgressCircle
                      value={skillGapSummary.overallMatchPercentage || 0}
                      size={68}
                      strokeWidth={6}
                      color="teal"
                    />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Overall Skill Match
                      </p>
                      <h4 className="text-2xl font-bold text-[#102A2A] mt-0.5">
                        {formatPercentage(skillGapSummary.overallMatchPercentage)}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {skillGapSummary.meetsRequiredSkills} of {skillGapSummary.totalRequirements} role requirements met
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-xs text-slate-500">Missing</p>
                      <p className="text-lg font-bold text-rose-600 mt-1">
                        {skillGapSummary.missingSkills || 0}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-xs text-slate-500">Below Req.</p>
                      <p className="text-lg font-bold text-amber-600 mt-1">
                        {skillGapSummary.belowRequiredSkills || 0}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-xs text-slate-500">Meets Req.</p>
                      <p className="text-lg font-bold text-emerald-600 mt-1">
                        {skillGapSummary.meetsRequiredSkills || 0}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={<Target className="w-7 h-7 text-teal-700" />}
                  title="Start building your skill profile"
                  description={
                    skillsCount > 0
                      ? `You have ${skillsCount} recorded skill${skillsCount === 1 ? '' : 's'}. View detailed role benchmarking.`
                      : 'No skills benchmarked yet. Explore role competencies to begin upskilling.'
                  }
                  action={
                    <Button variant="outline" size="sm" onClick={() => navigate('/skills')}>
                      View Skill Gaps
                    </Button>
                  }
                />
              )}
            </Card.Content>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-between"
              onClick={() => navigate('/skills')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Explore Skill Benchmarks
            </Button>
          </div>
        </Card>

        {/* Compliance Status Card */}
        <Card className="flex flex-col justify-between">
          <div>
            <Card.Header
              title="Compliance Overview"
              subtitle="Mandatory regulatory and policy assignments"
              action={
                <Badge variant={complianceRate === 100 ? 'success' : 'warning'} size="sm" dot>
                  {complianceRate === 100 ? 'Compliant' : 'Attention Required'}
                </Badge>
              }
            />

            <Card.Content>
              {complianceError ? (
                <ErrorState
                  title="Unable to load compliance data"
                  message={complianceError}
                  onRetry={fetchCompliance}
                />
              ) : complianceSummary ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-6 p-4 rounded-2xl bg-sky-50/50 border border-sky-100/80">
                    <ProgressCircle
                      value={complianceSummary.complianceRate || 0}
                      size={68}
                      strokeWidth={6}
                      color="sky"
                    />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Compliance Standing
                      </p>
                      <h4 className="text-2xl font-bold text-slate-900 mt-0.5">
                        {formatPercentage(complianceSummary.complianceRate)}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {complianceSummary.compliant} of {complianceSummary.totalAssignments} requirements fulfilled
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-xs text-slate-500">Compliant</p>
                      <p className="text-lg font-bold text-emerald-600 mt-1">
                        {complianceSummary.compliant || 0}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-xs text-slate-500">Due Soon</p>
                      <p className={`text-lg font-bold mt-1 ${complianceSummary.dueSoon > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
                        {complianceSummary.dueSoon || 0}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-xs text-slate-500">Overdue</p>
                      <p className={`text-lg font-bold mt-1 ${complianceSummary.overdue > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                        {complianceSummary.overdue || 0}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={<ShieldCheck className="w-7 h-7 text-sky-600" />}
                  title="No compliance requirements"
                  description="You currently have no outstanding compliance training assignments."
                />
              )}
            </Card.Content>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-between"
              onClick={() => navigate('/compliance')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Review Compliance Requirements
            </Button>
          </div>
        </Card>
      </div>

      {/* 5. Assigned Department Compliance Obligations Section */}
      <div className="space-y-4 pt-4 border-t border-slate-200/80" data-testid="employee-compliance-section">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#102A2A] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-teal-700" />
              Assigned Department Compliance Obligations
            </h2>
            <p className="text-xs text-slate-500">
              Mandatory policy standards and certifications required for your department ({user?.employee?.department?.name || 'Assigned Department'}).
            </p>
          </div>
          <Link to="/compliance" className="text-xs font-semibold text-teal-700 hover:text-teal-800 shrink-0">
            View Compliance Hub →
          </Link>
        </div>

        {complianceAssignments.length > 0 ? (
          <ComplianceRequirementList assignments={complianceAssignments} />
        ) : (
          <EmptyState
            icon={<ShieldCheck className="w-8 h-8 text-teal-600" />}
            title="All Compliance Standards Fulfilled"
            description="You have no pending compliance obligations assigned to your department profile."
          />
        )}
      </div>

      {/* 6. Certificates Summary & Notifications Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Certificates Summary */}
        <Card className="flex flex-col justify-between">
          <div>
            <Card.Header
              title="Certificates"
              subtitle="Verifiable credentials earned from completed courses"
              action={
                <Link to="/certificates" className="text-xs font-semibold text-teal-700 hover:text-teal-800">
                  View All →
                </Link>
              }
            />

            <Card.Content>
              {certificateError ? (
                <ErrorState
                  title="Unable to load certificates"
                  message={certificateError}
                  onRetry={fetchCertificates}
                />
              ) : certificates.length === 0 ? (
                <EmptyState
                  icon={<Award className="w-7 h-7 text-amber-600" />}
                  title="Earn your first certificate"
                  description="Complete a course to earn your first certificate and share your verified credentials."
                  action={
                    <Button variant="outline" size="sm" onClick={() => navigate('/courses')}>
                      Browse Courses
                    </Button>
                  }
                />
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-amber-50/50 border border-amber-100">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-800">
                          {activeCertificates.length} Active Certificate{activeCertificates.length === 1 ? '' : 's'}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {certificates.length} total issued
                        </p>
                      </div>
                    </div>
                    <Badge variant="warning" size="sm">
                      Verified
                    </Badge>
                  </div>

                  {certificates.slice(0, 2).map((cert) => (
                    <div
                      key={cert._id}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50/60 transition-colors"
                    >
                      <div className="min-w-0 pr-3">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {cert.course?.title || cert.certificateNumber}
                        </p>
                        <p className="text-xs text-slate-400">
                          Issued {formatRelativeTime(cert.issuedAt)} • ID: {cert.certificateNumber}
                        </p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-400 shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </Card.Content>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-between"
              onClick={() => navigate('/certificates')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              View All Certificates
            </Button>
          </div>
        </Card>

        {/* Notifications Preview */}
        <Card className="flex flex-col justify-between">
          <div>
            <Card.Header
              title="Recent Notifications"
              subtitle="Latest system alerts, milestones, and reminders"
              action={
                <Link to="/notifications" className="text-xs font-semibold text-teal-700 hover:text-teal-800">
                  View All →
                </Link>
              }
            />

            <Card.Content>
              {notificationError ? (
                <ErrorState
                  title="Unable to load notifications"
                  message={notificationError}
                  onRetry={fetchNotifications}
                />
              ) : notifications.length === 0 ? (
                <EmptyState
                  icon={<Bell className="w-7 h-7 text-teal-700" />}
                  title="You're all caught up"
                  description="No new notifications. Alerts for assignments, certificates, and reviews will appear here."
                />
              ) : (
                <div className="space-y-3">
                  {notifications.map((notif) => (
                    <div
                      key={notif._id}
                      className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
                        notif.isRead
                          ? 'border-slate-100 bg-white'
                          : 'border-teal-200/60 bg-teal-50/40'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 mt-0.5">
                        <Bell className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-slate-900 truncate">
                            {notif.title}
                          </p>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {formatRelativeTime(notif.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                          {notif.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Content>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-between"
              onClick={() => navigate('/notifications')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Open Notifications Center
            </Button>
          </div>
        </Card>
      </div>

      {/* 6. Recent Activity Timeline */}
      {recentActivity.length > 0 && (
        <Card>
          <Card.Header
            title="Recent Activity"
            subtitle="Your latest milestones across learning, achievements, and notifications"
          />
          <Card.Content>
            <div className="flow-root">
              <ul className="-mb-8">
                {recentActivity.map((activity, idx) => {
                  const isLast = idx === recentActivity.length - 1;
                  return (
                    <li key={activity.id}>
                      <div className="relative pb-6">
                        {!isLast && (
                          <span
                            className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200"
                            aria-hidden="true"
                          />
                        )}
                        <div className="relative flex space-x-3 items-start">
                          <div>
                            <span
                              className={`h-8 w-8 rounded-full flex items-center justify-center ring-4 ring-white ${
                                activity.type === 'course_completed'
                                  ? 'bg-emerald-500 text-white'
                                  : activity.type === 'certificate_earned'
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-teal-700 text-white'
                              }`}
                            >
                              {activity.type === 'course_completed' ? (
                                <CheckCircle2 className="w-4 h-4" />
                              ) : activity.type === 'certificate_earned' ? (
                                <Award className="w-4 h-4" />
                              ) : (
                                <Bell className="w-4 h-4" />
                              )}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-xs font-semibold text-[#102A2A]">
                                {activity.title}
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {activity.description}
                              </p>
                            </div>
                            <div className="text-right text-[11px] whitespace-nowrap text-slate-400">
                              {formatRelativeTime(activity.date)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </Card.Content>
        </Card>
      )}

      {/* 7. Recommended Next Actions */}
      <Card className="bg-gradient-to-r from-slate-950 via-teal-950 to-slate-950 text-white border-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <h3 className="text-base font-bold text-white tracking-tight">Recommended Next Actions</h3>
            </div>
            <p className="text-xs text-slate-300">
              Quick shortcuts prioritized based on your active development status
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {activeEnrollments.length > 0 && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/my-learning')}
                leftIcon={<PlayCircle className="w-4 h-4" />}
              >
                Resume Course
              </Button>
            )}

            {complianceSummary?.overdue > 0 || complianceSummary?.dueSoon > 0 ? (
              <Button
                variant="outline"
                size="sm"
                className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                onClick={() => navigate('/my-learning')}
                leftIcon={<AlertTriangle className="w-4 h-4 text-amber-400" />}
              >
                Complete Compliance
              </Button>
            ) : null}

            <Button
              variant="outline"
              size="sm"
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
              onClick={() => navigate('/skills')}
              leftIcon={<Target className="w-4 h-4 text-teal-300" />}
            >
              Analyze Skills
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
              onClick={() => navigate('/certificates')}
              leftIcon={<Award className="w-4 h-4 text-amber-300" />}
            >
              View Credentials
            </Button>
          </div>
        </div>
      </Card>
        </>
      )}
    </div>
  );
};

export default EmployeeDashboard;
