import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Building2,
  Search,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  Users,
  BookOpen,
} from 'lucide-react';
import adminService from '../services/adminService';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Skeleton from '../components/ui/Skeleton';
import ErrorState from '../components/ui/ErrorState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import AdminStatusBadge from '../components/admin/AdminStatusBadge';
import DepartmentModal from '../components/admin/DepartmentModal';

export const AdminDepartmentsPage = () => {
  const { success, error: toastError } = useToast();

  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [deptData, empData, courseData] = await Promise.all([
        adminService.getDepartments(),
        adminService.getEmployees(),
        adminService.getCourses(),
      ]);
      setDepartments(deptData);
      setEmployees(empData);
      setCourses(courseData);
    } catch (err) {
      setError(err.normalizedMessage || err.message || 'Failed to load department records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Compute headcount per department
  const headcountMap = useMemo(() => {
    const map = {};
    employees.forEach((emp) => {
      const deptId = emp.department?._id || emp.department?.id || emp.department;
      if (deptId) {
        map[deptId] = (map[deptId] || 0) + 1;
      }
    });
    return map;
  }, [employees]);

  // Compute mapped courses per department
  const courseMap = useMemo(() => {
    const map = {};
    courses.forEach((c) => {
      const deptId = c.department?._id || c.department?.id || c.department;
      if (deptId) {
        if (!map[deptId]) map[deptId] = [];
        map[deptId].push(c);
      }
    });
    return map;
  }, [courses]);

  const filteredDepartments = useMemo(() => {
    return departments.filter((d) => {
      if (statusFilter === 'active' && d.isActive === false) return false;
      if (statusFilter === 'inactive' && d.isActive !== false) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const name = (d.name || '').toLowerCase();
        const desc = (d.description || '').toLowerCase();
        return name.includes(term) || desc.includes(term);
      }
      return true;
    });
  }, [departments, statusFilter, searchTerm]);

  const handleOpenCreateModal = () => {
    setEditingDept(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (dept) => {
    setEditingDept(dept);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      if (editingDept) {
        const id = editingDept._id || editingDept.id;
        const updated = await adminService.updateDepartment(id, formData);
        setDepartments((prev) =>
          prev.map((d) => ((d._id || d.id) === id ? updated : d))
        );
        success(`Department "${updated.name}" updated successfully.`);
      } else {
        const created = await adminService.createDepartment(formData);
        setDepartments((prev) => [...prev, created]);
        success(`Department "${created.name}" created successfully.`);
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
      await adminService.deleteDepartment(id);
      setDepartments((prev) =>
        prev.map((d) => ((d._id || d.id) === id ? { ...d, isActive: false } : d))
      );
      success(`Deactivated department "${deleteTarget.name}".`);
      setDeleteTarget(null);
    } catch (err) {
      toastError(err.normalizedMessage || err.message || 'Failed to deactivate department.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-ink-primary dark:text-white flex items-center gap-2">
            <Building2 className="w-7 h-7 text-sky-600" />
            Departments
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure business units, workforce divisions, and compliance assignment scopes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            aria-label="Refresh departments"
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
            Add Department
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
            placeholder="Search by department name or description..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-brand-ink-primary dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
            aria-label="Search departments"
          />
        </div>

        <div className="shrink-0 w-full sm:w-44">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-44 rounded-xl" />
        </div>
      ) : error ? (
        <ErrorState
          title="Departments Unavailable"
          message={error}
          onRetry={loadData}
        />
      ) : filteredDepartments.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            No departments found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            {searchTerm || statusFilter !== 'all'
              ? 'Try modifying your search or filters.'
              : 'Add your company departments to organize your workforce.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDepartments.map((dept) => {
            const id = dept._id || dept.id;
            const isActive = dept.isActive !== false;
            const count = headcountMap[id] || 0;

            return (
              <Card key={id} className="flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                      {dept.name}
                    </h3>
                    <AdminStatusBadge status={isActive ? 'active' : 'inactive'} />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 min-h-[36px]">
                    {dept.description || 'No description provided.'}
                  </p>
                  {courseMap[id]?.length > 0 && (
                    <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-teal-700 font-medium bg-teal-50 px-2.5 py-1 rounded-md border border-teal-100/80">
                      <BookOpen className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Mapped Course: {courseMap[id][0].title}</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>
                      <strong className="text-slate-900 dark:text-white">{count}</strong>{' '}
                      {count === 1 ? 'employee' : 'employees'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEditModal(dept)}
                      title="Edit Department"
                      aria-label={`Edit ${dept.name}`}
                    >
                      <Edit2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    </Button>
                    {isActive && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteTarget(dept)}
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        title="Deactivate Department"
                        aria-label={`Deactivate ${dept.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Department Modal */}
      <DepartmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        department={editingDept}
        isLoading={isSubmitting}
      />

      {/* Deactivate Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Deactivate Department"
        message={`Are you sure you want to deactivate "${deleteTarget?.name}"? New employees cannot be assigned to inactive departments.`}
        confirmText="Deactivate"
        isDestructive
        isLoading={isDeleting}
      />
    </div>
  );
};

export default AdminDepartmentsPage;
