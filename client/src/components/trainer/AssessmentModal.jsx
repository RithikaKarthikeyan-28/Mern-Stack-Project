import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import Button from '../ui/Button';

export const AssessmentModal = ({
  isOpen = false,
  assessment = null,
  courses = [],
  modules = [],
  onCourseChange,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    course: '',
    module: '',
    passingPercentage: 60,
    timeLimitMinutes: '',
    maxAttempts: '',
    status: 'draft',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  const isEditing = Boolean(assessment);

  useEffect(() => {
    if (assessment) {
      setFormData({
        title: assessment.title || '',
        description: assessment.description || '',
        course: assessment.course?._id || assessment.course || '',
        module: assessment.module?._id || assessment.module || '',
        passingPercentage: assessment.passingPercentage ?? 60,
        timeLimitMinutes: assessment.timeLimitMinutes ?? '',
        maxAttempts: assessment.maxAttempts ?? '',
        status: assessment.status || 'draft',
      });
    } else {
      const defaultCourseId = courses[0]?._id || courses[0]?.id || '';
      setFormData({
        title: '',
        description: '',
        course: defaultCourseId,
        module: '',
        passingPercentage: 60,
        timeLimitMinutes: '',
        maxAttempts: '',
        status: 'draft',
      });
      if (defaultCourseId && onCourseChange) {
        onCourseChange(defaultCourseId);
      }
    }
    setErrors({});
    setServerError('');
  }, [assessment, courses, isOpen, onCourseChange]);

  if (!isOpen) return null;

  const handleCourseSelect = (courseId) => {
    setFormData((prev) => ({ ...prev, course: courseId, module: '' }));
    if (onCourseChange) {
      onCourseChange(courseId);
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.title.trim() || formData.title.trim().length < 3) {
      errs.title = 'Assessment title must be at least 3 characters long';
    }
    if (!formData.course) {
      errs.course = 'Please associate assessment with a course';
    }
    const passingPct = Number(formData.passingPercentage);
    if (isNaN(passingPct) || passingPct < 0 || passingPct > 100) {
      errs.passingPercentage = 'Passing score must be between 0 and 100';
    }
    if (formData.timeLimitMinutes && Number(formData.timeLimitMinutes) < 1) {
      errs.timeLimitMinutes = 'Time limit must be at least 1 minute if provided';
    }
    if (formData.maxAttempts && Number(formData.maxAttempts) < 1) {
      errs.maxAttempts = 'Max attempts must be at least 1 if provided';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        course: formData.course,
        module: formData.module ? formData.module : null,
        passingPercentage: Number(formData.passingPercentage),
        timeLimitMinutes: formData.timeLimitMinutes ? Number(formData.timeLimitMinutes) : null,
        maxAttempts: formData.maxAttempts ? Number(formData.maxAttempts) : null,
        status: formData.status,
      };
      await onSubmit(payload);
      onClose();
    } catch (err) {
      setServerError(
        err.response?.data?.message || err.message || 'Failed to save assessment.'
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="assessment-modal-title"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <h2
            id="assessment-modal-title"
            className="text-xl font-bold text-slate-900 dark:text-white"
          >
            {isEditing ? 'Edit Assessment' : 'Create Assessment'}
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
              htmlFor="assessment-title"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Assessment Title *
            </label>
            <input
              id="assessment-title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-600 focus:border-teal-600 focus:outline-none ${
                errors.title
                  ? 'border-red-400 focus:border-red-400'
                  : 'border-slate-300 dark:border-slate-700'
              }`}
              placeholder="e.g. Mid-Term Security Evaluation"
              disabled={isLoading}
            />
            {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
          </div>

          <div>
            <label
              htmlFor="assessment-course"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Associated Course *
            </label>
            <select
              id="assessment-course"
              value={formData.course}
              onChange={(e) => handleCourseSelect(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-600 focus:border-teal-600 focus:outline-none"
              disabled={isLoading || isEditing}
            >
              <option value="">Select Course</option>
              {courses.map((c) => (
                <option key={c._id || c.id} value={c._id || c.id}>
                  {c.title}
                </option>
              ))}
            </select>
            {errors.course && <p className="mt-1 text-xs text-red-600">{errors.course}</p>}
          </div>

          {modules.length > 0 && (
            <div>
              <label
                htmlFor="assessment-module"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Module (Optional)
              </label>
              <select
                id="assessment-module"
                value={formData.module}
                onChange={(e) => setFormData({ ...formData, module: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-600 focus:border-teal-600 focus:outline-none"
                disabled={isLoading}
              >
                <option value="">Course Level (Entire Course)</option>
                {modules.map((m) => (
                  <option key={m._id || m.id} value={m._id || m.id}>
                    Module {m.order}: {m.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="assessment-pass-rate"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Passing % *
              </label>
              <input
                id="assessment-pass-rate"
                type="number"
                min={0}
                max={100}
                value={formData.passingPercentage}
                onChange={(e) => setFormData({ ...formData, passingPercentage: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-600 focus:border-teal-600 focus:outline-none"
                disabled={isLoading}
              />
              {errors.passingPercentage && (
                <p className="mt-1 text-xs text-red-600">{errors.passingPercentage}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="assessment-time-limit"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Time Limit (mins)
              </label>
              <input
                id="assessment-time-limit"
                type="number"
                min={1}
                value={formData.timeLimitMinutes}
                onChange={(e) => setFormData({ ...formData, timeLimitMinutes: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-600 focus:border-teal-600 focus:outline-none"
                placeholder="Optional"
                disabled={isLoading}
              />
            </div>

            <div>
              <label
                htmlFor="assessment-max-attempts"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Max Attempts
              </label>
              <input
                id="assessment-max-attempts"
                type="number"
                min={1}
                value={formData.maxAttempts}
                onChange={(e) => setFormData({ ...formData, maxAttempts: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-600 focus:border-teal-600 focus:outline-none"
                placeholder="Unlimited"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="assessment-status"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Status *
            </label>
            <select
              id="assessment-status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-600 focus:border-teal-600 focus:outline-none"
              disabled={isLoading}
            >
              <option value="draft">Draft (Private)</option>
              <option value="published">Published (Learner Accessible)</option>
              {isEditing && <option value="archived">Archived</option>}
            </select>
          </div>

          <div>
            <label
              htmlFor="assessment-description"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Instructions / Description
            </label>
            <textarea
              id="assessment-description"
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-600 focus:border-teal-600 focus:outline-none"
              placeholder="Guidelines for students prior to starting the quiz..."
              disabled={isLoading}
            />
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
              {isLoading ? 'Saving...' : isEditing ? 'Update Assessment' : 'Create Assessment'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssessmentModal;
