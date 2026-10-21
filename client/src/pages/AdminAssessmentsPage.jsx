import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FileCheck,
  Search,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  CheckCircle,
  Archive,
  BarChart3,
  Award,
  Clock,
  HelpCircle,
} from 'lucide-react';
import adminService from '../services/adminService';
import trainerService from '../services/trainerService';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Skeleton from '../components/ui/Skeleton';
import ErrorState from '../components/ui/ErrorState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Modal from '../components/ui/Modal';
import AdminStatusBadge from '../components/admin/AdminStatusBadge';
import AssessmentModal from '../components/trainer/AssessmentModal';
import AssessmentPerformanceCard from '../components/trainer/AssessmentPerformanceCard';

export const AdminAssessmentsPage = () => {
  const { success, error: toastError } = useToast();

  const [assessments, setAssessments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [courseModules, setCourseModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Dialog
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Performance Inspect
  const [inspectAssessment, setInspectAssessment] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [loadingPerf, setLoadingPerf] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [assessmentsData, coursesData] = await Promise.all([
        adminService.getAssessments(),
        adminService.getCourses(),
      ]);
      setAssessments(assessmentsData);
      setCourses(coursesData);
    } catch (err) {
      setError(err.normalizedMessage || err.message || 'Failed to load assessments.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCourseChangeForModal = useCallback(async (courseId) => {
    if (!courseId) {
      setCourseModules([]);
      return;
    }
    try {
      const mods = await trainerService.getCourseModules(courseId);
      setCourseModules(mods);
    } catch {
      setCourseModules([]);
    }
  }, []);

  const filteredAssessments = useMemo(() => {
    return assessments.filter((a) => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;

      if (courseFilter !== 'all') {
        const itemCourseId = a.course?._id || a.course?.id || a.course;
        if (itemCourseId !== courseFilter) return false;
      }

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const title = (a.title || '').toLowerCase();
        const courseTitle = (a.course?.title || '').toLowerCase();
        return title.includes(term) || courseTitle.includes(term);
      }
      return true;
    });
  }, [assessments, statusFilter, courseFilter, searchTerm]);

  const handleOpenCreateModal = () => {
    setEditingAssessment(null);
    if (courses.length > 0) {
      handleCourseChangeForModal(courses[0]._id || courses[0].id);
    }
    setIsModalOpen(true);
  };

  const handleOpenEditModal = async (a) => {
    setEditingAssessment(a);
    const courseId = a.course?._id || a.course?.id || a.course;
    if (courseId) {
      await handleCourseChangeForModal(courseId);
    }
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      if (editingAssessment) {
        const id = editingAssessment._id || editingAssessment.id;
        const updated = await adminService.updateAssessment(id, formData);
        setAssessments((prev) =>
          prev.map((item) => ((item._id || item.id) === id ? updated : item))
        );
        success(`Assessment "${updated.title}" updated.`);
      } else {
        const created = await adminService.createAssessment(formData);
        setAssessments((prev) => [created, ...prev]);
        success(`Assessment "${created.title}" created.`);
      }
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (a, targetStatus) => {
    const id = a._id || a.id;
    try {
      let updated;
      if (targetStatus === 'published') {
        updated = await adminService.publishAssessment(id);
      } else if (targetStatus === 'archived') {
        updated = await adminService.archiveAssessment(id);
      } else {
        updated = await adminService.updateAssessment(id, { status: 'draft' });
      }
      setAssessments((prev) =>
        prev.map((item) => ((item._id || item.id) === id ? updated : item))
      );
      success(`Assessment status set to ${targetStatus}.`);
    } catch (err) {
      toastError(err.normalizedMessage || `Failed to change status to ${targetStatus}.`);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const id = deleteTarget._id || deleteTarget.id;
      await adminService.deleteAssessment(id);
      setAssessments((prev) => prev.filter((item) => (item._id || item.id) !== id));
      success(`Assessment "${deleteTarget.title}" deleted.`);
      setDeleteTarget(null);
    } catch (err) {
      toastError(err.normalizedMessage || err.message || 'Failed to delete assessment.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleInspectPerformance = async (a) => {
    setInspectAssessment(a);
    setLoadingPerf(true);
    setPerformanceData(null);
    try {
      const id = a._id || a.id;
      const perf = await adminService.getAssessmentPerformance(id);
      setPerformanceData(perf);
    } catch (err) {
      toastError(err.normalizedMessage || 'Could not load performance metrics.');
    } finally {
      setLoadingPerf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-ink-primary dark:text-white flex items-center gap-2">
            <FileCheck className="w-7 h-7 text-purple-600" />
            Assessment Oversight
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Global tests catalog, passing thresholds, attempts configuration, and performance analytics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            aria-label="Refresh assessments"
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
            Create Assessment
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
            placeholder="Search by title or associated course..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-brand-ink-primary dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
            aria-label="Search assessments"
          />
        </div>

        {courses.length > 0 && (
          <div className="shrink-0 w-full sm:w-56">
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-brand-ink-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
              aria-label="Filter by course"
            >
              <option value="all">All Courses</option>
              {courses.map((c) => (
                <option key={c._id || c.id} value={c._id || c.id}>
                  {c.title}
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
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
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
          title="Assessments Unavailable"
          message={error}
          onRetry={loadData}
        />
      ) : filteredAssessments.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <FileCheck className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-brand-ink-primary dark:text-white">
            No assessments found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            {searchTerm || statusFilter !== 'all' || courseFilter !== 'all'
              ? 'Try modifying your search or filters.'
              : 'Add assessments to evaluate learner competency.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAssessments.map((a) => {
            const id = a._id || a.id;
            return (
              <Card key={id} className="flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[11px] font-semibold text-teal-700 dark:text-teal-400 truncate max-w-[180px]">
                      {a.course?.title || 'Standalone Assessment'}
                    </span>
                    <AdminStatusBadge status={a.status} />
                  </div>

                  <h3 className="text-base font-bold text-brand-ink-primary dark:text-white line-clamp-1">
                    {a.title}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                    {a.description || 'No description provided.'}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <span className="flex items-center gap-1 font-medium">
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      Pass: {a.passingPercentage}%
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {a.timeLimitMinutes ? `${a.timeLimitMinutes}m` : 'Untimed'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                      {a.questionsCount ?? a.questions?.length ?? 0} questions
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleInspectPerformance(a)}
                      className="text-xs text-purple-700 border-purple-300 hover:bg-purple-50"
                      title="View Performance Analytics"
                      aria-label={`View performance for ${a.title}`}
                    >
                      <BarChart3 className="w-3.5 h-3.5 mr-1" />
                      Stats
                    </Button>

                    {a.status !== 'published' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(a, 'published')}
                        className="text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                        title="Publish Assessment"
                        aria-label={`Publish ${a.title}`}
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    {a.status === 'published' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(a, 'archived')}
                        className="text-xs text-slate-600 border-slate-300 hover:bg-slate-50"
                        title="Archive Assessment"
                        aria-label={`Archive ${a.title}`}
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEditModal(a)}
                      title="Edit Assessment"
                      aria-label={`Edit ${a.title}`}
                    >
                      <Edit2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget(a)}
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      title="Delete Assessment"
                      aria-label={`Delete ${a.title}`}
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

      {/* Assessment Modal */}
      <AssessmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        assessment={editingAssessment}
        courses={courses}
        modules={courseModules}
        onCourseChange={handleCourseChangeForModal}
        isLoading={isSubmitting}
      />

      {/* Performance Modal */}
      {inspectAssessment && (
        <Modal
          isOpen={Boolean(inspectAssessment)}
          onClose={() => setInspectAssessment(null)}
          title={`Performance: ${inspectAssessment.title}`}
          description="Authoritative assessment analytics compiled from learner attempts."
          size="md"
        >
          {loadingPerf ? (
            <div className="space-y-3 py-4">
              <Skeleton className="h-24 rounded-xl" />
            </div>
          ) : (
            <AssessmentPerformanceCard
              performance={performanceData}
              passingPercentage={inspectAssessment.passingPercentage}
            />
          )}
        </Modal>
      )}

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Assessment"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This cannot be undone.`}
        confirmText="Delete"
        isDestructive
        isLoading={isDeleting}
      />
    </div>
  );
};

export default AdminAssessmentsPage;
