import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  CheckCircle,
  Archive,
  Layers,
  Users,
  UserCheck,
} from 'lucide-react';
import adminService from '../services/adminService';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Skeleton from '../components/ui/Skeleton';
import ErrorState from '../components/ui/ErrorState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import AdminStatusBadge from '../components/admin/AdminStatusBadge';
import TrainerCourseModal from '../components/trainer/TrainerCourseModal';
import AssignCourseModal from '../components/admin/AssignCourseModal';

export const AdminCoursesPage = () => {
  const { success, error: toastError } = useToast();

  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Course Assignment Modal
  const [assigningCourse, setAssigningCourse] = useState(null);

  // Delete Dialog
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [coursesData, deptsData, empsData] = await Promise.all([
        adminService.getCourses(),
        adminService.getDepartments(),
        adminService.getEmployees(),
      ]);
      setCourses(coursesData);
      setDepartments(deptsData);
      setEmployees(empsData);
    } catch (err) {
      setError(err.normalizedMessage || err.message || 'Failed to load courses.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (levelFilter !== 'all' && c.level !== levelFilter) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const title = (c.title || '').toLowerCase();
        const desc = (c.description || '').toLowerCase();
        const cat = (c.category || '').toLowerCase();
        return title.includes(term) || desc.includes(term) || cat.includes(term);
      }
      return true;
    });
  }, [courses, statusFilter, levelFilter, searchTerm]);

  const handleOpenCreateModal = () => {
    setEditingCourse(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (course) => {
    setEditingCourse(course);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      if (editingCourse) {
        const id = editingCourse._id || editingCourse.id;
        const updated = await adminService.updateCourse(id, formData);
        setCourses((prev) =>
          prev.map((c) => ((c._id || c.id) === id ? updated : c))
        );
        success(`Course "${updated.title}" updated.`);
      } else {
        const created = await adminService.createCourse(formData);
        setCourses((prev) => [created, ...prev]);
        success(`Course "${created.title}" created.`);
      }
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (course, targetStatus) => {
    const id = course._id || course.id;
    try {
      const updated = await adminService.updateCourse(id, { status: targetStatus });
      setCourses((prev) =>
        prev.map((c) => ((c._id || c.id) === id ? updated : c))
      );
      success(`Course status changed to ${targetStatus}.`);
    } catch (err) {
      toastError(err.normalizedMessage || `Failed to set status to ${targetStatus}.`);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const id = deleteTarget._id || deleteTarget.id;
      await adminService.deleteCourse(id);
      setCourses((prev) => prev.filter((c) => (c._id || c.id) !== id));
      success(`Course "${deleteTarget.title}" deleted.`);
      setDeleteTarget(null);
    } catch (err) {
      toastError(err.normalizedMessage || err.message || 'Failed to delete course.');
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
            <BookOpen className="w-7 h-7 text-teal-700" />
            Course Administration
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Global catalog oversight, curriculum statuses, and course lifecycle controls.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadCourses}
            disabled={loading}
            aria-label="Refresh courses"
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
            Create Course
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
            placeholder="Search by title, description, or category..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-brand-ink-primary dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
            aria-label="Search courses"
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
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div className="shrink-0 w-full sm:w-40">
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-brand-ink-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
            aria-label="Filter by level"
          >
            <option value="all">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <Skeleton className="h-56 rounded-xl" />
          <Skeleton className="h-56 rounded-xl" />
          <Skeleton className="h-56 rounded-xl" />
        </div>
      ) : error ? (
        <ErrorState
          title="Courses Unavailable"
          message={error}
          onRetry={loadCourses}
        />
      ) : filteredCourses.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            No courses found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            {searchTerm || statusFilter !== 'all' || levelFilter !== 'all'
              ? 'Try modifying your search or filters.'
              : 'Add courses to build your learning catalog.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCourses.map((course) => {
            const id = course._id || course.id;
            return (
              <Card key={id} className="flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                      {course.category || 'General'}
                    </span>
                    <AdminStatusBadge status={course.status} />
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1">
                    {course.title}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                    {course.description || 'No description provided.'}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <span className="capitalize font-medium">{course.level || 'All levels'}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      {course.modulesCount ?? 0} modules
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      {course.enrollmentsCount ?? 0} enrolled
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {course.status !== 'published' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(course, 'published')}
                        className="text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                        title="Publish Course"
                        aria-label={`Publish ${course.title}`}
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1" />
                        Publish
                      </Button>
                    )}
                    {course.status === 'published' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(course, 'archived')}
                        className="text-xs text-slate-600 border-slate-300 hover:bg-slate-50"
                        title="Archive Course"
                        aria-label={`Archive ${course.title}`}
                      >
                        <Archive className="w-3.5 h-3.5 mr-1" />
                        Archive
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAssigningCourse(course)}
                      className="text-teal-700 hover:text-teal-800 hover:bg-teal-50"
                      title="Assign Course to Workforce"
                      aria-label={`Assign ${course.title}`}
                    >
                      <UserCheck className="w-4 h-4 mr-1" />
                      <span className="text-xs font-semibold">Assign</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEditModal(course)}
                      title="Edit Course"
                      aria-label={`Edit ${course.title}`}
                    >
                      <Edit2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget(course)}
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      title="Delete Course"
                      aria-label={`Delete ${course.title}`}
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

      {/* Assign Course Modal */}
      <AssignCourseModal
        isOpen={Boolean(assigningCourse)}
        onClose={() => setAssigningCourse(null)}
        course={assigningCourse}
        departments={departments}
        employees={employees}
        onAssigned={loadCourses}
      />

      {/* Course Modal */}
      <TrainerCourseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        course={editingCourse}
        isLoading={isSubmitting}
      />

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Course"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This will soft delete the course document.`}
        confirmText="Delete"
        isDestructive
        isLoading={isDeleting}
      />
    </div>
  );
};

export default AdminCoursesPage;
