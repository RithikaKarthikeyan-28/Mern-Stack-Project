import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';

const FREQUENCY_OPTIONS = [
  { value: 'annual', label: 'Annual (Every 1 Year)' },
  { value: 'biennial', label: 'Biennial (Every 2 Years)' },
  { value: 'one_time', label: 'One-Time Onboarding' },
];

export const ComplianceRequirementModal = ({
  isOpen,
  onClose,
  onSubmit,
  requirement = null,
  courses = [],
  departments = [],
  isLoading = false,
}) => {
  const isEditing = Boolean(requirement);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    course: '',
    department: '',
    isGlobal: false,
    frequency: 'annual',
    dueWithinDays: 30,
    renewalGraceDays: 0,
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (requirement) {
      setFormData({
        title: requirement.title || '',
        description: requirement.description || '',
        course: requirement.course?._id || requirement.course?.id || requirement.course || '',
        department: requirement.department?._id || requirement.department?.id || requirement.department || '',
        isGlobal: Boolean(requirement.isGlobal),
        frequency: requirement.frequency || 'annual',
        dueWithinDays: requirement.dueWithinDays ?? 30,
        renewalGraceDays: requirement.renewalGraceDays ?? 0,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        course: courses[0]?._id || courses[0]?.id || '',
        department: departments[0]?._id || departments[0]?.id || '',
        isGlobal: false,
        frequency: 'annual',
        dueWithinDays: 30,
        renewalGraceDays: 0,
      });
    }
    setErrors({});
    setServerError('');
  }, [requirement, courses, departments, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    const trimmedTitle = formData.title.trim();
    if (!trimmedTitle) {
      errs.title = 'Requirement title is required';
    } else if (trimmedTitle.length < 3) {
      errs.title = 'Title must be at least 3 characters';
    } else if (trimmedTitle.length > 120) {
      errs.title = 'Title cannot exceed 120 characters';
    }

    if (!formData.course) {
      errs.course = 'Associated course is required';
    }

    const dueDays = Number(formData.dueWithinDays);
    if (!Number.isInteger(dueDays) || dueDays < 1 || dueDays > 365) {
      errs.dueWithinDays = 'Must be an integer between 1 and 365 days';
    }

    const graceDays = Number(formData.renewalGraceDays);
    if (!Number.isInteger(graceDays) || graceDays < 0 || graceDays > 90) {
      errs.renewalGraceDays = 'Must be an integer between 0 and 90 days';
    }

    if (formData.description && formData.description.length > 1000) {
      errs.description = 'Description cannot exceed 1000 characters';
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
        department: formData.isGlobal ? null : (formData.department || null),
        isGlobal: Boolean(formData.isGlobal),
        frequency: formData.frequency,
        dueWithinDays: Number(formData.dueWithinDays),
        renewalGraceDays: Number(formData.renewalGraceDays),
      };
      await onSubmit(payload);
      onClose();
    } catch (err) {
      setServerError(err.normalizedMessage || err.message || 'Operation failed');
    }
  };

  const courseOptions = courses.map((c) => ({
    value: c._id || c.id,
    label: `${c.title} (${c.level || 'all levels'})`,
  }));

  const departmentOptions = [
    { value: '', label: 'Select Target Department' },
    ...departments.map((d) => ({
      value: d._id || d.id,
      label: d.name,
    })),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Compliance Rule' : 'Create Compliance Requirement'}
      description="Define mandatory training regulations and recurrence for workforce compliance."
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {serverError && (
          <div className="p-3 text-xs bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 rounded-lg border border-rose-200 dark:border-rose-800">
            {serverError}
          </div>
        )}

        <Input
          label="Requirement Title *"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g. Annual Anti-Harassment & Workplace Ethics"
          error={errors.title}
        />

        <Select
          label="Associated Training Course *"
          value={formData.course}
          onChange={(e) => setFormData({ ...formData, course: e.target.value })}
          options={courseOptions}
          error={errors.course}
        />

        <div className="space-y-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={formData.isGlobal}
              onChange={(e) => setFormData({ ...formData, isGlobal: e.target.checked })}
              className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4"
            />
            <span>Organization-Wide (Global Requirement for All Departments)</span>
          </label>

          {!formData.isGlobal && (
            <Select
              label="Target Department"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              options={departmentOptions}
              helperText="Only employees in this department will be assigned this mandatory rule."
            />
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select
            label="Frequency *"
            value={formData.frequency}
            onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
            options={FREQUENCY_OPTIONS}
          />
          <Input
            label="Due Days *"
            type="number"
            min="1"
            max="365"
            value={formData.dueWithinDays}
            onChange={(e) => setFormData({ ...formData, dueWithinDays: e.target.value })}
            error={errors.dueWithinDays}
            helperText="Days to complete"
          />
          <Input
            label="Grace Days"
            type="number"
            min="0"
            max="90"
            value={formData.renewalGraceDays}
            onChange={(e) => setFormData({ ...formData, renewalGraceDays: e.target.value })}
            error={errors.renewalGraceDays}
            helperText="Renewal grace"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Regulatory background, jurisdiction, or organizational standard..."
            rows={3}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-brand-ink-primary dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
          />
          {errors.description && (
            <p className="mt-1 text-xs text-rose-500">{errors.description}</p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
            {isEditing ? 'Save Changes' : 'Create Requirement'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ComplianceRequirementModal;
