import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import Button from '../ui/Button';

const CATEGORIES = [
  'Engineering',
  'Security & Compliance',
  'Product & Design',
  'Data & Analytics',
  'Management & Leadership',
  'Quality Assurance',
  'General',
];

const LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

export const TrainerCourseModal = ({
  isOpen = false,
  course = null,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Engineering',
    level: 'beginner',
    duration: 10,
    status: 'draft',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  const isEditing = Boolean(course);

  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title || '',
        description: course.description || '',
        category: course.category || 'Engineering',
        level: course.level || 'beginner',
        duration: course.duration || 10,
        status: course.status || 'draft',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        category: 'Engineering',
        level: 'beginner',
        duration: 10,
        status: 'draft',
      });
    }
    setErrors({});
    setServerError('');
  }, [course, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    if (!formData.title.trim() || formData.title.trim().length < 3) {
      errs.title = 'Title must be at least 3 characters long';
    }
    if (!formData.description.trim() || formData.description.trim().length < 10) {
      errs.description = 'Description must be at least 10 characters long';
    }
    if (!formData.category.trim()) {
      errs.category = 'Category is required';
    }
    if (!formData.level) {
      errs.level = 'Level is required';
    }
    if (!formData.duration || Number(formData.duration) < 1) {
      errs.duration = 'Duration must be at least 1 hour';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    try {
      await onSubmit({
        ...formData,
        duration: Number(formData.duration),
      });
      onClose();
    } catch (err) {
      setServerError(
        err.response?.data?.message || err.message || 'Failed to save course. Please check inputs.'
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="course-modal-title"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <h2
            id="course-modal-title"
            className="text-xl font-bold text-brand-ink-primary dark:text-white"
          >
            {isEditing ? 'Edit Course' : 'Create New Course'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
            aria-label="Close dialog"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {serverError && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="course-title"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Course Title *
            </label>
            <input
              id="course-title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-slate-800 text-brand-ink-primary dark:text-white focus:ring-2 focus:ring-teal-600 focus:border-teal-600 focus:outline-none ${
                errors.title
                  ? 'border-red-400 focus:border-red-400'
                  : 'border-slate-300 dark:border-slate-700'
              }`}
              placeholder="e.g. Advanced Distributed Systems"
              disabled={isLoading}
            />
            {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
          </div>

          <div>
            <label
              htmlFor="course-description"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Description *
            </label>
            <textarea
              id="course-description"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-slate-800 text-brand-ink-primary dark:text-white focus:ring-2 focus:ring-teal-600 focus:border-teal-600 focus:outline-none ${
                errors.description
                  ? 'border-red-400 focus:border-red-400'
                  : 'border-slate-300 dark:border-slate-700'
              }`}
              placeholder="Detailed synopsis of the learning goals..."
              disabled={isLoading}
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-600">{errors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="course-category"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Category *
              </label>
              <select
                id="course-category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-brand-ink-primary dark:text-white focus:ring-2 focus:ring-teal-600 focus:border-teal-600 focus:outline-none"
                disabled={isLoading}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="course-level"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Difficulty Level *
              </label>
              <select
                id="course-level"
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-brand-ink-primary dark:text-white focus:ring-2 focus:ring-teal-600 focus:border-teal-600 focus:outline-none"
                disabled={isLoading}
              >
                {LEVELS.map((lvl) => (
                  <option key={lvl.value} value={lvl.value}>
                    {lvl.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="course-duration"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Duration (hours) *
              </label>
              <input
                id="course-duration"
                type="number"
                min={1}
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-slate-800 text-brand-ink-primary dark:text-white focus:ring-2 focus:ring-teal-600 focus:border-teal-600 focus:outline-none ${
                  errors.duration
                    ? 'border-red-400 focus:border-red-400'
                    : 'border-slate-300 dark:border-slate-700'
                }`}
                disabled={isLoading}
              />
              {errors.duration && (
                <p className="mt-1 text-xs text-red-600">{errors.duration}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="course-status"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Publication Status *
              </label>
              <select
                id="course-status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-brand-ink-primary dark:text-white focus:ring-2 focus:ring-teal-600 focus:border-teal-600 focus:outline-none"
                disabled={isLoading}
              >
                <option value="draft">Draft (Private)</option>
                <option value="published">Published (Visible)</option>
                {isEditing && <option value="archived">Archived</option>}
              </select>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : isEditing ? 'Update Course' : 'Create Course'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TrainerCourseModal;
