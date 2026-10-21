import React, { useState } from 'react';
import { Download, CheckCircle2, Shield, X } from 'lucide-react';
import Button from '../ui/Button';
import analyticsService from '../../services/analyticsService';

export const ExportReportModal = ({ isOpen, onClose, data }) => {
  const [selectedReport, setSelectedReport] = useState('overview');
  const [statusMessage, setStatusMessage] = useState(null);

  if (!isOpen) return null;

  const handleExport = () => {
    setStatusMessage(null);
    try {
      const timestamp = new Date().toISOString().slice(0, 10);

      if (selectedReport === 'overview') {
        const ov = data?.overview;
        if (!ov) throw new Error('No overview data available.');
        const rows = [
          { metric: 'Total Employees', value: ov.employees?.total ?? 0 },
          { metric: 'Active Employees', value: ov.employees?.active ?? 0 },
          { metric: 'Total Departments', value: ov.departments?.total ?? 0 },
          { metric: 'Total Courses', value: ov.courses?.total ?? 0 },
          { metric: 'Published Courses', value: ov.courses?.published ?? 0 },
          { metric: 'Total Enrollments', value: ov.enrollments?.total ?? 0 },
          { metric: 'Completed Enrollments', value: ov.enrollments?.completed ?? 0 },
          { metric: 'Assessment Attempts', value: ov.assessments?.attempts ?? 0 },
          { metric: 'Assessment Pass Rate (%)', value: ov.assessments?.passRate ?? 0 },
          { metric: 'Active Certificates', value: ov.certificates?.active ?? 0 },
          { metric: 'Compliance Rate (%)', value: ov.compliance?.complianceRate ?? 0 },
          { metric: 'Overdue Compliance Assignments', value: ov.compliance?.overdue ?? 0 },
        ];
        analyticsService.exportToCSV(
          `SkillTrack_Executive_Overview_${timestamp}.csv`,
          [
            { label: 'Metric', key: 'metric' },
            { label: 'Value', key: 'value' },
          ],
          rows
        );
      } else if (selectedReport === 'departments') {
        const rows = data?.departments?.departments || data?.learning?.departmentBreakdown || [];
        if (rows.length === 0) throw new Error('No department analytics data available to export.');

        analyticsService.exportToCSV(
          `SkillTrack_Department_Analytics_${timestamp}.csv`,
          [
            { label: 'Department Name', key: 'departmentName' },
            { label: 'Employee Count', key: 'employeeCount' },
            { label: 'Active Employees', key: 'activeEmployeeCount' },
            { label: 'Enrollments', key: 'enrollmentCount' },
            { label: 'Completions', key: 'completionCount' },
            { label: 'Avg Progress (%)', key: 'averageProgressPercentage' },
            { label: 'Assessment Pass Rate (%)', key: 'assessmentPassRate' },
            { label: 'Compliance Rate (%)', key: 'complianceRate' },
          ],
          rows
        );
      } else if (selectedReport === 'courses') {
        const rows = data?.courses?.courses || data?.learning?.courseBreakdown || [];
        if (rows.length === 0) throw new Error('No course analytics data available to export.');

        analyticsService.exportToCSV(
          `SkillTrack_Course_Analytics_${timestamp}.csv`,
          [
            { label: 'Course Title', key: 'title' },
            { label: 'Status', key: 'status' },
            { label: 'Total Enrollments', key: 'enrollmentCount' },
            { label: 'Completions', key: 'completedCount' },
            { label: 'Completion Rate (%)', key: 'completionRate' },
            { label: 'Avg Progress (%)', key: 'averageProgressPercentage' },
            { label: 'Assessment Attempts', key: 'assessmentAttempts' },
            { label: 'Assessment Pass Rate (%)', key: 'assessmentPassRate' },
            { label: 'Certificates Issued', key: 'certificateCount' },
          ],
          rows
        );
      } else if (selectedReport === 'compliance') {
        const rows = data?.compliance?.requirementBreakdown || [];
        if (rows.length === 0) throw new Error('No compliance breakdown data available to export.');

        analyticsService.exportToCSV(
          `SkillTrack_Compliance_Report_${timestamp}.csv`,
          [
            { label: 'Requirement Title', key: 'title' },
            { label: 'Assigned Employees', key: 'assignedEmployees' },
            { label: 'Compliant Count', key: 'compliant' },
            { label: 'Due Soon Count', key: 'dueSoon' },
            { label: 'Overdue Count', key: 'overdue' },
            { label: 'Compliance Rate (%)', key: 'complianceRate' },
          ],
          rows
        );
      } else if (selectedReport === 'assessments') {
        const rows = data?.assessments?.assessmentBreakdown || [];
        if (rows.length === 0) throw new Error('No assessment breakdown data available to export.');

        analyticsService.exportToCSV(
          `SkillTrack_Assessment_Performance_${timestamp}.csv`,
          [
            { label: 'Assessment Title', key: 'title' },
            { label: 'Total Attempts', key: 'attemptCount' },
            { label: 'Unique Employees', key: 'uniqueEmployees' },
            { label: 'Passed', key: 'passed' },
            { label: 'Failed', key: 'failed' },
            { label: 'Pass Rate (%)', key: 'passRate' },
            { label: 'Average Score (%)', key: 'averagePercentage' },
            { label: 'Highest Score (%)', key: 'highestPercentage' },
            { label: 'Lowest Score (%)', key: 'lowestPercentage' },
          ],
          rows
        );
      }

      setStatusMessage({ type: 'success', text: 'CSV export downloaded successfully.' });
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to export report.' });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
    >
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <h2 id="export-modal-title" className="text-base font-semibold text-brand-ink-primary">
              Export Analytics Report
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            Select the dataset you wish to download in standard CSV format for offline reporting and spreadsheet analysis.
          </p>

          {/* Options */}
          <div className="space-y-2">
            {[
              { id: 'overview', title: 'Executive Overview KPIs', desc: 'Workforce, enrollment, compliance, and certificate aggregates.' },
              { id: 'departments', title: 'Department Performance', desc: 'Department-by-department completion and compliance rates.' },
              { id: 'courses', title: 'Course Performance & Metrics', desc: 'Enrollment volume, completion rates, and average progress.' },
              { id: 'compliance', title: 'Compliance Regulations', desc: 'Requirement breakdown, overdue counts, and adherence rates.' },
              { id: 'assessments', title: 'Assessment Cohorts', desc: 'Attempt volumes, pass rates, and score distributions.' },
            ].map((option) => (
              <label
                key={option.id}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedReport === option.id
                    ? 'border-teal-700 bg-teal-50/50 text-brand-ink-primary'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="reportType"
                  value={option.id}
                  checked={selectedReport === option.id}
                  onChange={() => setSelectedReport(option.id)}
                  className="mt-1 text-teal-700 focus:ring-teal-600"
                />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-brand-ink-primary">{option.title}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{option.desc}</div>
                </div>
              </label>
            ))}
          </div>

          {/* Privacy Note */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-slate-600 text-[11px]">
            <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              <strong>PII Protected:</strong> Exports include aggregated operational metrics only. Passwords, hashes, and employee personal contact details are never exported.
            </span>
          </div>

          {statusMessage && (
            <div
              className={`p-2.5 rounded-lg text-xs font-medium flex items-center gap-1.5 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
              <span>{statusMessage.text}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleExport} className="flex items-center gap-1.5">
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExportReportModal;
