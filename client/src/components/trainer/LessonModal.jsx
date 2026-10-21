import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import Button from '../ui/Button';

const CONTENT_TYPES = [
  { value: 'text', label: 'Article / Text Document' },
  { value: 'video', label: 'Video Stream (URL)' },
  { value: 'link', label: 'External Resource (Link)' },
];

export const LessonModal = ({
  isOpen = false,
  lesson = null,
  defaultOrder = 1,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    contentType: 'text',
    resourceUrl: '',
    order: 1,
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  const isEditing = Boolean(lesson);

  useEffect(() => {
    if (lesson) {
      setFormData({
        title: lesson.title || '',
        content: lesson.content || '',
        contentType: lesson.contentType || 'text',
        resourceUrl: lesson.resourceUrl || '',
        order: lesson.order || 1,
      });
    } else {
      setFormData({
        title: '',
        content: '',
        contentType: 'text',
        resourceUrl: '',
        order: defaultOrder,
      });
    }
    setErrors({});
    setServerError('');
  }, [lesson, defaultOrder, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    if (!formData.title.trim() || formData.title.trim().length < 3) {
      errs.title = 'Lesson title must be at least 3 characters long';
    }
    if (!formData.content.trim()) {
      errs.content = 'Lesson content description is required';
    }
    if (formData.contentType === 'video' || formData.contentType === 'link') {
      if (!formData.resourceUrl.trim()) {
        errs.resourceUrl = 'Resource URL is required for video or link lessons';
      } else {
        try {
          const parsed = new URL(formData.resourceUrl.trim());
          if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            errs.resourceUrl = 'URL must begin with http:// or https://';
          }
        } catch {
          errs.resourceUrl = 'Please enter a valid web URL';
        }
      }
    }
    if (!formData.order || Number(formData.order) < 1) {
      errs.order = 'Order must be a positive integer';
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
        order: Number(formData.order),
        resourceUrl: formData.resourceUrl ? formData.resourceUrl.trim() : null,
      });
      onClose();
    } catch (err) {
      setServerError(
        err.response?.data?.message || err.message || 'Failed to save lesson.'
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lesson-modal-title"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <h2
            id="lesson-modal-title"
            className="text-lg font-bold text-brand-ink-primary dark:text-white"
          >
            {isEditing ? 'Edit Lesson' : 'Add New Lesson'}
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
              htmlFor="lesson-title"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Lesson Title *
            </label>
            <input
              id="lesson-title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-slate-800 text-brand-ink-primary dark:text-white focus:ring-2 focus:ring-teal-600 focus:border-teal-600 focus:outline-none ${
                errors.title
                  ? 'border-red-400 focus:border-red-400'
                  : 'border-slate-300 dark:border-slate-700'
              }`}
              placeholder="e.g. Asynchronous Execution Models"
              disabled={isLoading}
            />
            {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="lesson-content-type"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Content Type *
              </label>
              <select
                id="lesson-content-type"
                value={formData.contentType}
                onChange={(e) => setFormData({ ...formData, contentType: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-brand-ink-primary dark:text-white focus:ring-2 focus:ring-teal-600 focus:border-teal-600 focus:outline-none"
                disabled={isLoading}
              >
                {CONTENT_TYPES.map((ct) => (
                  <option key={ct.value} value={ct.value}>
                    {ct.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="lesson-order"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Sequence Order *
              </label>
              <input
                id="lesson-order"
                type="number"
                min={1}
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-slate-800 text-brand-ink-primary dark:text-white focus:ring-2 focus:ring-teal-600 focus:border-teal-600 focus:outline-none ${
                  errors.order
                    ? 'border-red-400 focus:border-red-400'
                    : 'border-slate-300 dark:border-slate-700'
                }`}
                disabled={isLoading}
              />
              {errors.order && <p className="mt-1 text-xs text-red-600">{errors.order}</p>}
            </div>
          </div>

          {(formData.contentType === 'video' || formData.contentType === 'link') && (
            <div>
              <label
                htmlFor="lesson-resource-url"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Resource URL *
              </label>
              <input
                id="lesson-resource-url"
                type="url"
                value={formData.resourceUrl}
                onChange={(e) => setFormData({ ...formData, resourceUrl: e.target.value })}
                className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-slate-800 text-brand-ink-primary dark:text-white focus:ring-2 focus:ring-teal-600 focus:border-teal-600 focus:outline-none ${
                  errors.resourceUrl
                    ? 'border-red-400 focus:border-red-400'
                    : 'border-slate-300 dark:border-slate-700'
                }`}
                placeholder="https://example.com/stream/lesson.mp4"
                disabled={isLoading}
              />
              {errors.resourceUrl && (
                <p className="mt-1 text-xs text-red-600">{errors.resourceUrl}</p>
              )}
            </div>
          )}

          <div>
            <label
              htmlFor="lesson-content"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Lesson Content / Overview *
            </label>
            <textarea
              id="lesson-content"
              rows={4}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-slate-800 text-brand-ink-primary dark:text-white focus:ring-2 focus:ring-teal-600 focus:border-teal-600 focus:outline-none ${
                errors.content
                  ? 'border-red-400 focus:border-red-400'
                  : 'border-slate-300 dark:border-slate-700'
              }`}
              placeholder="Lecture notes, reading material, or lesson instructions..."
              disabled={isLoading}
            />
            {errors.content && (
              <p className="mt-1 text-xs text-red-600">{errors.content}</p>
            )}
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
              {isLoading ? 'Saving...' : isEditing ? 'Update Lesson' : 'Add Lesson'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LessonModal;
