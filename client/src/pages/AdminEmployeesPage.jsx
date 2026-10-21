import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import adminService from '../services/adminService';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import ErrorState from '../components/ui/ErrorState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Modal from '../components/ui/Modal';
import AdminStatusBadge from '../components/admin/AdminStatusBadge';
import EmployeeModal from '../components/admin/EmployeeModal';

export const AdminEmployeesPage = () => {
  const { success, error: toastError } = useToast();

  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirm dialog
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Compliance inspect modal
  const [complianceEmployee, setComplianceEmployee] = useState(null);
  const [complianceList, setComplianceList] = useState([]);
  const [loadingCompliance, setLoadingCompliance] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [empData, deptData] = await Promise.all([
        adminService.getEmployees(),
        adminService.getDepartments(),
      ]);
      setEmployees(empData);
      setDepartments(deptData);
    } catch (err) {
      setError(err.normalizedMessage || err.message || 'Failed to load employee records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (departmentFilter !== 'all') {
        const deptId = emp.department?._id || emp.department?.id || emp.department;
        if (deptId !== departmentFilter) return false;
      }

      if (statusFilter === 'active' && emp.isActive === false) return false;
      if (statusFilter === 'inactive' && emp.isActive !== false) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const name = (emp.user?.name || '').toLowerCase();
        const email = (emp.user?.email || '').toLowerCase();
        const empId = (emp.employeeId || '').toLowerCase();
        const desig = (emp.designation || '').toLowerCase();
        return (
          name.includes(term) ||
          email.includes(term) ||
          empId.includes(term) ||
          desig.includes(term)
        );
      }

      return true;
    });
  }, [employees, departmentFilter, statusFilter, searchTerm]);

  const handleOpenCreateModal = () => {
    setEditingEmployee(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (emp) => {
    setEditingEmployee(emp);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      if (editingEmployee) {
        const id = editingEmployee._id || editingEmployee.id;
        const updated = await adminService.updateEmployee(id, formData);
        setEmployees((prev) =>
          prev.map((e) => ((e._id || e.id) === id ? updated : e))
        );
        success('Employee profile updated successfully.');
      } else {
        const created = await adminService.createEmployee(formData);
        setEmployees((prev) => [created, ...prev]);
        success('Employee profile created successfully.');
      }
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const id = deleteTarget._id || deleteTarget.id;
      await adminService.deleteEmployee(id);
      setEmployees((prev) =>
        prev.map((e) => ((e._id || e.id) === id ? { ...e, isActive: false } : e))
      );
      success(`Deactivated employee profile ${deleteTarget.employeeId}.`);
      setDeleteTarget(null);
    } catch (err) {
      toastError(err.normalizedMessage || err.message || 'Failed to deactivate employee.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleInspectCompliance = async (emp) => {
    setComplianceEmployee(emp);
    setLoadingCompliance(true);
    setComplianceList([]);
    try {
      const id = emp._id || emp.id;
      const assignments = await adminService.getEmployeeCompliance(id);
      setComplianceList(assignments);
    } catch (err) {
      toastError(err.normalizedMessage || 'Could not load compliance assignments.');
    } finally {
      setLoadingCompliance(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-ink-primary dark:text-white flex items-center gap-2">
            <Users className="w-7 h-7 text-teal-700" />
            Workforce Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Maintain organizational profiles, departmental linkages, and staff compliance records.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            aria-label="Refresh employees"
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add Employee
          </Button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, employee ID, or designation..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-brand-ink-primary dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
            aria-label="Search employees"
          />
        </div>

        {departments.length > 0 && (
          <div className="shrink-0 w-full sm:w-52">
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-brand-ink-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
              aria-label="Filter by department"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d._id || d.id} value={d._id || d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="shrink-0 w-full sm:w-40">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-brand-ink-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
            aria-label="Filter by status"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
        </div>
      ) : error ? (
        <ErrorState
          title="Employee Roster Unavailable"
          message={error}
          onRetry={loadData}
        />
      ) : filteredEmployees.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            No employees match your search
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            {searchTerm || departmentFilter !== 'all' || statusFilter !== 'all'
              ? 'Try adjusting your search criteria or resetting filters.'
              : 'Add an employee profile to connect registered users to departments.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Employee</th>
                <th className="px-5 py-3.5">Employee ID</th>
                <th className="px-5 py-3.5">Department</th>
                <th className="px-5 py-3.5">Designation</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredEmployees.map((emp) => {
                const id = emp._id || emp.id;
                const isActive = emp.isActive !== false;
                return (
                  <tr key={id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {emp.user?.name || 'Unnamed Employee'}
                      </div>
                      <div className="text-xs text-slate-500">{emp.user?.email}</div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap font-mono text-xs font-medium text-slate-700 dark:text-slate-300">
                      {emp.employeeId}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 text-xs">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {emp.department?.name || 'Unassigned'}
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-600 dark:text-slate-400">
                      {emp.designation || 'Staff'}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <AdminStatusBadge status={isActive ? 'active' : 'inactive'} />
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleInspectCompliance(emp)}
                          title="View Compliance Status"
                          aria-label={`View compliance for ${emp.user?.name || emp.employeeId}`}
                        >
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEditModal(emp)}
                          title="Edit Profile"
                          aria-label={`Edit ${emp.user?.name || emp.employeeId}`}
                        >
                          <Edit2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                        </Button>
                        {isActive && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTarget(emp)}
                            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            title="Deactivate Profile"
                            aria-label={`Deactivate ${emp.user?.name || emp.employeeId}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Employee Create/Edit Modal */}
      <EmployeeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        employee={editingEmployee}
        departments={departments}
        isLoading={isSubmitting}
      />

      {/* Deactivate Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Deactivate Employee Profile"
        message={`Are you sure you want to deactivate ${deleteTarget?.user?.name || deleteTarget?.employeeId}? They will be marked as inactive in company rosters.`}
        confirmText="Deactivate"
        isDestructive
        isLoading={isDeleting}
      />

      {/* Inspect Compliance Modal */}
      {complianceEmployee && (
        <Modal
          isOpen={Boolean(complianceEmployee)}
          onClose={() => setComplianceEmployee(null)}
          title={`Compliance: ${complianceEmployee.user?.name || complianceEmployee.employeeId}`}
          description={`Assigned regulatory requirements and completion status.`}
          size="lg"
        >
          {loadingCompliance ? (
            <div className="space-y-2 py-4">
              <Skeleton className="h-12 rounded-lg" />
              <Skeleton className="h-12 rounded-lg" />
            </div>
          ) : complianceList.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No compliance obligations assigned to this employee.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto">
              {complianceList.map((c) => (
                <div key={c._id || c.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <h5 className="font-semibold text-slate-900 dark:text-white">
                      {c.complianceRequirement?.title || c.requirement?.title || 'Compliance Rule'}
                    </h5>
                    <p className="text-slate-500">
                      Due: {c.dueAt ? new Date(c.dueAt).toLocaleDateString() : 'No date'}
                    </p>
                  </div>
                  <AdminStatusBadge status={c.status} />
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};

export default AdminEmployeesPage;
