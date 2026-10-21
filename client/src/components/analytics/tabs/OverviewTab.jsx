import React from 'react';
import {
  Users,
  BookOpen,
  Award,
  ShieldCheck,
  FileCheck,
  GraduationCap,
  AlertTriangle,
} from 'lucide-react';
import MetricCard from '../MetricCard';
import AnalyticsDistributionChart from '../AnalyticsDistributionChart';
import AnalyticsDonutChart from '../AnalyticsDonutChart';

export const OverviewTab = ({ data }) => {
  const ov = data?.overview || {};
  const employees = ov.employees || { total: 0, active: 0, inactive: 0 };
  const courses = ov.courses || { total: 0, published: 0, draft: 0, archived: 0 };
  const enrollments = ov.enrollments || { total: 0, enrolled: 0, inProgress: 0, completed: 0, dropped: 0 };
  const assessments = ov.assessments || { total: 0, attempts: 0, passed: 0, failed: 0, passRate: 100 };
  const compliance = ov.compliance || { total: 0, compliant: 0, dueSoon: 0, overdue: 0, complianceRate: 100 };
  const certs = ov.certificates || { active: 0, expired: 0, revoked: 0 };

  // Compliance Donut Items
  const complianceItems = [
    { label: 'Compliant', value: compliance.compliant, color: '#10b981' },
    { label: 'Due Soon', value: compliance.dueSoon, color: '#f59e0b' },
    { label: 'Overdue', value: compliance.overdue, color: '#ef4444' },
    { label: 'In Progress', value: compliance.inProgress, color: '#0F766E' },
    { label: 'Not Started', value: compliance.notStarted, color: '#94a3b8' },
  ];

  // Enrollment Funnel Items
  const enrollmentItems = [
    { label: 'Enrolled', value: enrollments.enrolled, colorClass: 'bg-blue-500' },
    { label: 'In Progress', value: enrollments.inProgress, colorClass: 'bg-teal-600' },
    { label: 'Completed', value: enrollments.completed, colorClass: 'bg-emerald-500' },
    { label: 'Dropped', value: enrollments.dropped, colorClass: 'bg-rose-500' },
  ];

  // Assessment Attempts
  const assessmentItems = [
    { label: 'Passed', value: assessments.passed, colorClass: 'bg-emerald-500' },
    { label: 'Failed', value: assessments.failed, colorClass: 'bg-rose-500' },
  ];

  // Certificates Lifecycle
  const certItems = [
    { label: 'Active', value: certs.active, colorClass: 'bg-emerald-500' },
    { label: 'Expired', value: certs.expired, colorClass: 'bg-amber-500' },
    { label: 'Revoked', value: certs.revoked, colorClass: 'bg-rose-500' },
  ];

  return (
    <div className="space-y-6" data-testid="analytics-overview-tab">
      {/* High-Level Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          title="Workforce"
          value={employees.total}
          subtext={`${employees.active} active members`}
          icon={Users}
          variant="info"
        />
        <MetricCard
          title="Courses"
          value={courses.total}
          subtext={`${courses.published} published`}
          icon={BookOpen}
          variant="default"
        />
        <MetricCard
          title="Enrollments"
          value={enrollments.total}
          subtext={`${enrollments.completed} completions`}
          icon={GraduationCap}
          variant="purple"
        />
        <MetricCard
          title="Pass Rate"
          value={`${assessments.passRate}%`}
          subtext={`${assessments.attempts} attempts recorded`}
          icon={FileCheck}
          variant={assessments.passRate >= 80 ? 'success' : assessments.passRate >= 60 ? 'warning' : 'danger'}
          progress={assessments.passRate}
        />
        <MetricCard
          title="Compliance"
          value={`${compliance.complianceRate}%`}
          subtext={
            compliance.overdue > 0
              ? `${compliance.overdue} overdue items`
              : 'All mandatory items current'
          }
          icon={ShieldCheck}
          variant={compliance.overdue > 0 ? 'warning' : 'success'}
          progress={compliance.complianceRate}
        />
        <MetricCard
          title="Active Certs"
          value={certs.active}
          subtext={`${certs.expired} expired`}
          icon={Award}
          variant="success"
        />
      </div>

      {/* Overdue Compliance Warning Alert if Overdue > 0 */}
      {compliance.overdue > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900">
            <span className="font-semibold">Compliance Risk Alert:</span> There are currently{' '}
            <span className="font-bold underline">{compliance.overdue} overdue compliance assignments</span> across the organization. Review the Compliance tab to audit affected employees and requirements.
          </div>
        </div>
      )}

      {/* Visual Chart Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compliance Donut */}
        <AnalyticsDonutChart
          title="Compliance Health Distribution"
          subtitle="Mandatory training assignments by current completion standing"
          centerValue={`${compliance.complianceRate}%`}
          centerLabel="Compliance"
          items={complianceItems}
          data-testid="overview-compliance-donut"
        />

        {/* Enrollment Distribution */}
        <AnalyticsDistributionChart
          title="Enrollment Lifecycle Funnel"
          subtitle="Employee course enrollment states across the curriculum"
          items={enrollmentItems}
          total={enrollments.total}
          data-testid="overview-enrollment-distribution"
        />

        {/* Assessment Evaluation Outcomes */}
        <AnalyticsDistributionChart
          title="Assessment Evaluation Outcomes"
          subtitle="Cohort attempt results across all evaluated assessments"
          items={assessmentItems}
          total={assessments.attempts}
          data-testid="overview-assessment-outcomes"
        />

        {/* Certificate Lifecycle Status */}
        <AnalyticsDistributionChart
          title="Certificate Lifecycle Status"
          subtitle="Organizational credentials categorized by validity standing"
          items={certItems}
          total={certs.active + certs.expired + certs.revoked}
          data-testid="overview-certificates-lifecycle"
        />
      </div>
    </div>
  );
};

export default OverviewTab;
