import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';

export const EmployeeModal = ({
  isOpen,
  onClose,
  onSubmit,
  employee = null,
  departments = [],
  isLoading = false,
}) => {
  const isEditing = Boolean(employee);

  const [formData, setFormData] = useState({
    user: '',
    employeeId: '',
    department: '',
    designation: '',
    phone: '',
    dateOfJoining: '',
    isActive: true,
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (employee) {
      setFormData({
        user: employee.user?._id || employee.user?.id || employee.user || '',
        employeeId: employee.employeeId || '',
        department: employee.department?._id || employee.department?.id || employee.department || '',
        designation: employee.designation || '',
        phone: employee.phone || '',
        dateOfJoining: employee.dateOfJoining
          ? new Date(employee.dateOfJoining).toISOString().split('T')[0]
          : '',
        isActive: employee.isActive !== false,
      });
    } else {
      setFormData({
        user: '',
        employeeId: '',
        department: departments[0]?._id || departments[0]?.id || '',
        designation: '',
        phone: '',
        dateOfJoining: new Date().toISOString().split('T')[0],
        isActive: true,
      });
    }
    setErrors({});
    setServerError('');
  }, [employee, departments, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    if (!isEditing && !formData.user.trim()) {
      errs.user = 'User ObjectId is required to link employee profile';
    }
    if (!formData.employeeId.trim()) {
      errs.employeeId = 'Employee ID is required';
    } else if (formData.employeeId.trim().length > 50) {
      errs.employeeId = 'Employee ID cannot exceed 50 characters';
    }
    if (!formData.department) {
      errs.department = 'Department is required';
    }
    if (formData.designation && formData.designation.length > 100) {
      errs.designation = 'Designation cannot exceed 100 characters';
    }
    if (formData.phone && formData.phone.length > 25) {
      errs.phone = 'Phone cannot exceed 25 characters';
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
        employeeId: formData.employeeId.trim(),
        department: formData.department,
        designation: formData.designation.trim(),
        phone: formData.phone.trim(),
        dateOfJoining: formData.dateOfJoining || undefined,
      };

      if (isEditing) {
        payload.isActive = formData.isActive;
      } else {
        payload.user = formData.user.trim();
      }

      await onSubmit(payload);
      onClose();
    } catch (err) {
      setServerError(err.normalizedMessage || err.message || 'Operation failed');
    }
  };

  const departmentOptions = departments.map((d) => ({
    value: d._id || d.id,
    label: d.name,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Employee Profile' : 'Create Employee Profile'}
      description={
        isEditing
          ? `Update organizational assignment for ${employee.user?.name || employee.employeeId}`
          : 'Link a registered user account to a department.'
      }
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {serverError && (
          <div className="p-3 text-xs bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 rounded-lg border border-rose-200 dark:border-rose-800">
            {serverError}
          </div>
        )}

        {isEditing ? (
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Linked User Account</span>
            <div className="font-semibold text-sm text-brand-ink-primary dark:text-white">
              {employee.user?.name || 'User'}
            </div>
            <div className="text-xs text-slate-500">{employee.user?.email}</div>
          </div>
        ) : (
          <Input
            label="User ObjectId *"
            value={formData.user}
            onChange={(e) => setFormData({ ...formData, user: e.target.value })}
            placeholder="e.g. 6a9d31cbccabba7778869a30"
            error={errors.user}
            helperText="The MongoDB ObjectId of the registered user account."
          />
        )}

        <Input
          label="Employee ID *"
          value={formData.employeeId}
          onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
          placeholder="e.g. EMP-1042"
          error={errors.employeeId}
        />

        <Select
          label="Department *"
          value={formData.department}
          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
          options={departmentOptions}
          error={errors.department}
        />

        <Input
          label="Designation / Role"
          value={formData.designation}
          onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
          placeholder="e.g. Senior Software Engineer"
          error={errors.designation}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+1 555-0192"
            error={errors.phone}
          />
          <Input
            label="Date of Joining"
            type="date"
            value={formData.dateOfJoining}
            onChange={(e) => setFormData({ ...formData, dateOfJoining: e.target.value })}
          />
        </div>

        {isEditing && (
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
              Profile is active and eligible for learning assignments
            </label>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
            {isEditing ? 'Save Changes' : 'Create Profile'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EmployeeModal;
