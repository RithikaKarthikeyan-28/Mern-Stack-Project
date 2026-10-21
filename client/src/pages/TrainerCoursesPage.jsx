import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Search, BookOpen, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import trainerService from '../services/trainerService';
import TrainerCourseCard from '../components/trainer/TrainerCourseCard';
import TrainerCourseModal from '../components/trainer/TrainerCourseModal';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import ErrorState from '../components/ui/ErrorState';

export const TrainerCoursesPage = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mutatingId, setMutatingId] = useState(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const trainerUserId = user?._id || user?.id;

  const loadCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await trainerService.getMyCourses(
        trainerUserId ? { trainer: trainerUserId } : {}
      );
      setCourses(res);
    } catch (err) {
      setError(err.message || 'Failed to load courses.');
    } finally {
      setLoading(false);
    }
  }, [trainerUserId]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const categories = useMemo(() => {
    const set = new Set(courses.map((c) => c.category).filter(Boolean));
    return Array.from(set);
  }, [courses]);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      if (statusFilter !== 'all' && course.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && course.category !== categoryFilter) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const title = (course.title || '').toLowerCase();
        const desc = (course.description || '').toLowerCase();
        const cat = (course.category || '').toLowerCase();
        return title.includes(term) || desc.includes(term) || cat.includes(term);
      }
      return true;
    });
  }, [courses, statusFilter, categoryFilter, searchTerm]);

  const handleOpenCreateModal = () => {
    setEditingCourse(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (course) => {
    setEditingCourse(course);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      if (editingCourse) {
        const courseId = editingCourse._id || editingCourse.id;
        const updated = await trainerService.updateCourse(courseId, formData);
        setCourses((prev) =>
          prev.map((c) => ((c._id || c.id) === courseId ? updated : c))
        );
      } else {
        const created = await trainerService.createCourse(formData);
        setCourses((prev) => [created, ...prev]);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (course, nextStatus) => {
    const courseId = course._id || course.id;
    setMutatingId(courseId);
    try {
      const updated = await trainerService.updateCourse(courseId, { status: nextStatus });
      setCourses((prev) =>
        prev.map((c) => ((c._id || c.id) === courseId ? updated : c))
      );
    } catch (err) {
      alert(`Failed to change course status: ${err.message}`);
    } finally {
      setMutatingId(null);
    }
  };

  const statusTabs = [
    { id: 'all', label: 'All Courses', count: courses.length },
    {
      id: 'published',
      label: 'Published',
      count: courses.filter((c) => c.status === 'published').length,
    },
    {
      id: 'draft',
      label: 'Drafts',
      count: courses.filter((c) => c.status === 'draft').length,
    },
    {
      id: 'archived',
      label: 'Archived',
      count: courses.filter((c) => c.status === 'archived').length,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#102A2A] dark:text-white">
            Course Management
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Create, configure, and maintain your authored courses and learning tracks.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadCourses}
            disabled={loading}
            className="flex items-center gap-1.5"
            aria-label="Refresh course list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
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

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search courses by title, topic, or category..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
            aria-label="Search courses"
          />
        </div>

        {categories.length > 0 && (
          <div className="shrink-0 w-full sm:w-48">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-600"
              aria-label="Filter by category"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Status Filter Tabs */}
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

      {/* Main Content Area */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <Skeleton className="h-56 rounded-xl" />
          <Skeleton className="h-56 rounded-xl" />
          <Skeleton className="h-56 rounded-xl" />
        </div>
      ) : error ? (
        <ErrorState
          title="Could Not Load Courses"
          message={error}
          onRetry={loadCourses}
        />
      ) : filteredCourses.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
          <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            No courses found
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
              ? 'Try adjusting your search criteria or resetting the status filters.'
              : 'You have not authored any courses yet. Get started by creating your first course.'}
          </p>
          <div className="mt-5">
            <Button variant="primary" size="sm" onClick={handleOpenCreateModal}>
              <Plus className="w-4 h-4 mr-1.5" />
              Create Course
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCourses.map((course) => (
            <TrainerCourseCard
              key={course._id || course.id}
              course={course}
              onEdit={handleOpenEditModal}
              onStatusChange={handleStatusChange}
              isMutating={mutatingId === (course._id || course.id)}
            />
          ))}
        </div>
      )}

      {/* Modal for Creating / Editing Courses */}
      <TrainerCourseModal
        isOpen={isModalOpen}
        course={editingCourse}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default TrainerCoursesPage;
