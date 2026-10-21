import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ShieldCheck,
  Search,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  UserPlus,
  Clock,
} from 'lucide-react';
import adminService from '../services/adminService';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Skeleton from '../components/ui/Skeleton';
import ErrorState from '../components/ui/ErrorState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import ProgressBar from '../components/ui/ProgressBar';
import AdminStatusBadge from '../components/admin/AdminStatusBadge';
import ComplianceRequirementModal from '../components/admin/ComplianceRequirementModal';
import ComplianceAssignModal from '../components/admin/ComplianceAssignModal';

export const AdminCompliancePage = () => {
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState('rules'); // 'rules' | 'assignments'
  const [summary, setSummary] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshingStatuses, setIsRefreshingStatuses] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  // Modals
  const [isReqModalOpen, setIsReqModalOpen] = useState(false);
  const [editingReq, setEditingReq] = useState(null);
  const [isSubmittingReq, setIsSubmittingReq] = useState(false);

  const [assigningReq, setAssigningReq] = useState(null);
  const [isAssigning, setIsAssigning] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumData, reqData, assignData, coursesData, deptData, empData] = await Promise.all([
        adminService.getComplianceSummary(),
        adminService.getComplianceRequirements(),
        adminService.getComplianceAssignments(),
        adminService.getCourses(),
        adminService.getDepartments(),
        adminService.getEmployees(),
      ]);
      setSummary(sumData);
      setRequirements(reqData);
      setAssignments(assignData.assignments || (Array.isArray(assignData) ? assignData : []));
      setCourses(coursesData);
      setDepartments(deptData);
      setEmployees(empData);
    } catch (err) {
      setError(err.normalizedMessage || err.message || 'Failed to load compliance records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefreshStatuses = async () => {
    setIsRefreshingStatuses(true);
    try {
      await adminService.refreshComplianceStatuses();
      success('Compliance statuses recalculated across all assignments.');
      await loadData();
    } catch (err) {
      toastError(err.normalizedMessage || 'Status recalculation failed.');
    } finally {
      setIsRefreshingStatuses(false);
    }
  };

  const filteredRequirements = useMemo(() => {
    return requirements.filter((r) => {
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const title = (r.title || '').toLowerCase();
        const desc = (r.description || '').toLowerCase();
        const courseTitle = (r.course?.title || '').toLowerCase();
        return title.includes(term) || desc.includes(term) || courseTitle.includes(term);
      }
      return true;
    });
  }, [requirements, searchTerm]);

  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      if (departmentFilter !== 'all') {
        const aDeptId =
          a.employee?.department?._id ||
          a.employee?.department?.id ||
          a.employee?.department;
        if (aDeptId !== departmentFilter) {
          return false;
        }
      }
      if (statusFilter !== 'all' && (a.status || '').toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const empName = (a.employee?.user?.name || a.employee?.employeeId || '').toLowerCase();
        const reqTitle = (a.complianceRequirement?.title || a.requirement?.title || '').toLowerCase();
        return empName.includes(term) || reqTitle.includes(term);
      }
      return true;
    });
  }, [assignments, statusFilter, departmentFilter, searchTerm]);

  const handleOpenCreateReq = () => {
    setEditingReq(null);
    setIsReqModalOpen(true);
  };

  const handleOpenEditReq = (r) => {
    setEditingReq(r);
    setIsReqModalOpen(true);
  };

  const handleReqModalSubmit = async (formData) => {
    setIsSubmittingReq(true);
    try {
      if (editingReq) {
        const id = editingReq._id || editingReq.id;
        const updated = await adminService.updateComplianceRequirement(id, formData);
        setRequirements((prev) =>
          prev.map((r) => ((r._id || r.id) === id ? updated : r))
        );
        success(`Rule "${updated.title}" updated.`);
      } else {
        const created = await adminService.createComplianceRequirement(formData);
        setRequirements((prev) => [created, ...prev]);
        success(`Rule "${created.title}" created.`);
      }
      setIsReqModalOpen(false);
    } finally {
      setIsSubmittingReq(false);
    }
  };

  const handleDeleteReq = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const id = deleteTarget._id || deleteTarget.id;
      await adminService.deleteComplianceRequirement(id);
      setRequirements((prev) => prev.filter((r) => (r._id || r.id) !== id));
      success(`Rule "${deleteTarget.title}" deleted.`);
      setDeleteTarget(null);
    } catch (err) {
      toastError(err.normalizedMessage || err.message || 'Failed to delete rule.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAssignDepartment = async (reqId, deptId, dueAt) => {
    setIsAssigning(true);
    try {
      await adminService.assignRequirementToDepartment(reqId, deptId, dueAt);
      success('Assigned rule to department employees.');
      await loadData();
    } finally {
      setIsAssigning(false);
    }
  };

  const handleAssignEmployee = async (reqId, empId, dueAt) => {
    setIsAssigning(true);
    try {
      await adminService.assignRequirementToEmployee(reqId, empId, dueAt);
      success('Assigned rule to employee.');
      await loadData();
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-emerald-600" />
            Compliance Oversight
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Enforce mandatory regulations, assign department policies, and monitor completion deadlines.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshStatuses}
            disabled={isRefreshingStatuses || loading}
            title="Recalculate status triggers"
            aria-label="Recalculate compliance statuses"
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${isRefreshingStatuses ? 'animate-spin' : ''}`} />
            Audit Statuses
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreateReq}
            className="flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add Rule
          </Button>
        </div>
      </div>

      {/* KPI Overview */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-medium">Compliance Rate</span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {Math.round(summary.complianceRate || 0)}%
            </div>
            <ProgressBar value={summary.complianceRate || 0} variant="success" size="sm" />
          </div>
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-medium">Compliant</span>
            <div className="text-2xl font-bold text-emerald-600">
              {summary.compliant || 0}
            </div>
            <span className="text-[11px] text-slate-400">Fulfilled obligations</span>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-medium">Due Soon</span>
            <div className="text-2xl font-bold text-amber-600">
              {summary.dueSoon || 0}
            </div>
            <span className="text-[11px] text-slate-400">Within renewal window</span>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-medium">Overdue</span>
            <div className="text-2xl font-bold text-rose-600">
              {summary.overdue || 0}
            </div>
            <span className="text-[11px] text-slate-400">Past mandatory deadline</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('rules')}
          className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'rules'
              ? 'border-teal-700 text-teal-800 dark:text-teal-300'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Compliance Rules ({requirements.length})
        </button>
        <button
          onClick={() => setActiveTab('assignments')}
          className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'assignments'
              ? 'border-teal-700 text-teal-800 dark:text-teal-300'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Workforce Assignments ({assignments.length})
        </button>
      </div>

      {/* Tab 1: Rules Catalog */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search compliance requirements..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-brand-ink-primary dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
              aria-label="Search compliance requirements"
            />
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-44 rounded-xl" />
              <Skeleton className="h-44 rounded-xl" />
            </div>
          ) : error ? (
            <ErrorState title="Rules Unavailable" message={error} onRetry={loadData} />
          ) : filteredRequirements.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <ShieldCheck className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                No compliance requirements configured
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Add rules to mandate critical courses for onboarding or annual compliance.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRequirements.map((r) => {
                const id = r._id || r.id;
                return (
                  <Card key={id} className="flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                          {r.frequency?.replace('_', ' ') || 'Mandatory'}
                        </span>
                        <span className="text-xs text-slate-400">
                          Due in {r.dueWithinDays}d
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {r.title}
                      </h3>

                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                        {r.description || 'No description provided.'}
                      </p>

                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                        <span className="truncate max-w-[220px]">
                          Course: <strong>{r.course?.title || 'Linked course'}</strong>
                        </span>
                        <span>Grace: {r.renewalGraceDays || 0}d</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 flex items-center justify-between">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setAssigningReq(r)}
                        className="text-xs flex items-center gap-1.5"
                        aria-label={`Assign ${r.title}`}
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        Assign Rule
                      </Button>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEditReq(r)}
                          title="Edit Rule"
                          aria-label={`Edit ${r.title}`}
                        >
                          <Edit2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(r)}
                          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                          title="Delete Rule"
                          aria-label={`Delete ${r.title}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Workforce Assignments Table */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search assignments by employee name or requirement..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-brand-ink-primary dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                aria-label="Search assignments"
              />
            </div>

            <div className="shrink-0 w-full sm:w-48">
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-brand-ink-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                aria-label="Filter assignments by department"
              >
                <option value="all">All Departments</option>
                {departments.map((d) => (
                  <option key={d._id || d.id} value={d._id || d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="shrink-0 w-full sm:w-44">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-brand-ink-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                aria-label="Filter assignments by status"
              >
                <option value="all">All Statuses</option>
                <option value="compliant">Compliant</option>
                <option value="due_soon">Due Soon</option>
                <option value="overdue">Overdue</option>
                <option value="in_progress">In Progress</option>
                <option value="not_started">Not Started</option>
              </select>
            </div>
          </div>

          {filteredAssignments.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <Clock className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                No matching compliance assignments
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Assignments are automatically registered when rules are assigned to employees or departments.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3.5">Employee</th>
                    <th className="px-5 py-3.5">Requirement</th>
                    <th className="px-5 py-3.5">Due Date</th>
                    <th className="px-5 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredAssignments.map((a) => {
                    const id = a._id || a.id;
                    const empName = a.employee?.user?.name || a.employee?.employeeId || 'Employee';
                    const reqTitle = a.complianceRequirement?.title || a.requirement?.title || 'Requirement';
                    return (
                      <tr key={id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {empName}
                          </div>
                          <div className="text-xs text-slate-500">
                            {a.employee?.department?.name || 'Department'}
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-700 dark:text-slate-300 font-medium">
                          {reqTitle}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-500">
                          {a.dueAt ? new Date(a.dueAt).toLocaleDateString() : 'Unscheduled'}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <AdminStatusBadge status={a.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Requirement Modal */}
      <ComplianceRequirementModal
        isOpen={isReqModalOpen}
        onClose={() => setIsReqModalOpen(false)}
        onSubmit={handleReqModalSubmit}
        requirement={editingReq}
        courses={courses}
        departments={departments}
        isLoading={isSubmittingReq}
      />

      {/* Assign Modal */}
      <ComplianceAssignModal
        isOpen={Boolean(assigningReq)}
        onClose={() => setAssigningReq(null)}
        requirement={assigningReq}
        departments={departments}
        employees={employees}
        onAssignDepartment={handleAssignDepartment}
        onAssignEmployee={handleAssignEmployee}
        isLoading={isAssigning}
      />

      {/* Delete Rule Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteReq}
        title="Delete Compliance Rule"
        message={`Are you sure you want to remove "${deleteTarget?.title}"? Existing assignments will remain for auditing.`}
        confirmText="Delete"
        isDestructive
        isLoading={isDeleting}
      />
    </div>
  );
};

export default AdminCompliancePage;
