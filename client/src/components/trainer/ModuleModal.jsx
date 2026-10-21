import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import Button from '../ui/Button';

export const ModuleModal = ({
  isOpen = false,
  module = null,
  defaultOrder = 1,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    order: 1,
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  const isEditing = Boolean(module);

  useEffect(() => {
    if (module) {
      setFormData({
        title: module.title || '',
        description: module.description || '',
        order: module.order || 1,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        order: defaultOrder,
      });
    }
    setErrors({});
    setServerError('');
  }, [module, defaultOrder, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    if (!formData.title.trim() || formData.title.trim().length < 3) {
      errs.title = 'Module title must be at least 3 characters long';
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
      });
      onClose();
    } catch (err) {
      setServerError(
        err.response?.data?.message || err.message || 'Failed to save module.'
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="module-modal-title"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <h2
            id="module-modal-title"
            className="text-lg font-bold text-brand-ink-primary dark:text-white"
          >
            {isEditing ? 'Edit Module' : 'Add New Module'}
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
              htmlFor="module-title"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Module Title *
            </label>
            <input
              id="module-title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-slate-800 text-brand-ink-primary dark:text-white focus:ring-2 focus:ring-teal-600 focus:border-teal-600 focus:outline-none ${
                errors.title
                  ? 'border-red-400 focus:border-red-400'
                  : 'border-slate-300 dark:border-slate-700'
              }`}
              placeholder="e.g. Core Architecture & Design Patterns"
              disabled={isLoading}
            />
            {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
          </div>

          <div>
            <label
              htmlFor="module-description"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Description (Optional)
            </label>
            <textarea
              id="module-description"
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-brand-ink-primary dark:text-white focus:ring-2 focus:ring-teal-600 focus:border-teal-600 focus:outline-none"
              placeholder="Brief summary of topics covered in this module..."
              disabled={isLoading}
            />
          </div>

          <div>
            <label
              htmlFor="module-order"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Sequence Order *
            </label>
            <input
              id="module-order"
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
              {isLoading ? 'Saving...' : isEditing ? 'Update Module' : 'Add Module'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModuleModal;
