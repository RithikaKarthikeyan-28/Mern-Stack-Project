import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, FileCheck, RefreshCw, Clock, Award, HelpCircle, Archive, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import trainerService from '../services/trainerService';
import AssessmentModal from '../components/trainer/AssessmentModal';
import TrainerStatusBadge from '../components/trainer/TrainerStatusBadge';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import ErrorState from '../components/ui/ErrorState';

export const TrainerAssessmentsPage = () => {
  const { user } = useAuth();

  const [assessments, setAssessments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mutatingId, setMutatingId] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState(null);
  const [courseModules, setCourseModules] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const trainerUserId = user?._id || user?.id;

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [assessmentsRes, coursesRes] = await Promise.all([
        trainerService.getAssessments(),
        trainerService.getMyCourses(trainerUserId ? { trainer: trainerUserId } : {}),
      ]);
      setAssessments(assessmentsRes);
      setCourses(coursesRes);
    } catch (err) {
      setError(err.message || 'Failed to load assessments.');
    } finally {
      setLoading(false);
    }
  }, [trainerUserId]);

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
    return assessments.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;

      if (courseFilter !== 'all') {
        const itemCourseId = item.course?._id || item.course?.id || item.course;
        if (itemCourseId !== courseFilter) return false;
      }

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const title = (item.title || '').toLowerCase();
        const courseTitle = (item.course?.title || '').toLowerCase();
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

  const handleOpenEditModal = async (assessment) => {
    setEditingAssessment(assessment);
    const courseId = assessment.course?._id || assessment.course?.id || assessment.course;
    if (courseId) {
      await handleCourseChangeForModal(courseId);
    }
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      if (editingAssessment) {
        const assessmentId = editingAssessment._id || editingAssessment.id;
        const updated = await trainerService.updateAssessment(assessmentId, formData);
        setAssessments((prev) =>
          prev.map((a) => ((a._id || a.id) === assessmentId ? updated : a))
        );
      } else {
        const created = await trainerService.createAssessment(formData);
        setAssessments((prev) => [created, ...prev]);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (assessment, nextStatus) => {
    const assessmentId = assessment._id || assessment.id;
    setMutatingId(assessmentId);
    try {
      let updated;
      if (nextStatus === 'published') {
        updated = await trainerService.publishAssessment(assessmentId);
      } else if (nextStatus === 'archived') {
        updated = await trainerService.archiveAssessment(assessmentId);
      } else {
        updated = await trainerService.updateAssessment(assessmentId, { status: nextStatus });
      }
      setAssessments((prev) =>
        prev.map((a) => ((a._id || a.id) === assessmentId ? updated : a))
      );
    } catch (err) {
      alert(`Failed to update status: ${err.message}`);
    } finally {
      setMutatingId(null);
    }
  };

  const statusTabs = [
    { id: 'all', label: 'All Assessments', count: assessments.length },
    {
      id: 'published',
      label: 'Published',
      count: assessments.filter((a) => a.status === 'published').length,
    },
    {
      id: 'draft',
      label: 'Drafts',
      count: assessments.filter((a) => a.status === 'draft').length,
    },
    {
      id: 'archived',
      label: 'Archived',
      count: assessments.filter((a) => a.status === 'archived').length,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#102A2A] dark:text-white">
            Assessment Management
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Design assessments, configure passing criteria, and manage question pools.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5"
            aria-label="Refresh assessments"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5"
            disabled={courses.length === 0}
          >
            <Plus className="w-4 h-4" />
            Create Assessment
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search assessments by title or course..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
            aria-label="Search assessments"
          />
        </div>

        {courses.length > 0 && (
          <div className="shrink-0 w-full sm:w-60">
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-600"
              aria-label="Filter by course"
            >
              <option value="all">All Assigned Courses</option>
              {courses.map((c) => (
                <option key={c._id || c.id} value={c._id || c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800">
        {statusTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              statusFilter === tab.id
                ? 'bg-teal-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 font-semibold'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                statusFilter === tab.id
                  ? 'bg-teal-200/60 text-teal-900 dark:bg-teal-900 dark:text-teal-200'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Assessment Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <Skeleton className="h-56 rounded-xl" />
          <Skeleton className="h-56 rounded-xl" />
          <Skeleton className="h-56 rounded-xl" />
        </div>
      ) : error ? (
        <ErrorState
          title="Could Not Load Assessments"
          message={error}
          onRetry={loadData}
        />
      ) : filteredAssessments.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
          <FileCheck className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            No assessments found
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm || statusFilter !== 'all' || courseFilter !== 'all'
              ? 'Try adjusting your search criteria or resetting the status filters.'
              : 'You have not created any assessments yet. Click "Create Assessment" to build a quiz.'}
          </p>
          <div className="mt-5">
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenCreateModal}
              disabled={courses.length === 0}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Create Assessment
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAssessments.map((assessment) => {
            const assessmentId = assessment._id || assessment.id;
            const courseTitle = assessment.course?.title || 'Course';
            const isDraft = assessment.status === 'draft';
            const isPublished = assessment.status === 'published';
            const isArchived = assessment.status === 'archived';

            return (
              <div
                key={assessmentId}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                data-testid={`trainer-assessment-card-${assessmentId}`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 truncate max-w-[180px]">
                      {courseTitle}
                    </span>
                    <TrainerStatusBadge status={assessment.status} />
                  </div>

                  <h3 className="text-base font-semibold text-[#102A2A] dark:text-white line-clamp-1">
                    {assessment.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                    {assessment.description || 'No description provided.'}
                  </p>

                  <div className="mt-4 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                    <span className="flex items-center gap-1 font-medium text-teal-700 dark:text-teal-400">
                      <Award className="w-3.5 h-3.5" />
                      Pass: {assessment.passingPercentage}%
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {assessment.timeLimitMinutes ? `${assessment.timeLimitMinutes}m` : 'No limit'}
                    </span>
                    <span className="flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5" />
                      {assessment.maxAttempts ? `Max: ${assessment.maxAttempts}` : 'Unlimited'}
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                  <Link to={`/trainer/assessments/${assessmentId}`}>
                    <Button variant="primary" size="sm" className="text-xs">
                      Questions &amp; Results
                    </Button>
                  </Link>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEditModal(assessment)}
                      className="text-xs"
                      aria-label={`Edit ${assessment.title}`}
                    >
                      Edit
                    </Button>

                    {isDraft && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(assessment, 'published')}
                        className="text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800"
                        disabled={mutatingId === assessmentId}
                        aria-label={`Publish ${assessment.title}`}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Publish
                      </Button>
                    )}

                    {isPublished && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(assessment, 'archived')}
                        className="text-xs text-slate-600 border-slate-300 hover:bg-slate-50 dark:text-slate-400"
                        disabled={mutatingId === assessmentId}
                        aria-label={`Archive ${assessment.title}`}
                      >
                        <Archive className="w-3 h-3 mr-1" />
                        Archive
                      </Button>
                    )}

                    {isArchived && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(assessment, 'draft')}
                        className="text-xs text-amber-700 border-amber-300 hover:bg-amber-50"
                        disabled={mutatingId === assessmentId}
                        aria-label={`Restore ${assessment.title}`}
                      >
                        Draft
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Assessment Modal */}
      <AssessmentModal
        isOpen={isModalOpen}
        assessment={editingAssessment}
        courses={courses}
        modules={courseModules}
        onCourseChange={handleCourseChangeForModal}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default TrainerAssessmentsPage;
