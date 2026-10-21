import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';

export const DepartmentModal = ({
  isOpen,
  onClose,
  onSubmit,
  department = null,
  isLoading = false,
}) => {
  const isEditing = Boolean(department);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (department) {
      setFormData({
        name: department.name || '',
        description: department.description || '',
        isActive: department.isActive !== false,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        isActive: true,
      });
    }
    setErrors({});
    setServerError('');
  }, [department, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      errs.name = 'Department name is required';
    } else if (trimmedName.length < 2) {
      errs.name = 'Department name must be at least 2 characters';
    } else if (trimmedName.length > 100) {
      errs.name = 'Department name cannot exceed 100 characters';
    }
    if (formData.description && formData.description.length > 500) {
      errs.description = 'Description cannot exceed 500 characters';
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
        name: formData.name.trim(),
        description: formData.description.trim(),
      };
      if (isEditing) {
        payload.isActive = formData.isActive;
      }
      await onSubmit(payload);
      onClose();
    } catch (err) {
      setServerError(err.normalizedMessage || err.message || 'Operation failed');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Department' : 'Create Department'}
      description={
        isEditing
          ? `Modify details for ${department.name}`
          : 'Define a new organizational business unit.'
      }
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {serverError && (
          <div className="p-3 text-xs bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 rounded-lg border border-rose-200 dark:border-rose-800">
            {serverError}
          </div>
        )}

        <Input
          label="Department Name *"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g. Engineering, Sales, Compliance"
          error={errors.name}
        />

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Brief purpose or function of this unit..."
            rows={3}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-brand-ink-primary dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
          />
          {errors.description && (
            <p className="mt-1 text-xs text-rose-500">{errors.description}</p>
          )}
        </div>

        {isEditing && (
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="deptIsActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
            />
            <label htmlFor="deptIsActive" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
              Active unit (available for employee assignment)
            </label>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
            {isEditing ? 'Save Changes' : 'Create Department'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default DepartmentModal;
