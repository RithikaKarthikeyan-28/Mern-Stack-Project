import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import Button from '../components/ui/Button';
import ErrorState from '../components/ui/ErrorState';
import Skeleton from '../components/ui/Skeleton';
import { useAuth } from '../context/AuthContext';

// Compliance Components
import ComplianceSummaryCards from '../components/compliance/ComplianceSummaryCards';
import ComplianceRequirementList from '../components/compliance/ComplianceRequirementList';

// Services
import complianceService from '../services/complianceService';

export const CompliancePage = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [assignments, setAssignments] = useState([]);

  const [summaryLoading, setSummaryLoading] = useState(true);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);

  const [summaryError, setSummaryError] = useState(null);
  const [assignmentsError, setAssignmentsError] = useState(null);

  // Fetch Summary
  const fetchSummary = useCallback(async () => {
    try {
      setSummaryLoading(true);
      setSummaryError(null);
      const data = await complianceService.getMyComplianceSummary();
      setSummary(data);
    } catch {
      setSummaryError('Failed to load compliance summary metrics. Please try again.');
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  // Fetch Assignments
  const fetchAssignments = useCallback(async () => {
    try {
      setAssignmentsLoading(true);
      setAssignmentsError(null);
      const list = await complianceService.getMyComplianceAssignments();
      setAssignments(list || []);
    } catch {
      setAssignmentsError('Failed to load compliance policy assignments.');
    } finally {
      setAssignmentsLoading(false);
    }
  }, []);

  // Load both concurrently
  const refreshAll = useCallback(() => {
    fetchSummary();
    fetchAssignments();
  }, [fetchSummary, fetchAssignments]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const isLoading = summaryLoading || assignmentsLoading;

  return (
    <div className="space-y-8" data-testid="compliance-page">
      {/* 1. Header Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-teal-900 via-teal-950 to-slate-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-slate-950/20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-teal-200 text-xs font-semibold backdrop-blur-sm mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-300" />
              <span>
                {user?.employee?.jobRole?.name || user?.employee?.designation ? `Role Track: ${user?.employee?.jobRole?.name || user?.employee?.designation} • ` : ''}
                Mandatory Compliance Obligations
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
              Compliance Management Hub
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Track your mandatory corporate compliance obligations, upcoming policy deadlines, and verified certifications in real time to maintain full organizational compliance.
            </p>
          </div>

          <div className="shrink-0">
            <Button
              variant="outline-light"
              size="sm"
              onClick={refreshAll}
              disabled={isLoading}
              className="gap-2"
              aria-label="Refresh Status"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Status</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Top Summary Metrics Section */}
      <div data-testid="compliance-summary-section">
        {summaryLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-44 rounded-3xl w-full" />
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-24 rounded-2xl" />
              ))}
            </div>
          </div>
        ) : summaryError ? (
          <ErrorState
            title="Summary metrics unavailable"
            message={summaryError}
            onRetry={fetchSummary}
          />
        ) : (
          <ComplianceSummaryCards summary={summary} />
        )}
      </div>

      {/* 3. Detailed Requirements & Assignments Section */}
      <div data-testid="compliance-assignments-section" className="space-y-4 pt-4 border-t border-slate-200/80">
        <div className="flex items-center justify-between gap-4 mb-2">
          <div>
            <h2 className="text-lg font-bold text-[#102A2A]">
              Assigned Policy Requirements
            </h2>
            <p className="text-xs text-slate-500">
              Review individual training requirements, target courses, and completion status.
            </p>
          </div>
        </div>

        {assignmentsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-6 rounded-3xl border border-slate-200 bg-white space-y-4">
                <div className="flex justify-between">
                  <Skeleton className="w-24 h-5 rounded-full" />
                  <Skeleton className="w-20 h-5 rounded-full" />
                </div>
                <Skeleton className="w-3/4 h-6" />
                <Skeleton className="w-full h-12" />
                <Skeleton className="w-full h-10 rounded-xl" />
              </div>
            ))}
          </div>
        ) : assignmentsError ? (
          <ErrorState
            title="Failed to load policy assignments"
            message={assignmentsError}
            onRetry={fetchAssignments}
          />
        ) : (
          <ComplianceRequirementList assignments={assignments} />
        )}
      </div>
    </div>
  );
};

export default CompliancePage;
